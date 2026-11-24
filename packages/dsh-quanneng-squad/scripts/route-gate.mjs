import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';

// 全能小队不限制任何模型（用户原始规约 USER-ORIGINAL-PROMPT.md:17/:31/:46）。
// 席位无 model pin 时由宿主默认路由接管；本门只做结构检查，不按模型/provider 拒。
// 任何 provider/model 都允许：本门只做结构完整性检查（席位参数合法），不按模型名/provider 拒绝。
const DOC = join(W, 'docs/squad/gates/routes.json');
const problems = [];
let routes = {};
try {
  if (existsSync(DOC)) routes = JSON.parse(readFileSync(DOC, 'utf8'));
  else problems.push('路由真源缺失（routes.json 不存在）—— fail-closed');
} catch (e) { problems.push('路由真源读取失败: ' + e.message); }

const seatsJson = process.argv[2];
if (!seatsJson) problems.push('缺少席位参数（JSON 数组）');
let seats = [];
try { seats = JSON.parse(seatsJson || '[]'); } catch (e) { problems.push('席位 JSON 解析失败'); }
if (!Array.isArray(seats)) problems.push('席位参数必须是数组');

// 关键：不对 model / provider 做任何白名单/黑名单/地区/额度判断——全放行。
const exitCode = runGate({ name: 'route-gate', varName: 'QUANNENG_ALLOW_DEAD_ROUTE',
  kind: '派单路由参数风险', items: problems, W,
  report: { workspace: W, gate: 'route-gate', source: existsSync(DOC) ? 'routes.json' : 'missing',
    policy: 'unrestricted: 任何 provider/model 都可用', seats: seats.length, problems } });
failFast(exitCode);
