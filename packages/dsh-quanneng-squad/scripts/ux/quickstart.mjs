// L3-P0 · quickstart：一句话任务 → 可复制的 subagent prompt（squadRole + 六要素自动补全）。
// 设计：docs/squad/ARCH-LAYERS.md L3 quickstart 组件。零配置派活。
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SQUAD_ID } from "../lib/squad-const.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// 席位路由表：任务意图 → 建议席位（prompt 角色文件在 docs/squad/prompts/）
const SEAT_MAP = [
  { seat: "后端经理",    role: "backend-engineer",  kw: ["接口","api","数据库","后端","服务","sql","java","spring","加密","sign"] },
  { seat: "前端经理",    role: "ui-designer",       kw: ["前端","页面","ui","vue","css","组件","表单","渲染"] },
  { seat: "测试经理",    role: "qa-engineer",       kw: ["测试","用例","回归","coverage","质量","验证"] },
  { seat: "运维经理",    role: "devops-engineer",   kw: ["部署","发布","运维","docker","ci","监控"] },
  { seat: "需求经理",    role: "requirements-analyst", kw: ["需求","prd","用户故事","场景","边界"] },
  { seat: "架构经理",    role: "sys-architect",     kw: ["架构","选型","设计","契约","adr","模块"] },
  { seat: "安全审计",    role: "security-auditor",  kw: ["安全","审计","漏洞","合规","风险"] },
  { seat: "前端经理",    role: "ui-designer",       kw: ["修复","bug","修复代码"] },
];

export function quickstart(intent, opts = {}) {
  const prompt = String(intent || "").trim();
  if (!prompt) { return { ok: false, reason: "intent is required" }; }
  // 意图→席位匹配（关键词计数最高者胜）
  let best = null, bestScore = 0;
  for (const s of SEAT_MAP) {
    const score = s.kw.reduce((acc, kw) => acc + (prompt.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  if (!best) best = SEAT_MAP[0]; // 兜底：默认后端
  // 生成 token（简单时间戳）
  const token = "TK-" + Date.now().toString().slice(-6);
  // 生成 subagent prompt
  const subagentPrompt = [
    `squadRole: docs/squad/prompts/${best.role}.md`,
    ``,
    `任务书 ${token}`,
    `目标：${prompt}`,
    `写域：${opts.domain || "(按任务自定，AGENTS §1)"}`,
    `验收：${opts.acceptance || "(按任务自定)"}`,
    `证据：完成后回报文件路径 + 关键结论摘要`,
    `失败路径：不确定时 hand_back，不得猜`,
    ``,
    `以上任务由主对话派发，你是 ${best.seat}。开始执行。`
  ].join("\n");
  return { ok: true, seat: best.seat, role: best.role, token, prompt: subagentPrompt, matchScore: bestScore };
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const intent = args.filter(a => !a.startsWith("--")).join(" ");
  const r = quickstart(intent, {
    domain: (args.find(a => a.startsWith("--domain=")) || "").replace("--domain=", "") || undefined,
    acceptance: (args.find(a => a.startsWith("--acceptance=")) || "").replace("--acceptance=", "") || undefined,
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
