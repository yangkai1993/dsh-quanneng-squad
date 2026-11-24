import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'tests');
const files = readdirSync(dir).filter(f => f.endsWith('.test.js')).sort().map(f => join('tests', f).split(String.fromCharCode(92)).join('/'));
const r = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
process.exit(r.status ?? 1);
