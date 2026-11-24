import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';
// D6：云端 Hindsight 长期不可达时，本地 DECISIONS.jsonl 必须是被书面承认的最终权威，
// 且 OUTBOX 积压不得无限静默增长。此门只监督/留痕，不假装能修云端。
const LIMIT = 100;
const decPath = join(W, 'docs/squad/memory/DECISIONS.jsonl');
const outPath = join(W, 'docs/squad/memory/OUTBOX.jsonl');
const declPath = join(W, 'docs/squad/memory/README.md');
const lines = p => existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter(Boolean) : [];
const decisions = lines(decPath).length;
const pending = lines(outPath).length;
const declaration = existsSync(declPath) ? readFileSync(declPath, 'utf8') : '';
const localAuthorityDeclared = /本地.*(最终)?权威|local-primary|权威真源/.test(declaration);
const problems = [];
if (!localAuthorityDeclared) problems.push('本地最终权威未书面声明（docs/squad/memory/README.md）');
// U17（TK-68-07）：顶格=已积压满，> 会让 100/100 不阻断。
if (pending >= LIMIT) problems.push('OUTBOX 积压 ' + pending + ' >= 上限 ' + LIMIT + '：须回放或书面降级');
const snap = { gate:'memory-sla', at:new Date().toISOString(), decisions, pendingReplay:pending,
  limit:LIMIT, localAuthorityDeclared, cloudState:'unreachable (probe: memory.mjs cloud)',
  policy: localAuthorityDeclared ? '本地 DECISIONS.jsonl 为最终权威；OUTBOX 待云端恢复回放' : '需补声明',
  problems, ok: problems.length === 0 };
// V-52-01 整改：默认阻断（与其余门一致），不再是「只监督不阻断」的制定者自留后门。
// 云端故障本身不阻断；只有「未声明本地权威」或「OUTBOX 超上限」才阻断。
const exitCode = runGate({ name:'memory-sla', varName:'QUANNENG_ALLOW_MEMORY_SLA',
  kind:'记忆层合规差距', items: problems, W, report: snap });
failFast(exitCode);
