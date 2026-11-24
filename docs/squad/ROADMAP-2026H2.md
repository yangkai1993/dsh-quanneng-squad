# 全能小队插件 · 整体优化迭代总方案（v1.0 · 2026-11-23）

> 〔方案定位〕本文件是插件的**唯一总迭代方案**：以 ARCH-LAYERS 六层为骨架、对标采风（intel/multi-agent-benchmark-2026-11-23.md）为输入、编排梳理 5 缺口为起点，收敛为一个分期路线图。宪法层约束（CONSTITUTION C1~C10）不触碰；P15 不锁死模型为红线。
> 〔裁决口径〕分期经用户批准后逐期实施；每期独立版本号、独立 release 全链验收（exit0+verify 断言数不减+hard-green）。
> 〔采风输入〕intel/multi-agent-benchmark（编排面十机制）+ intel/eng-skill-benchmark-2026-11-23.md（工程化技能面 A1~A7）+ intel/master-benchmark-2026-11-23.md（大师面 B1~B7：Pocock skills 330.9K 的 SCOPE/GLOSSARY/out-of-scope 纪律 + Karpathy nanochat 60.8K 极简可复现哲学 + sandcastle 编排原语）

## 0 · 现状底盘（实采数据）

| 维度 | 现值 |
| --- | --- |
| 版本 | 1.14.1（PATCH 轨），包 384 文件/112 mjs |
| 六层 | L0 契约底座 ✅ / L1 领域能力 ✅（2 缺口） / L2 交付运维 ✅ / L3 体验 ✅(1.13.0) / L4 治理横切 ✅ / L5 可观测 ✅(1.14.0) |
| 门禁 | 9 门脚本+gate-kit 统一协议+verify 104 断言+release 34 步链 |
| 编排 | round-events Event Sourcing（建而未用，仅 1 条迁移事件 round 0→71）+ squad-autopilot 五动作 + W1~W4 换班 |
| 提示词 | 26 个版本化文件，INDEX.md 唯一指针，P1~P15 内化 |
| 已知缺口 | 编排 5 缺口（通道双轨/真源分叉/L1 抽象/help 缺陷/编排断言空）+ 对标 10 机制未收编 |

## 1 · 迭代北极星（三条）

1. **事件驱动编排闭环**：轮次/令牌/派活/回报/验收全部事件化，叙述文档降级投影（对标 langgraph checkpoint + edict 状态机）。
2. **验收机器可判**：从"散文验收"到"文件存在/exit0/阈值"三元组（对标 crewAI expected_output）。
3. **harness 不绑模型**：路由只建议不钉死（P15 红线，对标 ruflo Agent=Model+Harness）。

## 2 · 六层逐层方案

### L0 契约底座（维护+1 组件）
- 现有 8 组件保持；**新增 event-store**：`lib/event-store.mjs` 统一 append/read/derive（复用 round-events.mjs 逻辑），事件类型常量 EVENT_TYPES={ROUND_ADVANCE,TOKEN_ISSUE,DISPATCH,REPORT,ACCEPT,REJECT}。
- 验收：append 幂等（seq 唯一）+ deriveState 纯函数 + 负向（损坏行 fail-closed 跳过并计数）。

### L1 领域能力（补 2 缺口 + 通道统一）
- **dispatch 抽象**：`scripts/lib/dispatch-plan.mjs` 导出 `createDispatchPlan({round,w,seats,cards})`，squad-autopilot --dispatch 改为薄壳调用（零行为变化）。
- **roster 抽象**：`scripts/lib/roster.mjs` 导出 read()/write()/clearPins()，export-roster 与 sync-seat-model 共用。
- **通道统一（最高优先）**：autopilot dispatch 消息体去 `agent_teams_send_message(to=captain)`，改「回报直接回主对话+落盘 inbox 兼容留痕」；--collect 改为事件源取数（REPORT 事件），inbox 降级为只读留痕。
- **状态机门**：`scripts/state-machine-gate.mjs`：令牌生命周期 planned→dispatched→reported→accepted/rejected，非法跳转拒绝（对标 edict kanban_update）。接入 squadctl gate:* 与 release 链。

### L2 交付运维（升级伴随发布）
- upgrade/rollback/pack/smoke 保持；升级链中补「事件日志迁移」步骤（老 profile 无 events 目录时自动初始化）。
- 验收：四路径不变 + 升级后 roster/gates 全绿。

### L3 用户体验（对标补强）
- quickstart/status/light-mode 保持；**新增 `squadctl pulse:board`**：TEAM-PULSE 数据渲染三态徽章（🟢活跃≤24h/🟡停滞≤72h/🔴告警>72h，mtime 实测）（对标 edict 心跳徽章）。
- 验收：badge 三态与 mtime 阈值一致 + 负向（伪造 mtime→对应态）。

### L4 治理横切（门面扩容）
- verify 补 `orchestration.mjs` 断言（当前为空）：rotation 可解析/事件日志存在/令牌格式/状态机门接入 ≥4 条。
- reflow：若通道统一引发新反复模式，按 S9→G-REFLOW 增补 P16。
- EXEMPTIONS/SUPERVISION/G-REFLOW 机制不变。

### L5 可观测（事件维度）
- telemetry record 补 `seat` 字段 + `squadctl obs:rank`：按席位聚合 Token/活动排行（对标 edict 官员总览）。
- hub 五源聚合补第六源：state-machine-gate。
- diagnostics 症状表补「事件日志损坏」「令牌状态机卡死」两条路由。

## 3 · 分期路线图（版本化）

| 期 | 版本 | 内容 | 涉及文件（≤12） | 依赖 |
| --- | --- | --- | --- | --- |
| **一期 事件化编排** | 1.15.0 MINOR | L0 event-store + L1 通道统一/dispatch 抽象/roster 抽象/状态机门 + L4 orchestration 断言 + round 71↔68 对账事件 + ROSTER-16 §七 改 Event Sourcing 口径 + B6 dispatch 接口对齐 sandcastle（jobs[]+missingCards[] 机器可读返回）+ B1 OUT-OF-SCOPE.md 拒绝清单（3 篇起步） | lib/event-store.mjs、lib/round-events.mjs、scripts/lib/dispatch-plan.mjs、scripts/lib/roster.mjs、scripts/state-machine-gate.mjs、squad-autopilot.mjs、verify/assertions/orchestration.mjs、ROSTER-16.md、ARCH-LAYERS.md、docs/squad/OUT-OF-SCOPE.md | 无 |
| **二期 可观测+技能化增强** | 1.16.0 MINOR | L3 pulse:board 三态徽章 + L5 telemetry seat 维度 + obs:rank 排行 + hub 第六源 + A1 提示词评分快照（prompt-score.mjs+snapshot，verify 断言）+ A2 技能化（assets/skills/ 12 个 SKILL.md，sop-inject 触发式注入降 token）+ B2 GLOSSARY.md 正名表（席位/令牌/写域/回报/门+Avoid 反例）+ B3 轮成本三数（卡/令牌/门红）+ B7 A1 边界=纯静态层不做 LLM judge | scripts/ux/pulse-board.mjs、observability/telemetry.mjs、hub.mjs、rank.mjs、diagnostics.mjs、scripts/prompt-score.mjs、assets/skills/*、lib/index.js | 一期 |
| **三期 流程回环+验收结构化** | 1.17.0 MINOR | S5→S4 fix 回环（DELIVERY-PIPELINE 补段+stage-order 适配）+ 验收三元组扩展 protected_paths（A6，防改测试凑绿）+ A3 AGENTS.md 单源化 + A4 garden 漂移门扩容（孤儿/超长/回程三检测）+ B4 prompts/INDEX status 生命周期列 + B5 CHANGELOG.d/ changeset 式聚合 | DELIVERY-PIPELINE.md、stage-order.mjs、dispatch-guard.mjs、drift-check.mjs、AGENTS.md、scripts/build-agents-context.mjs | 一期 |
| **四期 谋断升级** | 1.18.0 MINOR | S6 多署会审（御史/给事中/考功并行独立复核）+ A5 模型建议层别名表（lib/model-tiers.mjs，映射表生成期转换，运行时零字面量）+ 派单清洗 + S1 工作量预估 | audit 流程文档、pipeline 文档、sync-seat-model.mjs、squad-autopilot.mjs | 一期 |
| PATCH 轨 | 1.15.x~ | squadctl help grouped 输出修复 + A7 pack --check 清单-文件对账（category 字段） | squadctl.mjs、delivery/pack.mjs | 随时可进 |

## 4 · 验收红线（每期通用）

1. release 全链 exit0；verify 断言数不减（104 起）；tests 47/47；fixture 26/26；hard-green。
2. 无新增 provider/model 字面量（P15）；零 npm 外部运行时依赖。
3. 每期 CHANGELOG/STATE/ledger 三登记 + install 同步宿主。
4. 行为变更须有负向用例（P4：注入缺陷→红）。
5. 每期收尾按 S8 记注（journal）+ S9 反哺检查（是否触发新 P 模式）。

## 5 · 明确不做（边界）

- 不改宪法层（C1~C10）；不改 16 席编制与 W1~W4 名册结构；不改 11 门既有语义（只扩不删）。
- 不引入 npm 运行时依赖；不建外部服务/看板 UI（edict 式 Web 看板超出现有形态，若用户需要另立项）。
- agent_teams 兼容通道保留但不再投入；inbox 只读留痕。
