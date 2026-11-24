import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// L4 提案真源（唯一）：G-REFLOW.md 表格第一列 P<n> ↔ L4 提案 id P-<3位> ↔ 本体锚点。
// 消费方：run.mjs（全池推进）、maturity.mjs（M5/M9）、reflow-check.mjs（覆盖统计）。
// D1 修复：G-REFLOW 写 `| P3 |`（不补零），旧 run.meta() 用 replace('P-0','P') 生成 `| P03 |`
//          → bodyWritten 恒 false，6 条提案永久卡在 rollout。此处统一为数值化映射。
// D2 修复：BODY 锚点表不再在 run/maturity 各存一份。

export const l4Id = p => 'P-' + String(Number(p.slice(1))).padStart(3, '0');
export const patternId = id => 'P' + Number(id.slice(2));

export const BODY = {
  'P-001': ['AGENTS.md', '并发冲突铁律'],
  'P-002': ['AGENTS.md', '每次派活前提'],
  'P-004': ['docs/squad/pipeline/DELIVERY-PIPELINE.md', 'result-verify.mjs'],
  'P-010': ['AGENTS.md', '时刻监督三件套'],
  'P-011': ['docs/squad/pipeline/DESIGN-PRINCIPLES.md', '组件化 / 工程化'],
};

export function bodyAnchor(id) {
  return BODY[id] || ['docs/squad/gates/G-REFLOW.md', '| ' + patternId(id) + ' |'];
}

export function loadProposals(W) {
  const gatePath = join(W, 'docs/squad/gates/G-REFLOW.md');
  // DIP/容错：工作区由调用方注入；缺输入返回空池，不得抛 ENOENT 崩掉整个门。
  if (!existsSync(gatePath)) return new Map();
  const g = readFileSync(gatePath, 'utf8');
  const rows = [...g.matchAll(/^\|\s*(P\d+)\s*\|\s*([^|]+)\|/gm)];
  const all = new Map();
  for (const m of rows) {
    const id = l4Id(m[1]);
    const [bodyFile, needle] = bodyAnchor(id);
    all.set(id, { id, layer: 'process', theme: m[2].trim().slice(0, 110),
      bodyNeedle: needle, bodyFiles: [bodyFile] });
  }
  return all;
}
