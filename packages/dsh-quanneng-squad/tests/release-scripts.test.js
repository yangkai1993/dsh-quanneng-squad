// release 链自身的地基测试。
// 上一轮的教训：入口 barrel 没被任何测试 import，27/27 绿灯掩盖了它的语法损坏；
// memory / build-patch / audit-roster / install 同样是「只被调用、从不被验证」的构件。
// 本文件把这些脚本纳入被测面，包含破坏-重建验证（前提：build-patch 已实测字节幂等）。
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';

// 以文件位置为基准（run-tests.mjs 会把 cwd 设为包根，但直接 node --test 时未必）
const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const NODE = process.execPath;
const run = (args, opts = {}) => spawnSync(NODE, args, { encoding: 'utf8', timeout: 90000, cwd: PKG_DIR, ...opts });
const WS = join(PKG_DIR, '.tmp-meta');
const REAL_DB = join(PKG_DIR, '../../docs/squad/memory/DECISIONS.jsonl');
// 安装副本旁没有工作区台账：此时「不许碰真实台账」这条断言无对象可查，跳过而不是崩掉整个文件
const REAL_EXISTS = existsSync(REAL_DB);
const REAL_BEFORE = REAL_EXISTS ? readFileSync(REAL_DB, 'utf8') : '';
const iso = (name) => { const d = join(WS, name); mkdirSync(join(d, 'docs/squad/memory'), { recursive: true }); return d; };

before(() => { rmSync(WS, { recursive: true, force: true }); });
after(() => { rmSync(WS, { recursive: true, force: true }); });

describe('memory CLI contract (local-primary layer)', () => {
  // 全部在隔离工作区里断言「行为」，不依赖宿主上恰好存在的台账内容：
  // profile 副本没有 docs/squad/memory，拿环境内容当断言必然假失败。
  const inWs = (d, cmdArgs, extra = {}) => run(['scripts/memory.mjs', ...cmdArgs],
    { env: { ...process.env, QUANNENG_WORKSPACE: d, ...extra } });

  test('ingest then verify passes on a seeded ledger', () => {
    const d = iso('seed');
    for (let i = 0; i < 12; i++) inWs(d, ['ingest', 'S' + i, 'body ' + i]);
    const v = inWs(d, ['verify']);
    assert.equal(v.status, 0, v.stdout + v.stderr);
    const j = JSON.parse(v.stdout);
    assert.equal(j.ok, true);
    assert.equal(j.decisions, 12);
  });

  test('verify rejects rows missing required fields', () => {
    const d = iso('bad');
    writeFileSync(join(d, 'docs/squad/memory/DECISIONS.jsonl'),
      JSON.stringify({ id: 'B-1', date: '2026-11-11', topic: 'x', decision: 'y', status: 'settled' }) + '\n' +
      Array.from({ length: 11 }, (_, i) => JSON.stringify({ id: 'X' + i, date: '2026-11-11', topic: 't' + i, decision: 'v', evidence: 'e', status: 'settled' })).join('\n') + '\n', 'utf8');
    const r = inWs(d, ['verify']);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /missing/);
  });

  test('ingest dedupes identical topic+decision content', () => {
    const d = iso('dedupe');
    assert.match(inWs(d, ['ingest', 'T1', 'same body']).stdout, /ingested locally/);
    assert.match(inWs(d, ['ingest', 'T1', 'same body']).stdout, /rejected: duplicate content/);
    const rows = readFileSync(join(d, 'docs/squad/memory/DECISIONS.jsonl'), 'utf8').split('\n').filter(Boolean);
    assert.equal(rows.length, 1, 'dedupe must not grow the ledger');
  });

  test('search returns only matching rows', () => {
    const d = iso('search');
    inWs(d, ['ingest', '路由审计', '关于 qfmodel 的结论']);
    inWs(d, ['ingest', '无关主题', 'nothing here']);
    assert.equal(JSON.parse(inWs(d, ['search', '路由']).stdout).hits, 1);
    assert.equal(JSON.parse(inWs(d, ['search', 'zzz_nothing_zzz']).stdout).hits, 0);
  });

  test('replay --clear is explicit-only', () => {
    const d = iso('replay');
    inWs(d, ['ingest', 'R1', 'body']);
    const ob = join(d, 'docs/squad/memory/OUTBOX.jsonl');
    assert.ok(readFileSync(ob, 'utf8').includes('R1'));
    inWs(d, ['replay']);
    assert.ok(readFileSync(ob, 'utf8').includes('R1'), 'plain replay must keep the queue');
    inWs(d, ['replay', '--clear']);
    assert.equal(readFileSync(ob, 'utf8').trim(), '');
  });

  test('a missing workspace is reported, never silently shadow-created', () => {
    const ghost = join(WS, 'ghost-' + Math.random().toString(36).slice(2, 8));
    const r = inWs(ghost, ['verify']);
    assert.equal(r.status, 1);
    assert.match(r.stdout + r.stderr, /workspace not resolved|ledger missing/);
    assert.equal(existsSync(join(ghost, 'docs/squad/memory')), false, 'must not mkdir a phantom ledger');
  });

  test('status runs without a workspace and says so', () => {
    const r = run(['scripts/memory.mjs', 'status'], { env: { ...process.env, QUANNENG_WORKSPACE: join(WS, 'none-' + Date.now()) } });
    assert.equal(r.status, 0);
    const j = JSON.parse(r.stdout);
    assert.equal(j.backend, 'local-primary');
    assert.equal(j.ledgerPresent, false);
  });

  test('export renders a ledger only where one exists', () => {
    const d = iso('exp');
    for (let i = 0; i < 11; i++) inWs(d, ['ingest', 'E' + i, 'content ' + i]);
    const r = inWs(d, ['export']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const md = join(d, 'docs/squad/memory/DECISIONS.md');
    assert.ok(existsSync(md));
    const body = readFileSync(md, 'utf8');
    assert.match(body, /决策台账/);
    assert.match(body, /E10/);
    // 未显式指定时：解析不到台账就拒绝写，绝不凭空造影子台账。
    // 在沙箱里放一份脚本副本，让它的 root/candidates 全部落在沙箱内（真实台账不可触及）。
    const sandbox = join(WS, 'exp-none');
    mkdirSync(join(sandbox, 'scripts'), { recursive: true });
    mkdirSync(join(sandbox, 'docs/squad'), { recursive: true });
    copyFileSync(join(PKG_DIR, 'scripts/memory.mjs'), join(sandbox, 'scripts/memory.mjs'));
    const bad = spawnSync(process.execPath, [join(sandbox, 'scripts/memory.mjs'), 'export'],
      { cwd: sandbox, encoding: 'utf8', timeout: 60000, env: { ...process.env, QUANNENG_WORKSPACE: '' } });
    assert.equal(bad.status, 1, 'auto-resolution must refuse writes without a ledger');
    assert.match(bad.stderr + bad.stdout, /no writable memory ledger/);
    assert.equal(existsSync(join(sandbox, 'docs/squad/memory')), false, 'must not shadow-create a ledger');
    if (REAL_EXISTS) assert.equal(readFileSync(REAL_DB, 'utf8'), REAL_BEFORE, 'guard test must never touch the real ledger');
    // 已存在真实台账时 export 必须成功
    assert.match(r.stdout, /exported/);
  });
});

describe('build-patch is a real generator, not a validator', () => {
  const p = join(PKG_DIR, 'cordis.patch.yml');
  const first = readFileSync(p, 'utf8');

  test('restores a deliberately corrupted patch byte-identically', () => {
    try {
      writeFileSync(p, '# corrupted by test\n', 'utf8');
      const r = run(['scripts/build-patch.mjs']);
      assert.equal(r.status, 0, r.stdout + r.stderr);
      const back = readFileSync(p, 'utf8');
      assert.equal(back, first, 'generator must reproduce the canonical bytes');
      assert.match(back, /GENERATED FILE/);
      assert.match(back, /maxMembers: 16/);
      assert.equal((back.match(/^\s+- name: \S+/gm) || []).length, 16);
      assert.equal((back.match(/^\s*- id: preset-squad-\S+/gm) || []).length, 7);
    } finally {
      writeFileSync(p, first, 'utf8');
    }
  });

  test('generated patch embeds canonical sources verbatim', () => {
    const patch = readFileSync(p, 'utf8');
    for (const f of ['presets.yml', 'team-overrides.yml']) {
      const canon = readFileSync(join(PKG_DIR, 'assets/canonical', f), 'utf8').trimEnd();
      assert.ok(patch.includes(canon), f + ' not embedded — canonical is no longer the single source');
    }
  });

  test('export contract gate has nothing to complain about', () => {
    const r = run(['scripts/sync-lib.mjs']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.deepEqual(JSON.parse(r.stdout).errors, []);
  });
});

describe('audit-roster does not restrict any model (user rule: squad works with all models)', () => {
  const snap = join(PKG_DIR, 'assets/roster-snapshot.json');
  const orig = readFileSync(snap, 'utf8');

  test('any provider/model is accepted — no whitelist/blacklist/provider rejection', () => {
    const models = [
      { role: 'x', seat: 'x@v1', model: 'buddy/glm-5.3-flash', provider: 'buddy' },
      { role: 'y', seat: 'y@v1', model: 'any-provider/any-model', provider: 'any-provider' },
      { role: 'z', seat: 'z@v1', model: 'qodercn/qfmodel', provider: 'qodercn' },
    ];
    try {
      writeFileSync(snap, JSON.stringify({ takenAt: new Date().toISOString(), seats: models }), 'utf8');
      const r = run(['scripts/audit-roster.mjs'], { env: { ...process.env, QUANNENG_EXPECTED_MODEL: 'any-provider/any-model' } });
      assert.equal(r.status, 0, 'audit-roster must not block any model: ' + r.stdout + r.stderr);
      const j = JSON.parse(r.stdout);
      assert.equal(j.warnings.length, 0, 'no model-related warning allowed: ' + JSON.stringify(j.warnings));
    } finally {
      writeFileSync(snap, orig, 'utf8');
    }
  });

  test('real roster is accepted (all models allowed)', () => {
    const r = run(['scripts/audit-roster.mjs'], { env: { ...process.env, QUANNENG_EXPECTED_MODEL: 'any-provider/any-model' } });
    assert.equal(r.status, 0, 'real roster must pass: ' + r.stdout + r.stderr);
  });
});

describe('install keeps the profile copy trustworthy', () => {
  // profile 目录随 DSH GUI 重启可能变化；用可覆盖的环境变量 + 常见候选路径探测，找不到则跳过该组测试（而不是误判失败）。
const PR = process.env.QUANNENG_PROFILE_COPY || [
  join(homedir(), '.dsh/profiles/desktop/node_modules/dsh-quanneng-squad'),
  join(homedir(), '.dsh/profiles/node_modules/dsh-quanneng-squad'),
].find(p => existsSync(p)) || null;
  const walk = (d, base = d) => existsSync(d)
    ? readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory()
        ? walk(join(d, e.name), base)
        : [relative(base, join(d, e.name)).split(String.fromCharCode(92)).join('/')])
    : [];
  const hash = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 12);

  test('profile never holds stale or drifted files', { skip: !PR }, () => {
    assert.ok(existsSync(PR), 'profile copy missing: ' + PR);
    const r = run(['scripts/install.mjs']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const a = {}, b = {};
    for (const f of walk(PKG_DIR)) if (!/^(node_modules|\.tmp-meta)(\/|$)/.test(f)) a[f] = hash(join(PKG_DIR, f));
    for (const f of walk(PR)) if (!/^(node_modules|\.tmp-meta)(\/|$)/.test(f)) b[f] = hash(join(PR, f));
    const stale = Object.keys(b).filter(k => !(k in a));
    assert.deepEqual(stale, [], 'stale files at profile: ' + stale.join(','));
    for (const k of ['lib/index.js', 'scripts/sync-lib.mjs', 'scripts/run-tests.mjs', 'scripts/audit-roster.mjs', 'cordis.patch.yml', 'package.json', 'assets/roster-snapshot.json']) {
      assert.ok(k in b, 'required file absent at profile: ' + k);
      assert.equal(b[k], a[k], 'drift: ' + k);
    }
  });

  test('installed copy passes the export gate on its own', { skip: !PR }, () => {
    const r = spawnSync(NODE, ['scripts/sync-lib.mjs'], { cwd: PR, encoding: 'utf8', timeout: 90000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
});
