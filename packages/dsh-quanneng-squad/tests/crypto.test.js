import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sm3 } from '../lib/crypto/sm3.js';
import { sm4CbcEncrypt, sm4CbcDecrypt, sm4EncryptBlock, expandKey } from '../lib/crypto/sm4.js';
import { generateKeyPair, sm2Sign, sm2Verify, sm2Encrypt, sm2Decrypt, scalarMul, N, G } from '../lib/crypto/sm2.js';

describe('SM3 / SM4 standard vectors', () => {
  test('SM3(abc) vector', () => {
    assert.equal(sm3('abc'), '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
  });
  test('SM3(empty) vector', () => {
    assert.equal(sm3(''), '1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b');
  });
  test('SM4 ECB vector', () => {
    const key = Buffer.from('0123456789abcdeffedcba9876543210', 'hex');
    assert.equal(sm4EncryptBlock(key, expandKey(key)).toString('hex'), '681edf34d206965e86b3e94f536e4246');
  });
  test('SM4-CBC ZeroPadding roundtrip incl empty/1B/16B/CJK', () => {
    const key = Buffer.alloc(16, 7), iv = Buffer.alloc(16, 0);
    for (const s of ['', 'x', '0123456789abcdef', '银联 SN26 核验']) {
      const p = Buffer.from(s, 'utf8');
      const c = sm4CbcEncrypt(key, iv, p);
      assert.equal(c.length % 16, 0);
      assert.equal(sm4CbcDecrypt(key, iv, c).toString('utf8'), s);
    }
  });
});

describe('SM2 curve and raw R||S signature', () => {
  test('n*G is the point at infinity (parameters self-consistent)', () => {
    assert.equal(scalarMul(N, G), null);
  });
  test('signature is exactly 64 raw bytes and verifies', () => {
    const { privateKey, publicKey } = generateKeyPair();
    const msg = 'version=1.0.0&appId=A1&bizMethod=soluGsp.gsp.sn26.query&reqId=R1&body={}';
    const sig = sm2Sign(msg, privateKey, '888888');
    assert.equal(sig.length, 64);
    assert.equal(sm2Verify(msg, sig, publicKey, '888888'), true);
  });
  test('EARS Unwanted: reordered canonical string fails verification', () => {
    const { privateKey, publicKey } = generateKeyPair();
    const good = 'version=1.0.0&appId=A1&bizMethod=m&reqId=R1&body={}';
    const sig = sm2Sign(good, privateKey, '888888');
    assert.equal(sm2Verify('appId=A1&version=1.0.0&bizMethod=m&reqId=R1&body={}', sig, publicKey, '888888'), false);
  });
  test('EARS Unwanted: tampered ciphertext rejected by C3', () => {
    const { privateKey, publicKey } = generateKeyPair();
    const c = sm2Encrypt(Buffer.from('key-material'), publicKey);
    c[70] ^= 1;
    assert.throws(() => sm2Decrypt(c, privateKey), /C3|integrity/i);
  });
});