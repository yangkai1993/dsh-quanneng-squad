import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = process.env.QUANNENG_WORKSPACE ?? 'E:/workspace/dsh-squad-lab';
const dest = join(root, 'assets/workspace');
const manifest = JSON.parse(readFileSync(join(root,'assets/MANIFEST.json'),'utf8'));
let n = 0; const missing = [];
const copy = (rel) => {
  const src = join(workspace, rel), dst = join(dest, rel);
  if (!existsSync(src)) { missing.push(rel); return; }
  mkdirSync(dirname(dst), { recursive: true }); copyFileSync(src, dst); n++;
};
for (const f of manifest.docs) copy(f);
const walk = (rel) => {
  for (const e of readdirSync(join(workspace, rel), { withFileTypes: true })) {
    const r = join(rel, e.name);
    if (e.isDirectory()) walk(r); else copy(r);
  }
};
for (const d of manifest.dirs) if (existsSync(join(workspace, d))) walk(d); else missing.push(d);
console.log(JSON.stringify({ synced: n, missing, workspace, dest }, null, 2));
if (missing.length) process.exit(1);
