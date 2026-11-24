import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { W } from './gate-kit.mjs';

// 事件存储唯一真源（Event Sourcing + CQRS · 一期 1.15.0）：
// 事件=不可变事实，append-only；状态由事件派生，叙述文档只读。
// 依据：Martin Fowler Event Sourcing「state purely derivable from event log」；
//       CQRS 读写分离；edict kanban_update 的「非法状态跳转拒绝」作为状态机消费方实现。
// 全插件唯一事件入口：round-events（轮次/令牌）与 state-machine-gate（令牌生命周期）共用本库。
export const EVENT_TYPES = {
  ROUND_ADVANCE: 'ROUND_ADVANCE',   // 轮次推进（from→to，只允许 +1）
  TOKEN_ISSUED: 'TOKEN_ISSUED',     // 令牌登记（幂等：同 token 重复登记去重）
  DISPATCH: 'DISPATCH',             // 派活（令牌 planned→dispatched）
  REPORT: 'REPORT',                 // 回报（dispatched→reported；带回执摘要）
  ACCEPT: 'ACCEPT',                 // 验收通过（reported→accepted）
  REJECT: 'REJECT',                 // 验收驳回（reported→rejected，可回 DISPATCH 重派）
  DISCREPANCY: 'DISCREPANCY',       // 对账注记（轮次↔简报偏差等事实记录，不改真源轮次）
};

// 令牌生命周期合法转换表（状态机唯一真源；edict：非法状态跳转被拒绝）。
// planned（已登记未派）→ dispatched → reported → accepted | rejected；rejected → dispatched（重派）。
export const TOKEN_TRANSITIONS = {
  planned: ['dispatched'],
  dispatched: ['reported'],
  reported: ['accepted', 'rejected'],
  rejected: ['dispatched'],
  accepted: [],
};

export const eventsPath = ws => join(ws || W, 'docs/squad/events/round-events.jsonl');

// 读取全量事件。损坏行 fail-closed（抛错带行号）——静默跳过会让真源悄悄缩水。
export function readEvents(ws) {
  const p = eventsPath(ws);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l, i) => {
    let e;
    try { e = JSON.parse(l); } catch (err) { throw new Error('事件日志第 ' + (i + 1) + ' 行损坏（fail-closed）: ' + err.message); }
    if (!e || typeof e.type !== 'string' || !EVENT_TYPES[e.type]) throw new Error('事件日志第 ' + (i + 1) + ' 行 type 非法: ' + (e && e.type));
    if (!Number.isInteger(e.seq)) throw new Error('事件日志第 ' + (i + 1) + ' 行缺 seq');
    return e;
  });
}

function nextSeq(ev) { return ev.length ? Math.max(...ev.map(e => e.seq || 0)) + 1 : 1; }

// 唯一写入口：校验（可选谓词）→ seq 分配 → append。调用方只提供 type/payload/check。
export function appendEvent(type, payload, { ws, check } = {}) {
  const ev = readEvents(ws);
  const e = { seq: nextSeq(ev), ts: new Date().toISOString(), type, ...payload };
  if (check) check(e, ev); // 校验失败抛错，不落盘（原子：校验全过才写）
  appendFileSync(eventsPath(ws), JSON.stringify(e) + '\n', 'utf8');
  return e;
}

// 派生：令牌状态表（状态机门与 autopilot --collect 共用的读模型）。
// planned=已 TOKEN_ISSUED 未 DISPATCH；之后按 DISPATCH/REPORT/ACCEPT/REJECT 流转。
export function deriveTokenStates(ws) {
  const ev = readEvents(ws);
  const state = new Map(); // token → {state, round, seat, card, history[]}
  const done = new Set(ev.filter(e => e.type === 'TOKEN_ISSUED').map(e => e.token));
  for (const e of ev) {
    if (e.type !== 'TOKEN_ISSUED') continue;
    const rec = state.get(e.token) || { state: 'planned', round: e.round, seat: e.seat, card: e.card || null, history: [] };
    rec.history.push(e);
    state.set(e.token, rec);
  }
  for (const e of ev) {
    if (e.type === 'DISPATCH' || e.type === 'REPORT' || e.type === 'ACCEPT' || e.type === 'REJECT') {
      const rec = state.get(e.token);
      if (!rec) continue; // 未登记令牌的事件不入读模型（由调用方门的校验拦截）
      rec.history.push(e);
      if (e.type === 'DISPATCH') rec.state = 'dispatched';
      else if (e.type === 'REPORT') rec.state = 'reported';
      else if (e.type === 'ACCEPT') rec.state = 'accepted';
      else if (e.type === 'REJECT') rec.state = 'rejected';
    }
  }
  return state;
}

// 状态机校验：from 状态是否允许转到 to。非法=抛错（edict：非法跳转被拒绝）。
export function assertTransition(token, from, to) {
  const allowed = TOKEN_TRANSITIONS[from];
  if (!allowed) throw new Error('令牌 ' + token + ' 状态未知: ' + from);
  if (!allowed.includes(to)) throw new Error('令牌 ' + token + ' 状态机非法跳转: ' + from + ' → ' + to + '（允许: ' + allowed.join('/') + '）');
}

// 兼容导出：round-events.mjs 旧名 loadEvents 继续可用。
export const loadEvents = readEvents;
