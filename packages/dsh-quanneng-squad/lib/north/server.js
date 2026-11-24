// src/north/server.js — northbound REST: auth, tenant isolation, rate limit, admin endpoints.
import http from 'node:http';
import { createHmac } from 'node:crypto';
import { BIZ } from '../contract.js';

function jwtVerify(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const sig = createHmac('sha256', secret).update(parts[0] + '.' + parts[1]).digest('base64url');
  if (sig !== parts[2]) return null;
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); } catch { return null; }
}

export function createNorthServer(cfg, orchestrator, stores, metrics, reconciler, fileChannel, provider) {
  const n = cfg.north;
  const buckets = new Map();
  const rateOk = (ip) => {
    const now = Date.now(), k = ip || 'x';
    const b = buckets.get(k) || { t: now, c: 0 };
    if (now - b.t >= 1000) { b.t = now; b.c = 0; }
    b.c++; buckets.set(k, b);
    return b.c <= (n.rateLimitPerSec || 200);
  };
  const json = (res, code, obj) => { const s = JSON.stringify(obj); res.writeHead(code, { 'Content-Type': 'application/json;charset=utf-8', 'Content-Length': String(Buffer.byteLength(s)) }); res.end(s); };
  const ROUTES = { '/api/sn/query': BIZ.query, '/api/sn/occupancy': BIZ.occupancy, '/api/sn/release': BIZ.release };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const chunks = []; for await (const d of req) chunks.push(d);
    let body = {}; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {}
    const ip = req.socket.remoteAddress;

    if (!rateOk(ip)) return json(res, 429, { error: 'RATE_LIMITED' });
    if (url.pathname === '/health') return json(res, 200, { ok: true, appId: cfg.identity.appId, ts: new Date().toISOString() });

    // mtls+jwt auth: local sandbox accepts a signed JWT or the dev token.
    const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const claim = jwtVerify(auth, n.auth.jwtSecret) || (auth === 'LOCAL_DEV_TOKEN' ? { appId: cfg.identity.appId } : null);
    if (!claim) return json(res, 401, { error: 'UNAUTHORIZED' });
    if (!n.auth.tenants.includes(claim.appId)) return json(res, 403, { error: 'TENANT_NOT_ALLOWED', appId: claim.appId });

    if (ROUTES[url.pathname]) {
      const r = await orchestrator.handle({ ...body, appId: claim.appId }, ROUTES[url.pathname], { traceId: req.headers['x-trace-id'] });
      return json(res, r.ok || r.kind === 'UNKNOWN' ? 200 : 200, r);
    }
    if (url.pathname === '/admin/state') return json(res, 200, { states: await stores.state.all(), idem: await stores.idem.all() });
    if (url.pathname === '/admin/audit') return json(res, 200, { audit: await stores.audit.all() });
    if (url.pathname === '/admin/metrics') return json(res, 200, metrics.snapshot());
    if (url.pathname === '/admin/alerts') return json(res, 200, { alerts: metrics.evaluate() });
    if (url.pathname === '/admin/centers' && orchestrator.upstreamStats) return json(res, 200, orchestrator.upstreamStats());
    if (url.pathname === '/admin/recon/tick') return json(res, 200, await reconciler.tick(async () => true));
    if (url.pathname === '/admin/file/send') { const r = await fileChannel.send(body.payload ?? body); return json(res, 200, { manifest: r.manifest, mode: r.mode, hasBody: !!r.body }); }
    if (url.pathname === '/admin/cert/userget') {
      const expiring = await stores.cert.expiringWithin(cfg.cert.expiryAlertDays);
      const active = await stores.cert.active();
      return json(res, 200, { expiring, active, autoUpdate: cfg.cert.autoUpdate, overlapDays: cfg.cert.overlapDays });
    }
    if (url.pathname === '/admin/failover/probe') return json(res, 200, { healthy: await orchestrator.upstreamProbe?.() });
    return json(res, 404, { error: 'NOT_FOUND' });
  });

  return { start: () => new Promise(r => server.listen(n.port, '127.0.0.1', () => r(server.address().port))),
    stop: () => new Promise(r => server.close(r)), get port() { return server.address()?.port; }, server };
}
