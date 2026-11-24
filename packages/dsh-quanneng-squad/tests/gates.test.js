import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// 门层黄金路径单测（1.20.0 · G8，对标 nanochat 每组件一测）：
// 隔离工作区（QUANNENG_WORKSPACE 预注入 env——gate-kit 的 W 模块加载期固化，须 spawnSync env 传入）。
const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const NODE = process.execPath;

function makeWs(files) {
  const ws = mkdtempSync(join(tmpdir(), 'gates-test-'));
  mkdirSync(join(ws, 'docs/squad/dispatch'), { recursive: true });
  mkdirSync(join(ws, 'docs/squad/events'), { recursive: true });
  mkdirSync(join(ws, 'docs/squad/briefs'), { recursive: true });
  for (const [rel, body] of Object.entries(files)) writeFileSync(join(ws, rel), body, 'utf8');
  return ws;
}
const card = (seat, tok, round = 72, extra = '') =>
  '## 第 ' + round + ' 轮 · ' + tok + '\n| 要素 | 值 |\n| --- | --- |\n| 令牌 | ' + tok + ' |\n| 状态 | 在途 |\n| 写域 | docs/qa/' + seat + '/ |\n' + extra;

describe('gate: state-machine-gate（令牌状态机黄金路径）', () => {
  test('合法链 planned→dispatched→reported→accepted 全绿', async () => {
    const ws = makeWs({});
    const ev = [
      { seq: 1, ts: '2026-01-01T00:00:00Z', type: 'ROUND_ADVANCE', from: 0, to: 72, reason: 't' },
      { seq: 2, ts: '2026-01-01T00:00:01Z', type: 'TOKEN_ISSUED', round: 72, w: 'W3', seat: '后端经理', token: 'TK-72-901', path: 'd' },
      { seq: 3, ts: '2026-01-01T00:00:02Z', type: 'DISPATCH', token: 'TK-72-901' },
      { seq: 4, ts: '2026-01-01T00:00:03Z', type: 'REPORT', token: 'TK-72-901' },
      { seq: 5, ts: '2026-01-01T00:00:04Z', type: 'ACCEPT', token: 'TK-72-901' },
    ];
    writeFileSync(join(ws, 'docs/squad/events/round-events.jsonl'), ev.map(e => JSON.stringify(e)).join('\n') + '\n');
    const r = spawnSync(NODE, [join(PKG, 'scripts/state-machine-gate.mjs')], { env: { ...process.env, QUANNENG_WORKSPACE: ws }, encoding: 'utf8', timeout: 60000 });
    assert.equal(r.status, 0);
    rmSync(ws, { recursive: true, force: true });
  });
  test('非法跳转 planned→ACCEPT 被拦（T2）exit1', async () => {
    const ws = makeWs({});
    const ev = [
      { seq: 1, ts: '2026-01-01T00:00:00Z', type: 'ROUND_ADVANCE', from: 0, to: 72, reason: 't' },
      { seq: 2, ts: '2026-01-01T00:00:01Z', type: 'TOKEN_ISSUED', round: 72, w: 'W3', seat: '后端经理', token: 'TK-72-902', path: 'd' },
      { seq: 3, ts: '2026-01-01T00:00:02Z', type: 'ACCEPT', token: 'TK-72-902' },
    ];
    writeFileSync(join(ws, 'docs/squad/events/round-events.jsonl'), ev.map(e => JSON.stringify(e)).join('\n') + '\n');
    const r = spawnSync(NODE, [join(PKG, 'scripts/state-machine-gate.mjs')], { env: { ...process.env, QUANNENG_WORKSPACE: ws }, encoding: 'utf8', timeout: 60000 });
    assert.equal(r.status, 1);
    rmSync(ws, { recursive: true, force: true });
  });
  test('损坏行 fail-closed exit1', async () => {
    const ws = makeWs({});
    writeFileSync(join(ws, 'docs/squad/events/round-events.jsonl'), '{"seq":1,"type":"ROUND_ADVANCE"}\nbroken-line\n');
    const r = spawnSync(NODE, [join(PKG, 'scripts/state-machine-gate.mjs')], { env: { ...process.env, QUANNENG_WORKSPACE: ws }, encoding: 'utf8', timeout: 60000 });
    assert.equal(r.status, 1);
    rmSync(ws, { recursive: true, force: true });
  });
});

describe('gate: dispatch-guard（protected_paths 黄金路径）', () => {
  test('写域触碰他卡 protected_paths 被拦 exit1', async () => {
    const ws = makeWs({
      'docs/squad/briefs/round-71.md': '第 71 轮简报',
      'docs/squad/dispatch/测试经理.md': card('测试经理', 'TK-72-903', 72, '| protected_paths | tests/regression.spec.js |\n'),
      'docs/squad/dispatch/后端经理.md': '## 第 72 轮 · TK-72-904\n| 要素 | 值 |\n| --- | --- |\n| 令牌 | TK-72-904 |\n| 状态 | 在途 |\n| 写域 | tests/, src/ |\n',
    });
    const r = spawnSync(NODE, [join(PKG, 'scripts/dispatch-guard.mjs')], { env: { ...process.env, QUANNENG_WORKSPACE: ws }, encoding: 'utf8', timeout: 60000 });
    assert.equal(r.status, 1);
    rmSync(ws, { recursive: true, force: true });
  });
  test('无重叠写域全绿 exit0', async () => {
    const ws = makeWs({
      'docs/squad/briefs/round-71.md': '第 71 轮简报',
      'docs/squad/dispatch/后端经理.md': card('后端经理', 'TK-72-905', 72),
      'docs/squad/dispatch/测试经理.md': '## 第 72 轮 · TK-72-906\n| 要素 | 值 |\n| --- | --- |\n| 令牌 | TK-72-906 |\n| 状态 | 在途 |\n| 写域 | docs/qa/测试经理/ |\n',
    });
    const r = spawnSync(NODE, [join(PKG, 'scripts/dispatch-guard.mjs')], { env: { ...process.env, QUANNENG_WORKSPACE: ws }, encoding: 'utf8', timeout: 60000 });
    assert.equal(r.status, 0);
    rmSync(ws, { recursive: true, force: true });
  });
});

describe('gate: event-store（唯一写入口+读模型）', () => {
  test('appendEvent seq 递增+deriveTokenStates 流转', async () => {
    const { appendEvent, deriveTokenStates } = await import('../scripts/lib/event-store.mjs');
    const { mkdtempSync: mt, mkdirSync: md } = await import('node:fs');
    const ws = mt(join(tmpdir(), 'evstore-unit-'));
    md(join(ws, 'docs/squad/events'), { recursive: true });
    const e1 = appendEvent('TOKEN_ISSUED', { round: 72, w: 'W3', seat: '前端', token: 'TK-72-999', path: 'd' }, { ws });
    const e2 = appendEvent('DISPATCH', { token: 'TK-72-999' }, { ws });
    assert.equal(e2.seq, e1.seq + 1);
    const st = deriveTokenStates(ws).get('TK-72-999');
    assert.equal(st.state, 'dispatched');
    rmSync(ws, { recursive: true, force: true });
  });
});
