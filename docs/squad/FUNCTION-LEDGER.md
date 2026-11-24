# 席位职能台账 · FUNCTION-LEDGER

> 用途：把「席位在岗」从自我声明变成文件可核查。每席一行：必产物 → 首轮目标 → 现状。
> 核查：node packages/dsh-quanneng-squad/scripts/seat-utilization.mjs（产出 idle 列表）。

| 席位 | 阶段 | 必产物 | 首轮目标 | 现状（2026-11-11 实测） |
| --- | --- | --- | --- | --- |
| 采风官 | S-1 | docs/squad/intel/*.md | SN26 规范约束清单 | ✅ 1 篇（43 行/11 约束/41 处 文件:行；发现 CR-003 四项缺陷） |
| 集贤学士 | S1 | docs/squad/prompts/*.md | ≥6 个岗位提示词优化稿 | ✅ 8 篇（7 角色四节齐备 + INDEX；纠正指挥口径 11→12/12） |
| 翰林学士 | S1 | docs/squad/pipeline/P-*-decomposition.md | SN26 任务树 | ✅ P-004（284 行/26 卡，六要素零缺，写域无冲突） |
| 需求经理 | S0 | docs/prd/clarifications-*.md | 未决问题表 + 拍板 | 已有 2 篇 |
| 产品经理 | S0 | docs/prd/PRD-*.md | PRD + 价值排序 | 已有 1 篇 |
| 架构经理 | S2 | docs/arch/*.md | 契约冻结 + ADR | 已有 6 篇 |
| 给事中 | S3 | docs/squad/gates/G-S*.md | 契约封驳 | 已有 2 篇 |
| 后端经理 | S4 | src/src, src/ | 实现 + 自测 | 已产出 |
| 前端经理 | S4 | docs/squad/reviews/usability-*.md | 接口可用性评审（本项目无前端交付，故重定义） | ✅ 80 行/8 项/72 指针 → **揭出 CR-004 北向空壳** |
| 测试经理 | S5 | docs/qa/*.md | 用例矩阵 + 实跑 | ✅ 2 篇（gate-matrix-CR003-CR004 等）；CR-004 门禁自报 37/37 但证据归档被 credential 失效中断 |
| 御史大夫 | S6 | docs/squad/audit/*.md | 独立复核 | 已有 6 篇 |
| 运维经理 | S7 | deploy/* + 回滚预案 | 部署与回滚验证 | ⚠️ 1 篇（deploy）；独立回滚演练待补 |
| 交付发布经理 | S7 | docs/squad/releases/release-*.md | 发布物独立实跑 | ✅ 91 行「有条件可发」+ 自报 6 项缺陷 + 6 步回滚 |
| 起居注官 | S8 | docs/squad/journal/*.md | 逐轮记注 | 已有（此前由指挥代记） |
| 考功郎中 | S8 | docs/squad/metrics/*.md | 席位利用率度量 | ✅ 194 行：返工 12 次(0.57/轮)、六要素 3/16、4 项口径缺陷 D-1~D-4 全部被指挥采纳修复 |
| 太傅 | S9 | docs/squad/retro-*.md | 机制缺陷→改进闭环 | ✅ 9 篇 retro；P1~P8 模式已回写 G-REFLOW 并内化进 7 份提示词 v2 |

**判定规则**：必产物文件数为 0 且非豁免席位 → 记「闲置」，S6 抽巡判该迭代阻塞。
**豁免原则**：确无该类交付的席位（如纯前端）必须当场重定义必产物，而不是留空——留空即冗余席位。

**第二十三轮更新**：16/16 席位必产物齐（idleCount=0，脚本按文件名模式判定，prompts 已收紧为 `<角色>-v<n>.md` 排除 INDEX.md）。考功郎中指出的 D-1~D-4 已全部处置：AGENTS.md 指针修正、计数口径收紧、G-S7 门已亲笔判「不可放行」。