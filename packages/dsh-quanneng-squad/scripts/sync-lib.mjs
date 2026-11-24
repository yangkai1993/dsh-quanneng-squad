// 导出契约门 + （可用时）src→lib 同步。
// 设计约束：无论是否存在工作区 src/，lib/ 的「导入-导出契约」都必须被完整校验；
// 早期版本在 src 缺失时直接 skipped/exit 0，导致安装到 profile 的副本形同无校验。
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { posix } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = join(root, 'lib');
const toPosix = (p) => p.split(String.fromCharCode(92)).join('/');

const SRC_CANDIDATES = [
  process.env.QUANNENG_SRC,
  process.env.QUANNENG_WORKSPACE ? join(process.env.QUANNENG_WORKSPACE, 'src') : null,
  join(root, '../../src'),
].filter(Boolean);
const SRC = SRC_CANDIDATES.find(p => existsSync(join(p, 'contract.js'))) ?? null;

const walk = (d, base = d) => existsSync(d)
  ? readdirSync(d, { withFileTypes: true }).flatMap(e => e.name.startsWith('.') ? []
      : e.isDirectory() ? walk(join(d, e.name), base) : [toPosix(relative(base, join(d, e.name)))])
  : [];

const exportsOf = (src) => {
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g))
    for (const part of m[1].split(',')) { const t = part.trim().split(/\s+as\s+/).pop().trim(); if (t) names.add(t); }
  if (/export\s+default/.test(src)) names.add('default');
  return names;
};

const errors = [];
let refreshed = [], removedStale = [];

// ── 1) 可选：从工作区 src/ 同步进 lib/（保持发布物与工作区一致）──
if (SRC) {
  const files = walk(SRC);
  const keep = new Set(files);
  for (const f of files) {
    const body = readFileSync(join(SRC, ...f.split('/')), 'utf8');
    const dst = join(LIB, ...f.split('/'));
    mkdirSync(dirname(dst), { recursive: true });
    if (!existsSync(dst) || readFileSync(dst, 'utf8') !== body) { writeFileSync(dst, body, 'utf8'); refreshed.push(f); }
  }
  // 文档/清单等非 JS 资产不参与 src→lib 同步，豁免 stale 清理（如 lib/README.md 定位说明）。
  removedStale = walk(LIB).filter(f => !keep.has(f) && f !== 'index.js' && !/\.(md|json)$/.test(f));
  for (const f of removedStale) rmSync(join(LIB, ...f.split('/')));
}

// ── 2) 永远执行：lib/ 的导入-导出契约校验 ──
const all = walk(LIB);
const cache = new Map();
const exOf = (r) => { if (!cache.has(r)) cache.set(r, exportsOf(readFileSync(join(LIB, ...r.split('/')), 'utf8'))); return cache.get(r); };
if (!all.length) errors.push('lib/ 为空：插件没有可发布的运行时入口');

for (const f of all) {
  const src = readFileSync(join(LIB, ...f.split('/')), 'utf8');

  // 2a) 语法可解析性由 node --check 负责；这里查语义契约
  const seen = new Map();
  const note = (n) => { if (n && n !== 'default') seen.set(n, (seen.get(n) || 0) + 1); };
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) note(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) note(part.trim().split(/\s+as\s+/).pop().trim());
  for (const [n, count] of seen) if (count > 1) errors.push(f + ': duplicate export ' + n);

  // 2b) import/export {} from './x.js' —— 目标存在 + 每个具名都必须真实导出
  for (const m of src.matchAll(/(?:import|export)\s*(?:[^;]*?\s)?\{([^}]*)\}\s*from\s*['"](\.[^'"]+\.js)['"]/g)) {
    // 相对「引用方文件所在目录」解析，并折叠 ../ 与 ./ 段
    const dir = posix.dirname(f);
    const target = posix.normalize(dir === '.' ? m[2] : posix.join(dir, m[2]));
    if (!existsSync(join(LIB, ...target.split('/')))) { errors.push(f + ': import target missing ./' + target); continue; }
    const avail = exOf(target);
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name && !avail.has(name)) errors.push(f + ': no export "' + name + '" in ./' + target);
    }
  }
}

// ── 3) 入口 barrel 必须可被解析（历史上损坏过且无测试覆盖）──
const barrel = join(LIB, 'index.js');
if (!existsSync(barrel)) errors.push('lib/index.js 缺失：插件没有入口');

console.log(JSON.stringify({
  src: SRC ? toPosix(relative(root, SRC)) : null,
  srcSynced: Boolean(SRC),
  libFiles: all.length, refreshed, removedStale, errors,
}, null, 2));
if (errors.length) process.exit(1);
