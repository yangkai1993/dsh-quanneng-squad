import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';

// 环境注入守卫（R-A1 修复）：生产验证链（release）禁止外部 QUANNENG_WORKSPACE 指向伪绿包。
// 测试夹具直接 spawn 单个门（不经 release），不受影响；release 是生产认证入口，注入即 fail-closed。
const problems = [];
const injected = process.env.QUANNENG_WORKSPACE || null;
const hasState = existsSync(join(W, 'docs/squad/STATE.md'));
const hasPkg = existsSync(join(W, 'packages/dsh-quanneng-squad/package.json'));
const isRealWorkspace = hasState && hasPkg;
if (injected && !isRealWorkspace) {
  problems.push('生产验证链检测到伪工作区注入：QUANNENG_WORKSPACE=' + injected + '（缺 STATE.md 或包清单，可能用于伪造 hard-green）');
}
const report = { gate: 'env-guard', injected, resolvedW: W, hasState, hasPkg, isRealWorkspace, problems,
  note: '夹具直接调单门不受影响；仅 release 首步守护生产认证。' };
const exitCode = runGate({ name: 'env-guard', varName: 'QUANNENG_ALLOW_ENV_INJECT', kind: '生产注入伪绿风险',
  items: problems, W, report });
failFast(exitCode);
