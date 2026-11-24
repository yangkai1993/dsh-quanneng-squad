// L5-P1 · telemetry：本地 JSONL 事件记录（派单/门/升级事件），可回放，零网络上报。
import * as fs from "node:fs";
const { appendFileSync, readFileSync, existsSync } = fs;
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ws = () => process.env.QUANNENG_WORKSPACE ?? join(root, "..", "..");
const file = () => join(ws(), "docs/squad/observability/telemetry.jsonl");

export function record(event) {
  const dir = dirname(file());
  if (!existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // 1.20.0（G3 计量）：seat 维度默认补齐（无 seat 的事件标 unknown——rank 聚合永不丢事件）；
  // usage 可选 {inputTokens,outputTokens,durationMs}，字段原样入档（计量真源=调用方，不伪造）。
  const norm = {
    ts: new Date().toISOString(),
    seat: typeof event?.seat === "string" && event.seat ? event.seat : "unknown",
    type: event?.type || "generic",
    ...event,
    usage: event?.usage && typeof event.usage === "object" ? event.usage : undefined,
  };
  const clean = { ...norm };
  if (clean.usage === undefined) delete clean.usage;
  const line = JSON.stringify(clean) + "\n";
  appendFileSync(file(), line, "utf8");
  return { ok: true, file: file() };
}

export function replay({ last = 20 } = {}) {
  if (!existsSync(file())) return { ok: true, events: [] };
  const lines = readFileSync(file(), "utf8").trim().split("\n").filter(Boolean);
  const events = lines.slice(-last).map(l => { try { return JSON.parse(l); } catch { return { bad: l }; } });
  return { ok: true, events, total: lines.length };
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cmd = args[0] || "replay";
  if (cmd === "record") {
    const r = record({ type: args[1] || "manual", detail: args.slice(2).join(" ") });
    console.log(JSON.stringify(r, null, 2));
  } else {
    const r = replay({ last: Number(args.find(a => a.startsWith("--last="))?.slice(7)) || 20 });
    console.log(JSON.stringify(r, null, 2));
  }
}
