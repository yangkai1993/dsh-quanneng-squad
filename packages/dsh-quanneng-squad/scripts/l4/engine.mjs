import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const STATES = ['proposal','regression','canary','rollout','codified'];
export const LAYERS = ['parameter','process','constitution'];

export function initialRecord(id, layer, theme) {
  return { id, layer, theme, state: 'proposal', enteredAt: new Date().toISOString(),
    history: [], fuses: [], cooldownUntil: null, evidence: [],
    canarySince: null, iterationsSeen: [], greenIterations: 0, stableIterations: 0 };
}

// 迭代粒度：一个迭代只贡献一次绿（iterationsSeen 全局去重）。可验证后果：canary 期用掉的迭代
// 不能再计入 stableIterations —— codified 必须在进入 rollout 之后再看到 2 个新的项目迭代持续为绿，
// 因此「同一会话/同一基线戳反复运行」无法把提案刷到 codified（防 P1 自洽绿灯）。
// 按「记录时所处状态」计数，去重键 = 状态:迭代。
//   canary 期的新迭代 -> greenIterations（rollout 门要求 >=1）
//   green 参数只允许 facts.greenLevel==='hard-green' 时传 true（A13）
//   rollout 期的新迭代 -> stableIterations（codified 门要求 >=2）
// 同一迭代在任一状态只计一次；跨状态不复用同一键之外还要求是新的项目迭代，
// 所以「同一基线戳反复运行」无法把提案刷到 codified（防 P1 自洽绿灯）。
// 迭代键规范：只接受 round-<n>（真实项目轮次）。历史日期等格式一律拒计，
// 防止「同一轮用两种键各记一次绿」的假绿（2026-11-12 实踩过：日期键与轮次键混用，
// 把 stableIterations 抬到 2 造成 codified 假绿 —— 由 L4 自己揪出并熔断重置）。
export function normalizeIteration(id) {
  const s = String(id);
  if (!s.startsWith('round-')) return null;
  return /^[0-9]+$/.test(s.slice(6)) ? s : null;
}

// 按「记录时所处状态」计数，去重键 = 状态:迭代。
//   canary 期新迭代 -> greenIterations（rollout 门要求 >=1）
//   rollout 期新迭代 -> stableIterations（codified 门要求 >=2）
// 固化必须在进入 rollout 之后再出现新的项目轮次持续全绿；
// 同一轮内反复运行刷不出 codified（防 P1 自洽绿灯）。
export function recordGreenIteration(rec, iterationId, green = true) {
  // 计绿前置：该时刻项目必须全绿（五门+result-verify+tests）。
  // 否则记的是「观察过一轮」而非「绿过一轮」——2026-11-12 实踩过：drift 红时仍刷出 stable=2 造成固化。
  if (!green) return false;
  const norm = normalizeIteration(iterationId);
  if (!norm) return false;
  const key = rec.state + ':' + norm;
  if (rec.iterationsSeen.includes(key)) return false;
  rec.iterationsSeen.push(key);
  if (rec.state === 'canary') rec.greenIterations++;
  else if (rec.state === 'rollout') rec.stableIterations++;
  return true;
}

export const GATE = {
  regression: r => (r.toyFixturePassed ? [] : ['toyFixturePassed(玩具夹具实跑未通过)'])
    .concat(r.baselineCaptured ? [] : ['baselineCaptured(缺 L4-BASELINE 或 javaTests=0)']),
  canary: r => (r.canarySlotWritten ? [] : ['canarySlotWritten(VERSION.md canary 位未含本提案)'])
    .concat(r.scopeDeclared ? [] : ['scopeDeclared(canary_scope 为空)']),
  rollout: r => (r.greenIterations >= 1 && r.noFuseInCanary ? [] : ['canary 未跑绿或期间熔断'])
    .concat(r.projectGreenNow ? [] : ['projectGreenNow(五门/result-verify/release 链实跑未全绿)']),
  codified: r => (r.stableIterations >= 2 ? [] : ['stableIterations<2（需再一个项目迭代持续为绿，防同轮刷状态）'])
    .concat(r.bodyWritten ? [] : ['bodyWritten(目标文档无对应条款文本)']),
};

export function canAdvance(rec, to, facts) {
  if (rec.layer === 'constitution') return { ok:false, reason:'宪法层永不自动变更（C 系列走 CR + 用户批准）' };
  if (rec.cooldownUntil && Date.now() < Date.parse(rec.cooldownUntil)) return { ok:false, reason:'冷却中至 ' + rec.cooldownUntil };
  const i = STATES.indexOf(rec.state), j = STATES.indexOf(to);
  if (j !== i + 1) return { ok:false, reason:'只能逐态前进：' + rec.state + ' → ' + to };
  if (to === 'codified') facts.stableIterations = rec.stableIterations, facts.greenIterations = rec.greenIterations;
  if (to === 'rollout') facts.greenIterations = rec.greenIterations;
  const missing = (GATE[to] || (() => []))(facts);
  return missing.length ? { ok:false, reason:'checklist 缺项: ' + missing.join(', ') } : { ok:true };
}

export function advance(rec, to, facts, evidence) {
  const c = canAdvance(rec, to, facts);
  if (!c.ok) return { rec, error: c.reason };
  rec.history.push({ from: rec.state, to, at: new Date().toISOString(), factsSnapshot: sanitize(facts), evidence: evidence || [] });
  rec.state = to; rec.enteredAt = new Date().toISOString();
  if (to === 'canary') rec.canarySince = new Date().toISOString();
  if (evidence) rec.evidence.push(...evidence);
  return { rec, error: null };
}

function sanitize(f) { const o = {}; for (const k of Object.keys(f)) if (typeof f[k] !== 'function') o[k] = f[k]; return o; }

export function fuse(rec, reason, cooldownIterations = 2, iterationMs = 86400000) {
  const recent = rec.fuses.filter(x => Date.now() - Date.parse(x.at) < iterationMs * cooldownIterations);
  rec.fuses.push({ at: new Date().toISOString(), reason, from: rec.state });
  rec.history.push({ from: rec.state, to: 'stable(rollback)', at: new Date().toISOString(), reason });
  rec.state = 'stable';
  if (recent.length + 1 >= cooldownIterations) rec.cooldownUntil = new Date(Date.now() + iterationMs * cooldownIterations).toISOString();
  return rec;
}
