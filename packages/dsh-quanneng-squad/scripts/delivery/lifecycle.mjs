// L2-S3 · 生命周期共享组件：备份（滚动 N=5）/恢复/ledger（upgrade 与 rollback 共用）。
// 设计：备份结构 <profile>/.dsh-quanneng-squad-backups/<ts>-<version>/{package/,cordis.patch.yml,bundle-registration.json}
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";

export const BACKUP_DIR = ".dsh-quanneng-squad-backups";
export const MAX_BACKUPS = 5;
export const LEDGER_FILE = "upgrade-ledger.jsonl";

const bakRoot = pd => join(pd, BACKUP_DIR);
const now = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

/** 备份当前安装状态，返回 backupId。滚动淘汰超出 MAX_BACKUPS 的旧备份。 */
export function createBackup({ profileDir, version }) {
  const id = now() + "-v" + version;
  const dir = join(bakRoot(profileDir), id);
  mkdirSync(join(dir, "package"), { recursive: true });
  // 1) cordis.patch.yml
  const patch = join(profileDir, "cordis.patch.yml");
  if (existsSync(patch)) copyFileSync(patch, join(dir, "cordis.patch.yml"));
  // 2) bundle 注册信息（package.json 的 dsh.profile.bundles）
  const pj = join(profileDir, "package.json");
  const bundles = existsSync(pj) ? (JSON.parse(readFileSync(pj, "utf8")).dsh?.profile?.bundles || []) : [];
  writeFileSync(join(dir, "bundle-registration.json"), JSON.stringify({ bundles, version, backedAt: new Date().toISOString() }, null, 2), "utf8");
  // 3) 已安装插件目录（node_modules/dsh-quanneng-squad）——仅关键文件，避免体积过大
  const inst = join(profileDir, "node_modules", "dsh-quanneng-squad");
  if (existsSync(inst)) {
    for (const f of ["package.json", "cordis.patch.yml", "compatibility.json", "lib/index.js"]) {
      const src = join(inst, f), dst = join(dir, "package", f);
      if (existsSync(src)) { mkdirSync(dirname(dst), { recursive: true }); copyFileSync(src, dst); }
    }
  }
  // 滚动淘汰
  try {
    const ids = readdirSync(bakRoot(profileDir), { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name).sort();
    while (ids.length > MAX_BACKUPS) { rmSync(join(bakRoot(profileDir), ids.shift()), { recursive: true, force: true }); }
  } catch {}
  return { backupId: id, dir };
}

/** 列出可用备份（新→旧），校验完整性（含 cordis.patch.yml 或 package 目录）。 */
export function listBackups(profileDir) {
  const root = bakRoot(profileDir);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).filter(x => x.isDirectory()).map(x => {
    const dir = join(root, x.name);
    const ok = existsSync(join(dir, "cordis.patch.yml")) || existsSync(join(dir, "package", "package.json"));
    return { id: x.name, dir, ok, version: (x.name.match(/v([^/]+)$/) || [])[1] || "?" };
  }).sort((a,b) => b.id.localeCompare(a.id));
}

/** 从备份恢复 cordis.patch.yml 与 bundle 注册（不自动重启宿主）。 */
export function restoreBackup({ profileDir, backupId }) {
  const dir = join(bakRoot(profileDir), backupId);
  if (!existsSync(dir)) return { ok: false, reason: "backup-not-found" };
  const patchSrc = join(dir, "cordis.patch.yml");
  if (existsSync(patchSrc)) copyFileSync(patchSrc, join(profileDir, "cordis.patch.yml"));
  const reg = join(dir, "bundle-registration.json");
  if (existsSync(reg)) {
    const data = JSON.parse(readFileSync(reg, "utf8"));
    const pjPath = join(profileDir, "package.json");
    if (existsSync(pjPath)) {
      const pj = JSON.parse(readFileSync(pjPath, "utf8"));
      pj.dsh ??= {}; pj.dsh.profile ??= {}; pj.dsh.profile.bundles = data.bundles || [];
      writeFileSync(pjPath, JSON.stringify(pj, null, 2) + "\n", "utf8");
    }
  }
  return { ok: true, restoredVersion: (backupId.match(/v(.+)$/) || [])[1] || "?", backupId };
}

/** ledger：追加一条升级/回滚记录。 */
export function ledgerAppend(profileDir, entry) {
  const f = join(bakRoot(profileDir), LEDGER_FILE);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n", { encoding: "utf8", flag: "a" });
}

/** ledger：读最后一条 pending（用于中断恢复）。 */
export function ledgerPending(profileDir) {
  const f = join(bakRoot(profileDir), LEDGER_FILE);
  if (!existsSync(f)) return null;
  const lines = readFileSync(f, "utf8").trim().split("\n").filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) { const e = JSON.parse(lines[i]); if (e.phase === "pending") return e; }
  return null;
}
