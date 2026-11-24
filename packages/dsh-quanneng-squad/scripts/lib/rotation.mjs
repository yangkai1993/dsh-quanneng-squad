import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { deriveState } from './round-events.mjs';

// 轮转绑定唯一真源（Event Sourcing）：轮次=不可变事件日志派生的读模型，叙述文档 STATE.md 不再驱动。
// 依据：第一性原理——轮次是派活循环的事实，不是文字声明；Fowler Event Sourcing / Azure CQRS 读写分离。
// 名册真源=ROSTER-16.md §七 W1~W4；W 绑定=(round-1)%4。
export function currentRotation(W) {
  const ds = deriveState(W);
  const round = ds.round;
  const rp = join(W, 'docs/squad/ROSTER-16.md');
  const rows = existsSync(rp)
    ? [...readFileSync(rp, 'utf8').matchAll(/^\|\s*(W\d)\s*\|[^|]*\|\s*([^|]+)\s*\|/gm)]
        .map(x => ({ round: x[1], stage: '', seats: x[2].split(/[、,，]/).map(s => s.trim()).filter(Boolean) }))
    : [];
  const idx = round > 0 ? (((round - 1) % 4) + 4) % 4 : 0;
  const result = { round, roundLabel: String(round), rows, current: rows[idx] || null, wIdx: idx,
    basis: 'round-events.jsonl (immutable) + ROSTER §七',
    note: '轮次真源=事件日志；STATE.md 文字不参与。round=0 表示未初始化，调用方须 fail-closed。' };
  if (round === 0) result.error = '轮次真源未初始化（无 ROUND_ADVANCE 事件）';
  return result;
}
