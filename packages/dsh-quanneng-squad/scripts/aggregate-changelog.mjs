import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// B5 changeset 式 CHANGELOG（1.17.0 · 依据 mattpocock/skills changesets 工程）：
// 每期一个 CHANGELOG.d/<version>.md 片段；release 聚合进 CHANGELOG.md 顶部（幂等：已含该版本跳过）。
// 片段被聚合后保留（审计留痕），CHANGELOG.md 仍是发布真源。
const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(PKG, 'CHANGELOG.d');
const CL = join(PKG, 'CHANGELOG.md');

export function aggregate() {
  if (!existsSync(DIR)) return { aggregated: 0, note: '无 CHANGELOG.d' };
  let cl = readFileSync(CL, 'utf8');
  let n = 0;
  for (const f of readdirSync(DIR).filter(f => f.endsWith('.md')).sort()) {
    const ver = f.replace(/\.md$/, '');
    const seg = readFileSync(join(DIR, f), 'utf8');
    if (cl.includes('## [' + ver + ']')) continue; // 幂等
    cl = cl.replace('# Changelog\n\n', '# Changelog\n\n' + seg.trim() + '\n\n');
    n++;
  }
  if (n) writeFileSync(CL, cl, 'utf8');
  return { aggregated: n };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  console.log(JSON.stringify(aggregate(), null, 2));
}
