import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';
import { loadProposals } from './l4/proposals.mjs';
// 反哺闭环门：G-REFLOW 的每条 P 必须被 >=2 份角色提示词以 [P<n>] 结构化声明。
// DRY：W/出口/豁免由 gate-kit 提供。边界修复：P[1-9] -> P\d+（否则 P10/P11 被门自己漏看）。
const NAME = 'reflow-check';
const VAR = 'QUANNENG_ALLOW_REFLOW_GAP';
const MARKER = /\[(P\d+)\]/g;
const ROW = /^\|\s*(P\d+)\s*\|/gm;

function collect() {
  const gatePath = join(W, 'docs/squad/gates/G-REFLOW.md');
  const dir = join(W, 'docs/squad/prompts');
  if (!existsSync(gatePath) || !existsSync(dir)) return { missingInputs:true, ids:[], files:[], latest:{}, refs:{} };
  const gate = readFileSync(gatePath, 'utf8');
  const ids = [...new Set([...gate.matchAll(ROW)].map(m => m[1]))];
  const files = readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'INDEX.md');
  const refs = {};
  for (const f of files) refs[f] = [...new Set([...readFileSync(join(dir, f), 'utf8').matchAll(MARKER)].map(m => m[1]))];
  const latest = {};
  for (const f of files) {
    const m = f.match(/^(.+?)-v(\d+)\.md$/);
    if (!m) continue;
    const cur = latest[m[1]];
    if (!cur || Number(m[2]) > cur.v) latest[m[1]] = { f, v:Number(m[2]) };
  }
  return { missingInputs:false, ids, files, latest, refs };
}

function judge(c) {
  const problems = [];
  if (c.missingInputs) return { problems:['缺少 docs/squad/gates/G-REFLOW.md 或 docs/squad/prompts/'], coverage:{}, ids:[] };
  const coverage = {};
  for (const id of c.ids) {
    const hit = c.files.filter(f => c.refs[f].includes(id));
    coverage[id] = hit.length;
    if (hit.length < 2) problems.push(id + ' 仅被 ' + hit.length + ' 份提示词以 [P] 标记声明（要求 >=2）');
  }
  for (const [role, x] of Object.entries(c.latest))
    if (c.refs[x.f].length === 0) problems.push(role + ' 最新版 ' + x.f + ' 未声明任何 [P] 标记');
  if (!Object.keys(c.latest).length) problems.push('没有任何 <角色>-v<n>.md 命名的提示词文件');
  return { problems, coverage, ids:c.ids };
}

let report, hardFailure = null;
try { report = judge(collect()); }
catch (e) { hardFailure = e.message; report = { problems:['gate-crash: ' + e.message], coverage:{}, ids:[] }; }

const truth = loadProposals(W);
if (truth.size !== report.ids.length) report.problems.push('P 编号真源分叉：proposals.mjs=' + truth.size + ' reflow=' + report.ids.length);
const exitCode = runGate({ name:NAME, varName:VAR,
  kind: hardFailure ? 'reflow-check 自身故障（不得用豁免长期掩盖）' : 'P 声明覆盖不足',
  items: report.problems, W,
  report: { workspace:W, gate:NAME, ok:report.problems.length===0, gateFailure:hardFailure,
    marker:'[P<n>] structured declaration only', gatePatterns:report.ids.length,
    problems:report.problems, coverage:report.coverage } });
failFast(exitCode);
