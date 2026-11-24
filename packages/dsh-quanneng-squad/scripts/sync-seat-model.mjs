// 席位跟随主模型（P15 终版实现）：**清空席位 model pin**，让席位永远跟随宿主默认路由。
// 根因复盘：v1.5.9 的实现把"切换时刻的主模型"pin 死到席位（members[].model = 主模型字面量），
// 用户之后再切主模型时旧 pin 仍在 → 席位继续走旧模型 = 又一次锁死（宿主 @linxin666/dsh-agents
// runMember 对有 pin 的席位调 gateway.selectModel 强制走 pin 路由）。
// 正确语义：无 pin = 跟随宿主当前模型（dsh-agents runMember L2592 parseModelPin 对空 pin 返回
// void0 → 不调 selectModel → 会话用宿主默认路由）。所以"跟随"的正确实现是清 pin，不是写 pin。
// 本脚本幂等：清掉所有残留 pin，主模型切换后席位自动跟随，永远无需再跑。
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { DSH_HOME } from './lib/config-adapter.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LEDGER = process.env.QUANNENG_DSH_LEDGER
  ?? join(DSH_HOME, 'dsh-agents', 'ledger.json');
import { SQUAD_ID } from './lib/squad-const.mjs';
export { SQUAD_ID };

// 清空 squad 全部成员的 model pin；返回结构化结果。只动 pin，不写任何模型字面量。
export function syncSeatModels() {
  const base = { gate: 'sync-seat-model', squadId: SQUAD_ID };
  if (!existsSync(LEDGER)) return { ...base, skipped: true, reason: 'squad ledger 不存在' };
  let led;
  try { led = JSON.parse(readFileSync(LEDGER, 'utf8')); } catch (e) { return { ...base, skipped: true, reason: 'ledger 解析失败: ' + e.message }; }
  const squad = (led.teams || []).find(t => t.id === SQUAD_ID);
  if (!squad) return { ...base, skipped: true, reason: 'squad 未找到' };

  let cleared = 0, clean = 0;
  for (const member of squad.members || []) {
    if (member.model === undefined) { clean++; continue; }
    delete member.model;               // 清 pin：席位跟随宿主默认路由（不写任何模型字面量）
    member.updatedAt = Date.now();
    cleared++;
  }
  let wrote = false;
  if (cleared > 0) {
    copyFileSync(LEDGER, LEDGER + '.bak-' + Date.now());
    led.revision = (led.revision || 0) + 1;
    writeFileSync(LEDGER, JSON.stringify(led, null, 2) + '\n', 'utf8');
    wrote = true;
  }
  return { ...base, seats: (squad.members || []).length, clearedPins: cleared, clean, wrote, ledger: LEDGER,
    policy: 'no-pin: 席位无 model pin，永远跟随宿主当前默认模型' };
}

// CLI：node scripts/sync-seat-model.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(JSON.stringify(syncSeatModels(), null, 2));
  process.exit(0);
}
