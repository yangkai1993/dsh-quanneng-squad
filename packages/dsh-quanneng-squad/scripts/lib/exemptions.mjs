import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// 门 id -> 生效中的豁免到期日。全部 fail-closed：
//   1) 只解析「当前豁免」表：必须 5 列（门|到期|原因|登记人|闭合条件）。历史表的第 2 列是期间而非到期日，
//      一旦被当成豁免，追加一条历史记录即可救活过期豁免（上一版实测踩过）。
//   2) id 必须以字母开头且整列即 id：否则日期形状（2026-11-14 / 26-11-14）会被误认成 id 而产生假豁免。
//   3) 同一门多行取最早到期（更严者胜）。
//   4) 到期日必须严格晚于今天；等于或早于今天即失效，无需人工撤销。
//   5) 日期不可解析 = 无效。文件不可读 = 无豁免。

const GATE_IDS = ['seat-utilization', 'audit-roster', 'reflow-check', 'stage-order', 'drift-check', 'result-verify', 'l4-maturity', 'memory-sla', 'gate-rotation'];
const ROW = /^\|\s*([a-z][a-z0-9-]*)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|([^|\n]*)\|([^|\n]+)\|([^|\n]+)\|([^|\n]*)\|/gm;   // R-3：6 列（第4=登记人 第5=会签人 均非空）

export function readExemptions(workspace) {
  const file = join(workspace, 'docs/squad/gates/EXEMPTIONS.md');
  if (!existsSync(file)) return {};
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return {}; }
  const today = new Date().toISOString().slice(0, 10);
  // D7：不再靠 split('## 历史') 隐式切分；显式只认 '## 当前豁免' 段。
  // 从该标题到下一个二级标题（含 ## 历史）为止；历史段含任何日期行都不参与判定。
  const cur = text.indexOf('## 当前豁免');
  if (cur < 0) return {};                       // 无当前豁免段 = 无豁免（fail-closed）
  const rest = text.slice(cur + '## 当前豁免'.length);
  const next = rest.search(/^## /m);
  const head = next >= 0 ? rest.slice(0, next) : rest;
  const earliest = {};
  for (const m of head.matchAll(ROW)) {
    const id = m[1], exp = m[2];
    // R-3（TK-58-03）：登记人与会签人必须为两个不同主体——单人自签一行即放行任意门是制定者旁路。
    const who = (m[4] || '').trim(), counter = (m[5] || '').trim();
    if (!who || !counter || who === counter) continue;    // 缺会签 / 同人自签 → 不生效
    if (!GATE_IDS.includes(id)) continue;              // 未知/拼错 id 直接忽略
    if (Number.isNaN(Date.parse(exp))) continue;
    if (!earliest[id] || exp < earliest[id]) earliest[id] = exp;
  }
  const active = {};
  for (const [id, exp] of Object.entries(earliest)) if (exp > today) active[id] = exp;
  return active;
}

// 豁免生效必须在 stderr 留痕（stdout 保持纯 JSON）。豁免不是修复。
export function traceExemption(name, varName, problems, workspace, kind) {
  const active = readExemptions(workspace);
  const byFile = Boolean(active[name]);
  // V-52-02：env 不再单独构成豁免——必须与 EXEMPTIONS.md 带到期日登记同时存在。
  // 否则制定者可用 `set VAR=1` 绕过自己写的门（C4 实测 active={} 仍 exempted:true）。
  const envSet = process.env[varName] === '1';
  const byEnv = envSet && byFile;
  if (!byFile && !byEnv) return { exempted: false, active, envIgnored: envSet && !byFile };
  const src = byFile ? 'EXEMPTIONS.md 到期日 ' + active[name] + (envSet ? ' (+env 确认)' : '') : 'env ' + varName;
  console.error('[豁免生效] 门=' + name + ' 来源=' + src + ' 未阻断项=' + problems +
    '（' + (kind || '') + '） —— 豁免不是修复，到期未闭合即恢复阻断。');
  return { exempted: true, active };
}
