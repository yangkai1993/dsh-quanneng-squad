// 名册快照导出器。宿主 API 只在指挥会话里可用，因此这里接受显式 JSON 输入：
//   node scripts/export-roster.mjs --from-file roster.json      （从 agent_teams_status 落盘的结果）
//   node scripts/export-roster.mjs --seats '需求经理=qfmodel,...' （手工紧凑清单）
// 若 assets/roster-snapshot.json 已新鲜（<24h）则直接通过，不覆盖。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { read as rosterRead, isFresh as rosterFresh, write as rosterWrite } from './lib/roster.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const snap = join(root, 'assets/roster-snapshot.json');
// 一期 1.15.0：snapshot 读写已收编 lib/roster.mjs（本文件保留 CLI 形态与新鲜度 fail-closed）
const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

const fresh = () => {
  if (!existsSync(snap)) return false;
  try { const j = JSON.parse(readFileSync(snap, 'utf8')); return (Date.now() - Date.parse(j.takenAt || '')) / 3600000 < 12; } catch { return false; }
};
const write = (seats, team) => {
  writeFileSync(snap, JSON.stringify({ takenAt: new Date().toISOString(), team, source: 'export-roster', seats }, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ written: seats.length, team }, null, 2));
};

const fromFile = argOf('--from-file');
const inline = argOf('--seats');
if (fromFile) {
  const j = JSON.parse(readFileSync(fromFile, 'utf8'));
  const members = j.members || j.seats || [];
  write(members.map(m => ({ role: String(m.name || m.role).split('@')[0], seat: m.name || m.seat, model: m.model, provider: m.provider })), j.team_id || j.team || null);
} else if (inline) {
  write(inline.split(',').map(s => { const [seat, model] = s.split('='); return { role: seat.split('@')[0], seat, model }; }), 'quanneng-squad');
} else if (fresh()) {
  console.log(JSON.stringify({ skipped: 'snapshot already fresh (<12h)', takenAt: JSON.parse(readFileSync(snap, 'utf8')).takenAt }, null, 2));
} else {
  console.error('名册快照已过期（>12h）且无实时输入：fail-closed。请用 agent_teams_status 落盘 JSON 后 --from-file 重建，禁止凭旧快照放行（G-REFLOW P2）。');
  process.exit(1);
}
