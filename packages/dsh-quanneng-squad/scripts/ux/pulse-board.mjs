import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { W } from '../lib/gate-kit.mjs';
import { spawnSync } from 'node:child_process';

// pulse:board 三态徽章（1.16.0 · B 依据 edict 心跳徽章）：🟢活跃 ≤24h / 🟡停滞 ≤72h / 🔴告警 >72h。
// 数据源=席位工位产物 mtime（FUNCTION-LEDGER 第一写域目录实扫）+ TEAM-PULSE 门状态。零手写状态。
const TH = { green: 24 * 3600000, yellow: 72 * 3600000 };

function badge(ageMs) {
  if (ageMs <= TH.green) return '🟢活跃';
  if (ageMs <= TH.yellow) return '🟡停滞';
  return '🔴告警';
}

// 席位→第一写域（FUNCTION-LEDGER 实读，同 dispatch-plan 逻辑）
function seatDomains() {
  const map = {};
  const p = join(W, 'docs/squad/FUNCTION-LEDGER.md');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split('\n')) {
    const c = l.split('|').map(s => s.trim());
    if (c.length > 4 && c[1] && c[1] !== '席位' && c[1] !== '---') {
      const m = c[3].match(/[\w./\-]+\//);
      map[c[1]] = m ? m[0] : null;
    }
  }
  return map;
}

export function pulseBoard() {
  const domains = seatDomains();
  const board = [];
  let reds = 0;
  for (const [seat, dom] of Object.entries(domains)) {
    if (!dom) { board.push({ seat, badge: '⚪无写域', age: null }); continue; }
    const dir = join(W, dom.replace(/\/$/, ''));
    let newest = 0;
    if (existsSync(dir)) {
      const walk = d => { for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p); else newest = Math.max(newest, statSync(p).mtimeMs);
      } };
      try { walk(dir); } catch {}
    }
    const age = newest ? Date.now() - newest : null;
    const b = age === null ? '⚪无产物' : badge(age);
    if (b === '🔴告警') reds++;
    board.push({ seat, domain: dom, newestAgeHours: age === null ? null : +(age / 3600000).toFixed(1), badge: b });
  }
  const summary = board.length + ' 席：' + board.filter(b => b.badge === '🟢活跃').length + '🟢 / ' + board.filter(b => b.badge === '🟡停滞').length + '🟡 / ' + reds + '🔴 / ' + board.filter(b => b.badge.startsWith('⚪')).length + '⚪';
  return { generatedAt: new Date().toISOString(), thresholds: TH, summary, board };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  console.log(JSON.stringify(pulseBoard(), null, 2));
}
