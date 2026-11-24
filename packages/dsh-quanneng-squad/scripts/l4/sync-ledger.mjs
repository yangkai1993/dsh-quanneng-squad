import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// 账本生成器：PIPELINE.md 的五态列由 assets/L4-STATE.json 渲染，状态列不再手改，
// 消除「文档写提案、机器已 rollout」这类叙述与事实分叉。
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = process.env.QUANNENG_WORKSPACE || join(root, '../../');
const stPath = join(root, 'assets/L4-STATE.json');
const ledger = join(W, 'docs/squad/pipeline/PIPELINE.md');
if (!existsSync(stPath)) {
  console.log(JSON.stringify({ error: 'L4-STATE.json 缺失：先跑 scripts/l4/run.mjs' }));
  process.exit(1);
}
const db = JSON.parse(readFileSync(stPath, 'utf8'));
const ORDER = ['proposal', 'regression', 'canary', 'rollout', 'codified'];
function mark(state, phase) {
  if (state === 'stable') return '熔断';
  const i = ORDER.indexOf(state), p = ORDER.indexOf(phase);
  if (i < 0) return '?';
  return i >= p ? '✓' : '·';
}
const header = '| 提案 | 层级 | 当前态 | 回归门 | 金丝雀 | 全量 | 固化 | 迭代计数 |';
const sep = '| --- | --- | --- | --- | --- | --- | --- | --- |';
const rows = Object.values(db.proposals).map(p =>
  '| ' + p.id + ' ' + p.theme + ' | ' + p.layer + ' | ' + p.state +
  ' | ' + mark(p.state, 'regression') + ' | ' + mark(p.state, 'canary') +
  ' | ' + mark(p.state, 'rollout') + ' | ' + mark(p.state, 'codified') +
  ' | green=' + p.greenIterations + ' stable=' + p.stableIterations +
  ' iter=' + (p.iterationsSeen || []).join('/') + ' |');
const body = [
  '# L4 五态管线账本',
  '> 本表由 packages/dsh-quanneng-squad/scripts/l4/sync-ledger.mjs 从 assets/L4-STATE.json 渲染，状态列勿手改。',
  '> 五态：proposal → regression → canary → rollout → codified；任一态 checklist 退化即熔断回 stable。',
  '> 固化需 stableIterations≥2（≥2 个不同 round-N 持续全绿）+ 目标文档 grep 命中条款；同一轮反复运行刷不出固化。',
  '> 宪法层提案一律拒绝（走 CR + 用户批准）。同主题连续 2 次熔断 → 冷却 2 迭代。',
  '', header, sep, ...rows, '',
  '生成时刻: ' + new Date().toISOString(),
].join('\n');
writeFileSync(ledger, body + '\n', 'utf8');
console.log(JSON.stringify({ rendered: rows.length, ledger: 'docs/squad/pipeline/PIPELINE.md' }, null, 2));
