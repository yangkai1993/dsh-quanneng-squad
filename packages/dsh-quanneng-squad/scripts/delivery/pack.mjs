// L2-S1 · 发布物构建组件（pack）：白名单发布 + 黑名单污染检出。
// 设计：E:/workspace/dsh-squad-lab/docs/squad/L2-DELIVERY-DESIGN.md §1。
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const posix = p => p.split(sep).join("/");
const sha = f => createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 16);

// 递归收集目录下所有文件（相对 posix 路径）
function walk(base, dir, acc) {
  const abs = join(base, dir);
  if (!existsSync(abs)) return acc;
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    const rel = dir ? dir + "/" + e.name : e.name;
    if (e.isDirectory()) walk(base, rel, acc);
    else acc.push(rel);
  }
  return acc;
}

// 黑名单匹配：glob 简化版（** / * 前缀匹配）
export function denylistHit(rel, patterns) {
  const r = posix(rel);
  return patterns.filter(pat => {
    // tests/** 这类「目录前缀」模式：必须整段路径组件匹配，不能用 includes。
    if (pat.endsWith("/**")) {
      const prefix = pat.slice(0, -3); // 去掉 /**
      return r === prefix || r.startsWith(prefix + "/");
    }
    // 无通配符的普通模式：basename 前缀或路径包含（.tmp-/袋鼠快照/%SystemDrive% 等）。
    if (!pat.includes("*")) return r.includes(pat);
    if (pat.includes("**")) {
      // 通用 **：按段匹配（如 scripts/**/*fixture*）
      const re = new RegExp("^" + pat.split("**").map(x => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")).join(".*") + "$");
      return re.test(r);
    }
    if (pat.startsWith("*.")) return r.endsWith(pat.slice(1));
    // "*xyz" 匹配 basename 前缀（如 .tmp-/.bak-*），不是整路径后缀。
    // "*xyz" 匹配 basename：后缀 "*" 用 endsWith（如 *.bak-*），否则前缀（如 .tmp-*）。
    if (pat.startsWith("*")) {
      const name = r.split("/").pop();
      const core = pat.slice(1);
      return core.endsWith("*") ? name.includes(core.slice(0, -1)) : name.startsWith(core);
    }
    return r === pat || r.startsWith(pat + "/");
  });
}
// 计算应发布文件集（白名单允许 ∩ 黑名单未拒）
export function resolveDistFiles(source, allowlist, denylist) {
  const allow = new Set(allowlist.files || []);
  const scripts = new Set(allowlist.scripts || []);
  const all = new Set(allowlist.files || []);
  for (const d of allowlist.dirs || [])
    for (const f of walk(source, d, [])) {
      if ((allowlist.dirsExclude || []).some(x => f.startsWith(x + "/"))) continue;
      if (!(allowlist.dirFilesInclude || ["*"]).some(pat => pat === "*" || f.endsWith(pat.slice(1)))) continue;
      all.add(f);
    }
  for (const s of scripts) all.add("scripts/" + s);
  const files = [...all].filter(f => existsSync(join(source, ...f.split("/")))).sort();
  const missing = [...all].filter(f => !existsSync(join(source, ...f.split("/")))).sort();
  const dirty = [];
  for (const f of files) {
    const hits = denylistHit(f, denylist.patterns || []);
    if (hits.length) dirty.push({ file: f, patterns: hits });
  }
  return { files, missing, dirty };
}

// 纯函数：构建 dist（source/target 为绝对路径），返回报告
export function buildDist({ source, target, allowlist, denylist, force }) {
  const plan = resolveDistFiles(source, allowlist, denylist);
  if (plan.missing.length) return { ok: false, reason: "allowlist-missing", missing: plan.missing, dirty: plan.dirty };
  if (plan.dirty.length) return { ok: false, reason: "dirty", missing: [], dirty: plan.dirty };
  if (existsSync(target) && !force) return { ok: false, reason: "target-exists", hint: "use --force", files: plan.files };
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const hashes = [];
  let bytes = 0;
  for (const f of plan.files) {
    const src = join(source, ...f.split("/"));
    const dst = join(target, ...f.split("/"));
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    const stat = statSync(src);
    bytes += stat.size;
    hashes.push(posix(f) + "  " + sha(src));
  }
  writeFileSync(join(target, "MANIFEST.sha256"), hashes.join("\n") + "\n", "utf8");
  return { ok: true, files: plan.files, bytes, manifest: "MANIFEST.sha256", dirty: [], missing: [] };
}

// CLI
const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = args.includes("--check");
  const force = args.includes("--force");
  const outIdx = args.indexOf("--out");
  const target = outIdx >= 0 ? join(root, args[outIdx + 1] || "dist") : join(root, "dist");
  const allow = JSON.parse(readFileSync(join(root, "assets/PACKAGE-ALLOWLIST.json"), "utf8"));
  const deny = JSON.parse(readFileSync(join(root, "assets/PACKAGE-DENY.json"), "utf8"));
  if (check) {
    const plan = resolveDistFiles(root, allow, deny);
    // 独立扫描磁盘污染（不受白名单过滤遮蔽）：deny 模式命中即红
    // 扫描"发布覆盖区域的磁盘文件"：白名单 dirs 全部文件（含被扩展名过滤的）+ files + scripts。
    const onDisk = [];
    for (const d of allow.dirs || []) walk(root, d, onDisk);
    for (const f of [...(allow.files || []), ...(allow.scripts || []).map(s => "scripts/" + s)])
      if (existsSync(join(root, ...f.split("/"))) && !onDisk.includes(f)) onDisk.push(f);
    const diskDirty = [];
    for (const f of onDisk) {
      const hits = denylistHit(f, deny.patterns || []);
      if (hits.length) diskDirty.push({ file: f, patterns: hits });
    }
    const allDirty = [...plan.dirty, ...diskDirty].filter((x,i,a) => a.findIndex(y => y.file === x.file) === i);
    const report = { gate: "pack-check", ok: !allDirty.length && !plan.missing.length, dirty: allDirty, missing: plan.missing, files: plan.files.length };
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }
  const r = buildDist({ source: root, target, allowlist: allow, denylist: deny, force });
  console.log(JSON.stringify({ gate: "pack", ...r }, null, 2));
  process.exit(r.ok ? 0 : 1);
}
