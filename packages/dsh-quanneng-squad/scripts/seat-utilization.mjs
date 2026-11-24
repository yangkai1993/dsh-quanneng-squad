import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { W, cn2num, maxBriefRound, runGate, failFast } from './lib/gate-kit.mjs';
// 席位利用率门：按 FUNCTION-LEDGER 的必产物「文件名模式」统计真实工件数；只看文件名，不看正文
// （正文匹配会把规范文档自身提及的产物名算成产出 = 假绿，已实测踩过）。
// 默认阻断；豁免 = docs/squad/gates/EXEMPTIONS.md 当前豁免表（带到期日）或 QUANNENG_ALLOW_IDLE=1。
const NAME = 'seat-utilization';
const VAR = 'QUANNENG_ALLOW_IDLE';


const SEATS = [
  { seat: '采风官', stage: 'S-1 情报对标', dirs: ['docs/squad/intel'], re: /\.md$/ },
  { seat: '集贤学士', stage: 'S1 提示词优化', dirs: ['docs/squad/prompts'], re: /[\w-]+-v\d+\.md$/ },
  { seat: '翰林学士', stage: 'S1 任务拆分', dirs: ['docs/squad/pipeline'], re: /decomposition.*\.md$/ },
  { seat: '需求经理', stage: 'S0 需求澄清', dirs: ['docs/prd'], re: /^clarifications-.*\.md$/ },
  { seat: '产品经理', stage: 'S0 PRD', dirs: ['docs/prd'], re: /^PRD-.*\.md$/ },
  { seat: '架构经理', stage: 'S2 架构契约', dirs: ['docs/arch'], re: /\.md$/ },
  { seat: '给事中', stage: 'S3 门下封驳', dirs: ['docs/squad/gates'], re: /^G-S.*\.md$/ },
  { seat: '后端经理', stage: 'S4 后端实现', dirs: ['gateway-java/src', 'src'], re: /\.(java|js)$/ },
  { seat: '前端经理', stage: 'S4 可用性评审', dirs: ['docs/squad/reviews'], re: /usability.*\.md$/ },
  { seat: '测试经理', stage: 'S5 质量验证', dirs: ['docs/qa'], re: /\.md$/ },
  { seat: '御史大夫', stage: 'S6 监察抽巡', dirs: ['docs/squad/audit'], re: /\.md$/ },
  { seat: '运维经理', stage: 'S7 部署回滚', dirs: ['deploy'], re: /\.md$/ },
  { seat: '交付发布经理', stage: 'S7 发布验证', dirs: ['docs/squad/releases'], re: /^release-.*\.md$/ },
  { seat: '起居注官', stage: 'S8 记注', dirs: ['docs/squad/journal'], re: /\.md$/ },
  { seat: '考功郎中', stage: 'S8 度量', dirs: ['docs/squad/metrics'], re: /\.md$/ },
  { seat: '太傅', stage: 'S9 反馈优化', dirs: ['docs/squad'], re: /^retro-.*\.md$/ },
];

function countIn(dirPath, re, stack) {
  let n = 0;
  if (!existsSync(dirPath)) return 0;
  for (const e of readdirSync(dirPath, { withFileTypes: true })) {
    const f = join(dirPath, e.name);
    if (e.isDirectory()) { if (stack.length < 500) stack.push(f); continue; }
    if (e.name.startsWith('.')) continue;
    if (re.test(e.name)) n++;
  }
  return n;
}

function count(relDirs, re) {
  let total = 0;
  for (const d of relDirs) {
    const stack = [join(W, d)];
    while (stack.length) total += countIn(stack.pop(), re, stack);
  }
  return total;
}

const rows = SEATS.map(s => ({ seat: s.seat, stage: s.stage, artifacts: count(s.dirs, s.re) }));
const idle = rows.filter(r => r.artifacts === 0);

// D5 滚动窗口：累计工件数会掩盖「近 N 轮多数席位没被派动」（A5 老问题）。
// 从 dispatch 卡的最新 N 轮段落统计「有结构化在途/已闭合令牌」的席位，双指标呈现。
const WINDOW = 5;
let maxRound = maxBriefRound(W);
const dspDir = join(W, 'docs/squad/dispatch');
const activeSeats = new Set();
if (existsSync(dspDir)) for (const f of readdirSync(dspDir)) {
  if (!f.endsWith('.md')) continue;
  const t = readFileSync(join(dspDir, f), 'utf8');
  const rounds = [...t.matchAll(/第\s*([0-9一二三四五六七八九十]+)\s*轮/g)].map(m => cn2num(m[1])).filter(n => !Number.isNaN(n));
  const latest = rounds.length ? Math.max(...rounds) : 0;
  if (latest >= maxRound - WINDOW + 1 && /TK-\d+-\d+/.test(t)) activeSeats.add(f.replace('.md',''));
}
const rollingActive = activeSeats.size;
const rollingIdle = rows.filter(r => !activeSeats.has(r.seat)).map(r => r.seat);

const exitCode = runGate({ name: NAME, varName: VAR, kind: '闲置席位',
  items: idle.map(r => r.seat + ' @ ' + r.stage), W,
  report: { workspace: W, gate: NAME, seats: rows.length, utilized: rows.length - idle.length,
    idleCount: idle.length, idle: idle.map(r => r.seat + ' @ ' + r.stage), rows,
    rolling: { window: WINDOW, maxRound, activeSeats: rollingActive, idleSeats: rollingIdle, coverage: rollingActive + '/' + rows.length } } });
failFast(exitCode);
