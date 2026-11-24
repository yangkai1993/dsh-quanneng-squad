// L3-P0 · status：人话版运行状态——一条命令回答"现在什么情况"。
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { configSnapshot } from "../lib/config-adapter.mjs";
import { SQUAD_ID } from "../lib/squad-const.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ws = () => process.env.QUANNENG_WORKSPACE ?? join(root, "..", "..");

export function status() {
  const snap = configSnapshot();
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const r = {
    plugin: { name: pkg.name, version: pkg.version },
    model: snap.model ? snap.model.full : "(跟随宿主默认)",
    profile: snap.profileDir,
  };
  // doctor 三态
  try {
    const res = spawnSync(process.execPath, [join(root, "scripts", "doctor.mjs")], { cwd: root, encoding: "utf8", timeout: 60000 });
    const o = (res.stdout || "").slice((res.stdout || "").indexOf("{"));
    const j = JSON.parse(o);
    r.health = j.level;
  } catch (e) { r.health = "error: " + e.message; }
  // 名册
  try {
    const snapPath = join(root, "assets/roster-snapshot.json");
    if (existsSync(snapPath)) {
      const s2 = JSON.parse(readFileSync(snapPath, "utf8"));
      r.roster = { seats: s2.seats?.length ?? 0, pinned: s2.seats?.filter(x => x.model).length ?? 0 };
    }
  } catch {}
  // 最近派单卡
  try {
    const dsp = join(ws(), "docs/squad/dispatch");
    if (existsSync(dsp)) {
      const latest = readdirSync(dsp).filter(f => f.endsWith(".md")).map(f => ({ f, mt: statSync(join(dsp, f)).mtimeMs })).sort((a,b) => b.mt - a.mt)[0];
      r.lastDispatchCard = latest ? latest.f : null;
    }
  } catch {}
  return r;
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(JSON.stringify(status(), null, 2));
}
