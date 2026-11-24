import http from 'node:http';
import { createHmac } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import {
  BIZ, HEADERS, STORE_FORWARD, SUCCESS_CODES, TIMEOUT, VERSION,
  buildCanonical, now17, reqId as makeReqId,
} from '../contract.js';

const H = Object.freeze(Object.fromEntries(Object.entries(HEADERS).map(([k, v]) => [k, v.toLowerCase()])));
const MAX_BODY = 10 * 1024 * 1024;
const PATHS = Object.freeze(['/cert/upget', '/notify', '/notify/replay']);

async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) throw new Error('BODY_TOO_LARGE'); chunks.push(chunk); }
  let buf = Buffer.concat(chunks);
  if (String(req.headers['content-encoding'] || '').toLowerCase() === 'gzip') buf = gunzipSync(buf);
  return buf.toString('utf8');
}

function newUserCerts(root, cfg) {
  const keys = root.keys || {};
  const oldId = String(keys.signId || '800000');
  const nextId = /^\d+$/.test(oldId) ? String(Number(oldId) + 1) : oldId + '_NEW';
  const base = {
    signPubKeyCertUser: keys.userSignPublicHex || 'MOCK_USER_SIGN_PUB_CERT_NEW',
    signIdUser: nextId,
    encPubKeyCertUser: keys.userEncryptPublicHex || 'MOCK_USER_ENC_PUB_CERT_NEW',
    encIdUser: String(keys.userEncCertId || '800002'),
  };
  const src = cfg.newCert || cfg.userCert || cfg.newCerts || cfg.certs?.user || cfg.certs?.new || cfg.certs || {};
  return {
    signPubKeyCertUser: String(src.signPubKeyCertUser ?? src.signCert ?? src.signPubKeyCert ?? base.signPubKeyCertUser),
    signIdUser: String(src.signIdUser ?? src.signId ?? base.signIdUser),
    encPubKeyCertUser: String(src.encPubKeyCertUser ?? src.encCert ?? src.encPubKeyCert ?? base.encPubKeyCertUser),
    encIdUser: String(src.encIdUser ?? src.encId ?? base.encIdUser),
  };
}

function oldCertOf(root, cfg) {
  const keys = root.keys || {};
  const raw = cfg.oldCert ?? cfg.old ?? null;
  if (typeof raw === 'string') return { signId: raw, signMethod: 'SM2', privateKey: raw };
  if (raw && typeof raw === 'object') return { signId: String(raw.signId ?? raw.signCertId ?? keys.signId ?? '800000'), signMethod: String(raw.signMethod ?? 'SM2'), privateKey: raw.privateKey ?? raw.privKey ?? raw.signId ?? keys.signId ?? '800000' };
  return { signId: String(keys.signId || '800000'), signMethod: String(root.crypto?.signMethod || 'SM2'), privateKey: keys.userSignPrivateHex || keys.signId || '800000' };
}

async function signWithOld(canon, root, cfg, oldCert) {
  const fn = cfg.signWithOld || cfg.sign || cfg.hooks?.sign;
  let out;
  if (typeof fn === 'function') out = await fn(canon, oldCert);
  else out = createHmac('sha256', String(oldCert.privateKey)).update(canon, 'utf8').digest('base64');
  if (out && typeof out === 'object' && !Buffer.isBuffer(out) && 'sign' in out) return String(out.sign ?? '');
  return Buffer.isBuffer(out) ? out.toString('base64') : String(out ?? '');
}

export function createInbound(config = {}) {
  const root = config && typeof config === 'object' ? config : {};
  const cfg = root.inbound && typeof root.inbound === 'object' ? root.inbound : root;
  const rawPort = cfg.port ?? root.port;
  const configuredPort = Number.isFinite(Number(rawPort)) && rawPort !== undefined ? Number(rawPort) : 18951;
  const host = cfg.host;
  const state = { requests: 0, failures: 0, upget: 0, notify: 0, replay: 0, other: 0, hookCalls: 0, replayAttempts: 0, replayTasks: 0, byPath: Object.create(null), notifications: [], records: [], replays: [], oldSignIds: [] };
  const timers = new Set();
  let server = null, actualPort = null, stopped = false;
  let onNotify = cfg.onNotify ?? root.onNotify ?? cfg.hooks?.onNotify ?? null;
  const selfPort = () => actualPort ?? configuredPort;

  async function handleCert(req, res, pub) {
    const version = pub[HEADERS.version] || root.identity?.version || VERSION;
    const appId = cfg.appId || root.identity?.appId || 'MOCK_USER';
    const bizMethod = pub[HEADERS.bizMethod] || BIZ.certUpGet;
    const reqIdVal = pub[HEADERS.reqId] || makeReqId();
    const fresh = newUserCerts(root, cfg);
    const oldCert = oldCertOf(root, cfg);
    const payload = {
      code: cfg.successCode || SUCCESS_CODES[0], msg: '交易成功', subCode: '000000', subMsg: '证书更新成功',
      ...fresh, transTm: now17(), _signedWith: 'OLD_CERT_' + oldCert.signId, _newCertSignId: fresh.signIdUser,
    };
    const rawBody = JSON.stringify(payload);
    const canon = buildCanonical({ version, appId, bizMethod, reqId: reqIdVal, rawBody });
    const sign = await signWithOld(canon, root, cfg, oldCert);
    const hdrs = {};
    hdrs[HEADERS.version] = version;
    hdrs[HEADERS.appType] = cfg.appType || root.identity?.appType || '01';
    hdrs[HEADERS.appId] = appId;
    hdrs[HEADERS.bizMethod] = bizMethod;
    hdrs[HEADERS.reqId] = reqIdVal;
    hdrs[HEADERS.sign] = sign;
    hdrs[HEADERS.signId] = oldCert.signId;
    hdrs[HEADERS.signMethod] = oldCert.signMethod;
    hdrs['x-signed-with'] = 'oldCert:' + oldCert.signId;
    hdrs['x-old-cert-sign-id'] = oldCert.signId;
    hdrs['x-new-cert-sign-id'] = fresh.signIdUser;
    res.writeHead(200, { 'content-type': 'application/json;charset=utf-8', 'content-length': Buffer.byteLength(rawBody, 'utf8'), ...hdrs });
    res.end(rawBody);
    state.upget += 1;
    state.oldSignIds.push(oldCert.signId);
  }

  async function handleNotify(req, res, pub, raw) {
    let body = null;
    try { body = JSON.parse(raw || '{}'); } catch { body = null; }
    const result = {
      code: body?.code ?? '', msg: body?.msg ?? '', subCode: body?.subCode ?? '', subMsg: body?.subMsg ?? '',
      bizStatus: body?.bizStatus ?? '', state: body?.state ?? '',
      origReqId: body?.origReqId ?? body?.reqId ?? pub[HEADERS.reqId] ?? '',
      originalResult: body?.originalResult ?? body?.result ?? body?.code ?? '',
    };
    const row = { ...(body || {}), result, receivedAt: new Date().toISOString() };
    const record = { seq: state.records.length + 1, at: row.receivedAt, path: (req.url || '').split('?')[0], headers: { ...req.headers }, rawBody: raw, body, result };
    state.notifications.push(row);
    state.records.push(record);
    state.notify += 1;
    if (typeof onNotify === 'function') {
      state.hookCalls += 1;
      try { await onNotify(row, record); } catch (e) { state.failures += 1; record.hookError = String(e?.message ?? e); }
    }
    const status = Number(cfg.notifyStatus) === 302 ? 302 : 200;
    if (!res.destroyed && !res.writableEnded) { res.writeHead(status, { 'content-length': 0 }); res.end(); }
  }

  async function runAttempt(task) {
    task.attempt += 1;
    const entry = { n: task.attempt, at: new Date().toISOString(), ok: false, status: null, error: null };
    const body = typeof task.payload === 'string' ? task.payload : JSON.stringify(task.payload ?? {});
    try {
      const r = await fetch(task.target, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/json;charset=utf-8' }, body, signal: AbortSignal.timeout(Number(cfg.requestTimeoutMs) || TIMEOUT.totalMs) });
      entry.status = r.status;
      entry.ok = r.status === 200 || r.status === 302;
      try { await r.arrayBuffer(); } catch {}
    } catch (e) { entry.error = String(e?.message ?? e); }
    task.attempts.push(entry);
    state.replayAttempts += 1;
    if (!entry.ok) state.failures += 1;
    return entry;
  }

  function schedule(task) {
    if (task.done || stopped) return;
    if (task.attempt >= task.maxAttempts) { task.done = true; task.result = 'EXHAUSTED'; task.nextFireAt = null; return; }
    const idx = Math.min(Math.max(0, task.attempt - 1), Math.max(0, task.intervalsMs.length - 1));
    const delayMs = Math.max(0, Number(task.intervalsMs[idx] ?? 0));
    const fireAt = Date.now() + delayMs;
    if (task.deadline && fireAt > task.deadline) { task.done = true; task.result = 'DAY_CUT'; task.nextFireAt = null; return; }
    task.nextFireAt = new Date(fireAt).toISOString();
    const t = setTimeout(async () => {
      timers.delete(t);
      if (stopped) return;
      const entry = await runAttempt(task);
      if (entry.ok) { task.done = true; task.result = 'DELIVERED'; task.nextFireAt = null; return; }
      schedule(task);
    }, delayMs);
    if (t.unref) t.unref();
    timers.add(t);
  }

  async function handleReplay(req, res, raw) {
    let spec = {};
    try { spec = JSON.parse(raw || '{}') || {}; } catch { spec = {}; }
    const target = String(spec.backUrl || spec.url || spec.target || cfg.replayTarget || ('http://127.0.0.1:' + selfPort() + '/notify'));
    const payload = spec.payload ?? spec.body ?? spec.notify ?? state.notifications.at(-1) ?? { code: SUCCESS_CODES[0], msg: '操作成功', subCode: '000000', subMsg: '可售' };
    const sf = cfg.storeForward || root.reliability?.storeForward || {};
    const minutes = Array.isArray(spec.intervalsMin) ? spec.intervalsMin : (Array.isArray(sf.intervalsMin) ? sf.intervalsMin : STORE_FORWARD.intervalsMin);
    const rawIntervals = Array.isArray(spec.intervalsMs) ? spec.intervalsMs : Array.isArray(cfg.replayIntervalsMs) ? cfg.replayIntervalsMs : minutes.map((m) => Number(m) * 60000);
    const intervalsMs = rawIntervals.map((x) => Number(x));
    const maxAttempts = Math.max(1, Number(spec.maxAttempts ?? cfg.maxAttempts ?? sf.maxAttempts ?? STORE_FORWARD.maxAttempts) || STORE_FORWARD.maxAttempts);
    let deadline = null;
    const dl = spec.deadline ?? cfg.dayCutDeadline;
    if (dl) { const n = typeof dl === 'number' ? dl : Date.parse(dl); if (Number.isFinite(n)) deadline = n; }
    const task = { taskId: makeReqId(), target, payload, intervalsMs, maxAttempts, deadline, attempt: 0, attempts: [], done: false, result: 'PENDING', nextFireAt: null, createdAt: new Date().toISOString() };
    state.replays.push(task);
    state.replayTasks += 1;
    state.replay += 1;
    const first = await runAttempt(task);
    if (first.ok) { task.done = true; task.result = 'DELIVERED'; } else schedule(task);
    const out = JSON.stringify({ code: SUCCESS_CODES[0], msg: 'stored', taskId: task.taskId, accepted: true, target: task.target, attempt: task.attempt, last: first, done: task.done, result: task.result, nextFireAt: task.nextFireAt, intervalsMs: task.intervalsMs, maxAttempts: task.maxAttempts, queued: state.notifications.length });
    res.writeHead(200, { 'content-type': 'application/json;charset=utf-8', 'content-length': Buffer.byteLength(out, 'utf8') });
    res.end(out);
  }

  function publicHeaderMap(h) {
    const out = {};
    for (const [key, name] of Object.entries(HEADERS)) out[name] = h[H[key]] ?? h[name] ?? '';
    return out;
  }

  const handler = (req, res) => {
    state.requests += 1;
    const pathname = ((req.url || '/').split('?')[0]).replace(/\/+$/, '') || '/';
    state.byPath[pathname] = (state.byPath[pathname] || 0) + 1;
    if (!PATHS.includes(pathname)) { state.other += 1; res.writeHead(404, { 'content-length': 0 }); res.end(); return; }
    if (req.method !== 'POST') { res.writeHead(405, { 'content-length': 0 }); res.end(); return; }
    (async () => {
      try {
        const raw = await readBody(req);
        const pub = publicHeaderMap(req.headers);
        if (pathname === '/cert/upget') await handleCert(req, res, pub);
        else if (pathname === '/notify') await handleNotify(req, res, pub, raw);
        else await handleReplay(req, res, raw);
      } catch (e) {
        state.failures += 1;
        if (!res.headersSent && !res.destroyed) {
          const out = JSON.stringify({ code: 'UP40070000', msg: String(e?.message ?? e) });
          res.writeHead(500, { 'content-type': 'application/json;charset=utf-8', 'content-length': Buffer.byteLength(out, 'utf8') });
          res.end(out);
        }
      }
    })();
  };

  async function start() {
    stopped = false;
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
    stopped = true;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    if (!server) return;
    const s = server; server = null; actualPort = null;
    await new Promise((resolve) => { try { s.close(() => resolve()); if (s.closeAllConnections) s.closeAllConnections(); if (s.closeIdleConnections) s.closeIdleConnections(); } catch { resolve(); } });
  }

  function stats() {
    return { requests: state.requests, byPath: { ...state.byPath }, failures: state.failures, upget: state.upget, notify: state.notify, replay: state.replay, other: state.other, notifications: state.notifications.length, notifyRecords: state.records.length, hookCalls: state.hookCalls, replayTasks: state.replayTasks, replayAttempts: state.replayAttempts, notifyStatus: Number(cfg.notifyStatus) === 302 ? 302 : 200, oldSignIds: [...state.oldSignIds], records: state.records.map((r) => ({ ...r, headers: { ...r.headers }, result: { ...r.result } })), replays: state.replays.map((t) => ({ ...t, attempts: t.attempts.map((a) => ({ ...a })) })), port: actualPort ?? configuredPort };
  }

  const api = {
    start, stop, stats,
    get notifications() { return state.notifications; },
    setOnNotify: (f) => { onNotify = f; return onNotify; },
    get port() { return actualPort ?? configuredPort; },
    get server() { return server; },
  };

  if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    api.start().then((p) => {
      console.log('inbound listening on ' + p);
      const bye = () => { api.stop().finally(() => process.exit(0)); };
      process.on('SIGINT', bye); process.on('SIGTERM', bye);
    });
  }
  return api;
}
