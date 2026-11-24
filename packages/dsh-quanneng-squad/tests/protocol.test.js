import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter } from '../lib/protocol/adapter.js';
import { normalizeResponse, normalizeSubCode } from '../lib/protocol/response.js';
import { BIZ } from '../lib/contract.js';

const mk = () => createAdapter({ crypto: { saleTmFormat: 'yyyy-MM-dd' } });

describe('adapter: projection, validation, unknown-field drop', () => {
  test('query projects only its fields and drops unknowns', () => {
    const r = mk().buildRequest({ bizMethod: BIZ.query, regionCd: '110101', snCode: 'S1', junk: 'DROP' });
    assert.deepEqual(Object.keys(JSON.parse(r.rawBody)), ['regionCd', 'snCode']);
    assert.equal(r.rawBody.includes('__PLACEHOLDER__'), false);
  });
  test('EARS Unwanted: invalid regionCd throws with the field name', () => {
    assert.throws(() => mk().buildRequest({ bizMethod: BIZ.query, regionCd: 'BAD', snCode: 'S' }), /regionCd/);
  });
  test('occupancy requires orderId/mchntCd/barcode and keeps isAiProd verbatim', () => {
    const r = mk().buildRequest({ bizMethod: BIZ.occupancy, txnTime: '20261111120000', orderId: 'O1',
      regionCd: '110101', mchntCd: 'M1', barcode: '69012345678901', snCode: 'S1', isAiProd: '0', cateCode: 'B01' });
    const body = JSON.parse(r.rawBody);
    assert.equal(body.isAiProd, '0');
    assert.equal(body.cateCode, 'B01');
    assert.throws(() => mk().buildRequest({ bizMethod: BIZ.occupancy, regionCd: '110101', snCode: 'S1' }), /orderId|txnTime/);
  });
  test('encryptData passed as 2nd arg lands in the wire body', () => {
    const env = { key: 'k', certId: '2222222', encryptMethod: 'SM4', data: 'd' };
    const r = mk().buildRequest({ bizMethod: BIZ.query, regionCd: '110101', snCode: 'S1' }, env);
    assert.deepEqual(JSON.parse(r.rawBody).encryptData, env);
  });
});

describe('response: three-layer normalization', () => {
  test('HTTP 500 -> COMM_FAILURE', () => {
    assert.equal(normalizeResponse(500, {}, '{}').kind, 'COMM_FAILURE');
  });
  test('code 200 accepted (dual success codes)', () => {
    const r = normalizeResponse(200, { bizMethod: BIZ.query }, '{"code":"200","subCode":"000000"}');
    assert.equal(r.kind, 'OK'); assert.equal(r.ok, true); assert.equal(r.bizStatus, 'SALEABLE');
  });
  test('000001 -> NOTSALEABLE', () => {
    assert.equal(normalizeResponse(200, { bizMethod: BIZ.query }, '{"code":"0000000000","subCode":"000001"}').bizStatus, 'NOTSALEABLE');
  });
  test('4003 -> SECURITY_REJECT, unknown -> UNMAPPED (never guessed)', () => {
    assert.equal(normalizeResponse(200, {}, '{"code":"UP40030000"}').kind, 'SECURITY_REJECT');
    assert.equal(normalizeResponse(200, {}, '{"code":"ZZ99999999"}').kind, 'UNMAPPED');
  });
  test('subCode 000002 -> DUP, unknown subCode -> UNMAPPED_SUB', () => {
    assert.equal(normalizeSubCode(BIZ.occupancy, '000002'), 'DUP');
    assert.equal(normalizeSubCode(BIZ.query, '777777'), 'UNMAPPED_SUB:777777');
  });
});