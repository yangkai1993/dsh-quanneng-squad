// src/transport/client.js — HTTP1.1 + TLS1.2+, per-center pools, timeouts, gzip, failover.
import http from 'node:http';
import https from 'node:https';
import { gzipSync, gunzipSync } from 'node:zlib';
import { TIMEOUT } from '../contract.js';

const MIN_TLS = 'TLSv1.2 method';

export function createUpstreamClient(cfg) {
  const up = cfg.up;
  const centers = up.centers.map(c => ({ ...c, url: new URL(c.url), errors: 0, total: 0, healthy: true }));
  const pools = new Map();
  const getAgent = (c) => {
    const key = c.name;
    if (pools.has(key)) return pools.get(key);
    const mod = c.url.protocol === 'https:' ? https : http;
    const Agent = mod.Agent;
    const agent = new Agent({ keepAlive: up.keepAlive.enabled, maxSockets: 32, maxFreeSockets: 8, timeout: up.timeout.readMs,
      ...(c.url.protocol === 'https:' ? { minVersion: 'TLSv1.2' } : {}) });
    pools.set(key, agent); return agent;
  };

  function compress(rawBody) {
    const buf = Buffer.from(rawBody, 'utf8');
    if (!up.gzip.enabled || buf.length < up.gzip.minBytes) return { body: buf, encoding: null };
    return { body: gzipSync(buf), encoding: 'gzip' };
  }

  async function sendOnce(c, req, ms) {
    const { body, encoding } = compress(req.rawBody);
    const headers = { ...req.headers,
      'Content-Type': 'application/json;charset=utf-8',
      'Content-Length': String(body.length),
      'Connection': up.keepAlive.enabled ? 'Keep-Alive' : 'close',
    };
    // Spec: Content-Encoding must NOT appear when uncompressed.
    if (encoding) headers['Content-Encoding'] = encoding; else delete headers['Content-Encoding'];
    const opts = { method: 'POST', hostname: c.url.hostname, port: c.url.port || (c.url.protocol === 'https:' ? 443 : 80),
      path: c.url.pathname + c.url.search, headers, agent: getAgent(c), timeout: ms };
    return await new Promise((resolve, reject) => {
      const mod = c.url.protocol === 'https:' ? https : http;
      const r = mod.request(opts, (res) => {
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
          let raw = Buffer.concat(chunks);
          if (String(res.headers['content-encoding'] || '').toLowerCase() === 'gzip') raw = gunzipSync(raw);
          resolve({ httpStatus: res.statusCode, headers: res.headers, rawBody: raw.toString('utf8') });
        });
      });
      r.on('timeout', () => r.destroy(new Error('UPSTREAM_TIMEOUT')));
      r.on('error', reject);
      r.end(body);
    });
  }

  async function send(req) {
    const budget = req.timeoutMs ?? up.timeout.totalMs;
    let lastErr;
    for (const c of centers) {
      if (!c.healthy && up.failover.enabled) continue;
      c.total++;
      try {
        const res = await sendOnce(c, req, budget);
        if (res.httpStatus >= 500) { c.errors++; throw new Error('UPSTREAM_5XX ' + res.httpStatus); }
        return { ...res, center: c.name };
      } catch (e) {
        lastErr = e; c.errors++;
        const rate = c.errors / c.total;
        if (rate > up.errorRateThreshold) c.healthy = false;
        if (!up.failover.enabled) throw e;
      }
    }
    throw lastErr || new Error('NO_HEALTHY_CENTER');
  }

  async function probe() {
    for (const c of centers) {
      try { await sendOnce(c, { headers: {}, rawBody: '{}', }, up.timeout.connectMs); c.healthy = true; }
      catch { c.healthy = false; }
    }
    return centers.filter(c => c.healthy).map(c => c.name);
  }
  async function healthyCenters() { return centers.filter(c => c.healthy).map(c => c.name); }
  const stats = () => centers.map(c => ({ name: c.name, healthy: c.healthy, errors: c.errors, total: c.total, rate: c.total ? c.errors / c.total : 0 }));
  function destroy() { for (const a of pools.values()) a.destroy(); pools.clear(); }
  return { send, probe, healthyCenters, stats, compress, destroy, centers };
}
