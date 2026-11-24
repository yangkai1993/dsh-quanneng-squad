import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildCanonical, idemKey, BIZ, SUCCESS_CODES, STATE } from '../lib/contract.js';

describe('contract (frozen seam)', () => {
  test('buildCanonical fixes the 5-field order', () => {
    assert.equal(
      buildCanonical({ version: '1.0.0', appId: 'A1', bizMethod: BIZ.query, reqId: 'R1', rawBody: '{"a":1}' }),
      'version=1.0.0&appId=A1&bizMethod=soluGsp.gsp.sn26.query&reqId=R1&body={"a":1}');
  });
  test('buildCanonical rejects a non-string body (one-serialization guard)', () => {
    assert.throws(() => buildCanonical({ version: '1.0.0', appId: 'A', bizMethod: 'm', reqId: 'R', rawBody: { a: 1 } }), TypeError);
  });
  test('idemKey is stable for the same business transaction', () => {
    const base = { appId: 'A', orderId: 'O1', regionCd: '110101', snCode: 'S1', bizMethod: BIZ.occupancy };
    assert.equal(idemKey(base), idemKey(base));
    assert.notEqual(idemKey(base), idemKey({ ...base, orderId: 'O2' }));
  });
  test('frozen seams unchanged from spec', () => {
    assert.deepEqual(SUCCESS_CODES, ['0000000000', '200']);
    assert.equal(BIZ.certUserGet, 'admin.cert.userget');
    assert.equal(STATE.PENDING_RECON, 'PENDING_RECON');
  });
});