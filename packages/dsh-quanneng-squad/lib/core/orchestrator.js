// src/core/orchestrator.js — the business orchestration layer (one full request lifecycle).
import { BIZ, STATE, idemKey, reqId } from '../contract.js';
import { normalizeResponse } from '../protocol/response.js';
import { applyResponse } from './state.js';

export function createOrchestrator({ cfg, provider, adapter, upstream, stores, metrics, reconciler }) {
  const SENSITIVE = cfg.crypto.encryptData.sensitiveFields;

  async function handle(input, method, ctx = {}) {
    const t0 = Date.now(); metrics.bump('requests');
    const traceId = ctx.traceId || 'TR' + Date.now().toString(36).toUpperCase();
    const rid = reqId();
    const key = method === BIZ.query
      ? idemKey({ appId: cfg.identity.appId, orderId: 'Q_' + Math.floor(Date.now() / 15000), regionCd: input.regionCd, snCode: input.snCode, bizMethod: method })
      : idemKey({ appId: cfg.identity.appId, orderId: input.orderId, regionCd: input.regionCd, snCode: input.snCode, bizMethod: method });

    // 1) Idempotency entry: two-phase in-flight claim + terminal result (§8.1, baseline=Sn26FlowService.java:54 putIfAbsent).
    //    First submission -> claim the key with an IN-FLIGHT marker carrying this reqId; a duplicate landing inside the
    //    in-flight window gets DUP_REQ semantics + the ORIGINAL reqId replay. ctx.forceNew skips the gate entirely.
    let claimed = false;
    if (!ctx.forceNew) {
      const existing = await stores.idem.get(key);
      if (existing && existing._inflight) {
        metrics.bump('dupReqInflight');
        return { ok: false, kind: 'DUP_REQ', code: '40050000', msg: 'request in flight; retry with original transaction data',
          reqId: existing.reqId, bizStatus: 'UNKNOWN', state: (await stores.state.get(input.regionCd, input.snCode))?.state || STATE.NEW,
          actionable: { resend: true, keepPrimaryKey: true, reason: 'retry with ORIGINAL transaction data and primary key unchanged' },
          traceId, _dupInflight: true };
      }
      if (existing) return { ...existing, _idempotent: true, traceId };
      await stores.idem.putIfAbsent(key, { _inflight: true, reqId: rid, bizMethod: method }, cfg.reliability.idemTtlMs);
      claimed = true;
    }

    // 2) Project + validate. Unknown fields are silently dropped.
    let built;
    try { built = adapter.buildRequest({ ...input, bizMethod: method }); }
    catch (e) { metrics.bump('requests'); await stores.idem.release(key, rid); return { ok: false, kind: 'PARAM_INVALID', msg: e.message, traceId }; }

    // 3) encryptData envelope on the real projected body, then ONE serialization.
    let encryptData = null;
    if (cfg.crypto.encryptData.enabled) {
      const sensitive = provider.extractSensitive(built.dto, SENSITIVE);
      if (Object.keys(sensitive).length) {
        encryptData = provider.buildEncryptData(sensitive, cfg.crypto.encryptMethod === 'SM4' ? cfg.keys.upEncCertId : cfg.keys.upEncCertId);
        built = adapter.buildRequest({ ...input, bizMethod: method }, encryptData);
        metrics.bump('encryptDataUsed');
      }
    }

    // 4) Canonical signing over EXACTLY the bytes that will be sent.
    const signed = provider.signRequest(built.rawBody, method, rid);
    const wire = await upstream.compress(built.rawBody);
    if (wire.encoding) metrics.bump('gzipCompressed');

    // 5) Outbound + response verification BEFORE business processing.
    let resp;
    try {
      resp = await upstream.send({ headers: signed.headers, rawBody: built.rawBody, timeoutMs: cfg.up.timeout.totalMs });
      metrics.bump('out');
    } catch (e) {
      metrics.bump('commFail');
      const failClosed = cfg.reliability.degrade === 'fail-closed';
      const res = { ok: false, kind: 'COMM_FAILURE', msg: e.message, traceId, reqId: rid,
        bizStatus: failClosed ? 'NOT_SALEABLE' : 'UNKNOWN', degrade: cfg.reliability.degrade };
      // §8.3 COMM_FAILURE result lands in the cache (fail-closed, NOT deleted, NOT auto-resent): overwrite the in-flight
      // claim with the terminal COMM_FAILURE so same-key replay is served from cache. release/putIfAbsent-as-delete is WRONG here.
      await stores.idem.put(key, res, cfg.reliability.idemTtlMs);
      await stores.audit.append({ kind: 'TXN', traceId, reqId: rid, direction: 'OUT', bizMethod: method,
        body: provider.sanitize(built.dto), result: 'COMM_FAILURE', center: 'failover-exhausted' });
      return res;
    }
    // Verify UnionPay's signature on the response.
    const hv = (name) => resp.headers[name] ?? resp.headers[name.toLowerCase()];
    const respCanon = 'version=' + (hv('version') || '') + '&appId=' + (hv('appId') || '')
      + '&bizMethod=' + (hv('bizMethod') || method) + '&reqId=' + (hv('reqId') || rid) + '&body=' + resp.rawBody;
    const vr = provider.verifyUp(respCanon, hv('sign'), { signId: hv('signId') });
    if (!vr.ok) {
      metrics.bump('verifyFail');
      const res = { ok: false, kind: 'SECURITY_REJECT', msg: 'response verify failed: ' + vr.reason, traceId };
      // §8.2 verification failure is NOT a business result -> RELEASE the idempotency key so a legitimate retry is allowed.
      // removeIfOwned (baseline=Sn26FlowService.java:92-93): only drop the key if the in-flight owner is OUR reqId, so we never
      // clobber a concurrent duplicate's claim. Do NOT cache SECURITY_REJECT as a terminal result.
      await stores.audit.append({ kind: 'SECURITY', traceId, reqId: rid, direction: 'IN', result: vr.reason });
      await stores.idem.release(key, rid);
      return res;
    }

    // 6) Three-layer response normalization.
    const norm = normalizeResponse(resp.httpStatus, { ...resp.headers, bizMethod: method }, resp.rawBody);
    if (norm.kind === 'UNMAPPED') metrics.bump('unmapped');
    if (norm.kind === 'SECURITY_REJECT') metrics.bump('securityReject');
    if (norm.kind === 'UP_UNAVAILABLE') metrics.bump('upUnavailable');
    if (norm.kind === 'UNKNOWN') metrics.bump('unknown');
    if (norm.ok) metrics.bump('ok');

    // 7) State machine + persistence.
    const cur = await stores.state.get(input.regionCd, input.snCode);
    let current = cur?.state || STATE.NEW;
    const applied = applyResponse(current, norm, method);
    await stores.state.upsert({ regionCd: input.regionCd, snCode: input.snCode, appId: cfg.identity.appId,
      orderId: input.orderId || cur?.orderId || '', state: applied.state, lastCode: norm.code, lastSubCode: norm.subCode,
      lastTraceId: traceId, updatedAt: new Date().toISOString() });
    if (['UNKNOWN', 'PENDING_RECON'].includes(applied.state)) await reconciler.markRecon();

    // 8) Audit (sanitized, NEVER the canonical string or plaintext sensitive values).
    await stores.audit.append({ kind: 'TXN', traceId, reqId: rid, direction: 'OUT', bizMethod: method,
      body: provider.sanitize(built.dto), result: norm.kind, code: norm.code, subCode: norm.subCode, center: resp.center });

    metrics.observe(Date.now() - t0);
    const res = { ok: norm.ok, kind: norm.kind, code: norm.code, msg: norm.msg, subCode: norm.subCode,
      subMsg: norm.subMsg, bizStatus: norm.bizStatus, state: applied.state, actionable: applied.actionable,
      traceId, reqId: rid, center: resp.center, raw: norm.raw };
    // §8.4 terminal overwrite: once the claim succeeded, write the FINAL result (replace the in-flight placeholder) so the
    // real outcome is cached, not a permanent first-result lock. UNKNOWN still occupies the key (no auto-resend per §8.5).
    await stores.idem.put(key, res, cfg.reliability.idemTtlMs);
    return res;
  }

  return { handle,
    query: (d, c) => handle(d, BIZ.query, c),
    occupancy: (d, c) => handle(d, BIZ.occupancy, c),
    release: (d, c) => handle(d, BIZ.release, c) };
}
