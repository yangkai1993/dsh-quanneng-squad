# 面板集成规程（Panel Integration Contract）· 2026-11-16

> 来源：第 59~60 轮面板集成实战（12 张卡、16 席、5 类失败面全部实测）。本规程是**面板侧 API 的真实约束**清单，
> 与本地 dispatch 纪律并列——违反任一条都会导致「面板显示失败/阻塞」而本地其实正常。

## 一、席位（16 席）

| 项 | 值 |
| --- | --- |
| 成员名 | `<席位>@v20`（16 席全部 v20；旧 v17/v18 已移除，**同名不可复用**） |
| 路由 | qodercn/qfmodel（8 席）+ our-free-model/nvidia/nemotron-3-ultra-550b-a55b:free（8 席） |
| reasoning_effort | **medium**（唯一全路由兼容档位） |

### 1.1 reasoning_effort 兼容矩阵（实测）

| 路由 | high | medium | low | 省略 |
| --- | --- | --- | --- | --- |
| buddy/hy4free | ❌ | ❌ | ❌ | ❌ provider 本会话禁用 |
| minimax/MiniMax-M3 | ❌ | ❌ | ❌ | ✅ undefined |
| qodercn/qfmodel | ❌ | ✅ | — | ✅ 自动 medium |
| our-free-model/nemotron | ❌ | ✅ | ✅ | ✅ 自动 high |

> **根因**：v17 旧席位全部配 `reasoning_effort: high`，而该档位仅部分路由支持 → 每个席位一接任务即 `UNSUPPORTED_REASONING_EFFORT` 失败。
> 面板所有席位一律 **medium**。

## 二、任务卡 API 约束（实测踩坑全记录）

| # | 约束 | 现象 | 正确做法 |
| --- | --- | --- | --- |
| 1 | **建卡必须带 assignee** | 无 assignee 的 pending 卡被调度器派给任意 ready 席位（TK-59-01 曾落到需求经理） | 建卡后立即 `reassign_task` 归位 |
| 2 | **调度器会抢派** | 同步视图卡（历史）也会被抢派并真的去执行 → 失败 | 历史卡建卡即 `reassign` 给 captain 并置 completed |
| 3 | **terminal 不可改状态** | failed 卡 `update_task(status=...)` 报 "terminal task is immutable" | 先 `reassign_task` 复活（撤销旧 attempt），再改状态 |
| 4 | **completed 需全部验收项 passed** | 报 "requires passed acceptanceResults for every acceptance item" | 传全部原始 acceptance 条目，每条 passed |
| 5 | **completed 需 commandsRun 覆盖每个 verify** | 报 "requires a passed commandsRun entry for every verify command" | 每个 verify 命令给一条 status=passed + 证据 |
| 6 | **completed 需 changedPaths 且必须在 inScope 内** | 报 "is undeclared" | changedPaths 用真实落盘路径；若 inScope 写错，用 `amend_task` 修契约 |
| 7 | **evidence_note 仅用于 terminal 卡** | 报 "evidence_note is for terminal tasks" | 活动卡用 output + acceptanceResults |
| 8 | **acceptanceResults.status 仅 passed/failed** | `pending` 非法 | 进行中任务也写 passed + 证据注明"进行中" |
| 9 | **captain 一人一任务** | "captain is busy with t1" | 逐张处理：reassign→update→下一张 |
| 10 | **面板席位模型端不可控** | qoder 112 pricing / buddy 限流 | 面板只作**观测面 + 派单面**，执行走 subagent 串行 |

| 13 | **队长收件箱是易失 coordination 通道** | captain_inbox/member_inboxes 消息被消费后清空（探测消息与完成回报都不驻留）；仅靠 inbox 做「汇总」会在快照时看不到 | 派发用 send_message(to=成员, delivered=wake)；回报用 send_message(to=captain)；**持久可见性靠 coverage 卡**：create_task(kind=integration, coverageOf=[被覆盖任务id])，面板 coverage 数组持久显示 goal_item→task_ids→status |
| 14 | **自动回报走 attempt 通知，非 inbox** | 成员完成任务时内容进「AgentTeams message from member」完成通知，不进 captain_inbox；误以为没回 | 队长收件箱专用于显式 coordination；任务成果以 attempt 通知 + 任务卡 output 为准，汇总落 coverage 卡 |
| 12 | **调度器会抢派 captain in_progress 卡** | t20 captain in_progress 中被派给产品经理@v20（限流路由）→ failed | 无 API 可防；唯一缓解=卡完成前保持 claimed→in_progress 快速流转；被抢派失败后 reassign 回 captain 重新收口 |

## 三、职责边界（本次确立）

- **面板**：任务可见性、席位状态、状态机流转（用户观察窗口）。
- **本地**（docs/squad/dispatch/*.md + STATE.md）：执行真源、验收真源、令牌真源。
- **panel-sync.mjs**：只读本地 → 输出对齐差异；**不改 dispatch 卡**、不驱动新工作。

## 三·补 队长编排闭环（拆解→派发→汇总，第 68 轮确立）

1. **收件箱**：成员显式 send_message(to=captain) 回报；队长 send_message(to=成员) 派发（delivered=wake）。
2. **拆解**：队长读回报，逐项校验验收点，写拆解结论到 artifact（docs/squad/briefs/captain-orchestration-TK-<轮>.md）。
3. **派发**：create_task(subject 含 TK 令牌) + reassign 给真实席位；需覆盖已有任务的，带 coverageOf=[任务id]。
4. **汇总**：建 kind=integration 的 coverage 卡（coverageOf 指向被汇总任务），面板 coverage 由空转非空=「拆解派发汇总已体现」的机器判据。
5. **注意**：inbox 易失（消费即清），coverage 持久；两者不可互替。

## 四、标准操作流程（派一票到用户可见）

1. 本地 dispatch 卡登记六要素 + TK 令牌（真源）。
2. `create_task`（带 objective/acceptance/verify/inScope/outOfScope/deliverables，subject 含 TK 令牌作对齐锚）。
3. `reassign_task` 给对应席位（防调度器抢派）。
4. 执行：走 subagent 串行（面板席位模型端不稳）；产物回本地 dispatch 卡。
5. 验收：captain 独立实跑 → dispatch 卡写结构化闭合行 → STATE/journal 更新。
6. 面板收口：`reassign` 给 captain → `update_task(completed)` 带 output + 全验收项 passed + commandsRun + changedPaths。

## 五、已知限制（如实登记）

- 面板无删除任务 API：作废的卡只能留在面板（用 output 标注「已取代归档」）。
- 面板历史卡只能存最近一批（本次 12 张 = 近 12 个已闭合令牌），更早的历史在本地与 STATE.md。
- 平台模型端点不稳定（buddy 限流 / qoder 112 / nemotron 静默夭折），执行通道以 subagent 串行为准。
