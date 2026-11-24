// src/contract.js — FROZEN SHARED SEAM. Owned by Lead. Children MUST NOT edit this file.
// Plain ESM + Node built-ins only: the whole reference implementation runs with `node` alone.

export const VERSION = '1.0.0';
export const BIZ = Object.freeze({
  query: 'soluGsp.gsp.sn26.query',
  occupancy: 'soluGsp.gsp.sn26.occupancy',
  release: 'soluGsp.gsp.sn26.release',
  certUserGet: 'admin.cert.userget',
  certUpGet: 'admin.cert.upget',
});
export const HEADERS = Object.freeze({
  version: 'version', appType: 'appType', appId: 'appId', bizMethod: 'bizMethod',
  reqId: 'reqId', sign: 'sign', signId: 'signId', signMethod: 'signMethod',
  signPubKeyCert: 'signPubKeyCert',
});
export const SUCCESS_CODES = Object.freeze(['0000000000', '200']);
export const SUB = Object.freeze({
  query:     { saleable: '000000', notSaleable: '000001' },
  occupancy: { ok: '000000', fail: '000001', dup: '000002', exception: '999999' },
  release:   { ok: '000000', fail: '000001', exception: '999999' },
});
export const CODE_REASON = Object.freeze({
  '10030000': 'PENDING', '20000000': 'UP_UNAVAILABLE', '40000000': 'PARAM_INVALID',
  '40030000': 'SECURITY_REJECT', '40040000': 'BIZ_FAILED', '40050000': 'DUP_REQ',
  '40060000': 'ORIG_NOT_FOUND', '40070000': 'UNKNOWN',
});
export const GENERATORS = Object.freeze(['UP', 'IS', 'AC', 'ID', 'PD', 'OT']);
export const CATE_CODES = Object.freeze(['A01','A02','A03','A04','A05','A06','B01','B02','B03']);
export const STATE = Object.freeze({
  NEW: 'NEW', SALEABLE: 'SALEABLE', NOT_SALEABLE: 'NOT_SALEABLE',
  OCCUPYING: 'OCCUPYING', OCCUPIED: 'OCCUPIED', OCCUPIED_DUP: 'OCCUPIED_DUP',
  OCCUPY_FAILED: 'OCCUPY_FAILED', RELEASING: 'RELEASING', RELEASED: 'RELEASED',
  RELEASE_FAILED: 'RELEASE_FAILED', UNKNOWN: 'UNKNOWN', PENDING_RECON: 'PENDING_RECON',
});
export const STORE_FORWARD = Object.freeze({ maxAttempts: 5, intervalsMin: [1, 2, 4, 5] });
export const TIMEOUT = Object.freeze({ connectMs: 3000, readMs: 9000, totalMs: 10000 });

/** The exact canonical signature string. rawBody MUST be the same byte string sent on the wire. */
export function buildCanonical({ version, appId, bizMethod, reqId, rawBody }) {
  if (typeof rawBody !== 'string') throw new TypeError('rawBody must be the exact serialized JSON string');
  return `version=${version}&appId=${appId}&bizMethod=${bizMethod}&reqId=${reqId}&body=${rawBody}`;
}
export const b64 = (b) => Buffer.from(b).toString('base64');
export const unb64 = (s) => Buffer.from(s, 'base64');
export function now14(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
export function now17(d = new Date()) { return now14(d) + String(d.getMilliseconds()).padStart(3, '0'); }
export function idemKey(x) {
  return [x.appId, x.orderId ?? '', x.regionCd, x.snCode, x.bizMethod].join('|');
}
export function reqId() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 14).toUpperCase();
}

/**
 * @typedef {Object} CryptoProvider
 * @property {(data: Uint8Array|string) => string} sm3                 SM3 -> lowercase hex
 * @property {(data: Uint8Array|string) => Buffer} sha256
 * @property {(digestHex: string, privHex: string, userId: string) => Buffer} sm2Sign   raw R||S, NO DER
 * @property {(digestHex: string, sig: Buffer, pubHex: string, userId: string) => boolean} sm2Verify
 * @property {(pubHex: string, data: Buffer) => Buffer} sm2Encrypt
 * @property {(privHex: string, data: Buffer) => Buffer} sm2Decrypt
 * @property {(key: Buffer, iv: Buffer, data: Buffer) => Buffer} sm4CbcEncrypt   ZeroPadding
 * @property {(key: Buffer, iv: Buffer, data: Buffer) => Buffer} sm4CbcDecrypt
 * @property {(key: Buffer, iv: Buffer, data: Buffer) => Buffer} aes256CbcEncrypt  PKCS7
 * @property {(key: Buffer, iv: Buffer, data: Buffer) => Buffer} aes256CbcDecrypt
 * @property {(pubPem: string, data: Buffer) => Buffer} rsaEncrypt
 * @property {(privPem: string, data: Buffer) => Buffer} rsaDecrypt
 * @property {(data: Uint8Array|string, privPem: string) => Buffer} rsaSignSha256
 * @property {(data: Uint8Array|string, sig: Buffer, pubPem: string) => boolean} rsaVerifySha256
 * @property {(n: number) => Buffer} randomBytes
 */

/**
 * @typedef {Object} UpstreamResponse
 * @property {number} httpStatus
 * @property {Record<string,string>} headers
 * @property {string} rawBody
 * @typedef {Object} UpstreamRequest
 * @property {Record<string,string>} headers
 * @property {string} rawBody
 * @property {string} center
 * @property {number} timeoutMs
 * @typedef {Object} UpstreamClient
 * @property {(r: UpstreamRequest) => Promise<UpstreamResponse>} send
 * @property {() => Promise<string[]>} healthyCenters
 */

/**
 * @typedef {Object} NormalizedResponse
 * @property {'OK'|'COMM_FAILURE'|'PENDING'|'UP_UNAVAILABLE'|'PARAM_INVALID'|'SECURITY_REJECT'|'BIZ_FAILED'|'DUP_REQ'|'ORIG_NOT_FOUND'|'UNKNOWN'|'UNMAPPED'|string} kind
 * @property {boolean} ok
 * @property {string} code
 * @property {string} msg
 * @property {string} subCode
 * @property {string} subMsg
 * @property {string} bizStatus
 * @property {object} raw
 */

/** @typedef {{ get(key:string):Promise<any>, putIfAbsent(key:string, value:any, ttlMs:number):Promise<{existed:boolean,value:any}> }} IdempotencyStore */
/** @typedef {{ get(regionCd:string, snCode:string):Promise<any>, compareAndSwap(rec:any, expectedVersion:number):Promise<boolean>, upsert(rec:any):Promise<void>, listUnknown():Promise<any[]> }} StateStore */
/** @typedef {{ getBySignId(id:string):Promise<any>, put(cert:any):Promise<void>, active():Promise<any[]>, expiringWithin(days:number):Promise<any[]> }} CertStore */

/** @typedef {{ buildRequest(dto:object): {rawBody:string, dto:object}, parseResponse(body:object): NormalizedResponse }} Adapter */

/** @typedef {Object} GatewayConfig
 * @property {object} identity
 * @property {object} crypto
 * @property {object} up
 * @property {object} reliability
 * @property {object} response
 * @property {object} cert
 */
