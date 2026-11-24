// L2-S4 · 冷启动烟测：临时干净 profile 装→诊断→卸载。
import { writeFileSync, existsSync, mkdirSync, rmSync, copyFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODE = process.execPath;

export function smoke({ keep = false } = {}) {
  const steps = [];
  let tmp = null;
  try {
    tmp = mkdtempSync(join(tmpdir(), "dsh-quanneng-smoke-"));
    mkdirSync(join(tmp, "node_modules"), { recursive: true });
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "smoke-profile", dsh: { profile: { bundles: [] } } }, null, 2), "utf8");
    copyFileSync(join(root, "cordis.patch.yml"), join(tmp, "cordis.patch.yml"));
    steps.push({ step: "profile-init", ok: true });
    const env = { ...process.env, DSH_PROFILE_DIR: tmp };
    const ins = spawnSync(NODE, [join(root, "scripts/install.mjs")], { cwd: root, encoding: "utf8", timeout: 180000, env });
    steps.push({ step: "install", ok: ins.status === 0, detail: ins.status === 0 ? "" : (ins.stderr || ins.stdout || "").slice(-200) });
    if (ins.status !== 0) return { ok: false, steps, doctorLevel: "incompatible" };
    const doc = spawnSync(NODE, [join(root, "scripts/doctor.mjs")], { cwd: root, encoding: "utf8", timeout: 120000, env });
    let level = "unknown";
    try { const o = (doc.stdout || "").slice((doc.stdout || "").indexOf("{")); level = JSON.parse(o).level; } catch {}
    steps.push({ step: "doctor", ok: doc.status <= 1, level, detail: level });
    const ok = steps.every(s => s.ok) && (level === "ok" || level === "degraded");
    return { ok, steps, doctorLevel: level, tmpProfile: keep ? tmp : undefined };
  } catch (e) {
    steps.push({ step: "exception", ok: false, detail: e.message });
    return { ok: false, steps, doctorLevel: "incompatible" };
  } finally {
    if (tmp && !keep) try { rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = smoke({ keep: args.includes("--keep") });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
