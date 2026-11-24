// 统一配置适配层（config adapter）：让小队适应不同 profile 位置与不同模型配置形态。
// DRY/DIP：此前 profile 路径硬编码 desktop、模型块用脆弱正则在 6 个脚本各写一遍，此处收敛为单一健壮入口。
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const DSH_HOME = process.env.DSH_HOME ?? join(homedir(), '.dsh');
export const PROFILES_ROOT = join(DSH_HOME, 'profiles');
export const PATCH_FILE = 'cordis.patch.yml';
export const MODEL_BLOCK_ID = 'agent-default-model';

/** 当前 profile 目录：显式 > DSH_PROFILE 名 > 扫描最近修改的含 patch 的 profile > desktop/default 兜底。 */
export function resolveProfileDir() {
  if (process.env.DSH_PROFILE_DIR) return process.env.DSH_PROFILE_DIR;
  const named = process.env.DSH_PROFILE;
  if (named && existsSync(join(PROFILES_ROOT, named, PATCH_FILE))) return join(PROFILES_ROOT, named);
  try {
    const candidates = readdirSync(PROFILES_ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(join(PROFILES_ROOT, d.name, PATCH_FILE)))
      .map(d => ({ dir: join(PROFILES_ROOT, d.name), mt: statSync(join(PROFILES_ROOT, d.name, PATCH_FILE)).mtimeMs }))
      .sort((a, b) => b.mt - a.mt);
    if (candidates.length) return candidates[0].dir;
  } catch {}
  for (const n of ['desktop', 'default']) if (existsSync(join(PROFILES_ROOT, n, PATCH_FILE))) return join(PROFILES_ROOT, n);
  return join(PROFILES_ROOT, 'desktop');
}

/** profile patch 路径：显式 DSH_PROFILE_PATCH 优先。 */
export function resolveProfilePatch() {
  return process.env.DSH_PROFILE_PATCH || join(resolveProfileDir(), PATCH_FILE);
}

/** 逐行切出顶层 "- id: <id>" 块，遇到下一个顶层 "- id:" / "- insert:" 结束。 */
export function sliceBlock(text, id) {
  const lines = String(text).split(/\r?\n/);
  const start = lines.findIndex(l => new RegExp('^\s*- id:\\s*' + id + '\\s*$').test(l));
  if (start < 0) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*- (?:id|insert):/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

/** 读块内某 key 的标量值（支持 config:{} 空配置、多行 provider/model、内联花括号）。 */
export function blockScalar(block, key) {
  const re = new RegExp('(?:^|[,{\\s])' + key + ':\\s*["\']?([^"\'\\s,}\n]+)');
  const m = block.match(re);
  return m ? m[1] : null;
}

/** profile 当前默认模型：{provider,model,full} 或 null（空配置/残缺=不钉死，跟随宿主默认）。 */
export function readDefaultModel(patchPath) {
  const p = patchPath || resolveProfilePatch();
  try {
    const block = sliceBlock(readFileSync(p, 'utf8'), MODEL_BLOCK_ID);
    if (!block) return null;
    const provider = blockScalar(block, 'provider');
    const model = blockScalar(block, 'model');
    if (!provider || !model) return null;
    return { provider, model, full: provider + '/' + model };
  } catch { return null; }
}

/** 配置快照：供门/安装器统一消费。 */
export function configSnapshot() {
  const profileDir = resolveProfileDir();
  const patchPath = join(profileDir, PATCH_FILE);
  return { dshHome: DSH_HOME, profileDir, patchPath, patchExists: existsSync(patchPath), model: readDefaultModel(patchPath) };
}
