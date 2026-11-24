import { Buffer } from 'node:buffer';
import { BIZ, CATE_CODES } from '../contract.js';
import { normalizeResponse } from './response.js';

const ALIASES = {
  regionCd: ['regionCd', 'regionCode', 'areaCode', 'region'],
  snCode: ['snCode', 'sn', 'snNo', 'serialNo'],
  txnTime: ['txnTime', 'txnTm', 'tradeTime'],
  orderId: ['orderId', 'orderNo', 'tradeNo'],
  mchntCd: ['mchntCd', 'merchantId', 'merchantNo', 'mchntNo'],
  postTmn: ['postTmn', 'terminalId', 'termId'],
  barcode: ['barcode', 'barCode', 'goodsBarcode'],
  reqReserved: ['reqReserved', 'reserved', 'reqResv'],
  imei1: ['imei1'],
  imei2: ['imei2'],
  mfrInfo: ['mfrInfo', 'manufacturer'],
  brand: ['brand', 'brandNm'],
  specModel: ['specModel', 'model'],
  cateCode: ['cateCode', 'cateCd', 'categoryCode'],
  isAiProd: ['isAiProd', 'aiProd'],
  saleTm: ['saleTm', 'saleTime', 'saleDate'],
  transTm: ['transTm', 'transTime'],
  txnAmt: ['txnAmt', 'amount', 'txnAmount'],
  discountAmt: ['discountAmt', 'discount', 'subsidyAmt'],
  salesModel: ['salesModel', 'saleModel'],
};

const FIELDS = {
  regionCd: { min: 6, max: 6 },
  snCode: { min: 1, max: 32 },
  txnTime: { pattern: /^\d{14}$/ },
  orderId: { min: 1, max: 64 },
  mchntCd: { min: 1, max: 128 },
  postTmn: { min: 1, max: 256 },
  barcode: { min: 14, max: 14 },
  reqReserved: { min: 1, max: 2048 },
  imei1: { min: 1, max: 32 },
  imei2: { min: 1, max: 32 },
  mfrInfo: { min: 1, max: 100 },
  brand: { min: 1, max: 100 },
  specModel: { min: 1, max: 100 },
  cateCode: { min: 2, max: 32, whitelist: true },
  isAiProd: { enum: ['0', '1'] },
  saleTm: { format: true, max: 32 },
  transTm: { pattern: /^\d{17}$/ },
  txnAmt: { pattern: /^\d+(?:\.\d{1,2})?$/, max: 12 },
  discountAmt: { pattern: /^\d+(?:\.\d{1,2})?$/, max: 12 },
  salesModel: { enum: ['0', '1'] },
};

const METHOD_FIELDS = {
  query: { M: ['regionCd', 'snCode'], C: [], O: ['reqReserved'] },
  occupancy: {
    M: ['txnTime', 'orderId', 'regionCd', 'mchntCd', 'barcode', 'snCode'],
    C: ['saleTm'],
    O: ['postTmn', 'reqReserved', 'imei1', 'imei2', 'mfrInfo', 'brand', 'cateCode', 'isAiProd', 'specModel', 'transTm', 'txnAmt', 'discountAmt', 'salesModel'],
  },
  release: { M: ['txnTime', 'regionCd', 'snCode'], C: [], O: ['reqReserved'] },
};

function str(v) {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : String(v);
}

function byteLen(s) { return Buffer.byteLength(s, 'utf8'); }

function saleTmFormat(config) {
  const c = config && typeof config === 'object' ? config : {};
  const crypto = c.crypto && typeof c.crypto === 'object' ? c.crypto : {};
  const alt = c.saleTm && typeof c.saleTm === 'object' ? c.saleTm.format : undefined;
  const f = crypto.saleTmFormat || alt;
  return typeof f === 'string' && f ? f : 'yyyy-MM-dd';
}

function escapeRe(ch) {
  return '.*+?^$()|[]{}'.includes(ch) || ch === '\\' ? '\\' + ch : ch;
}

function fmtRegex(fmt) {
  const map = { yyyy: '\\d{4}', SSS: '\\d{3}', MM: '\\d{2}', dd: '\\d{2}', HH: '\\d{2}', mm: '\\d{2}', ss: '\\d{2}' };
  let out = '^';
  let i = 0;
  while (i < fmt.length) {
    let hit = '';
    for (const t of Object.keys(map)) if (fmt.startsWith(t, i)) { hit = t; break; }
    if (hit) { out += map[hit]; i += hit.length; }
    else { out += escapeRe(fmt[i]); i += 1; }
  }
  return new RegExp(out + '$');
}

function fmtDate(d, fmt) {
  const p2 = (n) => String(n).padStart(2, '0');
  const parts = {
    yyyy: String(d.getFullYear()), MM: p2(d.getMonth() + 1), dd: p2(d.getDate()),
    HH: p2(d.getHours()), mm: p2(d.getMinutes()), ss: p2(d.getSeconds()),
    SSS: String(d.getMilliseconds()).padStart(3, '0'),
  };
  return fmt.replace(/yyyy|SSS|MM|dd|HH|mm|ss/g, (t) => parts[t]);
}

function formatSaleTm(value, fmt) {
  if (value instanceof Date) return fmtDate(value, fmt);
  const s = str(value);
  if (fmtRegex(fmt).test(s)) return s;
  const digits = s.replace(/\D/g, '');
  if (/^\d{4}$/.test(digits.slice(0, 4))) {
    const seg = (a, b, d) => digits.slice(a, b) || d;
    const parts = {
      yyyy: digits.slice(0, 4), MM: seg(4, 6, '01'), dd: seg(6, 8, '01'),
      HH: seg(8, 10, '00'), mm: seg(10, 12, '00'), ss: seg(12, 14, '00'),
      SSS: seg(14, 17, '000'),
    };
    return fmt.replace(/yyyy|SSS|MM|dd|HH|mm|ss/g, (t) => parts[t]);
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new TypeError('saleTm');
  return fmtDate(d, fmt);
}

function pick(dto, keys) {
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(dto, k)) return { present: true, value: dto[k] };
  return { present: false };
}

function resolveMethod(dto) {
  const raw = dto.bizMethod ?? dto.method ?? dto.bizType ?? dto.type ?? dto.biz ?? dto.bizMethodName;
  const m = str(raw);
  if (!m) return '';
  for (const [k, v] of Object.entries(BIZ)) if (k === m || v === m) return k;
  return '';
}

function normalizeAi(v) {
  if (typeof v === 'boolean') return v ? '0' : '1';
  return v;
}

function validateField(name, value, spec, fmt) {
  if (value === null || value === undefined || value === '') throw new TypeError(name);
  let src = spec.enum && name === 'isAiProd' ? normalizeAi(value) : value;
  const v = spec.format ? formatSaleTm(src, fmt) : str(src);
  if (spec.pattern && !spec.pattern.test(v)) throw new TypeError(name);
  if (spec.enum && !spec.enum.includes(v)) throw new TypeError(name);
  if (spec.whitelist && !CATE_CODES.includes(v)) throw new TypeError(name);
  const len = byteLen(v);
  if (spec.min !== undefined && len < spec.min) throw new TypeError(name);
  if (spec.max !== undefined && len > spec.max) throw new TypeError(name);
  return v;
}

export function createAdapter(config = {}) {
  const fmt = saleTmFormat(config);
  let lastMethod = '';

  function buildRequest(dto, encryptData) {
    if (!dto || typeof dto !== 'object' || Array.isArray(dto)) throw new TypeError('dto');
    const method = resolveMethod(dto);
    if (!method) throw new TypeError('bizMethod');
    const groups = METHOD_FIELDS[method];
    const allowed = [...groups.M, ...groups.C, ...groups.O];
    const out = {};
    for (const name of allowed) {
      const found = pick(dto, ALIASES[name] || [name]);
      if (!found.present) continue;
      out[name] = validateField(name, found.value, FIELDS[name], fmt);
    }
    for (const name of groups.M) {
      if (!Object.prototype.hasOwnProperty.call(out, name)) throw new TypeError(name);
    }
    if (encryptData) out.encryptData = encryptData;
    return { rawBody: JSON.stringify(out), dto: out, bizMethod: method };
  }

  function parseResponse(body) {
    let hs = 200;
    let hdr = {};
    let rb = body;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const wrapper = ('httpStatus' in body || 'rawBody' in body || ('status' in body && ('headers' in body || 'body' in body)));
      if (wrapper) {
        hs = 'httpStatus' in body ? body.httpStatus : ('status' in body ? body.status : 200);
        rb = 'rawBody' in body ? body.rawBody : ('body' in body ? body.body : body);
        hdr = body.headers || {};
      } else {
        hdr = body.headers || {};
      }
    }
    const h = lowerKeysSafe(hdr);
    const parsed = toObjectSafe(rb);
    if (!h.bizmethod && !parsed.bizMethod && lastMethod) h.bizmethod = BIZ[lastMethod];
    return normalizeResponse(hs, h, rb);
  }

  return { buildRequest, parseResponse };
}

function lowerKeysSafe(headers) {
  const out = {};
  if (!headers || typeof headers !== 'object') return out;
  const put = (k, v) => { out[String(k).toLowerCase()] = v; };
  if (Array.isArray(headers)) {
    for (const e of headers) if (Array.isArray(e) && e.length >= 2) put(e[0], e[1]);
  } else if (typeof headers.forEach === 'function') {
    headers.forEach((v, k) => put(k, v));
  } else {
    for (const [k, v] of Object.entries(headers)) put(k, v);
  }
  return out;
}

function toObjectSafe(rawBody) {
  if (typeof rawBody === 'string' || Buffer.isBuffer(rawBody) || rawBody instanceof Uint8Array) {
    const s = typeof rawBody === 'string' ? rawBody : Buffer.from(rawBody).toString('utf8');
    try { const v = JSON.parse(s); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
  }
  if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) return rawBody;
  return {};
}
