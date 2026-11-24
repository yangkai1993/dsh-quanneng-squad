import { initialRecord, advance, fuse, canAdvance, recordGreenIteration } from './engine.mjs';
import { l4Id, patternId, bodyAnchor, loadProposals } from './proposals.mjs';
// 回归门玩具夹具（纯内存，不触真实账本、不依赖真实项目绿）：验证五态语义、防刷、熔断、冷却、宪法拒绝。
const checks = [];
const ck = (n, ok, extra) => checks.push({ check: n, ok: !!ok, extra: extra === undefined ? '' : String(extra) });
const baseFacts = () => ({ toyFixturePassed: true, baselineCaptured: true, canarySlotWritten: true, scopeDeclared: true,
  noFuseInCanary: true, projectGreenNow: true, bodyWritten: true });

// 1) 逐态推进 + 迭代去重（防「同轮刷到 codified」）
let r = initialRecord('P-TOY', 'process', 'toy');
const seq = ['regression', 'canary', 'rollout', 'codified'];
for (const to of seq) {
  const f = baseFacts();
  if (to === 'codified') recordGreenIteration(r, 'round-3'); // rollout 期第二个新迭代
  const x = advance(r, to, f, ['toy:' + to]);
  r = x.rec;
  ck('advance→' + to, !x.error, x.error);
  // 进入新状态后再记录迭代（真实项目里等价于「下一个基线再跑一次」）
  if (to === 'canary') recordGreenIteration(r, 'round-1');
  if (to === 'rollout') { recordGreenIteration(r, 'round-2'); recordGreenIteration(r, 'round-2'); }
}
ck('final=codified', r.state === 'codified', r.state);
ck('stableIterations 只算两个不同迭代', r.stableIterations === 2, r.stableIterations);
ck('history=4', r.history.length === 4, r.history.length);

// 2) 同轮重复运行不得刷状态：只有一个迭代戳 → codified 被拒
let r2 = initialRecord('P-FARM', 'process', 'toy');
r2 = advance(r2, 'regression', baseFacts(), []).rec;
r2 = advance(r2, 'canary', baseFacts(), []).rec;
recordGreenIteration(r2, 'round-9');
r2 = advance(r2, 'rollout', baseFacts(), []).rec;
recordGreenIteration(r2, 'round-9');
const farm = canAdvance(r2, 'codified', { ...baseFacts(), stableIterations: r2.stableIterations });
ck('同轮刷 codified 被拒', !farm.ok, farm.reason);

// 3) 跳态拒绝
let r3 = initialRecord('P-SKIP', 'process', 'toy');
ck('跳态拒绝', !canAdvance(r3, 'rollout', baseFacts()).ok, canAdvance(r3, 'rollout', baseFacts()).reason);

// 4) 缺项拒绝（toyFixture 未跑 / baseline 缺失）
ck('缺 toyFixture 拒绝', !canAdvance(r3, 'regression', { baselineCaptured: true }).ok);
ck('缺 baseline 拒绝', !canAdvance(r3, 'regression', { toyFixturePassed: true }).ok);

// 5) 宪法层一律拒绝
let r5 = initialRecord('P-CONST', 'constitution', 'toy');
ck('宪法层拒绝', !canAdvance(r5, 'regression', baseFacts()).ok, canAdvance(r5, 'regression', baseFacts()).reason);

// 6) 熔断回 stable + 连续两次→冷却 + 冷却期阻断
let r6 = initialRecord('P-FUSE', 'process', 'toy');
r6 = advance(r6, 'regression', baseFacts(), []).rec;
r6 = fuse(r6, 'checklist 退化 A');
ck('熔断→stable', r6.state === 'stable', r6.state);
ck('首次熔断不冷却', !r6.cooldownUntil, r6.cooldownUntil);
r6 = fuse(r6, 'checklist 退化 B');
ck('两次熔断→冷却', !!r6.cooldownUntil);
ck('冷却期阻断推进', !canAdvance(r6, 'regression', baseFacts()).ok, canAdvance(r6, 'regression', baseFacts()).reason);

// 7) rollout 依赖项目真实全绿：projectGreenNow=false 必须拒绝
let r7 = initialRecord('P-NOGREEN', 'process', 'toy');
r7 = advance(r7, 'regression', baseFacts(), []).rec;
r7 = advance(r7, 'canary', baseFacts(), []).rec;
recordGreenIteration(r7, 'i1');
ck('项目未全绿拒 rollout', !canAdvance(r7, 'rollout', { ...baseFacts(), projectGreenNow: false, greenIterations: r7.greenIterations }).ok);

// 8) 迭代键规范：非 round-N 键（含历史日期）一律拒计（防同轮换键刷绿）
let r8 = initialRecord('P-KEY', 'process', 'toy');
r8 = advance(r8, 'regression', baseFacts(), []).rec;
r8 = advance(r8, 'canary', baseFacts(), []).rec;
ck('日期键拒计', recordGreenIteration(r8, '2026-11-12') === false, r8.greenIterations);
ck('乱格式键拒计', recordGreenIteration(r8, 'round-x') === false);
ck('合法轮次键计入', recordGreenIteration(r8, 'round-7') === true && r8.greenIterations === 1, r8.greenIterations);
ck('同轮重复不二次计', recordGreenIteration(r8, 'round-7') === false, r8.greenIterations);

// 8) P12 真源边界：编号映射、本体锚点、缺输入不崩（proposals.mjs 组件契约）
ck('P3→P-003 映射', l4Id('P3') === 'P-003', l4Id('P3'));
ck('P-003→P3 反向映射', patternId('P-003') === 'P3', patternId('P-003'));
ck('P11→P-011 / P-011→P11', l4Id('P11') === 'P-011' && patternId('P-011') === 'P11');
const [bf, bn] = bodyAnchor('P-003');
ck('未登记提案回退 G-REFLOW 行', bf.includes('G-REFLOW.md') && bn === '| P3 |', bn);
ck('缺输入工作区返回空池不崩', loadProposals('/nonexistent-workspace-for-fixture').size === 0);

const passed = checks.filter(c => c.ok).length;
console.log(JSON.stringify({ fixture: 'l4-toy-v2', checks: checks.length, passed,
  failed: checks.filter(c => !c.ok), allPassed: passed === checks.length }, null, 2));
if (passed !== checks.length) process.exit(1);
