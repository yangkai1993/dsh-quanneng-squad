import { Buffer } from 'node:buffer';
import { BIZ, SUB, SUCCESS_CODES, CODE_REASON, GENERATORS } from '../contract.js';

function str(v) {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : String(v);
}

function toObject(rawBody) {
  if (typeof rawBody === 'string' || Buffer.isBuffer(rawBody) || rawBody instanceof Uint8Array) {
    const s = typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody).toString('utf8');
    try {
      const v = JSON.parse(s);
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch {
      return {};
    }
  }
  if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) return rawBody;
  return {};
}

function lowerKeys(headers) {
  const out = {};
  if (!headers || typeof headers !== 'object') return out;
  const put = (k, v) => { out[String(k).toLowerCase()] = v; };
  if (Array.isArray(headers)) {
    for (const entry of headers) if (Array.isArray(entry) && entry.length >= 2) put(entry[0], entry[1]);
    return out;
  }
  if (typeof headers.forEach === 'function') {
    headers.forEach((v, k) => put(k, v));
    return out;
  }
  for (const [k, v] of Object.entries(headers)) put(k, v);
  return out;
}

function methodKey(bizMethod) {
  const m = str(bizMethod);
  if (!m) return '';
  if (Object.prototype.hasOwnProperty.call(SUB, m)) return m;
  for (const [k, v] of Object.entries(BIZ)) if (v === m) return k;
  return '';
}

function reasonKind(code) {
  if (typeof code !== 'string' || code.length !== 10) return 'UNMAPPED';
  const gen = code.slice(0, 2).toUpperCase();
  const reason = code.slice(2);
  if (!GENERATORS.includes(gen) || !/^[0-9]{8}$/.test(reason)) return 'UNMAPPED';
  return Object.prototype.hasOwnProperty.call(CODE_REASON, reason) ? CODE_REASON[reason] : 'UNMAPPED';
}

export function normalizeSubCode(bizMethod, subCode) {
  const s = str(subCode);
  if (!s) return '';
  const key = methodKey(bizMethod);
  if (!key) return 'UNMAPPED';
  for (const [status, code] of Object.entries(SUB[key])) if (code === s) return status.toUpperCase();
  return 'UNMAPPED_SUB:' + s;
}

export function normalizeResponse(httpStatus, headers, rawBody) {
  const raw = toObject(rawBody);
  const code = str(raw.code);
  const msg = str(raw.msg);
  const subCode = str(raw.subCode);
  const subMsg = str(raw.subMsg);
  const hdr = lowerKeys(headers);
  const bizMethod = str(hdr.bizmethod) || str(raw.bizMethod);
  const result = { kind: 'UNMAPPED', ok: false, code, msg, subCode, subMsg, bizStatus: '', raw };
  if (Number(httpStatus) !== 200) {
    result.kind = 'COMM_FAILURE';
    result.bizStatus = 'COMM_FAILURE';
    return result;
  }
  if (SUCCESS_CODES.includes(code)) {
    result.kind = 'OK';
    result.ok = true;
  } else {
    result.kind = reasonKind(code);
  }
  if (subCode) {
    const s = normalizeSubCode(bizMethod, subCode);
    result.bizStatus = s || 'OK';
  } else if (result.kind === 'OK') {
    result.bizStatus = 'OK';
  } else if (result.kind === 'UNMAPPED') {
    result.bizStatus = 'UNMAPPED';
  }
  return result;
}
