// src/core/reconcile.js — PENDING_RECON timed reconciliation + store-and-forward (5x, 1/2/4/5 min).
import { STORE_FORWARD, STATE } from '../contract.js';

export function createReconciler(stores, cfg) {
  const { notify, state, audit } = stores;
  const intervals = (cfg.reliability.storeForward.intervalsMin || [1, 2, 4, 5]).map(m => m * 60000);
  const findUnknown = () => state.listUnknown();
  async function markRecon() {
    const rows = await findUnknown(); let moved = 0;
    for (const r of rows) {
      if (r.state === STATE.UNKNOWN) { await state.upsert({ ...r, state: STATE.PENDING_RECON }); moved++; }
      await audit.append({ level: 'WARN', kind: 'RECON', regionCd: r.regionCd, snCode: r.snCode, msg: 'PENDING_RECON' });
    }
    return moved;
  }
  async function enqueue(task) {
    return notify.enqueue({ taskId: task.taskId, payload: task.payload, attempt: 0,
      maxAttempts: cfg.reliability.storeForward.maxAttempts, nextFireAt: Date.now(), createdAt: Date.now() });
  }
  async function fireDue(sender, now = Date.now()) {
    const due = await notify.due(now); const results = [];
    for (const t of due) {
      let ok = false; try { ok = await sender(t.payload); } catch {}
      t.attempt += 1;
      if (ok) { t.deliveredAt = now; t.nextFireAt = Infinity; }
      else if (t.attempt < t.maxAttempts) t.nextFireAt = now + (intervals[t.attempt - 1] ?? intervals.at(-1));
      else { t.exhaustedAt = now; t.nextFireAt = Infinity; await audit.append({ level: 'ERROR', kind: 'STORE_FORWARD_EXHAUSTED', taskId: t.taskId }); }
      await notify.mark(t);
      results.push({ taskId: t.taskId, attempt: t.attempt, ok, nextFireAt: t.nextFireAt });
    }
    return results;
  }
  function pastDayCut(now = new Date()) {
    const h = cfg.reliability.dayCutHour, m = cfg.reliability.dayCutMinute;
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  }
  async function tick(sender) {
    if (pastDayCut()) return { skipped: 'past-day-cut', manualIntervention: true, forwards: [] };
    return { recon: await markRecon(), forwards: await fireDue(sender) };
  }
  return { findUnknown, markRecon, enqueue, fireDue, tick, pastDayCut, intervals };
}
