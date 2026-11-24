// L2-S3 · rollback 组件：从备份恢复到指定/上一可用版本，恢复后 doctor 验证。
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { configSnapshot } from "../lib/config-adapter.mjs";
import { listBackups, restoreBackup, ledgerAppend } from "./lifecycle.mjs";
import { checkDoctor } from "../doctor.mjs";

export function rollback({ profileDir, backupId, toVersion } = {}) {
  const pd = profileDir || configSnapshot().profileDir;
  const backups = listBackups(pd).filter(b => b.ok);
  if (!backups.length) { return { ok: false, reason: "no-valid-backup", available: [] }; }
  const target = backupId ? backups.find(b => b.id === backupId)
    : toVersion ? backups.find(b => b.version === toVersion || b.version === "v" + toVersion)
    : backups[0];
  if (!target) return { ok: false, reason: "backup-not-found", available: backups.map(b => b.id) };
  const rb = restoreBackup({ profileDir: pd, backupId: target.id });
  if (!rb.ok) return { ok: false, reason: "restore-failed", backupId: target.id };
  const doctor = checkDoctor({ profileDir: pd });
  const ok = doctor.level === "ok" || doctor.level === "degraded";
  ledgerAppend(pd, { action: "rollback", phase: ok ? "committed" : "manual_required", backupId: target.id, doctorLevel: doctor.level });
  return { ok, restoredVersion: rb.restoredVersion, backupId: target.id, doctorLevel: doctor.level };
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bidIdx = args.indexOf("--backup");
  const verIdx = args.indexOf("--to");
  const r = rollback({ backupId: bidIdx>=0 ? args[bidIdx+1] : undefined, toVersion: verIdx>=0 ? args[verIdx+1] : undefined });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
