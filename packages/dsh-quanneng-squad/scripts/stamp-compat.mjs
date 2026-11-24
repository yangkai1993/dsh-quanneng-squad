import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// 用 package.json 的真值盖章 compatibility.json，消除「版本声明漂移但门禁只查文件存在」。
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const cPath = join(root, 'compatibility.json');
const c = JSON.parse(readFileSync(cPath, 'utf8'));
const before = JSON.stringify(c);
c.version = pkg.version;
c.bundleVersion = pkg.version;
if (Array.isArray(c.hostRanges) && c.hostRanges.length) {
  for (const r of c.hostRanges) if (r && r.pluginVersion) r.pluginVersion = pkg.version;
}
writeFileSync(cPath, JSON.stringify(c, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ stamped: pkg.version, changed: before !== JSON.stringify(c), keys: Object.keys(c) }, null, 2));
