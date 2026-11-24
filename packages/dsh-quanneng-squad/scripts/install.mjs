import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { homedir } from 'node:os';
import { resolveProfileDir, sliceBlock } from './lib/config-adapter.mjs';
import { syncSeatModels } from './sync-seat-model.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const profileDir = resolveProfileDir();
const dest = join(profileDir, 'node_modules', 'dsh-quanneng-squad');
const pjPath = join(profileDir, 'package.json');

// 派生目录一律不入发布物：node_modules 由 profile 装；.tmp-* 是测试/探针沙箱（本宿主 env 为空，
// os.tmpdir() 不可用，测试只能落在工作区内，因此必须按前缀排除）。
const SKIP_DIRS = new Set(['node_modules', '.git', 'target']);
const skipDir = (name) => SKIP_DIRS.has(name) || name.startsWith('.tmp-');
// 目的端只清派生沙箱；node_modules 属依赖树，只排除、不清理。
const purgeDir = (name) => name === 'target' || name === '.git' || name.startsWith('.tmp-');
function copyDir(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const e of readdirSync(src, { withFileTypes: true })) {
    if (e.isDirectory() && skipDir(e.name)) continue;
    const s = join(src, e.name), d = join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}
// 清理上一版可能已复制进发布物的派生目录（遍历 dest 自身；判据同 skipDir，幂等）
if (existsSync(dest)) {
  for (const junk of readdirSync(dest, { withFileTypes: true })) {
    if (junk.isDirectory() && purgeDir(junk.name)) rmSync(join(dest, junk.name), { recursive: true, force: true });
  }
}
copyDir(root, dest);

// 同步 profile 根 cordis.patch.yml：宿主读的是这一份（不是包内副本）。
// 此前只更新 node_modules 副本，导致「插件已更新但宿主仍用旧配置」——preset-unavailable 根因。
const profilePatch = join(profileDir, 'cordis.patch.yml');
const builtPatch = join(root, 'cordis.patch.yml');
let patchSynced = false;
if (existsSync(builtPatch)) {
  const srcText = readFileSync(builtPatch, 'utf8');
  // P15：bundle 不钉死模型。覆盖前把 profile 里用户当前的 agent-default-model 块合并回来，
  // 否则升级 install 会把用户当前路由（可能已被 GUI 改写）退回成空配置。
  const userBlock = existsSync(profilePatch) ? sliceBlock(readFileSync(profilePatch, 'utf8'), 'agent-default-model') : '';
  const injectBlock = (base, block) => {
    const ls = base.split(/\r?\n/);
    const at = ls.findIndex(l => /^\s*- id:\s*agent-default-model\s*$/.test(l));
    if (at < 0) return base.trimEnd() + "\n\n" + block + "\n";
    let end = ls.length;
    for (let k = at + 1; k < ls.length; k++) if (/^\s*- (?:id|insert):/.test(ls[k])) { end = k; break; }
    return [...ls.slice(0, at), block, ...ls.slice(end)].join("\n");
  };
  const targetText = userBlock ? injectBlock(srcText, userBlock) : srcText;
  if (!existsSync(profilePatch) || readFileSync(profilePatch, 'utf8') !== targetText) {
    if (existsSync(profilePatch)) writeFileSync(profilePatch + '.bak-' + Date.now(), readFileSync(profilePatch, 'utf8'), 'utf8');
    writeFileSync(profilePatch, targetText, 'utf8');
    patchSynced = true;
  }
}


let bundlesUpdated = false;
if (existsSync(pjPath)) {
  const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
  pj.dsh ??= {}; pj.dsh.profile ??= {}; pj.dsh.profile.bundles ??= [];
  const seen = new Set(); const clean = [];
  for (const b of pj.dsh.profile.bundles) {
    const k = (b.startsWith('file:') && b.includes('dsh-quanneng-squad')) ? 'dsh-quanneng-squad' : b;
    if (!seen.has(k)) { seen.add(k); clean.push(k); }
  }
  if (!clean.includes('dsh-quanneng-squad')) clean.push('dsh-quanneng-squad');
  if (JSON.stringify(clean) !== JSON.stringify(pj.dsh.profile.bundles)) {
    writeFileSync(pjPath + '.bak-' + Date.now(), JSON.stringify(pj, null, 2), 'utf8');
    pj.dsh.profile.bundles = clean;
    writeFileSync(pjPath, JSON.stringify(pj, null, 2) + '\n', 'utf8');
    bundlesUpdated = true;
  }
}
// ── 部署 agent presets 到用户目录（修「预设定义了但模式下拉选不到」）：
// canonical presets.yml 是唯一真源；按 preset-squad-<role> 块切分，每个生成
// $DSH_HOME/.agent-presets/squad-<role>/{preset.yml,agent.cordis.yml}。幂等，内容变更才写。
const presetsSrc = join(root, 'assets/canonical/presets.yml');
const presetsHome = join(homedir(), '.dsh', '.agent-presets');
let presetsDeployed = [];
if (existsSync(presetsSrc)) {
  const pl = readFileSync(presetsSrc, 'utf8').split('\n');
  const starts = pl.map((l, i) => ({ i, m: l.match(/^\s*-\s*id:\s*preset-squad-(\w+)\s*$/) })).filter(x => x.m);
  for (let k = 0; k < starts.length; k++) {
    const role = starts[k].m[1];
    const end = k + 1 < starts.length ? starts[k + 1].i : pl.length;
    const block = pl.slice(starts[k].i, end).map(l => l.replace(/^    /, '')).join('\n').trimEnd();
    const pdest = join(presetsHome, 'squad-' + role);
    mkdirSync(pdest, { recursive: true });
    const nm = block.match(/\n\s*name:\s*([^\n]+)/);
    // config 内 name 才是显示名；插件模块名（@deepseek-ai/...）跳过。
    const nameLines = [...block.matchAll(/\n\s*name:\s*([^\n]+)/g)].map(m => m[1].trim().replace(/^['"]|['"]$/g, ''));
    const displayName = nameLines.find(n => !n.startsWith('@')) || '全能小队 ' + role;
    const dm = block.match(/\n\s*description:\s*([^\n]+)/);
    const om = block.match(/\n\s*order:\s*(\d+)/);
    const presetYml = ['name: ' + displayName,
      'description: ' + (dm ? dm[1].trim() : '全能编程小队 ' + role),
      'order: ' + (om ? om[1] : '30'), ''].join('\n');
    const agentYml = ['# managed-by: dsh-quanneng-squad（由 canonical presets.yml 生成，勿手改）',
      '# 全能编程小队 · ' + role + ' 预设', '', block, ''].join('\n');
    for (const [f, content] of [['preset.yml', presetYml], ['agent.cordis.yml', agentYml]]) {
      const fp = join(pdest, f);
      if (!existsSync(fp) || readFileSync(fp, 'utf8') !== content) writeFileSync(fp, content, 'utf8');
    }
    presetsDeployed.push('squad-' + role);
  }
}
// ── lock/状态文件路径自愈：防止 package.json 已切源、lock 仍锁旧路径 → pnpm 反复弹「构建脚本待决」──
// 病根：pnpm 对 file: 依赖把绝对盘符写进 pnpm-lock.yaml / .modules.yaml；路径迁移后这些记录不随
// package.json 更新，pnpm 每次 install 从 lock 读到旧路径 + 旧 ignoredBuilds，把提示行写回 workspace
// 的 allowBuilds（非法占位值），进而影响其他插件安装。此处把旧路径统一改回当前源路径。
const SOURCE = join(root);                       // 当前插件源根（本工作区）
const toPosix = (p) => p.split(String.fromCharCode(92)).join('/');
const sourcePosix = toPosix(SOURCE);
const lockFiles = [
  join(profileDir, 'pnpm-lock.yaml'),
  join(profileDir, 'node_modules', '.modules.yaml'),
  join(profileDir, 'pnpm-workspace.yaml'),
];
const lockHealed = [];
for (const lf of lockFiles) {
  if (!existsSync(lf)) continue;
  const before = readFileSync(lf, 'utf8');
  // 匹配任意盘符下指向 dsh-quanneng-squad 的旧 file: 目录路径
  let after = before.replace(/[A-Za-z]:[\\/][^\s"'()]*dsh-quanneng-squad/g, (m) =>
    m.includes(sourcePosix) ? m : sourcePosix);
  // 清除 workspace 里 pnpm 写回的非法/待决 allowBuilds 占位行（值非 true/false）
  if (lf.endsWith('pnpm-workspace.yaml')) {
    after = after.split('\n').filter(line =>
      !(/dsh-quanneng-squad/.test(line) && !/:\s*(true|false)\s*$/.test(line))).join('\n');
  }
  // 清除 .modules.yaml 的 ignoredBuilds 中本插件记录——这是 DSH GUI 反复弹「构建脚本待决」的持久源：
  // 本插件是预构建 bundle、零 lifecycle 脚本，本就不该出现在 ignoredBuilds；留着会让 pnpm 每次
  // 重放依赖树都认定有未决构建批准，用户点放行后又被 --ignore-scripts 路径写回，形成死循环。
  if (lf.endsWith('.modules.yaml')) {
    after = after.split('\n').filter(line =>
      !(/^\s*"dsh-quanneng-squad@file:/.test(line))).join('\n');
  }
  if (after !== before) { writeFileSync(lf, after, 'utf8'); lockHealed.push(lf.split(/[\\/]/).pop()); }
}

// P15 席位跟随主模型：更新插件时清空席位 model pin（无 pin = 跟随宿主当前默认模型）。
let seatModelSync = null;
try { seatModelSync = syncSeatModels(); } catch (e) { seatModelSync = { skipped: true, reason: e.message }; }
console.log(JSON.stringify({ installedTo: dest, bundlesUpdated, profileDir, lockHealed,
  presetsDeployed, patchSynced, seatModelSync, nextStep: '重启 DSH 并在新会话生效；随后 node scripts/verify.mjs', version: JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version }, null, 2));
