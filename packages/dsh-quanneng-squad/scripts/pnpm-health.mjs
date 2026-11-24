// pnpm 构建批准健康诊断：确认全能小队插件没有触发 GUI 的「构建脚本待决」提示。
// 运行：node scripts/pnpm-health.mjs（在插件包目录），或 import { checkPnpmHealth }。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { resolveProfileDir } from './lib/config-adapter.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const profile = resolveProfileDir();
export function checkPnpmHealth() {
  const checks = [];
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const lifecycle = ['install', 'postinstall', 'preinstall', 'prepare'].filter(k => pkg.scripts?.[k]);
  checks.push({ name: '插件零生命周期脚本', ok: lifecycle.length === 0, detail: lifecycle });
  checks.push({ name: '插件包内无 pnpm 批准字段', ok: !('pnpm' in pkg) });
  const lock = join(profile, 'pnpm-lock.yaml');
  if (existsSync(lock)) {
    const l = readFileSync(lock, 'utf8');
    checks.push({ name: 'lock 无 trade-in 旧路径', ok: !/trade-in/.test(l) });
    checks.push({ name: 'lock 指向当前工作区', ok: /dsh-quanneng-squad@file:[^\s]*dsh-squad-lab/.test(l) });
  }
  const ws = join(profile, 'pnpm-workspace.yaml');
  if (existsSync(ws)) {
    const w = readFileSync(ws, 'utf8');
    checks.push({ name: 'workspace 无本插件待决 allowBuilds 脏行',
      ok: !/[\s\S]*dsh-quanneng-squad[\s\S]*set this to true or false/.test(w) });
  }
  const mod = join(profile, 'node_modules', '.modules.yaml');
  if (existsSync(mod)) {
    const m = readFileSync(mod, 'utf8');
    const ignored = (m.match(/"dsh-quanneng-squad@file:[^"]*"/g) || []);
    // 只统计出现在 ignoredBuilds 段内的记录
    const seg = m.split('"ignoredBuilds": [')[1]?.split(']')[0] || '';
    checks.push({ name: 'ignoredBuilds 无本插件记录', ok: !/dsh-quanneng-squad/.test(seg), detail: ignored.length });
  }
  const failed = checks.filter(c => !c.ok);
  return { ok: failed.length === 0, checks, failed: failed.length };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = checkPnpmHealth();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
