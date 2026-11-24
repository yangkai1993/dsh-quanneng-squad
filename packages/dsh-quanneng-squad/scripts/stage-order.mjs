import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { W, runGate, failFast } from './lib/gate-kit.mjs';
// 流水线顺序门：若后置阶段已发生而前置阶段无工件，即为越序（本轮实例：契约升 v1.1 并落码
// 却没有任何 G-S3 工件，说明 S3 门下封驳被整轮跳过）。默认阻断；豁免见 EXEMPTIONS.md 当前表。
const NAME = 'stage-order';
const VAR = 'QUANNENG_ALLOW_ORDER_GAP';


const anyMatch = (rel, patterns) => {
  for (const p of patterns) {
    const [dirName, re] = [join(W, p.d), p.re];
    if (!existsSync(dirName)) continue;
    const st = statSync(dirName);
    if (!st.isDirectory()) { if (re.test(p.d)) return true; continue; }
    const stack = [dirName];
    while (stack.length) {
      const cur = stack.pop();
      for (const e of readdirSync(cur, { withFileTypes: true })) {
        const f = join(cur, e.name);
        if (e.isDirectory()) { if (stack.length < 400) stack.push(f); continue; }
        if (e.name.startsWith('.')) continue;
        if (re.test(e.name)) return true;
      }
    }
  }
  return false;
};

const STAGES = [
  { id: 'S-1', title: '情报对标', tests: [{ d: 'docs/squad/intel', re: /\.md$/ }] },
  { id: 'S0', title: '需求澄清', tests: [{ d: 'docs/prd', re: /^(clarifications|PRD)-.*\.md$/ }] },
  { id: 'S1', title: '提示词与拆分', tests: [{ d: 'docs/squad/prompts', re: /[\w-]+-v\d+\.md$/ }, { d: 'docs/squad/pipeline', re: /decomposition.*\.md$/ }] },
  { id: 'S2', title: '架构契约', tests: [{ d: 'docs/arch', re: /\.md$/ }] },
  { id: 'S3', title: '门下封驳', tests: [{ d: 'docs/squad/gates', re: /^G-S3.*\.md$/ }] },
  { id: 'S4', title: '实现', tests: [{ d: 'src', re: /\.js$/ }, { d: 'gateway-java/src', re: /\.java$/ }] },
  { id: 'S5', title: '质量验证', tests: [{ d: 'docs/qa', re: /\.md$/ }, { d: 'tests', re: /\.test\.js$/ }] },
  { id: 'S6', title: '监察抽巡', tests: [{ d: 'docs/squad/audit', re: /\.md$/ }] },
  { id: 'S7', title: '发布交付', tests: [{ d: 'deploy', re: /\.md$/ }, { d: 'docs/squad/releases', re: /^release-.*\.md$/ }] },
  { id: 'S8', title: '记注度量', tests: [{ d: 'docs/squad/journal', re: /\.md$/ }, { d: 'docs/squad/metrics', re: /\.md$/ }] },
  { id: 'S9', title: '反馈优化', tests: [{ d: 'docs/squad', re: /^retro-.*\.md$/ }] },
];

const done = STAGES.map(s => ({ id: s.id, title: s.title, present: anyMatch(0, s.tests) }));
const violations = [];
done.forEach((d, i) => {
  if (!d.present) return;
  for (let k = 0; k < i; k++) {
    if (!done[k].present) violations.push(d.id + '（' + d.title + '）已发生，但前置 ' + done[k].id + '（' + done[k].title + '）无工件 = 越序');
  }
});

const exitCode = runGate({ name: NAME, varName: VAR, kind: '阶段越序', items: violations, W,
  report: { workspace: W, gate: NAME, stages: done, violations } });
failFast(exitCode);
