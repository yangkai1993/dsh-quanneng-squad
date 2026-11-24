# L4 五态管线账本
> 本表由 packages/dsh-quanneng-squad/scripts/l4/sync-ledger.mjs 从 assets/L4-STATE.json 渲染，状态列勿手改。
> 五态：proposal → regression → canary → rollout → codified；任一态 checklist 退化即熔断回 stable。
> 固化需 stableIterations≥2（≥2 个不同 round-N 持续全绿）+ 目标文档 grep 命中条款；同一轮反复运行刷不出固化。
> 宪法层提案一律拒绝（走 CR + 用户批准）。同主题连续 2 次熔断 → 冷却 2 迭代。

| 提案 | 层级 | 当前态 | 回归门 | 金丝雀 | 全量 | 固化 | 迭代计数 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P-001 并发覆写防治（目录所有权表 + hand_back 铁律） | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=regression:round-40/canary:round-40/rollout:round-40/rollout:round-42 |
| P-002 需求工程前置闸（八件套） | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=regression:round-40/canary:round-40/rollout:round-40/rollout:round-42 |
| P-004 端到端结果核对 result-verify 纳入 release 链 | parameter | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=regression:round-40/canary:round-40/rollout:round-40/rollout:round-42 |
| P-010 时刻监督/检验/改进三件套（dispatch-guard + lead-scope-check + supervise） | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-003 G-REFLOW P3：叙述性声明被当作验收 | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-005 G-REFLOW P5：未验证的宿主/环境假设 | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-006 G-REFLOW P6：上级输入未核验 | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-007 G-REFLOW P7：激活≠驱动 | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-008 G-REFLOW P8：**门禁只约束别人，不约束改门禁的人（修订：自审改为交叉审计）** | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-009 G-REFLOW P9：**任务书转写/合并基准语义**（指挥引用契约时把两个相反基准并成一句） | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-011 G-REFLOW P11：**治理脚本重复实现 + 合规条款未机器化 + 设计依据不落盘** | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-48/rollout:round-48/rollout:round-49 |
| P-012 **门禁/管线自身真源未覆盖（编号映射、锚点表、章节结构、版本声明）** | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=canary:round-50/rollout:round-50/rollout:round-51 |
| P-013 进化闭环（发现→夹具→门→反哺） | process | codified | ✓ | ✓ | ✓ | ✓ | green=1 stable=2 iter=regression:round-70/canary:round-70/rollout:round-70/rollout:round-71 |
| P-014 真源诚实与跨域反省（叙述不污染控制真源/不复验不报绿） | process | rollout | ✓ | ✓ | ✓ | · | green=1 stable=1 iter=regression:round-71/canary:round-71/rollout:round-71 |
| P-015 **钉死模型 / 违背「不限制模型」原始规约反复复发** | process | rollout | ✓ | ✓ | ✓ | · | green=1 stable=1 iter=regression:round-71/canary:round-71/rollout:round-71 |

生成时刻: 2026-11-24T02:01:50.208Z
