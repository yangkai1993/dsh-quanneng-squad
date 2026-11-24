#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { deriveState, readEvents } from '../lib/round-events.mjs';
import { W } from '../lib/gate-kit.mjs';

// Web 看板（1.19.0 · S5-5 · 用户 2026-11-24 明示批准解封 OUT-OF-SCOPE #3）：
// 零依赖（node:http+静态单页）；数据=实测文件读数（TEAM-PULSE/SUPERVISION/事件日志/FUNCTION-LEDGER）；
// 只读服务：不写任何状态；端口仅本机回环（127.0.0.1），默认 127.0.0.1:18790（--port 可改）。
// 面板四块：门状态 / 令牌状态机 / 席位徽章 / 轮次事件流（对标 edict 军机处的 CLI 内轻量版）。
const PKGDIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // board 在 scripts/dashboard/ 下，退两层到包根
const PORT = Number(process.argv.find(a => a.startsWith('--port='))?.split('=')[1] || 18790);

function badge(ms) { return ms <= 24*3600000 ? '🟢' : ms <= 72*3600000 ? '🟡' : '🔴'; }

function seatBoard() {
  const p = join(W, 'docs/squad/FUNCTION-LEDGER.md');
  const rows = [];
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split('\n')) {
    const c = l.split('|').map(s => s.trim());
    if (c.length > 4 && c[1] && c[1] !== '席位' && c[1] !== '---') {
      const dom = (c[3].match(/[\w./\\-]+\//) || [''])[0];
      const dir = join(W, dom);
      let newest = 0;
      if (dom && existsSync(dir)) {
        const walk = d => { for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); if (e.isDirectory()) walk(f); else newest = Math.max(newest, statSync(f).mtimeMs); } };
        try { walk(dir); } catch {}
      }
      const age = newest ? Date.now() - newest : null;
      rows.push({ seat: c[1], domain: dom || '—', ageHours: age === null ? null : +(age/3600000).toFixed(1), badge: age === null ? '⚪' : badge(age) });
    }
  }
  return rows;
}

function tokenStates() {
  try {
    const states = deriveTokenStates();
    return [...states.entries()].map(([tok, s]) => ({ token: tok, seat: s.seat, state: s.state, last: s.history.at(-1)?.ts || null }));
  } catch { return []; }
}

function events() { try { return readEvents().slice(-40).reverse(); } catch { return []; } }

function gates() {
  try {
    const sv = JSON.parse(readFileSync(join(W, 'docs/squad/SUPERVISION.json'), 'utf8'));
    const g = sv.latestBatch?.gateResults || sv.gates || {};
    return Object.entries(g).map(([k, v]) => ({ gate: k, exit: typeof v === 'number' ? v : v?.exit }));
  } catch { return []; }
}

function pulseMeta() {
  const p = join(W, 'docs/squad/TEAM-PULSE.md');
  if (!existsSync(p)) return { exists: false };
  return { exists: true, mtime: statSync(p).mtime.toISOString(), head: readFileSync(p, 'utf8').split('\n').slice(0, 4).join(' ') };
}

function data() {
  return { generatedAt: new Date().toISOString(), version: JSON.parse(readFileSync(join(PKGDIR, 'package.json'), 'utf8')).version,
    round: deriveState(), gates: gates(), tokens: tokenStates(), seats: seatBoard(), events: events(), pulse: pulseMeta() };
}

const PAGE = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>全能编程小队 · 军机处</title>
<style>
body{font-family:system-ui,-apple-system,'Segoe UI';background:#0f1115;color:#d8d8d8;margin:0;padding:24px}
h1{font-size:20px} h2{font-size:15px;color:#8ab4f8;margin:22px 0 8px}
.card{background:#171a21;border:1px solid #2a2f3a;border-radius:10px;padding:14px;margin-bottom:10px}
table{width:100%;border-collapse:collapse;font-size:13px} td,th{padding:5px 9px;border-bottom:1px solid #2a2f3a;text-align:left}
.badge{font-size:15px} .ok{color:#6fbf73}.bad{color:#e06c75}.ev{font-size:12px;color:#9aa0a6;font-family:monospace}
#meta{color:#9aa0a6;font-size:12px;margin-bottom:14px}
</style></head><body>
<h1>🏛️ 全能编程小队 · 军机处（<span id="ver"></span>）</h1>
<div id="meta"></div>
<h2>门状态</h2><div class="card" id="gates"></div>
<h2>令牌状态机</h2><div class="card" id="tokens"></div>
<h2>席位徽章（工位产物 mtime）</h2><div class="card" id="seats"></div>
<h2>轮次事件流（最近 40）</h2><div class="card" id="events"></div>
<script>
async function refresh(){
  const d = await (await fetch('/api/data')).json();
  document.getElementById('ver').textContent='v'+d.version;
  document.getElementById('meta').textContent='生成 '+d.generatedAt+' ｜ 轮次 '+d.round.round+'（事件真源）｜ TEAM-PULSE '+(d.pulse.exists?('更新 '+d.pulse.mtime):'缺失');
  document.getElementById('gates').innerHTML='<table><tr><th>门</th><th>exit</th></tr>'+
    (d.gates.length?d.gates.map(g=>'<tr><td>'+g.gate+'</td><td class="'+(g.exit===0?'ok':'bad')+'">'+g.exit+'</td></tr>').join(''):'<tr><td colspan=2>SUPERVISION.json 无门数据</td></tr>')+'</table>';
  document.getElementById('tokens').innerHTML='<table><tr><th>令牌</th><th>席位</th><th>状态</th><th>最近事件</th></tr>'+
    (d.tokens.length?d.tokens.map(t=>'<tr><td>'+t.token+'</td><td>'+t.seat+'</td><td class="'+(t.state==='accepted'?'ok':(t.state==='rejected'?'bad':''))+'">'+t.state+'</td><td class="ev">'+(t.last||'—')+'</td></tr>').join(''):'<tr><td colspan=4>事件日志无令牌（诚实标注）</td></tr>')+'</table>';
  document.getElementById('seats').innerHTML='<table><tr><th>席位</th><th>徽章</th><th>写域</th><th>最新产物距小时</th></tr>'+
    d.seats.map(s=>'<tr><td>'+s.seat+'</td><td class="badge">'+s.badge+'</td><td class="ev">'+s.domain+'</td><td>'+(s.ageHours===null?'—':s.ageHours)+'</td></tr>').join('')+'</table>';
  document.getElementById('events').innerHTML=d.events.map(e=>'<div class="ev">#'+e.seq+' '+e.ts+' <b>'+e.type+'</b> '+JSON.stringify({from:e.from,to:e.to,token:e.token,reason:e.reason}).slice(1,-1)+'</div>').join('');
}
refresh(); setInterval(refresh, 15000);
</script></body></html>`;

createServer((req, res) => {
  if (req.url === '/api/data') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(data())); return; }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(PAGE);
}).listen(PORT, '127.0.0.1', () => console.log(JSON.stringify({ ok: true, url: 'http://127.0.0.1:' + PORT, note: '零依赖只读看板；数据源=实测文件；15s 自刷新；仅本机回环' })));
