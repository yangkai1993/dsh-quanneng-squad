import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import pkgImport, * as api from '../lib/index.js';

describe('plugin entry (lib/index.js) — the real public surface', () => {
  test('barrel imports cleanly and exposes plugin identity', () => {
    assert.equal(api.name, 'dsh-quanneng-squad');
    assert.equal(api.SQUAD_MEMBERS.length, 16);
    assert.equal(api.DEFAULT_CONFIG.maxMembers, 16);
    assert.equal(pkgImport.name, 'dsh-quanneng-squad');
  });

  test('every re-exported business symbol actually exists', () => {
    const required = [
      'BIZ', 'STATE', 'SUCCESS_CODES', 'SUB', 'CODE_REASON', 'GENERATORS', 'CATE_CODES',
      'STORE_FORWARD', 'TIMEOUT', 'buildCanonical', 'idemKey', 'reqId', 'now14', 'now17', 'b64', 'unb64',
      'sm3', 'sm3Bytes', 'sm4CbcEncrypt', 'sm4CbcDecrypt', 'sm4EncryptBlock', 'expandKey',
      'sm2Sign', 'sm2Verify', 'sm2Encrypt', 'sm2Decrypt', 'generateKeyPair', 'scalarMul', 'computeZA',
      'createProvider', 'createAdapter', 'normalizeResponse', 'normalizeSubCode',
      'createMemoryStores', 'createFileStores', 'transition', 'applyResponse', 'assertNoResend', 'EVENT',
      'createReconciler', 'createOrchestrator', 'createUpstreamClient', 'createFileChannel',
      'createMetrics', 'createMockUp', 'createInbound', 'createNorthServer', 'loadConfig', 'createGateway',
    ];
    const missing = required.filter(k => api[k] === undefined);
    assert.deepEqual(missing, [], 'barrel lost exports: ' + missing.join(','));
  });

  test('barrel re-exports are the same objects as the source modules (no second definition)', async () => {
    const c = await import('../lib/contract.js');
    assert.equal(api.BIZ, c.BIZ);
    assert.equal(api.buildCanonical, c.buildCanonical);
    assert.equal(api.STATE, c.STATE);
  });

  test('apply(ctx) mounts the SOP section', () => {
    const box = {};
    const r = api.apply({ systemPrompt: { addSection: (x) => { box.s = x; } } });
    assert.equal(r.mounted, true);
    assert.equal(r.members, 16);
    assert.equal(box.s.title, 'dsh-quanneng-squad');
    assert.equal(box.s.text, api.squadUsageSection());
    // 断言当前纪律关键词（不锁死具体措辞，避免 SOP 升级就红 —— P4 教训）
    for (const k of ['派活令牌','user-prompts','result-verify','简报与脉搏','五门','本地为主']) {
      assert.ok(box.s.text.includes(k), 'SOP missing discipline: ' + k);
    }
  });

  test('apply degrades safely without host API', () => {
    assert.equal(api.apply({}).mounted, false);
    assert.equal(api.apply(null).mounted, false);
  });
});
