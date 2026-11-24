import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { W } from './lib/gate-kit.mjs';
import { join, relative } from 'node:path';
// 全仓文件索引：drift-check 用它解析 file:line 引用。release 链每次重建，保证不因索引过期误报。

const PKG_DIR = join(W, 'packages/dsh-quanneng-squad');
const SKIP = new Set(['node_modules', 'target', '.git']);
const idx = [];
const walk = (d, base) => {
  if (!existsSync(d)) return;
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
    const f = join(d, e.name);
    if (e.isDirectory()) { if (idx.length < 5000) walk(f, base); }
    else idx.push(relative(base, f).split('\\').join('/'));
  }
};
walk(W, W);
walk(join(PKG_DIR, 'lib'), join(PKG_DIR, 'lib'));
walk(join(PKG_DIR, 'scripts'), join(PKG_DIR, 'scripts'));
const out = join(PKG_DIR, 'assets/file-index.json');
writeFileSync(out, JSON.stringify(idx), 'utf8');
console.log(JSON.stringify({ files: idx.length, written: out }, null, 2));
