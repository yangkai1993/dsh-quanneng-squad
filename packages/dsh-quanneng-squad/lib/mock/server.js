import http from 'node:http';
import { createHmac } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import {
  BIZ, HEADERS, SUB, SUCCESS_CODES, VERSION,
  buildCanonical, now17, reqId as makeReqId,
} from '../contract.js';

const H = Object.freeze(Object.fromEntries(Object.entries(HEADERS).map(([k, v]) => [k, v.toLowerCase()])));
const REQUIRED = Object.freeze(['version', 'appType', 'appId', 'bizMethod', 'reqId', 'sign', 'signId', 'signMethod']);
const MAX_BODY = 10 * 1024 * 1024;
const MSG = Object.freeze({
  [BIZ.query]: Object.freeze({ [SUB.query.saleable]: '可售', [SUB.query.notSaleable]: '不可售' }),
  [BIZ.occupancy]: Object.freeze({
    [SUB.occupancy.ok]: '占用成功', [SUB.occupancy.fail]: '占用失败',
    [SUB.occupancy.dup]: '占用成功(重复)', [SUB.occupancy.exception]: '占用异常',
  }),
  [BIZ.release]: Object.freeze({
    [SUB.release.ok]: '释放成功', [SUB.release.fail]: '释放失败', [SUB.release.exception]: '释放异常',
  }),
});

function present(v) { return typeof v === 'string' && v.trim().length > 0; }

function validateHeaders(h, cfg) {
  for (const k of REQUIRED) {
    if (!present(h[H[k]])) return { ok: false, reason: 'MISSING_HEADER', header: HEADERS[k] };
  }
  const sm = String(h[H.signMethod] || '').toUpperCase();
  const needCert = sm.endsWith('-CERT') || cfg.requireSignPubKeyCert === true || cfg.requireAllNine === true;
  if (needCert && !present(h[H.signPubKeyCert])) return { ok: false, reason: 'MISSING_HEADER', header: HEADERS.signPubKeyCert };
  if (present(h[H.signPubKeyCert]) && /[\r\n]/.test(h[H.signPubKeyCert])) return { ok: false, reason: 'INVALID_HEADER', header: HEADERS.signPubKeyCert };
  if (!/^\d+\.\d+\.\d+$/.test(h[H.version])) return { ok: false, reason: 'INVALID_HEADER', header: HEADERS.version };
  if (!['00', '01', '02'].includes(h[H.appType])) return { ok: false, reason: 'INVALID_HEADER', header: HEADERS.appType };
  if (!/^\d+$/.test(h[H.signId])) return { ok: false, reason: 'INVALID_HEADER', header: HEADERS.signId };
  if (!/^(SM2|RSA2)(-CERT)?$/.test(sm)) return { ok: false, reason: 'INVALID_HEADER', header: HEADERS.signMethod };
  if (!/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)+$/.test(h[H.bizMethod])) return { ok: false, reason: 'INVALID_HEADER', header: HEADERS.bizMethod };
  if (/[\r\n]/.test(h[H.sign]) || /[\r\n]/.test(h[H.reqId] || '')) return { ok: false, reason: 'INVALID_HEADER', header: HEADERS.sign };
  return { ok: true };
}

async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) throw new Error('BODY_TOO_LARGE'); chunks.push(chunk); }
  let buf = Buffer.concat(chunks);
  if (String(req.headers['content-encoding'] || '').toLowerCase() === 'gzip') buf = gunzipSync(buf);
  return buf.toString('utf8');
}

function seedOccupied(input, set) {
  if (!input) return;
  const list = input instanceof Set ? [...input] : Array.isArray(input) ? input : Object.keys(input);
  for (const item of list) {
    if (typeof item === 'string') { set.add(item); continue; }
    if (item && typeof item === 'object') {
      if (item.snCode || item.regionCd) set.add(String(item.regionCd || '') + '|' + String(item.snCode || ''));
      else if (item.sn) set.add(String(item.sn));
    }
  }
}

function snKey(sn, dto) { return String(dto?.regionCd ?? '') + '|' + sn; }
function hasSn(set, sn, dto) { return set.has(sn) || set.has(snKey(sn, dto)); }
function addSn(set, sn, dto) { set.add(sn); set.add(snKey(sn, dto)); }
function delSn(set, sn, dto) { set.delete(sn); set.delete(snKey(sn, dto)); }

function publicHeaderMap(h) {
  const out = {};
  for (const [key, name] of Object.entries(HEADERS)) out[name] = h[H[key]] ?? h[name] ?? '';
  return out;
}

function upCertPayload(root, cfg) {
  const keys = root.keys || {};
  const base = {
    signPubKeyCertUP: keys.upSignPublicHex || 'MOCK_UP_SIGN_PUB_CERT_NEW',
    signIdUP: String(keys.upSignId || '900001'),
    encPubKeyCertUP: keys.upEncryptPublicHex || 'MOCK_UP_ENC_PUB_CERT_NEW',
    encIdUP: String(keys.upEncCertId || '900002'),
  };
  const src = cfg.upCert || cfg.newCert || cfg.certs?.up || cfg.certs?.new || cfg.certs || {};
  return { ...base, ...src };
}

function msgOf(method, subCode) { return MSG[method]?.[subCode] || '未知细分应答码'; }

function forcedSub(method, dto, cfg, active) {
  const fromDto = dto?.forceSubCode ?? dto?.mockSubCode ?? dto?.simulateSubCode ?? dto?.__mockSubCode ?? dto?.mock?.subCode;
  if (fromDto !== undefined && fromDto !== null && fromDto !== '') return String(fromDto);
  const rules = cfg.subCodes || cfg.forcedSubCodes || cfg.rules || {};
  const short = method === BIZ.query ? 'query' : method === BIZ.occupancy ? 'occupancy' : method === BIZ.release ? 'release' : method;
  const rule = rules[method] ?? rules[short];
  if (typeof rule === 'function') {
    const r = rule(dto);
    if (r !== undefined && r !== null && r !== '') return String(r);
  } else if (rule !== undefined && rule !== null && rule !== '') return String(rule);
  const fromChaos = active?.subCode ?? active?.forceSubCode ?? active?.forcedSubCode;
  if (fromChaos !== undefined && fromChaos !== null && fromChaos !== '') return String(fromChaos);
  return null;
}

function dispatch(method, dto, state, cfg, root, active) {
  const echo = {};
  for (const k of ['regionCd', 'snCode', 'reqReserved', 'orderId', 'txnTime']) if (dto?.[k] !== undefined) echo[k] = dto[k];
  const base = { code: cfg.successCode || root.response?.successCode || SUCCESS_CODES[1], msg: '操作成功', ...echo, transTm: now17() };
  if (method === BIZ.certUserGet) return { ...base, subCode: '000000', subMsg: '证书获取成功', ...upCertPayload(root, cfg) };
  if (method !== BIZ.query && method !== BIZ.occupancy && method !== BIZ.release) {
    return { code: 'UP40000000', msg: '未知接口', subCode: '999999', subMsg: '未知 bizMethod', transTm: now17() };
  }
  const forced = forcedSub(method, dto, cfg, active);
  if (forced) return { ...base, subCode: forced, subMsg: msgOf(method, forced) };
  const sn = String(dto?.snCode ?? dto?.sn ?? dto?.decrypted?.snCode ?? '');
  const occupied = hasSn(state.occupied, sn, dto);
  if (method === BIZ.query) {
    const sc = occupied ? SUB.query.notSaleable : SUB.query.saleable;
    return { ...base, subCode: sc, subMsg: msgOf(method, sc) };
  }
  if (method === BIZ.occupancy) {
    let sc;
    if (occupied) sc = SUB.occupancy.dup; else { addSn(state.occupied, sn, dto); sc = SUB.occupancy.ok; }
    return { ...base, subCode: sc, subMsg: msgOf(method, sc) };
  }
  let sc;
  if (occupied) { delSn(state.occupied, sn, dto); sc = SUB.release.ok; } else sc = SUB.release.fail;
  return { ...base, subCode: sc, subMsg: msgOf(method, sc) };
}

function defaultSign(canon, key) { return createHmac('sha256', String(key || 'MOCK_UP_SIGN_KEY')).update(canon, 'utf8').digest('base64'); }

async function doSign(signFn, root, canon) {
  const out = typeof signFn === 'function' ? await signFn(canon) : defaultSign(canon, root.keys?.upSignPrivateHex);
  if (out && typeof out === 'object' && !Buffer.isBuffer(out) && 'sign' in out) return String(out.sign ?? '');
  if (Buffer.isBuffer(out)) return out.toString('base64');
  return String(out ?? '');
}

async function doVerify(verifyFn, canon, sign, pub) {
  if (typeof verifyFn !== 'function') return { ok: true, reason: 'DEFAULT_ACCEPT' };
  try {
    const r = await verifyFn(canon, sign, pub);
    if (r === false) return { ok: false, reason: 'SIGN_MISMATCH' };
    if (r && typeof r === 'object') return { ok: r.ok !== false, reason: r.reason || (r.ok === false ? 'SIGN_MISMATCH' : 'OK') };
    return { ok: true, reason: 'OK' };
  } catch (e) { return { ok: false, reason: 'VERIFY_ERROR:' + String(e?.message ?? e) }; }
}

function responseHeaders(pub, root, cfg) {
  const keys = root.keys || {};
  const out = {};
  out[HEADERS.version] = root.identity?.version || pub[HEADERS.version] || VERSION;
  out[HEADERS.appType] = cfg.appType || root.identity?.upAppType || '00';
  out[HEADERS.appId] = cfg.appId || '00010000';
  out[HEADERS.bizMethod] = pub[HEADERS.bizMethod] || '';
  out[HEADERS.reqId] = pub[HEADERS.reqId] || makeReqId();
  out[HEADERS.sign] = '';
  out[HEADERS.signId] = String(cfg.signId || keys.upSignId || '100001');
  out[HEADERS.signMethod] = String(cfg.signMethod || root.crypto?.signMethod || 'SM2');
  if (cfg.signPubKeyCert || /-CERT$/i.test(out[HEADERS.signMethod])) out[HEADERS.signPubKeyCert] = cfg.signPubKeyCert || keys.upSignPublicHex || 'MOCK_UP_SIGN_PUB_CERT';
  return out;
}

function makeWaiter() {
  const pending = new Set();
  return {
    wait(ms) {
      if (!Number.isFinite(ms) || ms <= 0) return Promise.resolve();
      return new Promise((resolve) => {
        const item = { t: null, resolve };
        item.t = setTimeout(() => { pending.delete(item); resolve(); }, ms);
        if (item.t.unref) item.t.unref();
        pending.add(item);
      });
    },
    flush() { for (const item of pending) { clearTimeout(item.t); item.resolve(); } pending.clear(); },
  };
}

function resolveHooks(root, cfg) {
  function currentVerify() {
    const raw = cfg.verify ?? cfg.hooks?.verify;
    if (typeof raw === 'function') return raw;
    if (raw === false || raw === 'false' || raw === 0) return null;
    if (typeof root._verifyInbound === 'function') return (canon, sign, pub) => root._verifyInbound(canon, sign, { signId: pub[HEADERS.signId], ...pub });
    if (typeof root.verify === 'function') return root.verify;
    return null;
  }
  function currentSign() {
    if (typeof cfg.sign === 'function') return cfg.sign;
    if (typeof cfg.hooks?.sign === 'function') return cfg.hooks.sign;
    if (typeof root._sign === 'function') return root._sign;
    return null;
  }
  function currentDecrypt() {
    if (typeof root._decrypt === 'function') return root._decrypt;
    if (typeof cfg.decrypt === 'function') return cfg.decrypt;
    return null;
  }
  return { get verify() { return currentVerify(); }, get sign() { return currentSign(); }, get decrypt() { return currentDecrypt(); } };
}

export function createMockUp(config = {}) {
  const root = config && typeof config === 'object' ? config : {};
  const cfg = root.mock && typeof root.mock === 'object' ? root.mock : root;
  const hooks = resolveHooks(root, cfg);
  const rawPort = cfg.port ?? root.port;
  const configuredPort = Number.isFinite(Number(rawPort)) && rawPort !== undefined ? Number(rawPort) : 18950;
  const host = cfg.host;
  const state = { occupied: new Set(), requests: 0, failures: 0, headerInvalid: 0, verifyFailures: 0, signFailures: 0, byMethod: Object.create(null), byPath: Object.create(null) };
  seedOccupied(cfg.occupiedSn, state.occupied);
  let chaos = {};
  let server = null;
  let actualPort = null;
  const waiter = makeWaiter();

  async function sendJson(res, payload, hdrs, active) {
    const raw = JSON.stringify(payload);
    const canon = buildCanonical({ version: hdrs[HEADERS.version], appId: hdrs[HEADERS.appId], bizMethod: hdrs[HEADERS.bizMethod], reqId: hdrs[HEADERS.reqId], rawBody: raw });
    let sign = await doSign(hooks.sign, root, canon);
    if (active.signFail) sign = 'AA==';
    hdrs[HEADERS.sign] = String(sign);
    if (res.destroyed || res.writableEnded) return;
    const statusCode = Number(active.httpStatus) || 200;
    res.writeHead(statusCode, { 'content-type': 'application/json;charset=utf-8', 'content-length': Buffer.byteLength(raw, 'utf8'), connection: 'keep-alive', 'keep-alive': 'timeout=15', ...hdrs });
    res.end(raw);
  }

  async function reject(res, pub, active, code, msg, subCode) {
    await sendJson(res, { code, msg, subCode, subMsg: '请求未受理', transTm: now17() }, responseHeaders(pub, root, cfg), active);
  }

  const handler = async (req, res) => {
    state.requests += 1;
    const pathname = (req.url || '/').split('?')[0];
    state.byPath[pathname] = (state.byPath[pathname] || 0) + 1;
    const active = { ...chaos };
    const pub = publicHeaderMap(req.headers);
    try {
      if (pathname !== '/api/trans.do') { state.failures += 1; res.writeHead(404, { 'content-length': 0 }); res.end(); return; }
      if (req.method !== 'POST') { state.failures += 1; res.writeHead(405, { 'content-length': 0 }); res.end(); return; }
      let raw;
      try { raw = await readBody(req); } catch (e) {
        state.failures += 1;
        await reject(res, pub, active, 'UP40000000', '报文读取失败: ' + String(e?.message ?? e), '000001');
        return;
      }
      const hv = validateHeaders(req.headers, cfg);
      if (!hv.ok) {
        state.headerInvalid += 1; state.failures += 1;
        await reject(res, pub, active, 'UP40000000', hv.reason + ':' + hv.header, '000002');
        return;
      }
      let dto;
      try { dto = JSON.parse(raw); } catch { dto = null; }
      if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
        state.failures += 1;
        await reject(res, pub, active, 'UP40000000', 'BODY_NOT_JSON_OBJECT', '000003');
        return;
      }
      if (dto.encryptData && hooks.decrypt) {
        try { const dec = hooks.decrypt(dto.encryptData); if (dec && typeof dec === 'object' && !dec._undecryptable) dto = { ...dec, ...dto, decrypted: dec }; } catch {}
      }
      const canon = buildCanonical({ version: pub[HEADERS.version], appId: pub[HEADERS.appId], bizMethod: pub[HEADERS.bizMethod], reqId: pub[HEADERS.reqId], rawBody: raw });
      if (active.signFail) {
        state.signFailures += 1; state.verifyFailures += 1; state.failures += 1;
        await reject(res, pub, active, 'UP40030000', '验签失败', '000001');
        return;
      }
      const vr = await doVerify(hooks.verify, canon, pub[HEADERS.sign], pub);
      if (!vr.ok) {
        state.verifyFailures += 1; state.signFailures += 1; state.failures += 1;
        await reject(res, pub, active, 'UP40030000', '验签失败:' + vr.reason, '000001');
        return;
      }
      const method = pub[HEADERS.bizMethod];
      state.byMethod[method] = (state.byMethod[method] || 0) + 1;
      const payload = dispatch(method, dto, state, cfg, root, active);
      if (active.unknownSubCode) {
        payload.subCode = typeof active.unknownSubCode === 'string' ? active.unknownSubCode : '999998';
        payload.subMsg = '未知细分应答码';
      }
      if (active.timeoutMs) await waiter.wait(Number(active.timeoutMs));
      await sendJson(res, payload, responseHeaders(pub, root, cfg), active);
      if (active.httpStatus) state.failures += 1;
    } catch (e) {
      state.failures += 1;
      if (!res.headersSent && !res.destroyed) {
        try {
          const raw = JSON.stringify({ code: 'UP40070000', msg: String(e?.message ?? e) });
          res.writeHead(500, { 'content-type': 'application/json;charset=utf-8', 'content-length': Buffer.byteLength(raw) });
          res.end(raw);
        } catch {}
      }
    }
  };

  async function start() {
    if (server && server.listening) return actualPort;
    if (!server) { server = http.createServer(handler); server.keepAliveTimeout = 15000; }
    await new Promise((resolve, reject) => {
      const onError = (err) => { server.off('error', onError); reject(err); };
      server.once('error', onError);
      const done = () => { server.off('error', onError); actualPort = server.address().port; resolve(actualPort); };
      if (host) server.listen(configuredPort, host, done); else server.listen(configuredPort, done);
    });
    return actualPort;
  }

  async function stop() {
    waiter.flush();
    if (!server) return;
    const s = server; server = null; actualPort = null;
    await new Promise((resolve) => { try { s.close(() => resolve()); if (s.closeAllConnections) s.closeAllConnections(); if (s.closeIdleConnections) s.closeIdleConnections(); } catch { resolve(); } });
  }

  function stats() {
    return { requests: state.requests, byMethod: { ...state.byMethod }, byPath: { ...state.byPath }, failures: state.failures, headerInvalid: state.headerInvalid, verifyFailures: state.verifyFailures, signFailures: state.signFailures, chaos: { ...chaos }, occupied: [...state.occupied], port: actualPort ?? configuredPort };
  }

  function setChaos(opts) {
    if (!opts || opts.reset === true) chaos = {};
    else chaos = { ...(typeof opts === 'object' ? opts : {}) };
    return { ...chaos };
  }

  const api = {
    start, stop, stats, setChaos,
    seedOccupied: (a) => { seedOccupied(a, state.occupied); return [...state.occupied]; },
    get port() { return actualPort ?? configuredPort; },
    get server() { return server; },
  };

  if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    api.start().then((p) => {
      console.log('mock-up listening on ' + p);
      const bye = () => { api.stop().finally(() => process.exit(0)); };
      process.on('SIGINT', bye); process.on('SIGTERM', bye);
    });
  }
  return api;
}
