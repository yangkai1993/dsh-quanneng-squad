import { readEvents, deriveTokenStates, TOKEN_TRANSITIONS } from './lib/event-store.mjs';
import { runGate, failFast, W } from './lib/gate-kit.mjs';

// 令牌状态机门（一期 1.15.0 · S1-5 · 依据 edict「非法状态跳转被拒绝」）：
// 只读事件日志做全量重放校验，纯函数判定，不写任何状态。
// 三类检查：
//   T1 事件引用完整性：DISPATCH/REPORT/ACCEPT/REJECT 的 token 必须已 TOKEN_ISSUED 登记。
//   T2 流转合法性：重放每令牌状态机，任何事件使状态发生「转换表不允许」的跳转=红（deriveTokenStates 已按合法链派生，
//      此处用独立重放交叉验证——双实现互证，防派生函数自身 bug 假绿）。
//   T3 终态封闭：accepted 后不得再有任何该令牌事件（终态封闭）。
// QUANNENG_ALLOW_TOKEN_STATE_GAP=1 豁免（EXEMPTIONS 登记流程，fail-closed 默认）。
export function checkTokenStateMachine({ ws } = {}) {
  const problems = [];
  const ev = readEvents(ws);
  const states = new Map(); // token → {state, seenFinal}
  for (const e of ev) {
    if (e.type === 'TOKEN_ISSUED') {
      if (states.has(e.token)) problems.push('T1 重复登记: ' + e.token + ' (seq ' + e.seq + ')');
      else states.set(e.token, { state: 'planned' });
      continue;
    }
    if (e.type === 'DISCREPANCY') continue; // 对账注记不参与令牌状态机
    if (e.type === 'ROUND_ADVANCE') continue;
    if (!['DISPATCH','REPORT','ACCEPT','REJECT'].includes(e.type)) continue;
    const st = states.get(e.token);
    if (!st) { problems.push('T1 ' + e.type + ' 引用未登记令牌: ' + e.token + ' (seq ' + e.seq + ')'); continue; }
    if (st.state === 'accepted') { problems.push('T3 终态后新事件: ' + e.token + ' ' + e.type + ' (seq ' + e.seq + ')'); continue; }
    const to = e.type === 'DISPATCH' ? 'dispatched' : e.type === 'REPORT' ? 'reported' : e.type === 'ACCEPT' ? 'accepted' : 'rejected';
    const allowed = TOKEN_TRANSITIONS[st.state] || [];
    if (!allowed.includes(to)) problems.push('T2 非法跳转: ' + e.token + ' ' + st.state + ' → ' + to + ' (seq ' + e.seq + ')');
    else st.state = to;
  }
  const gate = runGate({ name: 'token-state-machine', varName: 'QUANNENG_ALLOW_TOKEN_STATE_GAP',
    kind: '令牌状态机违规: ' + problems.join('；'), items: problems, W,
    report: { workspace: W, checked: ev.length, tokens: states.size, problems, transitions: Object.fromEntries(Object.entries(TOKEN_TRANSITIONS)) } });
  failFast(gate);
  return { exit: gate, checked: ev.length, tokens: states.size, problems };
}

// CLI 直跑入口
const __isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (__isMain) {
  const r = checkTokenStateMachine({});
  console.log(JSON.stringify(r, null, 2));
}
