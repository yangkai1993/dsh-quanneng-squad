// L2-S3 · upgrade 编排组件：预检→备份→安装→诊断→提交/失败自动回滚。
// 设计：docs/squad/L2-DELIVERY-DESIGN.md §3。备份默认开，--no-rollback 保留现场排障。
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { configSnapshot } from "../lib/config-adapter.mjs";
import { createBackup, listBackups, restoreBackup, ledgerAppend, ledgerPending } from "./lifecycle.mjs";
import { checkDoctor } from "../doctor.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODE = process.execPath;
const run = (script, args=[]) => spawnSync(NODE, [join(root, "scripts", script), ...args], { cwd: root, encoding: "utf8", timeout: 300000 });

/** 纯函数式升级编排（副作用：写 profile + ledger）。dryRun 不改任何盘。 */
export function upgrade({ profileDir, dryRun, force, autoRollback = true } = {}) {
  const pd = profileDir || configSnapshot().profileDir;
  const fromVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version; // 源版本（即将安装的版本）
  const pre = checkDoctor({ profileDir: pd });
  if (pre.level === "incompatible" && !force) {
    ledgerAppend(pd, { action: "upgrade", phase: "aborted", reason: "precheck-incompatible", from: pre.version });
    return { ok: false, reason: "precheck-incompatible", doctorLevel: pre.level };
  }
  if (dryRun) return { ok: true, dryRun: true, fromVersion, doctorLevel: pre.level, plan: ["backup", "install", "doctor", "commit"] };
  // 备份（当前安装状态）
  const backup = createBackup({ profileDir: pd, version: pre.version });
  ledgerAppend(pd, { action: "upgrade", phase: "pending", from: pre.version, to: fromVersion, backupId: backup.backupId });
  // 安装源到 profile
  const ins = run("install.mjs");
  if (ins.status !== 0) {
    ledgerAppend(pd, { action: "upgrade", phase: "failed", reason: "install-exit-" + ins.status, backupId: backup.backupId });
    return { ok: false, reason: "install-failed", backupId: backup.backupId };
  }
  // 诊断新状态
  const post = checkDoctor({ profileDir: pd });
  if (post.level === "ok" || post.level === "degraded" || !autoRollback) {
    ledgerAppend(pd, { action: "upgrade", phase: post.level === "ok" ? "committed" : "committed-degraded", from: pre.version, to: fromVersion, backupId: backup.backupId, doctorLevel: post.level });
    return { ok: true, fromVersion: pre.version, toVersion: fromVersion, backupId: backup.backupId, doctorLevel: post.level };
  }
  // incompatible → 自动回滚
  const rb = restoreBackup({ profileDir: pd, backupId: backup.backupId });
  const after = checkDoctor({ profileDir: pd });
  ledgerAppend(pd, { action: "upgrade", phase: rb.ok ? "rolled_back" : "manual_required", backupId: backup.backupId, doctorAfter: after.level });
  return { ok: false, reason: "post-incompatible", rolledBack: rb.ok, backupId: backup.backupId, doctorLevel: after.level };
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = upgrade({ dryRun: args.includes("--dry-run"), force: args.includes("--force"), autoRollback: !args.includes("--no-rollback") });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
