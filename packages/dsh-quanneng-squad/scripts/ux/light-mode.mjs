// L3-P0 · light-mode：零配置一句话任务 + 场景模板匹配 → subagent prompt。
// 与 quickstart 区别：light-mode 直接合并模板 promptPrefix，用户零决策。
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { quickstart } from "./quickstart.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function lightMode(intent) {
  const prompt = String(intent || "").trim();
  if (!prompt) return { ok: false, reason: "intent is required" };
  // 模板匹配：场景关键词优先
  const tplPath = join(root, "assets", "ux-templates.json");
  let matched = null;
  try {
    const data = JSON.parse(readFileSync(tplPath, "utf8"));
    for (const t of data.templates || []) {
      const kws = t.description.split(/[/、,\s]+/);
      if (kws.some(kw => kw && prompt.includes(kw))) { matched = t; break; }
    }
  } catch {}
  // quickstart 生成基础 prompt
  const base = quickstart(prompt);
  if (!base.ok) return base;
  // 模板 promptPrefix 合并
  if (matched) base.prompt = matched.promptPrefix + "\n\n" + base.prompt;
  base.template = matched ? matched.name : null;
  return base;
}

const args = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const intent = args.join(" ");
  const r = lightMode(intent);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}
