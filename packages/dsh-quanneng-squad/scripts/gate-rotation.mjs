import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast, PENDING_RE } from './lib/gate-kit.mjs';
import { currentRotation } from './lib/rotation.mjs';

// 轮换覆盖门（C2 · 选项A，第 66 轮 captain 裁决；GR-2 第 68 轮修正 SLATED 语义）：
// 覆盖 = 该轮该席位存在一张「绑定本轮、有签发源、写域结构化」的令牌 —— 登记态(SLATED)即算覆盖。
// 语义依据：ROSTER cap=8 换班是排班工位不是交付配额；P7 激活≠驱动；交付由 pre-verify/result-verify/verify 另管。
// 反伪造（保留 GR-2 内核）：裸占位号（无签发源/无轮转确认/无写域）不算覆盖 —— 这是 GR-2 真正要封的。
// 轮次真源 = STATE.md 末轮（lib/rotation.mjs）；W 绑定 = (round-1)%4；与面板并发轮次无关（本地真源权威）。
const problems = [];
const KEY = 'QUANNENG_ALLOW_ROTATION_GAP';

const rot = currentRotation(W);
const round = rot.round;
const rows = rot.rows;
const current = rot.current;
if (!Number.isFinite(round)) problems.push('无法从 STATE.md 解析轮号');
if (rows.length !== 4) problems.push('ROSTER §七 W 表解析失败（行数=' + rows.length + '，应为4）');
if (!current) problems.push('无法确定当前 W 名册（round=' + round + '）');

// ③ 覆盖核对：逐段解析，令牌格式 TK-<round>-<数字或9xx>（与 autopilot/dispatch-guard 同口径）。
const dd = join(W, 'docs/squad/dispatch');
const cards = existsSync(dd) ? readdirSync(dd).filter(f => f.endsWith('.md')) : [];
if (!cards.length) problems.push('dispatch 目录无任务卡，无法核对覆盖');
const tokRe = new RegExp('TK-' + round + '-\\d+');
const SLATED_MARK = /签发源\s*\|?\s*squad-autopilot|轮转确认\s*\|?\s*是/;
const WRITE_DOMAIN = /\|\s*写域\s*\|([^\n]*)/;
const covered = [];
const rejected = [];
for (const f of cards) {
  const s = readFileSync(join(dd, f), 'utf8');
  const ok = s.split(/\n(?=## )/).some(sec => {
    if (!tokRe.test(sec)) return false;
    // 交付态：状态为在途/完成等，天然覆盖。
    const sm = sec.match(/\|\s*状态\s*\|([^\n]*)/);
    const status = sm ? sm[1] : '';
    if (!status.includes('仅登记移交意图')) return true;   // 非登记态 = 真实交付/在途
    // 登记态(SLATED)：须带签发源/轮转确认标记 + 结构化写域，才算覆盖（反 GR-2 裸占位号）。
    return SLATED_MARK.test(sec) && (WRITE_DOMAIN.test(sec) && RegExp.$1.trim().length > 0);
  });
  const seat = f.replace(/\.md$/, '');
  if (ok) covered.push(seat);
  else if (tokRe.test(s)) rejected.push(seat);
}

// ROSTER 简称 ↔ dispatch 全称：前缀/包含匹配。
const missing = current ? current.seats.filter(abbr => {
  const short = abbr.replace(/(经理|官|学士|大夫|郎中)$/, '');
  return !covered.some(c => c.startsWith(abbr) || c.startsWith(short) || c.includes(short));
}) : [];
for (const x of missing) problems.push('轮换缺口：' + current.round + ' 应上席位「' + x + '」本轮(第' + round + '轮)无有效令牌（登记态须带签发源+写域）');

const report = { workspace: W, gate: 'gate-rotation', round, w: current?.round, expected: current?.seats,
  covered, rejected, missing, cardCount: cards.length, problems,
  semantic: '覆盖=已登记即将上场(SLATED)或在途/交付；裸占位号不算（GR-2 反伪造保留）' };
const exitCode = runGate({ name: 'gate-rotation', varName: KEY, kind: '轮换覆盖缺口',
  items: problems, W, report });
failFast(exitCode);
