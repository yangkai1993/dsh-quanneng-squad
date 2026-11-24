// src/crypto/provider.js — the security/crypto service. Private keys never leave this module.
import { createHash, createSign, createVerify, createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, createHmac, randomBytes } from 'node:crypto';
import { sm3, sm3Bytes } from './sm3.js';
import { sm4CbcEncrypt, sm4CbcDecrypt } from './sm4.js';
import { sm2Sign, sm2Verify, sm2Encrypt, sm2Decrypt, publicKeyFromHex, privateKeyFromHex, computeZA } from './sm2.js';
import { buildCanonical, b64, unb64 } from '../contract.js';

const ZERO_IV = Buffer.alloc(16); // spec: CBC with 16 bytes of all-zero IV

export function createProvider(cfg) {
  const c = cfg.crypto, keys = cfg.keys, id = cfg.identity;
  const isSM = c.signMethod === 'SM2';
  if ((c.signMethod === 'SM2') !== (c.encryptMethod === 'SM4')) {
    throw new Error('signMethod and encryptMethod must be paired: SM2+SM4 or RSA2+AES');
  }
  const userSignPriv = privateKeyFromHex(keys.userSignPrivateHex);
  const userSignPub = publicKeyFromHex(keys.userSignPublicHex);
  const userDecPriv = privateKeyFromHex(keys.userDecryptPrivateHex);

  // Certificate store: map<signId, cert>. New + old coexist for the 3-month overlap.
  const certs = new Map();
  const putCert = (rec) => { certs.set(String(rec.signId), { ...rec }); return rec; };
  putCert({ signId: keys.upSignId, certType: 'UP_SIGN', publicHex: keys.upSignPublicHex, notBefore: '2020-01-01', notAfter: '2030-01-01', status: 'ACTIVE' });
  putCert({ signId: id.signId, certType: 'USER_SIGN', publicHex: keys.userSignPublicHex, notBefore: '2020-01-01', notAfter: '2030-01-01', status: 'ACTIVE' });
  putCert({ signId: keys.upEncCertId, certType: 'UP_ENC', publicHex: keys.upEncryptPublicHex, notBefore: '2020-01-01', notAfter: '2030-01-01', status: 'ACTIVE' });
  putCert({ signId: keys.userEncCertId, certType: 'USER_ENC', publicHex: keys.userEncryptPublicHex, notBefore: '2020-01-01', notAfter: '2030-01-01', status: 'ACTIVE' });

  function digest(canon) { return isSM ? sm3(canon) : createHash('sha256').update(canon, 'utf8').digest('hex'); }

  /** Sign a response as UnionPay would: upSign private key, userId = upSignId. */
  function signAsUp(canon) {
    const priv = privateKeyFromHex(keys.upSignPrivateHex);
    const pub = publicKeyFromHex(keys.upSignPublicHex);
    if (isSM) return b64(sm2Sign(canon, priv, String(keys.upSignId), { publicKey: pub }));
    return createSign('RSA-SHA256').update(canon, 'utf8').sign(keys.upSignPrivatePem, 'base64');
  }
  /** Verify a UnionPay-signed response. signId selects the cert; userId = that cert's serial. */
  /** Verify an INBOUND user-signed request: user public key, userId = user signId. */
  function verifyInbound(canon, signB64, headers) {
    const sid = String(headers.signId ?? headers.signid ?? id.signId);
    let ok;
    try {
      if (isSM) ok = sm2Verify(canon, unb64(signB64), userSignPub, String(id.signId));
      else ok = createVerify('RSA-SHA256').update(canon, 'utf8').verify(keys.userSignPublicPem, unb64(signB64));
    } catch (e) { return { ok: false, reason: 'VERIFY_ERROR:' + e.message }; }
    return { ok, reason: ok ? 'OK' : 'SIGN_MISMATCH', signId: sid };
  }

  function verifyUp(canon, signB64, headers) {
    const sid = String(headers.signId ?? headers.signid ?? keys.upSignId);
    const rec = certs.get(sid);
    if (!rec) return { ok: false, reason: 'CERT_NOT_FOUND:' + sid };
    let ok;
    try {
      if (isSM) ok = sm2Verify(canon, unb64(signB64), publicKeyFromHex(rec.publicHex), String(keys.upSignId));
      else ok = createVerify('RSA-SHA256').update(canon, 'utf8').verify(keys.upSignPublicPem, unb64(signB64));
    } catch (e) { return { ok: false, reason: 'VERIFY_ERROR:' + e.message }; }
    return { ok, reason: ok ? 'OK' : 'SIGN_MISMATCH', signId: sid };
  }

  function signCanonical(canon) {
    let raw;
    if (isSM) raw = sm2Sign(canon, userSignPriv, id.userId, { publicKey: userSignPub });
    else raw = createSign('RSA-SHA256').update(canon, 'utf8').sign(keys.userSignPrivatePem);
    return b64(raw); // SM2: raw 64-byte R||S, no ASN.1/DER; RSA2: DER signature, both base64
  }

  function verifyCanonical(canon, signB64, headers) {
    const sid = String(headers.signId ?? headers.signid ?? keys.upSignId);
    const rec = certs.get(sid);
    if (!rec) return { ok: false, reason: 'CERT_NOT_FOUND:' + sid };
    if (cfg.cert.validateChain) {
      const now = new Date().toISOString().slice(0, 10);
      if (rec.notBefore > now || rec.notAfter < now) return { ok: false, reason: 'CERT_EXPIRED:' + sid };
    }
    let ok;
    try {
      if (isSM) ok = sm2Verify(canon, unb64(signB64), publicKeyFromHex(rec.publicHex), id.userId);
      else ok = createVerify('RSA-SHA256').update(canon, 'utf8').verify(keys.upSignPublicPem, unb64(signB64));
    } catch (e) { return { ok: false, reason: 'VERIFY_ERROR:' + e.message }; }
    return { ok, reason: ok ? 'OK' : 'SIGN_MISMATCH', signId: sid };
  }

  /** Build the whole public header set for an outbound request, with ONE serialization. */
  function signRequest(rawBody, bizMethod, reqId) {
    const h = {
      version: id.version, appType: id.appType, appId: id.appId,
      bizMethod, reqId,
    };
    const canon = buildCanonical({ version: h.version, appId: h.appId, bizMethod: h.bizMethod, reqId: h.reqId, rawBody });
    h.sign = signCanonical(canon);
    h.signId = String(id.signId);
    h.signMethod = c.signMethod;
    return { headers: h, canon, rawBody };
  }

  /** encryptData envelope: one-time random symmetric key + receiver public-key wrapped key. */
  function buildEncryptData(sensitivePlain, receiverCertId) {
    const cert = certs.get(String(receiverCertId || keys.upEncCertId));
    if (!cert) throw new Error('encryptData: unknown receiver certId ' + receiverCertId);
    const plain = Buffer.from(JSON.stringify(sensitivePlain), 'utf8');
    let keyBytes, data, keyCipher;
    if (c.encryptMethod === 'SM4') {
      keyBytes = randomBytes(16);
      data = b64(sm4CbcEncrypt(keyBytes, ZERO_IV, plain));           // ZeroPadding
      keyCipher = b64(sm2Encrypt(keyBytes, publicKeyFromHex(cert.publicHex))); // C1C3C2
    } else {
      keyBytes = randomBytes(32);
      const ci = createCipheriv('aes-256-cbc', keyBytes, ZERO_IV);   // PKCS7Padding
      data = b64(Buffer.concat([ci.update(plain), ci.final()]));
      keyCipher = b64(publicEncrypt(keys.upEncryptPublicPem, keyBytes));
    }
    return {
      key: keyCipher, certId: String(receiverCertId || keys.upEncCertId),
      encryptMethod: c.encryptMethod, data,
    };
  }

  function decryptEncryptData(env) {
    if (!env || !env.key || !env.certId || !env.encryptMethod || !env.data) throw new Error('encryptData: all 4 subfields are mandatory (C5)');
    // certId identifies the RECEIVER's encryption cert. Choose the matching private key.
    // userEncCertId -> inbound (UnionPay encrypted for us). upEncCertId -> outbound, only
    // decryptable by UnionPay; in the local sandbox we hold that key to close the loop.
    let decryptPriv, decryptPem;
    if (String(env.certId) === String(keys.userEncCertId)) { decryptPriv = userDecPriv; decryptPem = keys.userDecryptPrivatePem; }
    else if (String(env.certId) === String(keys.upEncCertId)) { decryptPriv = privateKeyFromHex(keys.upDecryptPrivateHex); decryptPem = keys.upEncryptPublicPem ? keys.userDecryptPrivatePem : null; }
    else return { _undecryptable: true, certId: env.certId, reason: 'no private key for this receiver certId (expected for a third party)' };
    let keyBytes;
    if (env.encryptMethod === 'SM4') keyBytes = sm2Decrypt(unb64(env.key), decryptPriv);
    else keyBytes = privateDecrypt(decryptPem, unb64(env.key));
    let plain;
    if (env.encryptMethod === 'SM4') plain = sm4CbcDecrypt(keyBytes, ZERO_IV, unb64(env.data));
    else { const dc = createDecipheriv('aes-256-cbc', keyBytes, ZERO_IV); plain = Buffer.concat([dc.update(unb64(env.data)), dc.final()]); }
    return JSON.parse(plain.toString('utf8'));
  }

  /** Keep only sensitive subfields, preserving the ORIGINAL JSON hierarchy (§5.4). */
  function extractSensitive(dto, fields = c.encryptData.sensitiveFields) {
    const out = {};
    const walk = (src, dst) => {
      for (const [k, v] of Object.entries(src)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) { const sub = {}; walk(v, sub); if (Object.keys(sub).length) dst[k] = sub; }
        else if (fields.includes(k) && v !== undefined && v !== null && v !== '') dst[k] = v;
      }
    };
    walk(dto, out);
    return out;
  }

  const hmac = (s) => createHmac('sha256', cfg.observability.maskSecret).update(String(s), 'utf8').digest('hex').slice(0, 24);
  const mask = (s) => { const t = String(s); return t.length <= 4 ? '****' : t.slice(0, 2) + '*'.repeat(Math.min(t.length - 4, 12)) + t.slice(-2); };
  function sanitize(obj, fields = c.encryptData.sensitiveFields) {
    const o = structuredClone(obj);
    const walk = (x) => { for (const k of Object.keys(x)) { if (x[k] && typeof x[k] === 'object') walk(x[k]); else if (fields.includes(k)) x[k] = mask(x[k]); } };
    walk(o); return o;
  }

  return {
    get signMethod() { return c.signMethod; },
    get encryptMethod() { return c.encryptMethod; },
    certs, putCert, digest, signCanonical, verifyCanonical, signRequest, signAsUp, verifyUp, verifyInbound,
    upSignPrivateHex: keys.upSignPrivateHex, upSignId: keys.upSignId,
    userEncCertId: keys.userEncCertId, upEncCertId: keys.upEncCertId,
    buildEncryptData, decryptEncryptData, extractSensitive, sanitize, hmac, mask,
    sm3, sm3Bytes, computeZA,
    sm4CbcEncrypt, sm4CbcDecrypt, sm2Sign, sm2Verify, sm2Encrypt, sm2Decrypt,
    sha256: (d) => createHash('sha256').update(d).digest('hex'),
    randomBytes,
  };
}
