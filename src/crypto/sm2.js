// src/crypto/sm2.js — GM/T 0003 SM2: sign/verify (raw R||S, NO DER) + C1C3C2 encrypt.
// BigInt pure JS. Curve parameter b is DERIVED from the standard base point G,
// then the whole parameter set is validated by n*G == infinity at module load.
import { sm3Bytes } from './sm3.js';
import { randomBytes } from 'node:crypto';

export const P = BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF');
export const A = BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC');
export const N = BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123');
export const GX = BigInt('0x32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7');
export const GY = BigInt('0xBC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0');

const mod = (x, m) => ((x % m) + m) % m;
const pow = (b, e, m) => { let r = 1n; b = mod(b, m); while (e > 0n) { if (e & 1n) r = mod(r * b, m); b = mod(b * b, m); e >>= 1n; } return r; };
export const inv = (x, m) => pow(x, m - 2n, m);
const sqrtP = (x) => pow(x, (P + 1n) / 4n, P);

// b = Gy^2 - Gx^3 - A*Gx  (mod P). Derived, not memorized.
export const B = mod(GY * GY - GX * GX * GX - A * GX, P);
export const G = Object.freeze({ x: GX, y: GY });

export function isOnCurve(pt) {
  if (pt === null) return true;
  return mod(pt.y * pt.y - (pt.x * pt.x * pt.x + A * pt.x + B), P) === 0n;
}
export function pointAdd(p1, p2) {
  if (p1 === null) return p2;
  if (p2 === null) return p1;
  let lambda;
  if (p1.x === p2.x) {
    if (mod(p1.y + p2.y, P) === 0n) return null;
    lambda = mod((3n * p1.x * p1.x + A) * inv(2n * p1.y, P), P);
  } else {
    lambda = mod((p2.y - p1.y) * inv(p2.x - p1.x, P), P);
  }
  const x3 = mod(lambda * lambda - p1.x - p2.x, P);
  return { x: x3, y: mod(lambda * (p1.x - x3) - p1.y, P) };
}
export function scalarMul(k, pt = G) {
  k = mod(k, N);
  if (k === 0n || pt === null) return null;
  let r = null, add = pt;
  while (k > 0n) { if (k & 1n) r = pointAdd(r, add); add = pointAdd(add, add); k >>= 1n; }
  return r;
}

// Load-time parameter validation: n*G must be the point at infinity.
if (scalarMul(N, G) !== null) throw new Error('SM2 curve parameters inconsistent: n*G != infinity');
if (!isOnCurve(G)) throw new Error('SM2 base point not on curve');

const b32 = (n) => { const h = n.toString(16).padStart(64, '0'); return Buffer.from(h, 'hex'); };
const fromBuf = (buf) => BigInt('0x' + buf.toString('hex'));
const ZERO32 = Buffer.alloc(32);

/** ZA = SM3(ENTLA || ID || a || b || Gx || Gy || Px || Py) per GM/T 0003. */
export function computeZA(publicKey, userId) {
  const id = Buffer.isBuffer(userId) ? userId : Buffer.from(String(userId ?? '1234567812345678'), 'utf8');
  const entla = Buffer.alloc(2); entla.writeUInt16BE(id.length * 8);
  const parts = [entla, id, b32(A), b32(B), b32(GX), b32(GY), b32(publicKey.x), b32(publicKey.y)];
  return sm3Bytes(Buffer.concat(parts));
}
/** e = SM3(ZA || M) as integer. */
export function digestE(msg, publicKey, userId) {
  const m = Buffer.isBuffer(msg) ? msg : Buffer.from(String(msg), 'utf8');
  return fromBuf(sm3Bytes(Buffer.concat([computeZA(publicKey, userId), m])));
}

export function publicFromPrivate(d) { return scalarMul(mod(d, N), G); }
export function generateKeyPair() {
  let d; do { d = mod(fromBuf(randomBytes(32)), N - 1n) + 1n; } while (d === 0n);
  return { privateKey: d, publicKey: publicFromPrivate(d) };
}

/** SM2 signature: returns 64-byte raw R||S (NO ASN.1/DER), as the CUP spec requires. */
export function sm2Sign(msg, privateKey, userId, opts = {}) {
  const d = typeof privateKey === 'bigint' ? privateKey : fromBuf(privateKey);
  const pub = opts.publicKey ?? publicFromPrivate(d);
  const e = digestE(msg, pub, userId);
  for (let attempt = 0; attempt < 64; attempt++) {
    const k = opts.k ?? (mod(fromBuf(randomBytes(32)), N - 1n) + 1n);
    const p = scalarMul(k, G);
    const r = mod(e + p.x, N);
    if (r === 0n || r + k === N) continue;
    const s = mod(inv(1n + d, N) * mod(k - mod(r * d, N), N), N);
    if (s === 0n) continue;
    return Buffer.concat([b32(r), b32(s)]);
  }
  throw new Error('SM2 sign: failed to find valid k');
}

export function sm2Verify(msg, sig, publicKey, userId) {
  const buf = Buffer.isBuffer(sig) ? sig : Buffer.from(sig);
  if (buf.length !== 64) return false;
  const r = fromBuf(buf.subarray(0, 32)), s = fromBuf(buf.subarray(32));
  if (r < 1n || r >= N || s < 1n || s >= N) return false;
  const e = digestE(msg, publicKey, userId);
  const t = mod(r + s, N);
  if (t === 0n) return false;
  const pt = pointAdd(scalarMul(s, G), scalarMul(t, publicKey));
  if (pt === null) return false;
  return mod(e + pt.x, N) === r;
}

function kdf(z, klen) {
  const out = []; let ct = 1, total = 0;
  while (total < klen) {
    const c = Buffer.alloc(4); c.writeUInt32BE(ct++);
    out.push(sm3Bytes(Buffer.concat([z, c]))); total += 32;
  }
  return Buffer.concat(out).subarray(0, klen);
}
const xor = (a, b) => { const o = Buffer.alloc(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] ^ b[i]; return o; };

/** GM/T 0003 Part 4 encryption, ciphertext order C1 || C3 || C2 (uncompressed C1). */
export function sm2Encrypt(plain, publicKey, opts = {}) {
  const m = Buffer.isBuffer(plain) ? plain : Buffer.from(String(plain), 'utf8');
  let c1, s, x2, y2, t;
  do {
    const k = opts.k ?? (mod(fromBuf(randomBytes(32)), N - 1n) + 1n);
    c1 = scalarMul(k, G);
    s = scalarMul(k, publicKey);
    if (s === null) continue;
    const z = Buffer.concat([b32(s.x), b32(s.y)]);
    x2 = s.x; y2 = s.y; t = kdf(z, m.length);
  } while (!t);
  const c2 = xor(m, t);
  const c3 = sm3Bytes(Buffer.concat([b32(x2), m, b32(y2)]));
  return Buffer.concat([Buffer.from([0x04]), b32(c1.x), b32(c1.y), c3, c2]);
}

export function sm2Decrypt(cipher, privateKey) {
  const d = typeof privateKey === 'bigint' ? privateKey : fromBuf(privateKey);
  if (cipher.length < 97) throw new Error('SM2 ciphertext too short');
  const c1 = { x: fromBuf(cipher.subarray(1, 33)), y: fromBuf(cipher.subarray(33, 65)) };
  if (!isOnCurve(c1)) throw new Error('SM2 C1 not on curve');
  const s = scalarMul(d, c1);
  if (s === null) throw new Error('SM2 decrypt: invalid shared point');
  const c3 = cipher.subarray(65, 97), c2 = cipher.subarray(97);
  const m = xor(c2, kdf(Buffer.concat([b32(s.x), b32(s.y)]), c2.length));
  if (!sm3Bytes(Buffer.concat([b32(s.x), m, b32(s.y)])).equals(c3)) throw new Error('SM2 integrity check failed (C3)');
  return m;
}

export function publicKeyToHex(pub) {
  return Buffer.concat([Buffer.from([0x04]), b32(pub.x), b32(pub.y)]).toString('hex');
}
export function publicKeyFromHex(hex) {
  const b = Buffer.from(String(hex).replace(/^04/, ''), 'hex');
  if (b.length !== 64) throw new RangeError('SM2 public key must be 64 bytes (xy) or 65 (04||xy)');
  return { x: fromBuf(b.subarray(0, 32)), y: fromBuf(b.subarray(32)) };
}
export const privateKeyToHex = (d) => b32(typeof d === 'bigint' ? d : fromBuf(d)).toString('hex');
export const privateKeyFromHex = (hex) => BigInt('0x' + hex);
