// patch 真源同步（第1期重构）：build-patch 的生成逻辑抽为可导入纯函数。
// DIP：verify/install 可直接 import buildPatchText() 做字节级自检闭环（双真源漂移的治本）。
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** 由 canonical 真源生成 patch 文本（纯函数，无副作用）。root=插件包根。 */
export function buildPatchText(root) {
  const presets = readFileSync(join(root, 'assets/canonical/presets.yml'), 'utf8').trimEnd();
  const overrides = readFileSync(join(root, 'assets/canonical/team-overrides.yml'), 'utf8').trimEnd();
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  return [
    '# GENERATED FILE — DO NOT EDIT. Edit assets/canonical/*.yml then run: node scripts/build-patch.mjs',
    '# dsh-quanneng-squad · bundle patch v' + version,
    '# 1) 7 个 agent preset  2) agent-teams 覆盖 maxMembers 8→16 + quanneng-16 全编 profile',
    '# 生效：加入 dsh.profile.bundles 后重启 DSH，新会话加载。',
    '',
    presets,
    '',
    overrides,
    '',
  ].join('\n');
}

/** 生成并写盘（仅 CLI/需要落盘时调用）。返回 { text, bytes, changed }。 */
export function syncPatchFile(root) {
  const text = buildPatchText(root);
  const target = join(root, 'cordis.patch.yml');
  const cur = readFileSyncSafe(target);
  const changed = cur === null || cur !== text;
  if (changed) writeFileSync(target, text, 'utf8');
  return { text, bytes: text.length, changed };
}
function existsSyncSafe(p) { return readFileSyncSafe(p)!==null; }
function readFileSyncSafe(p){ try { return readFileSync(p,'utf8'); } catch { return null; } }
