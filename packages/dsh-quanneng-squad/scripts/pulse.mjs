import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { currentRotation } from './lib/rotation.mjs';
import { deriveState } from './lib/round-events.mjs';
import { W } from './lib/gate-kit.mjs';

// 团队脉搏机器生成：用户观察全能小队的唯一窗口。
// 全部字段从实测工具/落盘产物取数，禁止 captain 手写状态。依据 AGENTS §4「简报与脉搏」。
const PKG = join(W, 'packages/dsh-quanneng-squad');
const NODE = process.execPath;
const run = (script) => {
  const r = spawnSync(NODE, ['scripts/' + script], { cwd: PKG, encoding: 'utf8', timeout: 180000 });
  const j = { exit: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
  try { j.j = JSON.parse(r.stdout); } catch {}
  return j;
};

const sup = run('supervise.mjs');
const snap = sup.j || {};
const gates = snap.gates || {};

// 轮次真源：STATE.md 最后一轮（不凭记忆）。
const statePath = join(W, 'docs/squad/STATE.md');
const state = existsSync(statePath) ? readFileSync(statePath, 'utf8') : '';
const roundLines = state.split('\n').filter(l => /第[一二三四五六七八九十百零\d]+轮/.test(l));
const lastLine = roundLines[roundLines.length - 1] || '';
const roundNum = (lastLine.match(/第\s*([一二三四五六七八九十百零\d]+)\s*轮/) || [])[1] || '?';
const roundTitle = lastLine.replace(/^2026-\d\d-\d\d（/, '').replace(/）.?$/, '').trim().slice(0, 100);

// 结果数：独立实跑（pulse 在 verify 前跑）。
const vf = run('verify.mjs');
const vm = (vf.stdout + vf.stderr).match(/(\d+) passed, (\d+) failed/g) || [];
const verifyLine = vm[vm.length - 1] || 'unknown';
const testsRun = run('run-tests.mjs');
const tl = (testsRun.stdout + testsRun.stderr).match(/ℹ (tests|pass|fail|skipped) \d+/g) || [];
const testsLine = tl.join(' ');

// 路由机器真源。
let routes = { allowed: [], dead: [] };
try { routes = JSON.parse(readFileSync(join(W, 'docs/squad/gates/routes.json'), 'utf8')); } catch {}

// 真缺口清单：intel 清单实读「否」行。
let gaps = [];
const intel = join(W, 'docs/squad/intel/SN26-约束清单-refresh-2026-11-16.md');
if (existsSync(intel)) {
  for (const l of readFileSync(intel, 'utf8').split('\n'))
    if (/出域=否|入站.*否|\|\s*否\s*\|/.test(l) && /\|/.test(l)) gaps.push(l.trim().replace(/^-\s*/, '').slice(0, 120));
}
if (!gaps.length) gaps.push('（intel 清单未读到否项，需人工复核）');

// 在途 + 面板双账。
const inFlight = snap.inFlight || [];
const ps = run('panel-sync.mjs');
let panelStat = 'unavailable';
if (ps.j && Array.isArray(ps.j.tokens)) panelStat = ps.j.tokens.length + ' 令牌';

const attention = snap.attention || [];
const freshness = snap.freshness || {};
const seatRolling = snap.seatRolling || null;
const memorySla = snap.memorySla || {};
const java = snap.java || {};
const l4 = snap.l4 || {};
const tokenConverged = !!snap.tokenConverged;

// 轮转建议：从 FUNCTION-LEDGER 实读阶段映射 + ROSTER §七 W 轮次，算出当前 W 应上未上的席。
// 依据 AGENTS §3「席位=工位，阶段必产物缺失即判本迭代未完成」；软提示升级为可执行建议。
// B3 轮成本三数（1.16.0，Karpathy 成本账背书）：本轮派卡数 / 事件令牌数 / 门红数——全部实测取数。
let costThree = { cards: 0, tokens: 0, gateReds: 0 };
try {
  const dspDir = join(W, 'docs/squad/dispatch');
  costThree.cards = existsSync(dspDir) ? readdirSync(dspDir).filter(f => f.endsWith('.md')).length : 0;
  const st = deriveState();
  costThree.tokens = st.tokenCount;
  costThree.gateReds = attention.filter(x => /门红/.test(x)).length;
} catch {}
let rotationAdvice = [];
try {
  const rosterMd = readFileSync(join(W, 'docs/squad/ROSTER-16.md'), 'utf8');
  const rot = currentRotation(W);
  const wTable = rot.rows;
  const currentW = rot.current;
  if (currentW) {
    const activeBare = new Set((seatRolling ? [] : []));
    // 从 dispatch 卡文件名取已活动席（去 @vXX 后缀）
    const dsp = join(W, 'docs/squad/dispatch');
    if (existsSync(dsp))
      for (const f of readdirSync(dsp)) if (f.endsWith('.md')) activeBare.add(f.replace(/\.md$/, ''));
    // ROSTER 用简称（翰林/采风...），dispatch 用全称（翰林学士/采风官...）：前缀匹配。
    const missing = currentW.seats.filter(abbr => {
      const full = [...activeBare].some(a => a.startsWith(abbr) || abbr.startsWith(a.replace(/(经理|官|学士|大夫|郎中)$/, '')));
      const inWindow = (seatRolling?.activeSeats || 0) > 0
        ? (seatRolling.idleSeats || []).some(idle => idle.startsWith(abbr) || idle.includes(abbr))
        : !full;
      return inWindow;
    });
    rotationAdvice = ['当前名册 ' + currentW.round + '（应上 ' + currentW.seats.join('、') + '）',
      '近 ' + (seatRolling?.window || 5) + ' 轮未活动：' + (missing.length ? missing.join('、') : '无')];
  }
} catch (e) { rotationAdvice = ['轮转建议生成失败：' + e.message]; }

const gateLines = Object.entries(gates).map(([k, v]) => '- ' + k + ': ' + v).join('\n') || '- （无快照）';
const attLines = attention.length ? attention.map(x => '- ' + x).join('\n') : '- 无';
const gapLines = gaps.map(x => '- ' + x).join('\n');
const seatLine = seatRolling
  ? '近 ' + seatRolling.window + ' 轮 ' + seatRolling.activeSeats + '/16 席有派活；闲置：' + (seatRolling.idleSeats || []).join('、')
  : '无快照';
const inFlightLines = inFlight.length
  ? inFlight.map(x => '- ' + x.tok + '（' + x.seat + '）').join('\n')
  : '- 无在途令牌';
const routeLines = '- 白名单（可用）：' + (routes.allowed || []).join(', ') + '\n- 黑名单（失效）：' + (routes.dead || []).join(', ');
const verifyStatus = verifyLine.indexOf(' 0 failed') >= 0 ? '绿' : '红';

const md = [
  '# TEAM-PULSE · 第 ' + roundNum + ' 轮',
  '',
  '> 机器生成（AGENTS §4）：全部字段从实测工具/落盘产物取数，禁止 captain 手写状态。',
  '> 生成时间：' + new Date().toISOString() + ' ｜ 轮次真源：STATE.md 最后一轮 ｜ 监督真源：supervise.mjs 快照',
  '> 注：本报告由 pulse.mjs 生成后，supervise 的 freshness 才转绿（顺序：supervise → pulse）；旧快照中的 "TEAM-PULSE 超 2h" 属生成前取数，下轮自动消失。',
  '',
  '## 七门状态',
  gateLines,
  '',
  '## 结果',
  '- supervise exit ' + sup.exit + ' ｜ verify ' + verifyLine + '（' + verifyStatus + '） ｜ tests: ' + testsLine,
  '- 收敛判据 tokenConverged：' + tokenConverged + '（在途 ' + inFlight.length + ' ／ 门红 ' + attention.filter(x => /门红/.test(x)).length + '）',
  '- Java 批件：' + java.verdict + '（' + (java.reports || 0) + ' 报告）',
  '- memory-sla：' + (memorySla.exit === 0 ? '绿' : '阻断') + '（pendingReplay ' + (memorySla.pending ?? '?') + '）',
  '- L4 maturity：' + JSON.stringify(l4),
  '',
  '## 本轮成本三数（卡 / 令牌 / 门红）',
  '- 派卡 ' + costThree.cards + ' 张 ｜ 事件令牌 ' + costThree.tokens + ' 枚 ｜ 门红 ' + costThree.gateReds + ' 项（B3 成本账 1.16.0）',
  '',
  '## 席位活动',
  seatLine,
  '',
  '## 下一轮轮转建议',
  ...rotationAdvice.map(x => '- ' + x),
  '',
  '## 在途令牌',
  inFlightLines,
  '',
  '## 路由快照',
  routeLines,
  '',
  '## 面板双账',
  '- panel-sync：' + panelStat,
  '- 已知平台限制：t13 血缘 blocker（终端卡无 repair-finding 出口）；t19 failed（路由记录）',
  '',
  '## 未闭合风险（attention）',
  attLines,
  '',
  '## 真缺口清单（intel 实读）',
  gapLines,
  '',
  '## 新鲜度',
  '- pulse 生成时间：' + new Date().toISOString() + ' ｜ STATE 最后轮次：第 ' + roundNum + ' 轮',
  '- 快照 freshness：' + JSON.stringify(freshness),
  '',
].join('\n');

const pulsePath = join(W, 'docs/squad/TEAM-PULSE.md');
writeFileSync(pulsePath, md, 'utf8');
writeFileSync(join(W, 'docs/squad/SUPERVISION.json'), JSON.stringify(snap, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ pulse: pulsePath, round: roundNum, verify: verifyLine,
  gateRed: Object.entries(gates).filter(([k, v]) => v !== 0), attention: attention.length,
  inFlight: inFlight.length, gaps: gaps.length }, null, 2));
