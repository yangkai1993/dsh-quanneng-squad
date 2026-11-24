# INTERACTION.md §六 复测记录（2026-11-06 最终版）

- 触发：用户「按 INTERACTION.md §六 复测三项」
- 运行时 GUI：http://127.0.0.1:51646（上一轮 55215 → **宿主已重启过**）
- Hindsight：两轮 `ECONNRESET`，无可用页面（如实记录，不引用）

## 三项验收

| 项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 1 | `squads_run_squad` 返回 ok | `preset-unavailable: tool-subagent-list-agents ... never started` | **FAIL** |
| 2 | `list_agents` 出现 16 个 teammate | 仅 lead，0 个 teammate | **FAIL** |
| 3 | `send_message({target:成员名})` 可达 | `active teammate "架构经理" not found`（按名字/按 memberId 均失败） | **FAIL** |

**总判定：三项全 FAIL。**

## §六 代码块：16 员逐员探针（并发 ≤3 分批，两轮）

两轮均 **16/16 ok / running**：需求经理、产品经理、架构经理、前端经理、后端经理、御史大夫、运维经理、交付发布经理、测试经理、给事中、考功郎中、起居注官、采风官、集贤学士、翰林学士、太傅。

## 根因（推翻上轮「重启即可恢复」的判断）

1. `plugin_manager({action:'list_plugins'})` 全量分页扫描 **262 条**：
   - `@deepseek-ai/dsh-tool-subagent-control` 本体 `enabled:true / fiberPhase:active`；
   - **`list-agents` 子路径条目数 = 0**（仅出现在 `cordis.patch.yml` 的引用里，宿主插件表中不存在）。
2. 因此 `squad-lead` 预设被判 unusable → `squads_run_squad` 恒 FAIL；GUI 端口已变说明宿主重启过，不是会话没刷新。
3. 经理会话由 `squads_run_member` 拉起但不进 `list_agents` 的 team 总线 → `send_message` / `wait_agent` 均够不着。
4. `agent_teams_add_member` 可注册 teammate 但 **team 硬上限 8 人**，状态 `unspawned`；8 人逐个 `agent_teams_send_message` 唤醒（8/8 `delivered:"wake"`）后，`list_agents` 仍只有 lead、`send_message` 仍 not found。

## 可用替代通道（本次新增证据）

| 通道 | 实测 |
| --- | --- |
| `squads_run_member` | 16/16 ok/running ✅ |
| `agent_teams_send_message({to,content})` | 8/8 `delivered:"wake"` ✅（team 内部消息可用，上限 8 人） |
| `agent_teams_resume({name,reason})` | `already_running` |
| `team_task_create` / `task_board_create` | ok |
| 文件总线 dispatch/inbox + read/grep | ✅ 回报唯一可靠通道 |
| `set_plugin` / `tool_activate` | 均无法凭空创建不存在的子插件 |

## 结论与下一步

- 原 §六「重启宿主并在新会话生效」结论**已被实测推翻**，INTERACTION.md §六 已重写为 v2.10 校准版。
- 解除阻塞的真实条件：宿主升级提供该子插件 / 从 `preset-squad-lead` delegation 移除两行 `tool-subagent-list-agents` 引用并新会话生效 / 保持当前降级路径为正式运行方式。
- 本轮未修改 `cordis.patch.yml`（宿主资产，改动需用户确认且只在新会话生效）。
- 代码交付零改动：`src/` 20 模块；网关测试 11/11、国密自检 14 向量仍通过。

## 补记（v2.11）· 唤醒后出现真实在岗回报

| 证据 | 值 |
| --- | --- |
| `docs/squad/inbox/后端经理.md` 新增行 | `2026-11-06 · §六复测 | PING 已收到 · 在岗`（含 STATE/VERSION/AGENTS 复核声明） |
| 落盘 §六复测 回报的成员 | 后端经理、御史大夫、运维经理、需求经理（4 个） |
| `agent_teams_status` | 后端经理 `activity:"ready"`，其余 7 人 `running`，`captain_inbox` = 1 |
| 成员回报 captain | `agent_teams_send_message`，`delivered:"live"` |
| `agent_teams_send_message({to:"后端经理"})` 复测 | `delivered:"wake"` |
| `list_agents` / `send_message` | 仍仅 lead / `active teammate "后端经理" not found` |

**修正判定**：三项工具口径 FAIL 属实（宿主缺 `list-agents` 子插件），但**实际交互链路可用**——
注册（≤8 人）→ team 内部 wake → 成员写 inbox 文件 → 指挥 read/grep 回收 → team 内部回执。
不得由三项 FAIL 推断「整个小队无法交互」。完整口径见 INTERACTION.md §七。

## 闭合（终版）

- 8/8 team 成员落盘回报：交付发布经理、产品经理、前端经理、后端经理、御史大夫、架构经理、运维经理、需求经理；全部 ≤40 行、零越权。
- 原生消息双向：captain→成员 `wake`；成员→captain `live`；`captain_inbox`=3；架构经理 inbox jsonl 有 deliveredAt/readAt。
- `agent_teams_status`：6 人 `activity:"ready"`、2 人 `running`，phase `running`。
- 三项工具口径最终复测仍 FAIL（`preset-unavailable` / 仅 lead / `not found`），诊断不变。
- **闭合判定**：三项原定工具 FAIL ≠ 小队不可交互；`agent_teams` 原生消息 + 文件总线已双向跑通，INTERACTION.md §二/§七/§八 已同步修正。

## 末轮校准

- 成员（架构经理）闭合回报仍写「三项留待重启宿主后新会话复测」→ **已证伪**：宿主重启过（55215→51646），插件表 262 条无 `list-agents` 子路径，三项恒 FAIL，属宿主能力缺失而非待办。
- 以 INTERACTION.md §八/§九 为准：三项 FAIL 已定论；小队可交互依赖 `agent_teams` 原生消息双向 + 文件总线，与三项无关。
- 末轮回执：架构经理 inbox 39 行（≤40），`delivered:"live"`，`inbox/captain.jsonl` 已落。
