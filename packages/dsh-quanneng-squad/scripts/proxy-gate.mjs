import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';

// 代理签署行为门（R-02 修复）：文档断言只证明「规程在场」，本门证明「规程被遵守」。
// 真源=本地 dispatch 卡（面板易失不可靠）；检测「captain 代理执行/代签」是否带双留痕。
// 依据：PROXY-AUTHORITY 硬规矩 2/3 —— 代签 verdict 禁止、代理执行必须双留痕；
//       captain 独立复算是职责内复核（非代理），不触发本门。
const problems = [];
const dsp = join(W, 'docs/squad/dispatch');
// 触发词：真正的代理/代签（不含「独立复算」——那是合规复核）。
const TRIGGER = /captain\s*(代理执行|代为执行|代签)|由\s*captain\s*会话代理执行|captain\s*代理\s*签署/i;
// 留痕词：PROXY-AUTHORITY 规矩 3 的 ATTRIBUTION CORRECTION / PROXY DECLARATION。
const TRAIL = /ATTRIBUTION|PROXY\s*DECLARATION|双留痕|非席位本人签署/i;

if (!existsSync(dsp)) problems.push('dispatch 目录不存在，无法核查代理签署纪律');
else {
  for (const f of readdirSync(dsp).filter(x => x.endsWith('.md'))) {
    const s = readFileSync(join(dsp, f), 'utf8');
    // 逐段检查：代理声明与其留痕须在同一卡（append-only evidence_note 可在同卡任意段）。
    if (TRIGGER.test(s) && !TRAIL.test(s)) {
      problems.push('代理留痕缺失 ' + f.replace(/\.md$/, '') + '：卡内声明 captain 代理执行/代签但无 ATTRIBUTION CORRECTION（PROXY-AUTHORITY 规矩 3）');
    }
  }
}
const report = { workspace: W, gate: 'proxy-gate', problemCount: problems.length, problems,
  note: '只拦真代理/代签；captain 独立复算属职责内复核不触发。样本=0 时绿=真空绿，须由行为夹具补覆盖。' };
const exitCode = runGate({ name: 'proxy-gate', varName: 'QUANNENG_ALLOW_PROXY_GAP', kind: '代理签署留痕缺失',
  items: problems, W, report });
failFast(exitCode);
