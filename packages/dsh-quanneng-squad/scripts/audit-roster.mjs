import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { W, runGate, failFast } from './lib/gate-kit.mjs';
import { readDefaultModel } from './lib/config-adapter.mjs';
import { SQUAD_ID } from './lib/squad-const.mjs';
// 名册路由门：席位 provider/model 在创建时快照并持久化于 team.json，改 profile 默认值不影响既有席位
// （D-019R 实测）。因此死路由席位「可被激活但不会产出」，必须由本门检出。
// 默认阻断；豁免 = EXEMPTIONS.md 当前表（带到期日）或 QUANNENG_ALLOW_DEAD_ROUTE=1。
const NAME = 'audit-roster';
const VAR = 'QUANNENG_ALLOW_DEAD_ROUTE';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SQID = SQUAD_ID;
const warn = [];

// 1) profile 默认模型（agent-default-model 补丁项）
const dm = readDefaultModel();   // 统一适配层：自适应 profile 位置与配置形态
const profileDefault = dm ? dm.full : null;
if (!profileDefault) warn.push('profile 默认模型不可读/为空：期望路由未知（不限制模型，仅提示）');

// 2) 期望路由（未给定期望时用 profile 默认值）
const expected = process.env.QUANNENG_EXPECTED_MODEL || profileDefault;
if (!expected) warn.push('期望路由无法确定（profile 不可读且未设 QUANNENG_EXPECTED_MODEL）——fail-closed');

// 3) 名册快照（由 export-roster 或指挥从 agent_teams_status 导出）
const snapPath = join(root, 'assets/roster-snapshot.json');
let snap = null, seats = [];
if (existsSync(snapPath)) {
  try { snap = JSON.parse(readFileSync(snapPath, 'utf8')); seats = snap.seats || []; }
  catch (e) { warn.push('roster-snapshot.json 解析失败：' + e.message); }
} else {
  warn.push('缺少 assets/roster-snapshot.json：路由审计无数据可依');
}

// 4) 新鲜度：过期快照会让审计变成假绿
if (snap) {
  const ageH = (Date.now() - Date.parse(snap.takenAt || '')) / 3600000;
  if (Number.isNaN(ageH)) warn.push('roster-snapshot.takenAt 无法解析，结论不可信');
  else if (ageH > 24) warn.push('roster-snapshot 已过期（' + Math.round(ageH) + 'h），请重新导出名册');
}

// 5) 不限制模型（用户规约）：不再按任何模型名/provider 白黑名单拒席位。
// 任何 provider/model 都可用；席位路由只做结构性审计（空名册/重复后缀），不做可用性判断。
// 6) 席位名累积多重版本后缀 = 轮换没清干净
const doubled = seats.filter(s => /@v\d+@v\d+/.test(String(s.seat)));
// t10 后续防线：空名册快照不构成审计（vacuous green 禁止）。
if (seats.length === 0) warn.push('roster-snapshot 空名册：审计无席位可依（export 数据源断裂，须从 profile 重导）');

if (doubled.length) warn.push('席位名累积版本后缀：' + doubled.map(s => s.seat).join(', '));

const exitCode = runGate({ name: NAME, varName: VAR, kind: '路由告警', items: warn, W,
  report: { workspace: W, gate: NAME, profileDefaultModel: profileDefault, expectedModel: expected ?? null,
    squadId: SQID, seats: seats.length, warnings: warn } });
failFast(exitCode);
