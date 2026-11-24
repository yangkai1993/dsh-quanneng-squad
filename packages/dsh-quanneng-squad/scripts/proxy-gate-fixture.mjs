import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

// 代理签署门行为夹具：证明门不是「零样本假绿」。
const checks = [];
const ck = (n, ok, extra) => checks.push({ check: n, ok: !!ok, extra: String(extra || '').slice(0, 120) });
const HERE = dirname(fileURLToPath(import.meta.url));
const PKGDIR = join(HERE, '..');
const NODE = process.env.QUANNENG_NODE || 'node';
const tmp = mkdtempSync(join(tmpdir(), 'proxy-fixture-'));
mkdirSync(join(tmp, 'docs/squad/dispatch'), { recursive: true });
const card = join(tmp, 'docs/squad/dispatch/测试席.md');
const run = () => spawnSync(NODE, ['scripts/proxy-gate.mjs'], { cwd: PKGDIR, encoding: 'utf8', timeout: 60000,
  env: { ...process.env, QUANNENG_WORKSPACE: tmp } });
const rep = r => { try { return JSON.parse((r.stdout || '').trim()); } catch { return null; } };

try {
  // 1) 合规：独立复算不触发门（captain 职责内复核）。
  writeFileSync(card, '| 状态 | 已闭合（席位自签，captain 独立复算） |\n');
  let r = run();
  ck('独立复算不触发代理门', r.status === 0, 'exit=' + r.status);

  // 2) 违规：声明 captain 代理执行但无留痕 → 门必须红。
  writeFileSync(card, '| 状态 | 由 captain 会话代理执行并签署 |\n');
  r = run();
  ck('代理执行无留痕被拦（核心行为）', r.status === 1 && (rep(r)?.problems || []).some(p => p.includes('测试席')), 'exit=' + r.status);

  // 3) 合规：带 ATTRIBUTION CORRECTION 留痕 → 门绿。
  writeFileSync(card, '| 状态 | 由 captain 会话代理执行并签署 |\n| evidence_note | ATTRIBUTION CORRECTION: 代理执行双留痕 |\n');
  r = run();
  ck('带双留痕放行', r.status === 0, 'exit=' + r.status);

  // 4) 违规：代签 verdict 无留痕 → 门红。
  writeFileSync(card, 'verdict=pass 由 captain 代签\n');
  r = run();
  ck('代签 verdict 无留痕被拦', r.status === 1, 'exit=' + r.status);
} finally { rmSync(tmp, { recursive: true, force: true }); }

const passed = checks.filter(c => c.ok).length, failed = checks.length - passed;
console.log(JSON.stringify({ fixture: 'proxy-gate', checks, passed, failed, ok: failed === 0 }, null, 2));
if (failed) process.exit(1);
