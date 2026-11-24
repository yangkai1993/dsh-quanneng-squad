// src/config.js — single configuration entry. JSON file + env overrides + runnable local defaults.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes, generateKeyPairSync } from 'node:crypto';
import { generateKeyPair, publicKeyToHex, privateKeyToHex } from './crypto/sm2.js';

export const DEFAULTS = {
  identity: {
    version: '1.0.0', appType: '01', appId: 'LOCAL_SANDBOX_0001',
    signId: '888888', userId: '888888',
  },
  crypto: {
    signMethod: 'SM2', encryptMethod: 'SM4', bodyBasis: 'RAW_JSON',
    // §12-5: signature body basis under gzip. WIRE_BYTES uses the compressed payload.
    wireBodyBasis: 'RAW_JSON',
    encryptData: { enabled: true, sensitiveFields: ['imei1', 'imei2', 'addr', 'gps', 'snCode'] },
    saleTmFormat: 'yyyy-MM-dd',
  },
  up: {
    channel: 'mock',
    centers: [
      { name: 'center-a', url: 'http://127.0.0.1:18950/api/trans.do', weight: 100 },
      { name: 'center-b', url: 'http://127.0.0.1:18951/api/trans.do', weight: 0 },
    ],
    timeout: { connectMs: 3000, readMs: 9000, totalMs: 10000 },
    keepAlive: { enabled: true, serverTimeoutSec: 15 },
    gzip: { enabled: true, minBytes: 4096 },
    probeIntervalSec: 10, errorRateThreshold: 0.30,
  },
  cert: { overlapDays: 90, expiryAlertDays: 90, autoUpdate: true, validateChain: true },
  reliability: {
    idemTtlMs: 86400000,
    // §12-7: no occupancy-state query exists -> compensation goes to reconciliation.
    occupancyReconMode: 'PENDING_RECON', occupancyStateQueryBizMethod: null,
    // §12-8: release has no orderId; resolve the original order through sn_state.
    releaseOrderLookup: 'regionCd+snCode',
    // §12-12: backUrl whitelist + callback auth.
    backUrlWhitelist: [], callbackAuth: 'hmac-sha256',
    failover: { enabled: true, errorRateThreshold: 0.30 },
    storeForward: { maxAttempts: 5, intervalsMin: [1, 2, 4, 5], deadline: 'day-cut' },
    degrade: 'fail-closed',
    dayCutHour: 23, dayCutMinute: 30,
  },
  response: { acceptCodes: ['0000000000', '200'], unknownSubCode: 'ALERT_AND_PERSIST',
    // §12-1: which success code is authoritative. 'BOTH' keeps compatibility + alert.
    successCodePolicy: 'BOTH', strictSuccessCode: '0000000000' },
  north: { port: 18952, auth: { mode: 'mtls+jwt', jwtSecret: 'LOCAL_ONLY_CHANGE_ME', tenants: ['LOCAL_SANDBOX_0001'] }, rateLimitPerSec: 200 },
  mock: { port: 18950, occupiedSn: [], verify: true },
  inbound: { port: 18951, notifyStatus: 200 },
  file: { sftpDir: './.data/sftp', inlineLimitBytes: 10 * 1024 * 1024 },
  // §12-3 C3, §12-4 C4, §12-9 C6, §12-10 C7/C8: field-level compatibility switches.
  spec: {
    cateCodeExtra: ['B04'],              // §12-3 B04 masked in the source doc
    saleTmFormat: 'yyyy-MM-dd',           // §12-4 switchable to yyyyMMddHHmmss
    mchntCdMaxBytes: 128,                // §12-9 interface table 24 vs general 128
    reqReservedMaxBytes: 2048,           // §12-9 interface table 2048 vs general 1024
    standardId: 'Q/CUP-SC XXX-2025.1227', effectiveDate: '2026-11-05',
    flowChartSource: 'EMF/OLE unrecoverable — state machine derived from §7.1 + §8.2',
  },
  observability: { auditDir: './.data/audit', maskSecret: 'LOCAL_ONLY_MASK_KEY' },
};

const deepMerge = (a, b) => {
  if (Array.isArray(b)) return b.slice();
  if (b && typeof b === 'object') {
    const o = { ...(a && typeof a === 'object' ? a : {}) };
    for (const k of Object.keys(b)) o[k] = deepMerge(o[k], b[k]);
    return o;
  }
  return b === undefined ? a : b;
};
const setPath = (obj, path, val) => {
  const ks = path.split('.'); let cur = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (!cur[ks[i]] || typeof cur[ks[i]] !== 'object') cur[ks[i]] = {}; cur = cur[ks[i]]; }
  cur[ks[ks.length - 1]] = val;
};
const coerce = (v) => {
  if (v === 'true') return true; if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (v.startsWith('[') || v.startsWith('{')) { try { return JSON.parse(v); } catch {} }
  return v;
};

/** Deterministic local sandbox key material, generated once and persisted. */
export function ensureLocalKeys(file = './config/local-keys.json') {
  const abs = resolve(process.cwd(), file);
  const KEYS_V = 2;
  if (existsSync(abs)) {
    const old = JSON.parse(readFileSync(abs, 'utf8'));
    if (old._v === KEYS_V) return old;
  }
  const sign = generateKeyPair(), enc = generateKeyPair(), upSign = generateKeyPair(), upEnc = generateKeyPair();
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  const upRsa = generateKeyPairSync('rsa', { modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  const keys = {
    _v: KEYS_V,
    _note: 'LOCAL SANDBOX ONLY — replace with CA-issued certificates and KMS/HSM references before onboarding.',
    signId: '888888', userEncCertId: '999999', upSignId: '1111111', upEncCertId: '2222222',
    userSignPrivateHex: privateKeyToHex(sign.privateKey), userSignPublicHex: publicKeyToHex(sign.publicKey),
    userDecryptPrivateHex: privateKeyToHex(enc.privateKey), userEncryptPublicHex: publicKeyToHex(enc.publicKey),
    upSignPrivateHex: privateKeyToHex(upSign.privateKey), upSignPublicHex: publicKeyToHex(upSign.publicKey),
    upDecryptPrivateHex: privateKeyToHex(upEnc.privateKey), upEncryptPublicHex: publicKeyToHex(upEnc.publicKey),
    userSignPrivatePem: rsa.privateKey, userSignPublicPem: rsa.publicKey,
    upSignPrivatePem: upRsa.privateKey, upSignPublicPem: upRsa.publicKey,
    userDecryptPrivatePem: rsa.privateKey, userEncryptPublicPem: rsa.publicKey,
    generatedAt: new Date().toISOString(),
  };
  const dir = resolve(process.cwd(), './config'); mkdirSync(dir, { recursive: true });
  writeFileSync(abs, JSON.stringify(keys, null, 2), 'utf8');
  return keys;
}

export function loadConfig(opts = {}) {
  let cfg = structuredClone(DEFAULTS);
  const file = opts.file || process.env.GATEWAY_CONFIG || './config/gateway.json';
  const abs = resolve(process.cwd(), file);
  if (existsSync(abs)) cfg = deepMerge(cfg, JSON.parse(readFileSync(abs, 'utf8')));
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.startsWith('GW_')) continue;
    setPath(cfg, k.slice(3).replace(/__/g, '.').toLowerCase().replace(/_([a-z])/g, (_m, c) => c.toUpperCase()), coerce(v));
  }
  if (opts.overrides) cfg = deepMerge(cfg, opts.overrides);
  cfg.keys = opts.keys || ensureLocalKeys(opts.keysFile);
  cfg.configFile = abs;
  return cfg;
}
