# 全能编程小队 · 16 人运行时名册（2026-11-06 成团实测）

## 一、三个层级的「在智能体中体现」
| 层 | 载体 | 数量 | 实测 |
| --- | --- | --- | --- |
| 编制定义 | `squads_read` squad 成员（含 preset + permission + brief） | **16/16** | 全部有 brief、全部带 v2.8 资产指针 |
| 会话激活 | `squads_run_member({squadId,memberId,task})` | **16/16 ok / running** | 分 3 人一批、并发 ≤3，两轮一致 |
| team 总线可见 | `list_agents` / `agent_teams_status` / `spawn_teammate` | 8 + 6 = 14（见下） | 宿主硬上限 8 |

## 二、16 人名册与通道映射
| # | 角色 | 预设 | 权限 | team 可见标识 | 通道 |
| --- | --- | --- | --- | --- | --- |
| 1 | 需求经理 | squad-arch | workspace-write | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 2 | 产品经理 | squad-arch | workspace-write | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 3 | 架构经理 | squad-arch | workspace-write | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 4 | 前端经理 | squad-dev | workspace-write | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 5 | 后端经理 | squad-dev | workspace-write | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 6 | 御史大夫 | squad-court | read-only | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 7 | 运维经理 | squad-ops | workspace-write | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 8 | 交付发布经理 | squad-ops | workspace-write | (中文名，team.json 原生) | agent_teams_add_member(team.json) |
| 9 | 测试经理 | squad-qa | workspace-write | qa-manager | spawn_teammate(slug) / squads_run_member |
| 10 | 给事中 | squad-court | workspace-write | censor | spawn_teammate(slug) / squads_run_member |
| 11 | 考功郎中 | squad-court | workspace-write | merit-officer | spawn_teammate(slug) / squads_run_member |
| 12 | 起居注官 | squad-court | workspace-write | chronicler | spawn_teammate(slug) / squads_run_member |
| 13 | 采风官 | squad-court | workspace-write | intelligence-officer | spawn_teammate(slug) / squads_run_member |
| 14 | 集贤学士 | squad-court | workspace-write | brainstormer | spawn_teammate(slug) / squads_run_member |
| 15 | 翰林学士 | squad-court | workspace-write | prompt-clinician(待位) | spawn_teammate(slug) / squads_run_member |
| 16 | 太傅 | squad-court | workspace-write | grand-tutor(待位) | spawn_teammate(slug) / squads_run_member |

## 三、宿主硬约束（如实记录，不伪装 16 全可见）
- `agent_teams_add_member` 在 8 人（架构/需求/产品/前端/后端/御史/运维/交付）后报 `member cap (8)`。
- `spawn_teammate` 绕过 add_member 上限，成员进入 `list_agents`、`send_message` 可达（`sent:true`），要求 **lower-kebab-case** 名字；已注册 6 个 slug：qa-manager / censor / merit-officer / chronicler / intelligence-officer / brainstormer（+2 个探针占额）。
- `prompt-clinician`(翰林学士) / `grand-tutor`(太傅) 因累计 8 名额满未进 spawn 列表；但二者 `squads_run_member` 探针 **ok/running**，仍是可派活的在岗成员。
- `interrupt_agent` 只置 inactive，**不释放名额**；`agent_teams_remove_member` / `agent_teams_delete` 在当前会话报「you are not leading any team yet」，无法移除探针。

## 四、成团登记回执（落盘证据）
6 名 spawn 成员均写 `docs/squad/inbox/<中文名>.md` 并 `send_message` 回 lead 指针：
考功郎中、采风官、集贤学士、给事中、起居注官、测试经理。
8 名 team.json 成员经 `agent_teams_send_message` 唤醒（delivered: wake / mailbox）。

## 五、结论
**16 人全部在智能体中体现为可派活会话**（squads_run_member 16/16）；其中 14 人额外在 team 总线可见/可消息。
「16 人同时出现在 list_agents」受宿主 8 名额硬限制，需宿主放开 cap 或分多 team 才能达成——这是运行时能力边界，不是配置遗漏。


## 六、名册清洁性（终检）
- 16 个角色 inbox 全部存在、全部有「成团登记」行、全部 ≤40 行。
- 探测期临时文件 `probe-spawn.md`（93 行）已移出 inbox 归档至 `docs/squad/audit/probe-spawn-inbox-archive.md`，不占 16 人名册。
- 16 份 dispatch 状态全部由「未派活」更新为「已成团登记，待正式故事卡」。


## 七、轮次名册（cap=8 换班设计 · 见 ARCH-REDESIGN-cap8.md）

| 轮次 | 阶段 | 在席 8 角色 | 覆盖理念 |
| --- | --- | --- | --- |
| W1 | S-1 谋断门 | 翰林、采风、集贤、太傅、需求、产品、给事中、御史 | 提示词会诊/情报/风暴/票拟 + 科抄预审 |
| W2 | S0 + 架构 | 需求、产品、架构、给事中、御史、后端、测试、交付 | 拷问门/PRD/ADR/拆分准备 |
| W3 | 实现 + 初审 | 前端、后端、架构、测试、御史、运维、交付、需求 | EARS 故事卡/代码/测试/部署 |
| W4 | S8 复盘 + 门禁 | 考功、起居注、给事中、御史、交付、需求、产品、架构 | M1~M9/L4/记注/门禁/发布 |

16 角色 4 轮全覆盖；跨轮重复用别名「角色@W轮次」（名字永久占额，同名不可二次 add）。

### 轮次绑定规则（v2 · 1.15.0 Event Sourcing 口径 · 取代 CR-003-roster-binding 两级判定）

> **真源**：`docs/squad/events/round-events.jsonl`（不可变事件日志）+ 本节 §七 W1~W4 名册表。
> `packages/dsh-quanneng-squad/scripts/lib/rotation.mjs` `currentRotation(W)` 是机器实现：
> round = 最后一个 `ROUND_ADVANCE.to`；W 绑定 = `(round-1)%4`（W1↔0、W2↔1、W3↔2、W4↔3）。
> 事件日志损坏行 fail-closed；round=0 未初始化时调用方必须拒绝派活。

**1.15.0 变更说明（取代 CR-003 两级判定）**：旧规则「最近简报明确记载优先 → 无记载按 4 轮推定」
是叙述驱动，已被 Event Sourcing 取代（横切规则 6：轮次/令牌控制真源=不可变事件日志，叙述文档只读）。
历史教训保留：round-53.md:13 明示 W4 与取模 (55-1)%4=W3 冲突事件是本次收编的动机之一——
叙述口径可被遗忘、漏写、倒序回退歧义；事件日志一次落盘永久可重放。

**对账与偏差披露**：轮次两口径（事件日志 round vs 简报文件名 maxRound）独立计数；
偏差以 `DISCREPANCY` 事件注记（cmdNoteDiscrepancy），不篡改轮次真源。
2026-11-23 已注记：事件 round=71（2026-11-17 迁移基线 0→71）vs 简报 maxRound=68，偏差 3 轮成因=
两口径自 11-17 起独立计数且无对齐事件；此后以事件日志为唯一轮次真源，简报号只作审计旁证。

**消费纪律**（不变）：§七 W1~W4 表（本文件 `:56-59`）是轮次→在席 8 角色的唯一名册；
`current` 只表示「按该名册推荐当前上场 8 席」，不是新增第 5 个轮次。补派须受 C2 并发≤3 约束；
跨轮重复角色仍用「角色@W轮次」别名。令牌生命周期（planned→dispatched→reported→accepted/rejected）
见 `scripts/lib/event-store.mjs` TOKEN_TRANSITIONS 与 `scripts/state-machine-gate.mjs`（1.15.0 新增）。
本小节只追加规则，**不改 W1~W4 表任何一行**。
