import { join } from 'node:path';
import { W } from './gate-kit.mjs';
import { readEvents, appendEvent, EVENT_TYPES, eventsPath, loadEvents, TOKEN_TRANSITIONS, assertTransition, deriveTokenStates } from './event-store.mjs';

// 轮次/令牌事件命令层（Event Sourcing + CQRS · 一期 1.15.0 接 event-store 统一库）：
// 事件=不可变事实，append-only；状态由事件派生，叙述文档(STATE.md)降级为只读投影。
// 铁律：只有本模块的命令能追加事件；任何叙述性 .md 文本（含 STATE.md 写「第N轮」）都不得改变真源。
// IO/校验骨架已上收 event-store.mjs（S1-1）；本文件只保留「轮次/令牌」域命令与业务校验。
export { eventsPath, loadEvents, readEvents, EVENT_TYPES, TOKEN_TRANSITIONS, assertTransition, deriveTokenStates };

// 读模型（向后兼容 deriveState：轮次+令牌数）。
export function deriveState(ws) {
  const ev = readEvents(ws);
  let round = 0, at = null, reason = null;
  const issued = new Map();
  for (const e of ev) {
    if (e.type === 'ROUND_ADVANCE') { round = e.to; at = e.ts; reason = e.reason; }
    if (e.type === 'TOKEN_ISSUED') issued.set(e.token, e);
  }
  return { round, at, reason, tokenCount: issued.size, eventCount: ev.length, source: 'round-events.jsonl' };
}

// 命令：推进轮次。校验：to 必须 = 当前+1（不可跳跃、不可回退）；reason 必填（事实依据）。
export function cmdAdvance(to, reason, actor) {
  const cur = deriveState().round;
  if (!Number.isInteger(to) || to !== cur + 1) throw new Error('轮次推进非法：当前 ' + cur + ' → 请求 ' + to + '（只允许 +1）');
  if (!reason || !String(reason).trim()) throw new Error('轮次推进必须给出事实依据（reason），叙述不算');
  return appendEvent('ROUND_ADVANCE', { from: cur, to, reason: String(reason).trim(), actor: actor || 'machine' }, {
    ws: W,
    check: (e) => { if (e.to !== e.from + 1) throw new Error('ROUND_ADVANCE 只允许 +1'); },
  });
}

// 命令：登记令牌（幂等）。校验：轮次=当前；token 格式；seat/path 必填（写域纪律）。
export function cmdIssueToken({ round, w, seat, token, path: filePath, card, actor }) {
  const st = deriveState();
  if (round !== st.round) throw new Error('令牌轮次 ' + round + ' ≠ 当前真源 ' + st.round + '（拒绝跨轮登记）');
  if (!/^TK-\d+-\d+$/.test(token)) throw new Error('令牌格式非法：' + token + '（须纯数字，门可见）');
  if (!seat || !filePath) throw new Error('令牌须带 seat 与 path（写域纪律）');
  const ev = readEvents();
  if (ev.some(e => e.type === 'TOKEN_ISSUED' && e.token === token)) return { duplicate: true, token };
  return appendEvent('TOKEN_ISSUED', { round, w, seat, token, card: card || null, path: filePath, actor: actor || 'squad-autopilot' }, { ws: W });
}

// 内部：令牌生命周期命令公共骨架——查当前状态→状态机校验→落事件。
function cmdTokenEvent(type, { token, by, ...extra }) {
  if (!token) throw new Error(type + ' 须带 token');
  const states = deriveTokenStates();
  const cur = states.get(token);
  if (!cur) throw new Error('令牌 ' + token + ' 未登记（TOKEN_ISSUED 缺失），拒绝 ' + type);
  assertTransition(token, cur.state, type === 'DISPATCH' ? 'dispatched' : type === 'REPORT' ? 'reported' : type === 'ACCEPT' ? 'accepted' : 'rejected');
  return appendEvent(type, { token, seat: cur.seat, round: cur.round, by: by || 'captain', ...extra }, { ws: W });
}

// 命令：派活（planned→dispatched）。
export function cmdDispatch({ token, message, by }) { return cmdTokenEvent('DISPATCH', { token, message: message || null, by }); }
// 命令：回报（dispatched→reported）。
export function cmdReport({ token, summary, evidence, by }) { return cmdTokenEvent('REPORT', { token, summary: summary || null, evidence: evidence || null, by }); }
// 命令：验收通过（reported→accepted，终态）。
export function cmdAccept({ token, verdict, by }) { return cmdTokenEvent('ACCEPT', { token, verdict: verdict || 'accepted', by }); }
// 命令：验收驳回（reported→rejected；可再 cmdDispatch 重派）。
export function cmdReject({ token, reason, by }) { return cmdTokenEvent('REJECT', { token, reason: reason || null, by }); }

// 对账命令：轮次与叙述文档的偏差注记（不改真源轮次——只记事实，供 pulse/drift 披露）。
// 背景：事件轮次 71 与简报 maxRound=68 有 3 轮偏差（2026-11-23 发现）；对账=记 DISCREPANCY，不篡改轮次。
export function cmdNoteDiscrepancy({ kind, detail, actor }) {
  return appendEvent('DISCREPANCY', { kind, detail: String(detail || '').slice(0, 400), actor: actor || 'captain' }, { ws: W });
}
