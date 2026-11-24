// 模型路由健康诊断：全能小队不限制任何模型（用户规约 USER-ORIGINAL-PROMPT.md:17/:31/:46）。
// 只做结构完整性检查：routes.json 可读、bundle 无钉定、profile 模型块存在。不按模型名/provider 拒。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { configSnapshot } from './lib/config-adapter.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const root = resolve(HERE, '..');
const workspace = resolve(root, '..', '..');
const profile = configSnapshot().profileDir;
export function checkRouteHealth() {
  const checks = [];
  // 1) routes.json 可读且无任何模型限制（allowed/dead/deadProviders 全空）
  let ok = true;
  try {
    const routes = JSON.parse(readFileSync(join(workspace, 'docs/squad/gates/routes.json'), 'utf8'));
    ok = (routes.allowed || []).length === 0 && (routes.dead || []).length === 0 && (routes.deadProviders || []).length === 0;
  } catch { ok = false; }
  checks.push({ name: 'routes.json 无任何模型限制（allowed/dead/deadProviders 全空）', ok });
  // 2) bundle 真源不钉死模型
  const canon = readFileSync(join(root, 'assets/canonical/team-overrides.yml'), 'utf8');
  const cm = canon.match(/provider:\s*(\S+)[\s\S]*?model:\s*(\S+)/);
  checks.push({ name: 'bundle 真源不钉死模型（无 provider/model 块）', ok: !cm });
  // 3) profile 根模型块可读（什么模型都可，只确认配置存在）
  const snap = configSnapshot();
  if (snap.patchExists) {
    checks.push({ name: 'profile 根模型块可读（任何 provider/model 都允许）', ok: true,
      detail: snap.model ? snap.model.full : '(跟随宿主默认/空配置)' });
  }
  const failed = checks.filter(c => !c.ok);
  return { ok: failed.length === 0, checks, failed: failed.length, policy: 'unrestricted' };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = checkRouteHealth();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
