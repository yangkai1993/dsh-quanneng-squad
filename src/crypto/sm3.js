// src/crypto/sm3.js — GM/T 0004-2012 SM3, pure JS, zero deps.
const IV = [0x7380166f,0x4914b2b9,0x172442d7,0xda8a0600,0xa96f30bc,0x163138aa,0xe38dee4d,0xb0fb0e4e];
const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;
const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
const p0 = (x) => (x ^ rotl(x, 9) ^ rotl(x, 17)) >>> 0;
const p1 = (x) => (x ^ rotl(x, 15) ^ rotl(x, 23)) >>> 0;
const add = (...a) => a.reduce((s, v) => (s + v) >>> 0, 0) >>> 0;

function ff(x, y, z, j) { return j < 16 ? (x ^ y ^ z) : ((x & y) | (x & z) | (y & z)); }
function gg(x, y, z, j) { return j < 16 ? (x ^ y ^ z) : ((x & y) | (~x & z)); }

function cf(v, block) {
  const w = new Array(68);
  for (let i = 0; i < 16; i++) w[i] = block.readUInt32BE(i * 4) >>> 0;
  for (let j = 16; j < 68; j++) {
    w[j] = (p1((w[j-16] ^ w[j-9] ^ rotl(w[j-3], 15)) >>> 0) ^ rotl(w[j-13], 7) ^ w[j-6]) >>> 0;
  }
  const wp = new Array(64);
  for (let j = 0; j < 64; j++) wp[j] = (w[j] ^ w[j+4]) >>> 0;
  let [a,b,c,d,e,f,g,h] = v;
  for (let j = 0; j < 64; j++) {
    const tj = j < 16 ? 0x79cc4519 : 0x7a879d8a;
    const ss1 = rotl(add(rotl(a, 12), e, rotl(tj, j % 32)), 7);
    const ss2 = (ss1 ^ rotl(a, 12)) >>> 0;
    const tt1 = add(ff(a,b,c,j), d, ss2, wp[j]);
    const tt2 = add(gg(e,f,g,j), h, ss1, w[j]);
    d = c; c = rotl(b, 9); b = a; a = tt1;
    h = g; g = rotl(f, 19); f = e; e = p0(tt2);
  }
  return [a,b,c,d,e,f,g,h].map((x, i) => (x ^ v[i]) >>> 0);
}

export function sm3Bytes(input) {
  const msg = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  const bitLen = msg.length * 8;
  const padLen = (msg.length % 64 < 56) ? (56 - msg.length % 64) : (120 - msg.length % 64);
  const buf = Buffer.alloc(msg.length + padLen + 8);
  msg.copy(buf); buf[msg.length] = 0x80;
  const hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
  buf.writeUInt32BE(hi >>> 0, buf.length - 8); buf.writeUInt32BE(lo, buf.length - 4);
  let v = IV.slice();
  for (let off = 0; off < buf.length; off += 64) v = cf(v, buf.subarray(off, off + 64));
  const out = Buffer.alloc(32);
  v.forEach((x, i) => out.writeUInt32BE(x >>> 0, i * 4));
  return out;
}

export const sm3 = (input) => sm3Bytes(input).toString('hex');
export default sm3;
