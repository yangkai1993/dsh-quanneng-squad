<!-- AUTO-GENERATED from AGENTS.md by scripts/build-agents-context.mjs — DO NOT HAND-EDIT -->

# AGENTS.md · 仓库规则 v1.0

## §1 目录所有权（并行互斥，唯一权威）

| 目录 | 所有者 | 可写角色 | 禁止 |
| --- | --- | --- | --- |
| `src/crypto/`, `src/protocol/`, `src/core/` | 后端经理 | 后端工程师员工 | 其他任何并行任务 |
| `src/north/`, `src/mock/`, `src/inbound/`, `src/transport/` | 后端经理 | 后端工程师员工 | 其他任何并行任务 |
| `src/contract.js`, `src/config.js`, `package.json` | 架构经理 / 总指挥 | 仅 CR 批准后 | 员工一律禁写 |
| `tests/` | 测试经理 | 测试/E2E 工程师 | 实现域员工 |
| `docs/arch/`, `docs/prd/`, `docs/squad/CONSTITUTION.md` | 架构经理 / 需求经理 / 产品经理 | 文档员工 | 实现域 |
| `docs/squad/gates/`, `docs/squad/STATE.md`, `docs/squad/TRACE.md` | 总指挥 | 总指挥 | 所有成员 |
| `docs/squad/journal/`, `docs/squad/audit/` | 起居注官 | 起居注官 | 其他角色 |
| `docs/qa/`, `docs/squad/retro-*.md`, `docs/squad/pipeline/` | 测试经理 / 考功郎中 | 对应员工 | 其他角色 |
| `deploy/`, `CHANGELOG.md` | 运维经理 / 交付发布经理 | 对应员工 | 其他角色 |
| `stories/` | 各实现域经理（本域卡） | 本域经理 | 跨域改写 |
| `squad-toolkit/` | 架构经理（CR） | 考功郎中（管线执行） | 其他角色 |

**并发冲突铁律**：两个并行任务不得写同一文件。发现重叠立即停手，报 `status: hand_back` 附 `hand_back_reason`，由总指挥裁决唯一归属。上一轮 6 轮并发覆写即因缺少此表。

## §2 资源分配表

| 角色组 | 预设 | 典型任务 | 权限 |
| --- | --- | --- | --- |
| 总指挥 | squad-lead | 拆图/派活/验收/汇报 | 只读代码 |
| 规划域 | squad-arch | PRD/契约/宪法/AGENTS | 文档写 |
| 实现域 | squad-dev | 前后端实现 | 代码写 |
| 质量域 | squad-qa | 测试/TRACE/缺陷 | 测试写 |
| 运维域 | squad-ops | 部署/监控/发布 | deploy 写 |
| 监察谋断 | squad-court | 封驳/抽巡/记注/度量/票拟 | 只读或限定目录 |

## §3 开工第一动作

0. 读 `docs/squad/pipeline/DELIVERY-PIPELINE.md` 与 `docs/squad/FUNCTION-LEDGER.md`：确认本任务属于哪个阶段（S-1~S9）、本席位的必产物路径。**席位是工位不是编制**——阶段必产物缺失即判本迭代未完成，`packages/dsh-quanneng-squad/scripts/seat-utilization.mjs` 会把闲置席位列为阻塞。

1. 读 `docs/squad/STATE.md`（会话压缩/重启后必读，不凭记忆重建）。
2. 读 `squad-toolkit/VERSION.md`；canary 位非空则在受限故事卡顶部标注「canary 规则生效：P-<编号>」。
3. 对表 `<available_skills>` 与工具目录；命中即用 skill 工具加载。
4. 读本文件 §1 确认自己任务的目录所有权。

## §4 每次派活前提（硬纪律，缺一即派活无效）

- **情报先行**：派活前必须复核 `docs/squad/intel/` 下与本任务相关的约束清单；距上次更新 >7 天或代码已变更而清单未变 → 先派采风官重扫，再派活。清单里的「已实现/待验」判定以当前代码为准，不得沿用旧结论。
- **提示词现行版**：给任何成员派活，提示词第一行 `squadRole:` 必须指向 `docs/squad/prompts/<角色>-v<n>.md` 的**以 INDEX.md 主表中该角色的现行版指针为准**（禁止在本文硬编码版本号；主表由集贤学士维护，含 P1~P12 内化）；引用 v1 或裸 roles/ 原稿即视为未按规矩派工。INDEX.md 是版本索引真源。
- **派活令牌**：每张任务书携带唯一令牌（格式 `TK-<轮次>-<序号>`，如 TK-31-01），成员回报首行必须含 `token: TK-31-01`；**无令牌的产出 captain 不验收**——这是防止「成员先干完 captain 后知道」（信息流倒挂）的唯一机制。令牌由 captain 签发并登记在 dispatch 卡上，成员不得自造。
- **简报与脉搏**：captain 每轮收尾必写两件——① `docs/squad/briefs/round-<N>.md`（本轮简报：目标/拆解/交付/问题/门禁/风险/下一步 七段固定）；② 刷新 `docs/squad/TEAM-PULSE.md`（席位活动 + 五门状态 + 在途令牌 + 未闭合风险，全部从实测工具取数）。这两件是用户观察团队运行的唯一窗口，不写视为轮次未完成。
- **记注对账**：每轮收尾，起居注官比对本轮「报称产出」与「实际落盘」（mtime + 内容），差异记入 journal；发现文档指针失效或状态声明过期，立即跑 `packages/dsh-quanneng-squad/scripts/drift-check.mjs` 并把结果记入 journal。

- **时刻监督三件套（P10）**：① 派活前 `node packages/dsh-quanneng-squad/scripts/dispatch-guard.mjs` 校验同轮在途任务写域结构化且互斥（禁止「见任务书」转述）；② 每轮简报必写「## 本轮 src 变更归属」段，`lead-scope-check.mjs` 抽验指挥不得改 src（纠错须标注）；③ 每轮收尾跑 `supervise.mjs` 生成 `docs/squad/SUPERVISION.json`（只认最新批次实测、区分探针红/回归红）；三件套已接入 release 链与 verify 5 条断言。任一红即本轮不得收口。

## §5 通道纪律（v3 · 主对话 + subagent）

- **主通道 = 主对话内直接派 subagent**：`subagent({ description, prompt })`。小队所有实现/侦察/评审任务一律由主对话派 subagent 执行，回报直接回主对话。
- prompt 首行必须 `squadRole: docs/squad/prompts/<角色>-v<n>.md`（现行版以 INDEX.md 主表为准），后接六要素任务书。
- subagent 跟随主对话当前模型，**不设独立 model pin**——换模型全队跟随，不锁死。
- agent_teams / squads_run_member 降级为**兼容通道**：历史资产保留，不再作为派活主路径；仅在明确需要宿主成员面板时可选。
- 成员间不直接对话；信息经主对话中转或共享文件（subagent 回报即回主对话）。


## §6 席位与换班（v2.13）

- 同屏 8 席为并发预算，不是团队人数上限；16 人编制常驻。
- 每轮按 docs/squad/ROSTER-16.md §七 轮次名册上场，≤8 席；跨轮用「角色@W轮次」别名。
- 派活主通道 = 主对话 subagent（不受同屏 cap，天然并行）；回收 = subagent 完成回报直接回主对话（docs/squad/inbox/ 保留为兼容留痕）。
- **派活即驱动**（subagent 语义）：`subagent()` 的 prompt 必须自带六要素（写域+验收+证据），不再需要「激活后再投递」两步——这是旧多 agent 会话制的痛点，subagent 制已消除。
- 每张任务书六要素缺一不可：阶段号(S-n) / 目标 / 必产物路径 / 写域 / 验收标准 / 证据要求（外加失败路径 hand_back 条件）。缺项成员一律 status: hand_back，不得自行猜测补全。
- 禁止为凑 16 同屏而放弃三省六部/谋断四署/科抄抽巡任一环节；用换班保证全部环节都有专属轮次。

