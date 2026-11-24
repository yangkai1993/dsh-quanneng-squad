import { readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { buildPatchText } from './lib/patch-sync.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { run as bundleAssertions } from './verify/assertions/bundle.mjs';
import { run as routingAssertions } from './verify/assertions/routing.mjs';
import { run as gatesAAssertions } from './verify/assertions/gates-a.mjs';
import { run as orchestrationAssertions } from './verify/assertions/orchestration.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// workspace 由文件位置推导（scripts/verify.mjs → package → packages → lab 根），不再硬编码绝对路径
const workspace = process.env.QUANNENG_WORKSPACE ?? join(root, '..', '..');
let pass = 0, fail = 0;
const t = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('assertion false'); console.log('  PASS ' + name); pass++; } catch (e) { console.log('  FAIL ' + name + ' — ' + e.message); fail++; } };
const pkg = () => JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const patch = () => readFileSync(join(root,'cordis.patch.yml'),'utf8');
const ctx = { t, root, readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, spawnSync, pathToFileURL, tmpdir, join, dirname, workspace, pkg, patch, buildPatchText };
// 第2期重构：96 条断言按域机械拆分为 4 模块（内容逐字保留），本文件只做 ctx 装配与汇总。
(async () => {
  await bundleAssertions(ctx);
  await routingAssertions(ctx);
  await gatesAAssertions(ctx);
  await orchestrationAssertions(ctx);
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) process.exit(1);
})();
