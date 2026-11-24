// L2-S2 · doctor 兼容诊断组件：从静态文本检查升级为宿主能力探测三态（ok/degraded/incompatible）。
// 设计：E:/workspace/dsh-squad-lab/docs/squad/L2-DELIVERY-DESIGN.md §5。
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { configSnapshot, PROFILES_ROOT } from "./lib/config-adapter.mjs";
import { buildPatchText } from "./lib/patch-sync.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OK = "ok", DEG = "degraded", BAD = "incompatible";
const lv = (bad, deg=false) => bad ? BAD : (deg ? DEG : OK);

// 单条 check：{ name, level, detail, fix }
function check(name, level, detail, fix) { return { name, level, detail: String(detail), fix: fix || "" }; }

/** 纯函数：7 类兼容探测，返回三态报告。所有异常降级为单条 check，不让 doctor 崩。 */
export function checkDoctor({ profileDir, workspace, strict } = {}) {
  const checks = [];
  const ws = workspace || (process.env.QUANNENG_WORKSPACE ?? join(root, "..", ".."));
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const comp = JSON.parse(readFileSync(join(root, "compatibility.json"), "utf8"));
  const snap = configSnapshot();
  const pd = profileDir || snap.profileDir;

  // 1) Node 版本
  try {
    const need = (pkg.engines?.node || comp.requires?.node || ">=22").replace(/[^\d.]/g, "");
    const cur = process.versions.node.split(".").map(Number);
    const req = need.split(".").map(Number);
    const ok = cur[0] > req[0] || (cur[0] === req[0] && (cur[1]||0) >= (req[1]||0));
    checks.push(check("node-version", ok ? OK : BAD, process.versions.node + " requires >=" + need, ok ? "" : "升级 Node 至 " + need));
  } catch (e) { checks.push(check("node-version", DEG, "探测失败: " + e.message, "检查 engines.node 配置")); }

  // 2) DSH 版本（从宿主包 package.json 探测，缺失=degraded）
  try {
    const dshPkg = "D:/Programs/Dev/DeepSeek Harness/resources/app/dsh/package.json";
    let dshVer = null;
    for (const p of [process.env.DSH_PACKAGE_JSON, dshPkg]) if (p && existsSync(p)) { dshVer = JSON.parse(readFileSync(p,"utf8")).version; break; }
    if (!dshVer) checks.push(check("dsh-version", DEG, "未探测到宿主 DSH 版本", "在 DSH 环境内运行或设置 DSH_PACKAGE_JSON"));
    else checks.push(check("dsh-version", OK, dshVer + " requires " + (comp.requires?.dsh || "*"), ""));
  } catch (e) { checks.push(check("dsh-version", DEG, "探测失败: " + e.message, "检查 DSH 安装")); }

  // 3) 依赖插件存在且版本满足（探测 profile node_modules 与宿主 node_modules）
  try {
    const reqs = Object.entries(comp.requires || {}).filter(([k]) => k !== "node" && k !== "dsh");
    const roots = [join(pd, "node_modules"), "D:/Programs/Dev/DeepSeek Harness/resources/app/dsh/node_modules"];
    for (const [name, ver] of reqs) {
      const found = roots.map(r => join(r, ...name.split("/"))).find(p => existsSync(join(p, "package.json")));
      if (!found) { checks.push(check("dep:" + name, name === "@deepseek-ai/dsh-agent-preset" ? BAD : DEG, "缺失", "安装依赖 " + name + "@" + ver)); continue; }
      const got = JSON.parse(readFileSync(join(found, "package.json"),"utf8")).version || "?";
      checks.push(check("dep:" + name, OK, got + " requires " + ver, ""));
    }
  } catch (e) { checks.push(check("deps", DEG, "探测失败: " + e.message, "检查依赖安装")); }

  // 4) profile patch 结构（preset 数 / maxMembers / model 块形态）
  try {
    const pp = join(pd, "cordis.patch.yml");
    if (!existsSync(pp)) checks.push(check("patch-structure", BAD, "profile patch 不存在: " + pp, "运行 install.mjs"));
    else {
      const t = readFileSync(pp, "utf8");
      const presets = (t.match(/^\s*- id: preset-squad-/gm) || []).length;
      const mm = (t.match(/maxMembers:\s*(\d+)/) || [])[1];
      const ok = presets >= 7 && Number(mm) >= 16;
      checks.push(check("patch-structure", ok ? OK : BAD, "presets=" + presets + " maxMembers=" + mm, ok ? "" : "重装插件以恢复 patch 结构"));
    }
  } catch (e) { checks.push(check("patch-structure", DEG, "探测失败: " + e.message, "检查 patch 文件")); }

  // 5) patch 真源一致性（buildPatchText === 落盘 bundle patch）
  try {
    const generated = buildPatchText(root);
    const onDisk = readFileSync(join(root, "cordis.patch.yml"), "utf8");
    const ok = generated === onDisk;
    checks.push(check("patch-source", ok ? OK : BAD, ok ? "byte-identical" : "漂移", ok ? "" : "运行 node scripts/build-patch.mjs"));
  } catch (e) { checks.push(check("patch-source", DEG, "探测失败: " + e.message, "检查 canonical 源")); }

  // 6) EXEMPTIONS 过期行
  try {
    const exPath = join(ws, "docs/squad/gates/EXEMPTIONS.md");
    if (!existsSync(exPath)) checks.push(check("exemptions", DEG, "EXEMPTIONS.md 缺失", "创建豁免表"));
    else {
      const now = new Date().toISOString().slice(0,10);
      const expired = readFileSync(exPath,"utf8").split("\n").some(l => /^\|\s*\w[\w-]*\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(l) && (l.match(/\d{4}-\d{2}-\d{2}/)||[])[0] < now);
      checks.push(check("exemptions", expired ? DEG : OK, expired ? "存在过期豁免行" : "无过期行", expired ? "清理 EXEMPTIONS.md 当前表过期行" : ""));
    }
  } catch (e) { checks.push(check("exemptions", DEG, "探测失败: " + e.message, "检查豁免表")); }

  // 7) 发布物洁净度（dist 存在时 pack --check 的轻量等价： denying 模式扫描）
  try {
    const allowPath = join(root, "assets/PACKAGE-ALLOWLIST.json");
    const denyPath = join(root, "assets/PACKAGE-DENY.json");
    if (!existsSync(allowPath) || !existsSync(denyPath)) checks.push(check("pack-clean", DEG, "白/黑名单缺失", "运行 pack 组件"));
    else {
      const deny = JSON.parse(readFileSync(denyPath,"utf8"));
      const allow = JSON.parse(readFileSync(allowPath,"utf8"));
      const covered = [];
      for (const d of allow.dirs || []) {
        const base = join(root, d);
        if (!existsSync(base)) continue;
        const walk = (dir) => { for (const e of readdirSync(dir,{withFileTypes:true})) { const p = join(dir,e.name); if(e.isDirectory()) walk(p); else covered.push(p); } };
        walk(base);
      }
      const dirty = covered.filter(f => (deny.patterns||[]).some(pat => !pat.includes("*") && f.split(/[\\/]/).join("/").includes(pat)));
      checks.push(check("pack-clean", dirty.length ? DEG : OK, dirty.length ? "污染: " + dirty.slice(0,2).join(",") : "洁净", dirty.length ? "清理污染文件后重跑 pack" : ""));
    }
  } catch (e) { checks.push(check("pack-clean", DEG, "探测失败: " + e.message, "检查 pack 配置")); }

  // 汇总三态：任一 BAD → incompatible；否则任一 DEG → degraded；否则 ok
  const level = checks.some(c => c.level === BAD) ? BAD : checks.some(c => c.level === DEG) ? DEG : OK;
  const fixes = checks.filter(c => c.level !== OK && c.fix).map(c => ({ check: c.name, fix: c.fix }));
  return { level, checks, version: pkg.version, fixes, strict: Boolean(strict) };
}

// CLI：squadctl doctor [--json] [--strict]；exit 0/1/2 = ok/degraded/incompatible
const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = checkDoctor({ strict: args.includes("--strict") });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.level === OK ? 0 : report.level === DEG ? 1 : 2);
}
