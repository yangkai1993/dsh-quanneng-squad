import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { transition, applyResponse, assertNoResend, EVENT } from '../lib/core/state.js';
import { createMemoryStores } from '../lib/core/store.js';
import { BIZ, STATE } from '../lib/contract.js';

describe('state machine', () => {
  test('full lifecycle NEW -> SALEABLE -> OCCUPIED -> RELEASED', () => {
    let s = STATE.NEW;
    s = applyResponse(s, { kind: 'OK', bizStatus: 'SALEABLE' }, BIZ.query).state;
    assert.equal(s, STATE.SALEABLE);
    s = applyResponse(s, { kind: 'OK', bizStatus: 'OK' }, BIZ.occupancy).state;
    assert.equal(s, STATE.OCCUPIED);
    s = applyResponse(s, { kind: 'OK', bizStatus: 'OK' }, BIZ.release).state;
    assert.equal(s, STATE.RELEASED);
  });
  test('EARS Unwanted: UNKNOWN occupancy is never auto-resent', () => {
    const r = applyResponse(STATE.OCCUPYING, { kind: 'UNKNOWN', bizStatus: 'UNKNOWN' }, BIZ.occupancy);
    assert.equal(r.state, STATE.UNKNOWN);
    assert.equal(r.actionable.resend, false);
    assert.equal(assertNoResend(STATE.UNKNOWN, BIZ.occupancy), false);
    assert.match(r.actionable.reason, /NEVER auto-resent/);
  });
  test('DUP subCode routes to OCCUPIED_DUP; RECON_DONE converges', () => {
    assert.equal(applyResponse(STATE.OCCUPYING, { kind: 'OK', bizStatus: 'DUP' }, BIZ.occupancy).state, STATE.OCCUPIED_DUP);
    assert.equal(transition(STATE.UNKNOWN, EVENT.RECON_DONE), STATE.PENDING_RECON);
  });
});

describe('stores', () => {
  test('idempotency returns the FIRST result on repeat', async () => {
    const s = createMemoryStores();
    assert.equal((await s.idem.putIfAbsent('k', { code: '200' }, 60000)).existed, false);
    const again = await s.idem.putIfAbsent('k', { code: 'XXX' }, 60000);
    assert.equal(again.existed, true);
    assert.deepEqual(again.value, { code: '200' });
  });
  test('optimistic lock rejects a stale version', async () => {
    const s = createMemoryStores();
    await s.state.upsert({ regionCd: '110101', snCode: 'S1', state: STATE.NEW });
    assert.equal(await s.state.compareAndSwap({ regionCd: '110101', snCode: 'S1', state: STATE.OCCUPYING }, 1), true);
    assert.equal(await s.state.compareAndSwap({ regionCd: '110101', snCode: 'S1', state: STATE.OCCUPIED }, 1), false);
  });
  test('five stores exist per frozen contract', () => {
    const s = createMemoryStores();
    for (const k of ['idem', 'state', 'cert', 'notify', 'audit']) {
      assert.ok(s[k], 'missing store ' + k);
      assert.ok(Object.keys(s[k]).length > 0, 'empty store ' + k);
    }
  });
});