// src/observability/metrics.js — counters, gauges, threshold alerts.
export function createMetrics(cfg) {
  const n = { requests: 0, out: 0, ok: 0, commFail: 0, verifyFail: 0, idemHit: 0,
    unknown: 0, unmapped: 0, securityReject: 0, upUnavailable: 0, centerSwitch: 0,
    certExpiry: 0, storeForwardExhausted: 0, gzipCompressed: 0, encryptDataUsed: 0 };
  const latencies = [];
  const bump = (k, v = 1) => { n[k] = (n[k] || 0) + v; };
  function observe(ms) { latencies.push(ms); if (latencies.length > 500) latencies.shift(); }
  function snapshot() {
    const s = [...latencies].sort((a, b) => a - b);
    return { ...n, p50: s[Math.floor(s.length * .5)] ?? 0, p95: s[Math.floor(s.length * .95)] ?? 0,
      p99: s[Math.floor(s.length * .99)] ?? 0, samples: s.length };
  }
  function evaluate() {
    const out = [];
    if (n.verifyFail > 0) out.push({ level: 'P1', code: 'VERIFY_FAILED', count: n.verifyFail });
    if (n.unmapped > 0) out.push({ level: 'P2', code: 'UNMAPPED_CODE', count: n.unmapped });
    if (n.unknown > 0) out.push({ level: 'P1', code: 'UNKNOWN_STATE', count: n.unknown });
    if (n.upUnavailable > 0) out.push({ level: 'P1', code: 'UP_UNAVAILABLE', count: n.upUnavailable });
    if (n.centerSwitch > 0) out.push({ level: 'P2', code: 'CENTER_SWITCH', count: n.centerSwitch });
    return out;
  }
  return { bump, observe, snapshot, evaluate };
}
