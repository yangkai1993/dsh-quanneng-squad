// L5-P1 · observability-hub：聚合 doctor/route-health/pnpm-health/supervise 五源，一条命令出全貌。
// 设计：docs/squad/ARCH-LAYERS.md L5。只做格式归一与汇总，不执行重逻辑。
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODE = process.execPath;

function runScript(script) {
  const r = spawnSync(NODE, [join(root, "scripts", script)], { cwd: root, encoding: "utf8", timeout: 120000, maxBuffer: 20 * 1024 * 1024 });
  const o = (r.stdout || "").slice((r.stdout || "").indexOf("{"));
  let data = null;
  try { data = JSON.parse(o); } catch {}
  return { exit: r.status, data };
}

export function hub() {
  const sources = {};
  const summary = [];
  // 1) doctor（三态）
  const doc = runScript("doctor.mjs");
  const docLevel = doc.data?.level || "unknown";
  sources.doctor = { level: docLevel, exit: doc.exit };
  summary.push("doctor: " + docLevel);
  // 2) route-health
  const rh = runScript("route-health.mjs");
  sources.routeHealth = { ok: rh.data?.ok, failed: rh.data?.failed, exit: rh.exit };
  summary.push("route-health: " + (rh.data?.ok ? "ok" : "red") + "(" + (rh.data?.failed ?? "?") + ")");
  // 3) pnpm-health
  const ph = runScript("pnpm-health.mjs");
  sources.pnpmHealth = { ok: ph.data?.ok, exit: ph.exit };
  summary.push("pnpm-health: " + (ph.data?.ok ? "ok" : "red"));
  // 4) supervise（SUPERVISION.json gates）
  const sv = runScript("supervise.mjs");
  const gateResults = sv.data?.gates || sv.data?.latestBatch?.gateResults || null;
  sources.supervise = { exit: sv.exit, gateResults: gateResults ? Object.fromEntries(Object.entries(gateResults).map(([k,v]) => [k, typeof v === "number" ? v : (v?.exit ?? "?")])) : null };
const sm = runScript("state-machine-gate.mjs");
  sources.tokenStateMachine = { exit: sm.exit, checked: sm.data?.checked, problems: (sm.data?.problems || []).length };
  summary.push("token-state-machine: " + (sm.exit === 0 ? "ok" : "red") + "(checked " + (sm.data?.checked ?? "?") + ")");
  summary.push("supervise: " + (sv.exit === 0 ? "ok" : "red"));
  // 5) pulse（TEAM-PULSE 存在性）
  const pu = runScript("pulse.mjs");
  sources.pulse = { exit: pu.exit };
  summary.push("pulse: " + (pu.exit === 0 ? "ok" : "red"));
  // 汇总 level：doctor 优先，其他门只影响 degraded
  let level = docLevel;
  if (level !== "incompatible") {
    const redCount = Object.values(sources).filter(s => s.exit !== 0).length;
    if (redCount > 0 && level === "ok") level = "degraded";
  }
  return { level, sources, summary, timestamp: new Date().toISOString() };
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = hub();
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.level === "ok" ? 0 : 1);
}
