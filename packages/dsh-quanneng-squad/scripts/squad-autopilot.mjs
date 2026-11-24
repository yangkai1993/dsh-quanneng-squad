import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { W } from './lib/gate-kit.mjs';
import { currentRotation } from './lib/rotation.mjs';
import { createDispatchPlan } from './lib/dispatch-plan.mjs';
import { deriveTokenStates } from './lib/round-events.mjs';

// 智能组织自动编排器（squad-autopilot）：把每轮「轮转推导→令牌登记→编排汇总→门自检」自动化。
// 数据驱动：名单=rotation 真源；写域=FUNCTION-LEDGER；闭合词=drift 门认可集；卡片=dispatch 实读。无硬编码席位表。
// 令牌格式=纯数字 9xx 段（与 gate-rotation/dispatch-guard 的 TK-<round>-\d+ 正则兼容；-A 字母后缀会被门判不可见）。
// 模式：--plan（只读预览）/ --apply（幂等登记）/ --report（汇总 artifact）/ --verify（令牌↔门判定矩阵，实跑门零分叉）。
const mode = process.argv.includes('--apply') ? 'apply'
  : process.argv.includes('--report') ? 'report'
  : process.argv.includes('--verify') ? 'verify'
  : process.argv.includes('--dispatch') ? 'dispatch'
  : process.argv.includes('--collect') ? 'collect' : 'plan';
const PKGDIR = join(W, 'packages/dsh-quanneng-squad');
const rot = currentRotation(W);
if (!rot.current) { console.log(JSON.stringify({ error: '无法解析当前轮转名册' }, null, 2)); process.exit(1); }
const round = rot.round, w = rot.current.round, seats = rot.current.seats;

// ① 席位→写域（FUNCTION-LEDGER 实读）。
const domainOf = {};
const ledgerPath = join(W, 'docs/squad/FUNCTION-LEDGER.md');
if (existsSync(ledgerPath)) {
  for (const l of readFileSync(ledgerPath, 'utf8').split('\n')) {
    const c = l.split('|').map(s => s.trim());
    if (c.length > 4 && c[1] && c[1] !== '席位' && c[1] !== '---') {
      const m = c[3].match(/([\w./-]+\/)/);
      domainOf[c[1]] = m ? m[1] : c[3].split(/[+,]/)[0].trim();
    }
  }
}

// ② 简称→卡片文件名（dispatch 目录实读，前缀匹配）。
const dsp = join(W, 'docs/squad/dispatch');
const cards = existsSync(dsp) ? readdirSync(dsp).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')) : [];
const cardOf = abbr => {
  const short = abbr.replace(/(经理|官|学士|大夫|郎中)$/, '');
  return cards.find(c => c.startsWith(abbr) || c.startsWith(short)) || null;
};

// ③ 本轮已有令牌（幂等判定；纯数字正则，与门同口径）。
const tokenRe = new RegExp('TK-' + round + '-\\d+', 'g');
const covered = new Map();
for (const c of cards) {
  const s = readFileSync(join(dsp, c + '.md'), 'utf8');
  for (const m of s.matchAll(tokenRe)) covered.set(c, m[0]);
}

// ④ 规划：每位应上席位 → 令牌（9xx 纯数字段，门可见）+ 写域 + 状态。
const plan = seats.map((abbr, i) => {
  const card = cardOf(abbr);
  return { abbr, card, token: 'TK-' + round + '-' + (900 + i + 1),
    domain: (Object.entries(domainOf).find(([k]) => k === abbr || k.startsWith(abbr) || abbr.startsWith(k.replace(/(经理|官|学士|大夫|郎中)$/, ''))) || [,'(未知写域，需人工核对)'])[1],
    status: '仅登记移交意图（轮转确认）',
    already: card ? (covered.get(card) || null) : null };
});

const result = { mode, round, w, expected: seats.length, plan,
  missingCards: plan.filter(p => !p.card).map(p => p.abbr),
  note: '令牌=9xx 纯数字段（门正则 TK-<round>-\d+ 兼容）；状态=drift 认可终止态；签发源/轮转确认标记供 gate-rotation 识别登记态覆盖并反伪造。' };

if (mode === 'apply') {
  let n = 0;
  for (const p of plan) {
    if (!p.card) continue;
    const fp = join(dsp, p.card + '.md');
    let s = readFileSync(fp, 'utf8');
    if (s.includes(p.token)) continue;   // 幂等：已登记跳过
    const sec = ['', '## 第 ' + round + ' 轮 · ' + p.token + '（自动编排·轮转确认）', '',
      '| 要素 | 值 |', '| --- | --- |',
      '| 令牌 | ' + p.token + ' |',
      '| 状态 | ' + p.status + '（非交付令牌；由 squad-autopilot 自动登记） |',
      '| 签发源 | squad-autopilot |',
      '| 轮转确认 | 是 |',
      '| 写域 | ' + p.domain + '（仅登记，本令牌不写文件） |', ''].join('\n');
    writeFileSync(fp, s + sec, 'utf8');
    n++;
  }
  result.applied = n;
}

if (mode === 'report') {
  const brief = join(W, 'docs/squad/briefs', 'captain-orchestration-TK-' + round + '.md');
  const lines = ['# 队长编排汇总 · 第 ' + round + ' 轮（自动）', '',
    '> 由 squad-autopilot.mjs 从 rotation/FUNCTION-LEDGER 真源生成（智能组织自动化）。', '',
    '## 当前名册', '- ' + w + '（应上 ' + seats.join('、') + '）', '',
    '## 令牌登记计划',
    ...plan.map(p => '- ' + p.abbr + ' → ' + (p.card || '(无卡片)') + ' → ' + p.token + ' → ' + p.domain), '',
    '## 门兼容性', '- 闭合词：仅登记移交意图（drift 派活黑洞门认可）',
    '- 令牌序号：9xx 纯数字段（gate-rotation/dispatch-guard 正则可见）',
    '- 签发源/轮转确认标记：供门识别登记态覆盖、反裸占位号伪造', '',
  ];
  writeFileSync(brief, lines.join('\n'), 'utf8');
  result.report = brief;
}


if (mode === 'dispatch') {
  // U1 智能组织·自动派单计划（一期 1.15.0 薄壳化）：核心逻辑已抽 scripts/lib/dispatch-plan.mjs
  // （B6 sandcastle 形态：createDispatchPlan 调用返回 {jobs[],missingCards[]} 机器可读）。
  // CLI 只做：令牌回填（9xx 段）→ 落盘 dispatch-plan JSON；真实投递=主对话 subagent（通道统一）。
  const raw = createDispatchPlan({ round, w, seats, cards });
  const jobs = raw.jobs.map((j, i) => ({ ...j, token: 'TK-' + round + '-' + (900 + i + 1), message: j.message.replaceAll('TK-ROUND-NNN', 'TK-' + round + '-' + (900 + i + 1)) }));
  const out = join(W, 'docs/squad/pipeline', 'dispatch-plan-TK-' + round + '.json');
  writeFileSync(out, JSON.stringify({ round, w, generatedAt: new Date().toISOString(),
    seats: seats.length, jobs, missingCards: raw.missingCards, note: 'captain 按 jobs[] 逐条主对话 subagent({description,jobs[].message}) 派活；回报回主对话+落盘 inbox 留痕（通道统一 1.15.0）' }, null, 2), 'utf8');
  result.dispatch = { plan: out, jobs: jobs.length, missingCards: raw.missingCards, summary: jobs.map(j => j.seat + '→' + j.token) };
}

if (mode === 'collect') {
  // U2 智能组织·自动收口（一期 1.15.0 通道统一）：回报真源=事件日志 REPORT 事件（deriveTokenStates）；
  // inbox/ 降级为只读留痕对账（mtime 变化只作「有落盘动作」旁证，不再作为回报判定源）。
  const states = deriveTokenStates();
  const inboxDir = join(W, 'docs/squad/inbox');
  const inboxTouched = new Map();
  if (existsSync(inboxDir)) for (const f of readdirSync(inboxDir).filter(f => f.endsWith('.md'))) {
    inboxTouched.set(f.replace(/\.md$/, ''), statSync(join(inboxDir, f)).mtime.toISOString());
  }
  const matrix = plan.map(p => {
    const st = p.card ? [...states.values()].find(s => s.card === p.card || s.seat === p.abbr) || null : null;
    const touched = inboxTouched.get(p.card) || inboxTouched.get(p.abbr) || null;
    return { seat: p.abbr, token: p.token,
      state: st ? st.state : (touched ? 'inbox-only' : 'planned-or-silent'),
      historyLen: st ? st.history.length : 0,
      lastEventAt: st ? st.history.at(-1)?.ts || null : null, inboxTouchedAt: touched };
  });
  const cnt = k => matrix.filter(x => x.state === k).length;
  const out = join(W, 'docs/squad/pipeline', 'collect-matrix-TK-' + round + '.json');
  writeFileSync(out, JSON.stringify({ round, w, generatedAt: new Date().toISOString(),
    total: matrix.length, reported: cnt('reported'), accepted: cnt('accepted'), dispatched: cnt('dispatched'),
    inboxOnly: cnt('inbox-only'), silent: cnt('planned-or-silent'),
    silentSeats: matrix.filter(x => x.state === 'planned-or-silent').map(x => x.seat),
    matrix, honest: '状态取自事件日志 REPORT/ACCEPT（真源），inbox mtime 仅留痕旁证；质量验收由门与 captain 负责' }, null, 2), 'utf8');
  result.collect = { matrix: out, reported: cnt('reported'), dispatched: cnt('dispatched'), inboxOnly: cnt('inbox-only'), silent: cnt('planned-or-silent') };
}

if (mode === 'verify') {
  // 实跑两个门，矩阵直接取自门的实际 report —— 非模拟，零真源分叉。
  const node = process.env.QUANNENG_NODE || 'node';
  const gr = spawnSync(node, ['scripts/gate-rotation.mjs'], { cwd: PKGDIR, encoding: 'utf8', timeout: 120000 });
  const dg = spawnSync(node, ['scripts/dispatch-guard.mjs'], { cwd: PKGDIR, encoding: 'utf8', timeout: 120000 });
  const parse = r => { try { return JSON.parse((r.stdout || '').trim()); } catch { return null; } };
  const grj = parse(gr), dgj = parse(dg);
  const covered = new Set(grj?.covered || []);
  const inflight = dgj?.inFlight || [];
  result.verify = {
    gateRotation: { exit: gr.status, covered: grj?.covered || [], missing: grj?.missing || [] },
    dispatchGuard: { exit: dg.status, inFlight: inflight, problems: dgj?.problems || [] },
    matrix: plan.map(p => ({ token: p.token, seat: p.abbr, card: p.card,
      rotationCovered: p.card ? covered.has(p.card) : false,
      dispatchInFlight: inflight.some(x => x.tok === p.token) })),
    honest: '矩阵取自两门实际 report（非模拟预测），零真源分叉；令牌格式统一后 autopilot 产物对门可见。'
  };
}

console.log(JSON.stringify(result, null, 2));
