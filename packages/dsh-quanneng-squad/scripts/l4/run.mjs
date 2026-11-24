import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initialRecord, advance, recordGreenIteration, canAdvance } from './engine.mjs';
import { collectFacts } from './facts.mjs';
import { loadProposals } from './proposals.mjs';
// L4 五态管线驱动器（落地手册 §7.6）。
// 真源覆盖（P12 / DRY）：提案清单从 G-REFLOW.md 动态生成，不再硬编码 3 条；
// 主循环遍历整个提案池，使自动点火后的提案能继续走 canary/rollout/codified。
// 防刷：codified 需 >=2 个不同 round-N 的 hard-green 迭代 + 本体 grep 命中；同一轮反复运行刷不出。
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = process.env.QUANNENG_WORKSPACE || join(root, '..', '..');
const statePath = join(root, 'assets/L4-STATE.json');
const versionPath = join(W, 'squad-toolkit/VERSION.md');
let db = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { proposals: {} };

// 提案清单与本体锚点来自单一真源 proposals.mjs（DRY）。
const ALL = loadProposals(W);
for (const [id, p] of ALL) if (!db.proposals[id]) db.proposals[id] = initialRecord(id, p.layer, p.theme);

const facts = collectFacts(W);
const iteration = facts.projectIteration;
const hardGreen = facts.greenLevel === 'hard-green';
const log = [];

// 逐态推进整个提案池（proposal→regression 自动点火也在此处，不再有半截闭环）。
for (const [id, m] of ALL) {
  let r = db.proposals[id];
  if (r.state === 'codified') { log.push({ id, note:'已固化，跳过' }); continue; }
  // regression：玩具夹具 + S8 基线（与原回归门一致，走 canAdvance 而非手写）
  if (r.state === 'proposal') {
    const x = advance(r, 'regression', facts, ['toy-fixture','L4-BASELINE']);
    r = x.rec; log.push({ id, to:'regression', err:x.error, hardGreen });
  }
  // canary：VERSION.md canary 位真实写入并读回校验
  if (r.state === 'regression') {
    let v = readFileSync(versionPath, 'utf8');
    const cur = (v.match(/^canary: (.*)$/m) || [, ''])[1].trim();
    const next = (cur === '(空)' || cur === '') ? id : (cur.includes(id) ? cur : cur + ',' + id);
    v = v.replace(/^canary: .*/m, 'canary: ' + next)
       .replace(/^canary_scope: .*/m, 'canary_scope: ' + id + '@' + iteration);
    writeFileSync(versionPath, v, 'utf8');
    const vv = readFileSync(versionPath, 'utf8');
    const cw = new RegExp('^canary: .*\\b' + id + '\\b', 'm').test(vv);
    const f2 = { ...facts, canarySlotWritten:cw, scopeDeclared:/^canary_scope: (?!\(空\))\S/m.test(vv) };
    if (cw) recordGreenIteration(r, iteration, hardGreen);
    const x = advance(r, 'canary', f2, ['VERSION.md canary=' + next]);
    r = x.rec; log.push({ id, to:'canary', err:x.error, canarySlotWritten:cw });
  }
  // rollout：canary 跑过一版且无熔断 + 项目当前 hard-green
  if (r.state === 'canary') {
    const ok = recordGreenIteration(r, iteration, hardGreen);
    const f3 = { ...facts, greenIterations:r.greenIterations, noFuseInCanary:(r.fuses||[]).length===0 };
    const x = advance(r, 'rollout', f3, ['iteration=' + iteration, 'greenIterations=' + r.greenIterations, 'recorded=' + ok]);
    r = x.rec; log.push({ id, to:'rollout', err:x.error, green:r.greenIterations });
  }
  // codified：>=2 个不同迭代的 hard-green + 本体 grep 命中（不手刷）
  if (r.state === 'rollout') {
    recordGreenIteration(r, iteration, hardGreen);
    const written = facts.bodyWritten(m.bodyNeedle, m.bodyFiles);
    const f4 = { ...facts, stableIterations:r.stableIterations, bodyWritten:written };
    const x = advance(r, 'codified', f4, ['grep ' + m.bodyNeedle + '=' + written, 'stableIterations=' + r.stableIterations]);
    r = x.rec; log.push({ id, to:'codified', err:x.error, stable:r.stableIterations, bodyWritten:written });
  }
  db.proposals[id] = r;
}

writeFileSync(statePath, JSON.stringify(db, null, 2) + '\n', 'utf8');

// canary / scope 全池同步（只在 canary 之后的状态占位，proposal/regression 不占）
{
  let v = readFileSync(versionPath, 'utf8');
  const active = Object.entries(db.proposals)
    .filter(([, x]) => x.state === 'canary' || x.state === 'rollout')
    .map(([id]) => id);
  v = v.replace(/^canary: .*/m, 'canary: ' + (active.length ? active.join(',') : '(空)'))
     .replace(/^canary_scope: .*/m, 'canary_scope: ' + (active.length ? active.map(id => id + '@' + iteration).join(',') : '(空)'));
  writeFileSync(versionPath, v, 'utf8');
}

// 全部固化时机器递增 stable（带 stamp 防重复）
function bumpStable(vtxt) {
  const m = vtxt.match(/^stable: v(\d+)\.(\d+)$/m);
  if (!m) return vtxt;
  return vtxt.replace(/^stable: .*/m, 'stable: v' + m[1] + '.' + (Number(m[2]) + 1));
}
{
  const allCod = Object.values(db.proposals).every(x => x.state === 'codified');
  const stampPath = join(root, 'assets/.l4-stable-stamp');
  const stamped = existsSync(stampPath) ? readFileSync(stampPath, 'utf8') : '';
  if (allCod && stamped !== 'v-next') {
    let vtxt = readFileSync(versionPath, 'utf8');
    vtxt = bumpStable(vtxt).replace(/^updated_at: .*/m, 'updated_at: ' + new Date().toISOString().slice(0,10));
    writeFileSync(versionPath, vtxt, 'utf8'); writeFileSync(stampPath, 'v-next', 'utf8');
    log.push({ note:'stable 递增（全部提案已固化）' });
  }
}

const summary = Object.fromEntries(Object.entries(db.proposals).map(([k,v]) => [k,
  { state:v.state, green:v.greenIterations, stable:v.stableIterations, iterations:v.iterationsSeen }]));
console.log(JSON.stringify({ iteration, hardGreen, summary, log, factsChecks:facts.checks }, null, 2));
