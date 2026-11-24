import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// roster 读写唯一入口（一期 1.15.0 · ARCH-LAYERS L1 缺口②）：
// export-roster.mjs 与 sync-seat-model.mjs 曾各自实现 snapshot 读写——本模块收编为唯一实现。
// 接口：read()/write(seats,team)/clearPins()。依据 SRP/DRY；P15 红线：任何写入路径不得出现模型字面量。

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SNAPSHOT_PATH = join(PKG_DIR, 'assets', 'roster-snapshot.json');

// 读：快照缺失/损坏 → null（调用方决定 fail-closed 或重建）。
export function read(ws) {
  const p = join(ws || PKG_DIR, 'assets', 'roster-snapshot.json');
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

// 新鲜度：takenAt 在 hours 小时内。
export function isFresh(snap, hours = 12) {
  if (!snap || !snap.takenAt) return false;
  const t = Date.parse(snap.takenAt);
  return Number.isFinite(t) && (Date.now() - t) / 3600000 < hours;
}

// 写：唯一写入口。seats=[{role,seat,model?,provider?}]；本模块不校验 model 内容（P15 由消费方门保证），只保证结构。
export function write(seats, team, { ws, source } = {}) {
  if (!Array.isArray(seats)) throw new Error('roster.write 须传 seats 数组');
  const snap = { takenAt: new Date().toISOString(), team: team || null, source: source || 'roster.mjs', seats };
  writeFileSync(join(ws || PKG_DIR, 'assets', 'roster-snapshot.json'), JSON.stringify(snap, null, 2) + '\n', 'utf8');
  return snap;
}

// clearPins：清空 squad 全部成员的 model pin（跟随宿主默认路由，P15）。
// 从 sync-seat-model.mjs 机械抽出；只动 pin，不写任何模型字面量。
export function clearPins({ ledgerPath, squadId } = {}) {
  const base = { gate: 'roster.clearPins', squadId: squadId || null };
  if (!ledgerPath || !existsSync(ledgerPath)) return { ...base, skipped: true, reason: 'ledger 不存在' };
  let led;
  try { led = JSON.parse(readFileSync(ledgerPath, 'utf8')); } catch (e) { return { ...base, skipped: true, reason: 'ledger 解析失败: ' + e.message }; }
  const squad = (led.teams || []).find(t => t.id === (squadId || t.id)) ;
  const target = squadId ? (led.teams || []).find(t => t.id === squadId) : squad;
  if (!target) return { ...base, skipped: true, reason: 'squad 未找到' };
  let cleared = 0, clean = 0;
  for (const member of target.members || []) {
    if (member.model === undefined) { clean++; continue; }
    delete member.model;
    cleared++;
  }
  if (cleared > 0) writeFileSync(ledgerPath, JSON.stringify(led, null, 2) + '\n', 'utf8');
  return { ...base, cleared, clean, members: (target.members || []).length };
}
