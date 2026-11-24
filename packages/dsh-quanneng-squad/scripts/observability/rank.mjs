import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { W } from '../lib/gate-kit.mjs';
import { deriveTokenStates } from '../lib/round-events.mjs';

// obs:rank 席位活跃排行（1.16.0 · 对标 edict 官员总览 Token 排行）：
// 数据源双通道实测：①telemetry.jsonl 事件按 seat 计数 ②round-events 令牌状态按 seat 聚合。
// 零手写；无数据诚实标注 empty。
const TELEMETRY = () => join(W, 'docs/squad/observability/telemetry.jsonl');

export function rank() {
  // ① telemetry seat 计数 + usage 聚合（1.20.0 G3 计量激活）
  const counts = {};
  const usageAgg = {};
  let telEvents = 0, badLines = 0;
  if (existsSync(TELEMETRY())) {
    for (const l of readFileSync(TELEMETRY(), 'utf8').split('\n').filter(Boolean)) {
      let e; try { e = JSON.parse(l); } catch { badLines++; continue; }
      telEvents++;
      const seat = e.seat || 'unknown';
      counts[seat] = (counts[seat] || 0) + 1;
      if (e.usage && typeof e.usage === 'object') {
        const u = usageAgg[seat] = usageAgg[seat] || { events: 0, inputTokens: 0, outputTokens: 0, durationMs: 0 };
        u.events++; u.inputTokens += Number(e.usage.inputTokens) || 0;
        u.outputTokens += Number(e.usage.outputTokens) || 0;
        u.durationMs += Number(e.usage.durationMs) || 0;
      }
    }
  }
  // ② 事件日志 seat 聚合（令牌全生命周期事件）
  const tokenStats = {};
  try {
    const states = deriveTokenStates();
    for (const [tok, s] of states) {
      tokenStats[s.seat] = tokenStats[s.seat] || { tokens: 0, events: 0 };
      tokenStats[s.seat].tokens++;
      tokenStats[s.seat].events += s.history.length;
    }
  } catch {}
  const telRank = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([seat, n]) => ({
    seat, telemetryEvents: n, ...(usageAgg[seat] ? { usage: usageAgg[seat] } : {}) }));
  const tokRank = Object.entries(tokenStats).sort((a, b) => b[1].events - a[1].events)
    .map(([seat, v]) => ({ seat, tokens: v.tokens, lifecycleEvents: v.events }));
  return { generatedAt: new Date().toISOString(),
    telemetry: telEvents ? { events: telEvents, badLines, rank: telRank, usageTotal: Object.values(usageAgg).reduce((a, u) => ({ inputTokens: a.inputTokens + u.inputTokens, outputTokens: a.outputTokens + u.outputTokens, durationMs: a.durationMs + u.durationMs }), { inputTokens: 0, outputTokens: 0, durationMs: 0 }) } : { empty: true, note: 'telemetry.jsonl 无事件（record 未被调用过，诚实标注）' },
    tokens: tokRank.length ? { rank: tokRank } : { empty: true, note: '事件日志无 TOKEN_ISSUED（当前真源仅 ROUND_ADVANCE+DISCREPANCY）' } };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  console.log(JSON.stringify(rank(), null, 2));
}
