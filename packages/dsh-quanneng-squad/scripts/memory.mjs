// 本地记忆层 CLI —— 本地为主，云端（Hindsight）为辅助。
// 用法：memory.mjs <status|list|search|ingest|capture|replay|export|cloud|verify> [args]
//
// 工作区解析规则（两条，互不混淆）：
//   显式 QUANNENG_WORKSPACE = 权威目标，指向哪儿就读写哪儿（允许目录尚不存在时新建台账）；
//   未显式指定 = 只在「已存在台账」的候选目录里自动解析，绝不影子新建（否则会把发布物
//   assets/workspace 变成假台账，历史上正是这条路径污染过 profile 副本）。
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cmd = process.argv[2] ?? 'status';
const args = process.argv.slice(3);
const REQUIRED = ['id', 'date', 'topic', 'decision', 'evidence', 'status'];
const WRITE_CMDS = ['ingest', 'capture', 'replay', 'export'];

const hasLedger = (p) => Boolean(p) && existsSync(join(p, 'docs/squad/memory/DECISIONS.jsonl'));

const explicit = process.env.QUANNENG_WORKSPACE;
let workspace = null;
let explicitTarget = false;
if (explicit) {
  workspace = resolve(explicit);
  explicitTarget = true;
} else {
  workspace = [join(root, 'assets/workspace'), resolve(root, '../..'), process.cwd()].find(hasLedger) ?? null;
}

const mayWrite = explicitTarget || hasLedger(workspace);
if (!mayWrite && WRITE_CMDS.includes(cmd)) {
  console.error(JSON.stringify({
    error: 'no writable memory ledger in auto-resolved workspace',
    workspace, hint: '设置 QUANNENG_WORKSPACE 指向持有 docs/squad/memory/DECISIONS.jsonl 的工作区',
  }, null, 2));
  process.exit(1);
}

const dir = workspace ? join(workspace, 'docs/squad/memory') : null;
const db = dir ? join(dir, 'DECISIONS.jsonl') : null;
const outbox = dir ? join(dir, 'OUTBOX.jsonl') : null;

const parseRows = (txt) => txt.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const readDb = () => (db && existsSync(db)) ? parseRows(readFileSync(db, 'utf8')) : [];
const readOut = () => (outbox && existsSync(outbox)) ? parseRows(readFileSync(outbox, 'utf8')) : [];
const ensureDir = () => { if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true }); };

function status() {
  const d = readDb();
  console.log(JSON.stringify({
    backend: 'local-primary',
    cloud: 'auxiliary',
    cloudState: process.env.HINDSIGHT_CLOUD_OK === '1' ? 'reachable' : 'unreachable (probe: memory.mjs cloud)',
    workspace,
    ledgerPresent: hasLedger(workspace),
    decisions: d.length,
    pendingReplay: readOut().length,
    dbPath: db,
    outboxPath: outbox,
    note: '本地 DECISIONS.jsonl 为权威真源；云端恢复后用 replay 回放 OUTBOX。',
  }, null, 2));
}

function list() { for (const d of readDb()) console.log(d.id + ' | ' + d.topic + ' | ' + d.status + ' | ' + String(d.decision).slice(0, 70)); }

function search(q) {
  const s = String(q || '').toLowerCase();
  const hits = readDb().filter(d => JSON.stringify(d).toLowerCase().includes(s));
  console.log(JSON.stringify({ backend: 'local-primary', query: q, hits: hits.length, results: hits }, null, 2));
}

function validate(d, all) {
  const miss = REQUIRED.filter(k => !d[k]);
  if (miss.length) throw new Error('decision missing ' + miss.join(','));
  if (all.some(x => x.id === d.id)) throw new Error('duplicate id: ' + d.id);
  if (all.some(x => x.topic + '|' + x.decision === d.topic + '|' + d.decision)) throw new Error('duplicate content: ' + d.topic);
}

function ingest(title, content, meta) {
  ensureDir();
  const ts = new Date().toISOString();
  const id = 'L-' + ts.replace(/[^0-9]/g, '').slice(0, 14) + '-' + Math.random().toString(36).slice(2, 6);
  const d = { id, date: ts.slice(0, 10), topic: title, decision: String(content).slice(0, 400),
    evidence: 'docs/squad/memory/OUTBOX.jsonl', status: 'local-only' };
  try { validate(d, readDb()); } catch (e) { console.log('rejected: ' + e.message); return; }
  appendFileSync(db, JSON.stringify(d) + '\n');
  appendFileSync(outbox, JSON.stringify({ ts, kind: (meta && meta.kind) || 'document', title, content,
    source: 'local-primary', replayTo: (meta && meta.replayTo) || 'hindsight_ingest_document' }) + '\n');
  console.log('ingested locally (primary) + queued for cloud replay: ' + title + ' [' + id + ']');
}

function capture(title, summary) { ingest('initiative:' + title, summary, { kind: 'initiative', replayTo: 'hindsight_capture_initiative' }); }

function replay(clear) {
  const p = readOut();
  if (!p.length) { console.log(JSON.stringify({ pending: 0, cleared: false })); return; }
  if (clear === '--clear') {
    writeFileSync(outbox, '', 'utf8');
    console.log(JSON.stringify({ replayed: p.length, items: p.map(x => x.title), outboxCleared: true,
      instruction: '仅在逐条云端写入成功后使用 --clear' }, null, 2));
  } else {
    console.log(JSON.stringify({ pending: p.length, items: p.map(x => x.title),
      instruction: '逐条调用对应 Hindsight 工具，成功后 replay --clear' }, null, 2));
  }
}

function exportMd() {
  const d = readDb();
  const L = ['# 本地记忆 · 决策台账', '', '> 本地为主 / 云端辅助；由 memory.mjs export 生成。', '',
    '| ID | 日期 | 主题 | 决策 | 取代 | 证据 | 状态 |', '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const x of d) L.push('| ' + [x.id, x.date, x.topic, String(x.decision).replace(/\|/g, '/'),
    x.supersedes || '-', String(x.evidence).replace(/\|/g, '/'), x.status].join(' | ') + ' |');
  ensureDir();
  const dest = join(dir, 'DECISIONS.md');
  writeFileSync(dest, L.join('\n') + '\n', 'utf8');
  console.log('exported ' + d.length + ' decisions -> ' + dest);
}

async function cloud() {
  const url = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';
  try {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 6000);
    const r = await fetch(url, { method: 'HEAD', signal: c.signal });
    clearTimeout(timer);
    console.log(JSON.stringify({ role: 'auxiliary', reachable: true, httpStatus: r.status, note: '云端可用时 replay 回放；本地仍为权威' }, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ role: 'auxiliary', reachable: false, error: e.message, note: '云端不可达不影响本地记忆' }, null, 2));
  }
}

function verify() {
  const d = readDb();
  const problems = [];
  const seen = new Set();
  if (!workspace) problems.push('workspace not resolved');
  else if (!existsSync(db)) problems.push('ledger missing at ' + db);
  for (const x of d) {
    for (const k of REQUIRED) if (!x[k]) problems.push(x.id + ': missing ' + k);
    if (seen.has(x.id)) problems.push('duplicate ' + x.id);
    seen.add(x.id);
  }
  if (d.length < 10) problems.push('decision count ' + d.length + ' < 10');
  const ok = problems.length === 0;
  console.log(JSON.stringify({ backend: 'local-primary', ok, workspace, decisions: d.length, problems }, null, 2));
  if (!ok) process.exit(1);
}

const fn = { status, list, search, ingest, capture, replay, export: exportMd, cloud, verify }[cmd] ?? status;
await fn(...args);
