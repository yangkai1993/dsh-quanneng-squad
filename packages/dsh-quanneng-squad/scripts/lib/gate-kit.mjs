import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { traceExemption } from './exemptions.mjs';

/**
 * 门运行协议组件（P10 时刻监督三件套的共享底座）。
 * 抽取前：10 个脚本各写 W 解析、8 个门各写 traceExemption+process.exit(1)、2 个门各写 cn2num。
 * 依据：DRY（The Pragmatic Programmer）、SRP/单一出口（Clean Code / Release It!）、
 *       ISP/DIP（SOLID：门只依赖 runGate 契约，不自己拼装路径/豁免/退出）。
 * 语义铁律：默认阻断；豁免只在 EXEMPTIONS.md 带到期日登记且未过期时生效，stderr 必留痕。
 */

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG_DIR = resolve(HERE, '..', '..');           // scripts/lib -> package
export const WORKSPACE = resolve(PKG_DIR, '..', '..');     // package -> packages -> workspace root
export const W = process.env.QUANNENG_WORKSPACE || WORKSPACE;   // ISP/DIP：允许测试注入工作区；缺省才用真实根

const CN = { 零:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10 };
export function cn2num(s) {
  if (s == null) return NaN;
  s = String(s).trim();
  if (/^\d+$/.test(s)) return Number(s);
  if (s.includes('百')) {
    const [h, rest] = s.split('百');
    const hundreds = h === '' ? 1 : (CN[h] ?? NaN);
    const tail = rest ? cn2num(rest) : 0;
    return Number.isNaN(hundreds) || Number.isNaN(tail) ? NaN : hundreds * 100 + tail;
  }
  if (s.includes('十')) {
    const [t, o] = s.split('十');
    const tens = t === '' ? 1 : (CN[t] ?? NaN);
    const ones = !o ? 0 : (CN[o] ?? NaN);
    return Number.isNaN(tens) || Number.isNaN(ones) ? NaN : tens * 10 + ones;
  }
  return CN[s] ?? NaN;
}
export const roundOf = sec => { const m = sec.match(/第\s*([0-9一二三四五六七八九十]+)\s*轮/); return m ? cn2num(m[1]) : NaN; };

export function maxBriefRound(W = WORKSPACE) {
  const bd = join(W, 'docs/squad/briefs');
  let n = 0;
  if (existsSync(bd)) for (const f of readdirSync(bd)) { const m = f.match(/round-(\d+)/); if (m) n = Math.max(n, Number(m[1])); }
  return n;
}

/**
 * 统一门出口：默认阻断；有到期豁免则放行但 stderr 留痕。
 * @param {object} o name/varName/kind/items(问题数组)/exemptVar(可选，覆盖 varName)/W
 * @returns {number} 0=绿 1=阻断（调用方据此决定是否 process.exit）
 */
export function runGate(o) {
  const { name, varName, kind, items = [], W: ws = WORKSPACE } = o;
  console.log(JSON.stringify(o.report ?? { gate:name, problems:items, ok:items.length === 0 }, null, 2));
  if (!items.length) return 0;
  const ex = traceExemption(name, varName, items.length, ws, kind);
  if (ex.exempted) return 0;
  console.error('[门阻断] ' + name + '：' + kind + '（' + items.length + ' 项，见 JSON problems）');
  return 1;
}

export function failFast(code) { if (code) process.exit(code); }

// R-2（TK-58-03）：在途/终止词表唯一真源，verify / supervise / dispatch-guard 共用，杜绝词表分叉漏检。
export const TERMINAL_RE = /已闭合|作废|验收通过|取代|已撤销|完成|非投递|过程记录|仅登记移交意图/;
// t10（TK-68-07）：面板 status 词 claimed/in_progress/pending 与「待批准（staged）」原为词表双漏判区，
// 面板在途被静默忽略 → tokenConverged 假绿。词表收编为真源，消费方一律引用。
export const PENDING_RE = /在途|running|重投|派发中|待批准|staged|claimed|in_progress|pending|执行中|运行中/;
// 面板 failed：既非在途亦非终止——须 captain 处置的第三态，收敛判定必须为其停留。
export const PANEL_FAILED_RE = /\bfailed\b|失败待裁/;
