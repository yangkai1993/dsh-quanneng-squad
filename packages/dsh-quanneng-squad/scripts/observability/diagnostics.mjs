// L5-P1 · diagnostics：症状→诊断路由（数据驱动表，非 if-else）。
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODE = process.execPath;
// 症状路由表（数据）：关键词 → 诊断动作（脚本+参数）与预期产物
const ROUTES = [
  { kws: ["模型不跟","换模型","席位不跟随","model pin"], script: "sync-seat-model.mjs", why: "席位残留 model pin", fix: "运行 sync-seat-model.mjs 清 pin" },
  { kws: ["pack 红","发布污染","pack --check"], script: "delivery/pack.mjs --check", why: "发布区混入污染文件", fix: "按 report.dirty 路径清理后重跑" },
  { kws: ["通讯断","member 断联","mailbox","回报不到"], script: "squadctl.mjs --help", why: "agent-teams 状态异常", fix: "查 team.json id/createdAt/captainSessionId；send_message 参数 content" },
  { kws: ["升级失败","回滚失败","upgrade","rollback"], script: "delivery/upgrade.mjs --dry-run", why: "升级/回滚链路问题", fix: "dry-run 预检；查 upgrade-ledger.jsonl pending" },
  { kws: ["事件日志损坏","round-events 损坏","fail-closed 事件"], script: "state-machine-gate.mjs", why: "事件日志行损坏或 type 非法（readEvents fail-closed）", fix: "按报错行号修复 docs/squad/events/round-events.jsonl 对应行；禁止静默删行" },
  { kws: ["令牌卡死","状态机非法","token-state-machine 红","令牌跳转"], script: "state-machine-gate.mjs", why: "令牌生命周期出现非法跳转或终态后新事件", fix: "按 problems 中 seq 定位事件；REJECT 后重派走 cmdDispatch；勿手改 JSONL" },
  { kws: ["patch 漂移","patch-source","canonical 不一致"], script: "build-patch.mjs", why: "canonical 与 patch 漂移", fix: "重跑 build-patch.mjs 重建" },
  { kws: ["health","健康","体检","诊断"], script: "observability/hub.mjs", why: "需要全貌", fix: "跑 observability/hub.mjs 聚合五源" }
];

export function diagnostics(issue) {
  const q = String(issue || "").trim();
  if (!q) return { ok: false, reason: "issue required" };
  const hit = ROUTES.find(r => r.kws.some(kw => q.includes(kw)));
  if (!hit) return { ok: true, matched: false, hint: "无匹配路由；建议先跑 observability/hub.mjs 看全貌" };
  // 实际执行路由指向的脚本并回 JSON
  const args = hit.script.split(" ");
  const r = spawnSync(NODE, [join(root, "scripts", ...args)], { cwd: root, encoding: "utf8", timeout: 120000, maxBuffer: 20 * 1024 * 1024 });
  const o = (r.stdout || "").slice((r.stdout || "").indexOf("{"));
  let data = null;
  try { data = JSON.parse(o); } catch {}
  return { ok: true, matched: hit.kws[0], script: hit.script, why: hit.why, fix: hit.fix, exit: r.status, data };
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = diagnostics(args.join(" "));
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
