import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';

// AGENTS.md 单源化（1.17.0 · A3 依据 wshobson Invariants「唯一上下文文件」）：
// AGENTS.md 是唯一手写源；CLAUDE.md（Claude Code 习惯文件名）由本脚本生成——
// 生成物带指纹头，手工改 CLAUDE.md 会被门红（防双源漂移）。
const AGENTS = join(W, 'AGENTS.md');
const CLAUDE = join(W, 'CLAUDE.md');
const MARK = '<!-- AUTO-GENERATED from AGENTS.md by scripts/build-agents-context.mjs — DO NOT HAND-EDIT -->';

export function buildAgentsContext() {
  if (!existsSync(AGENTS)) return { skipped: true, reason: 'AGENTS.md 不存在' };
  const src = readFileSync(AGENTS, 'utf8');
  const out = MARK + '\n\n' + src;
  const prev = existsSync(CLAUDE) ? readFileSync(CLAUDE, 'utf8') : null;
  writeFileSync(CLAUDE, out, 'utf8');
  return { written: true, bytes: out.length, changed: prev !== out, source: AGENTS };
}

// 门：CLAUDE.md 必须存在且以指纹头开头；正文必须与 AGENTS.md 一致。
export function checkAgentsContext() {
  const problems = [];
  if (!existsSync(CLAUDE)) problems.push('CLAUDE.md 缺失（跑 build-agents-context.mjs 生成）');
  else {
    const t = readFileSync(CLAUDE, 'utf8');
    if (!t.startsWith(MARK)) problems.push('CLAUDE.md 无生成指纹头（疑似手工新建）');
    const src = existsSync(AGENTS) ? readFileSync(AGENTS, 'utf8') : '';
    if (src && !t.endsWith(src) && !t.includes(src)) problems.push('CLAUDE.md 正文与 AGENTS.md 漂移（重新生成）');
  }
  const gate = runGate({ name: 'agents-context', varName: 'QUANNENG_ALLOW_AGENTS_CTX_GAP',
    kind: 'AGENTS 单源化缺口: ' + problems.join('；'), items: problems, W,
    report: { workspace: W, problems } });
  failFast(gate);
  return { exit: gate, problems };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  console.log(JSON.stringify(process.argv.includes('--check') ? checkAgentsContext() : buildAgentsContext(), null, 2));
}
