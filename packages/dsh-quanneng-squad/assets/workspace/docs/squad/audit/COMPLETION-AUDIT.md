# 全能小队完整修补 · 验收台账（2026-11-06 实测）

## 一、逐员在岗检测（16/16）

| # | 角色 | preset | 权限 | 探针 |
| --- | --- | --- | --- | --- |
| 1 | 需求经理 | squad-arch | workspace-write | ok / running |
| 2 | 产品经理 | squad-arch | workspace-write | ok / running |
| 3 | 架构经理 | squad-arch | workspace-write | ok / running |
| 4 | 前端经理 | squad-dev | workspace-write | ok / running |
| 5 | 后端经理 | squad-dev | workspace-write | ok / running |
| 6 | 御史大夫 | squad-court | **read-only** | ok / running |
| 7 | 运维经理 | squad-ops | workspace-write | ok / running |
| 8 | 交付发布经理 | squad-ops | workspace-write | ok / running |
| 9 | 测试经理 | squad-qa | workspace-write | ok / running |
| 10 | 给事中 | squad-court | workspace-write | ok / running |
| 11 | 考功郎中 | squad-court | workspace-write | ok / running |
| 12 | 起居注官 | squad-court | workspace-write | ok / running |
| 13 | 采风官 | squad-court | workspace-write | ok / running |
| 14 | 集贤学士 | squad-court | workspace-write | ok / running |
| 15 | 翰林学士 | squad-court | workspace-write | ok / running |
| 16 | 太傅 | squad-court | workspace-write | ok / running |

七个预设（squad-lead/arch/design/dev/qa/ops/court）均已在 cordis.patch.yml 注册。
方法：逐个 `squads_run_member({squadId, memberId, task:'【在岗检测·只读】...'})`，复检两轮均 16/16 ok。

## 二、交互通道实测（关键断链已定性）

| 通道 | 结果 | 判定 |
| --- | --- | --- |
| squads_run_member | 16/16 ok/running | ✅ 派活（单向） |
| list_agents | 仅 lead，16 经理不出现 | ❌ |
| send_message（按 memberId / 按角色名） | `active teammate ... not found` | ❌ |
| wait_agent | `no-active-peer` | ❌ |
| squads_run_squad | `preset-unavailable: tool-subagent-list-agents never started` | ❌ 宿主阻塞 |
| team_task_create / task_board_create | 均返回 ok | ✅ 板面账本 |
| squads_update / squad_member_update / squads_read | 回读 v2.8 + 16/16 指针成功 | ✅ 定义持久化 |
| **文件总线（落盘回报 + read/grep 回收）** | 实测可用 | ✅ **唯一可靠回传** |

结论：经理会话只能单向激活、不能消息回传。交互协议已改为「派活写清落盘回报路径 → 指挥读文件验收」，见 `docs/squad/INTERACTION.md`。上一轮裸 `subagent` 能回消息却无 preset/brief，恰是「子智能体来源不明」的根因。

## 三、文件缺口：引用扫描 → 一一补齐

扫描源：16 份 member brief + `cordis.patch.yml` 七个 preset persona，共 25 条带路径引用、12 个裸文件名引用。

| 缺口 | 补齐 |
| --- | --- |
| `roles/*.md` × 12（brief 用裸相对路径） | 12 份路径别名 shim → 指向 `squad-toolkit/roles/` 权威正文 |
| `templates/*.md` × 9（含 CHANGE-REQUEST/STORY） | 9 份路径别名 shim → 指向 `squad-toolkit/templates/` |
| `docs/arch/api-contract.md` / `sys-arch.md` / `data-arch.md` / `biz-arch.md` | 4 份真实架构文书（契约/C4+ADR/ER+数据分级/业务流程+领域模型） |
| `docs/squad/journal/YYYY-MM-DD.md` | 日志模板 |
| `CHANGELOG.md` | 变更记录 |
| `docs/squad/defense-counter.md` | 防线触发计数（L4 第三张定时卡） |
| `deploy/runbook.md` | 启动/验收/6 类报警处置/日切差错 |
| `docs/squad/dispatch/<角色>.md` × 16 | 每员任务书落点 |
| `docs/squad/inbox/<角色>.md` × 16 | 每员落盘回传收件箱 |
| `docs/squad/INTERACTION.md` | 在岗检测 + 通道矩阵 + 每员交互契约 + 复测命令 |

**复检结果：25 条路径引用 `stillMissing: []`；12 个裸文件名逐个 `existsSync: true`。**

## 四、最终资产清点（规范化后）

| 类别 | 数量 |
| --- | --- |
| 工作区文件 / Markdown | 148 / 99 |
| squad-toolkit/templates | 9 |
| squad-toolkit/roles（权威） | 12 |
| roles/ 别名 shim | 12 |
| templates/ 别名 shim | 9 |
| docs/arch 架构文书 | 4 |
| docs/squad/dispatch 任务书 | 16 |
| docs/squad/inbox 收件箱 | 16 |
| gates / journal / audit / pipeline 账本 | 1 / 2 / 2 / 1 |
| 顶层权威 | 落地手册、AGENTS.md、CONSTITUTION.md、STATE.md、TRACE.md、CHANGELOG.md、VERSION.md、METRICS.md、ROOT-CAUSE.md、doc-freshness.md、INTERACTION.md、defense-counter.md、runbook.md |

## 五、仍需用户操作（不假装已修）

`squad-lead` 的 `list-agents` 插件宿主未加载，`squads_run_squad` 仍 `preset-unavailable`，经理会话不进消息总线。**重启宿主并在新会话生效**；重启后按 INTERACTION.md §六复测：`squads_run_squad` 应 ok、`list_agents` 应出现 16 个 teammate、`send_message` 应可达。本会话已用文件总线降级路径跑通全流程。

## 六、代码交付未受影响
`src/` 20 模块零改动；`node --test tests/gateway.test.js` 11/11、`crypto.selftest.js` 14 向量 PASS。
