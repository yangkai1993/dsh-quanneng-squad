# 多智能体编排对标采风 · GitHub/Gitee/GitCode（2026-11-23）

> 〔采风留痕〕S-1 阶段产物，总指挥代行采风官职能（当前轮次无在席采风官）。每条约束附出处；「待验」判定以当前代码为准。
> 数据源：GitHub REST API 实测（星标/描述/README 原文），Gitee API 返回空、GitCode API 400——同类开源创新集中在 GitHub，Gitee/GitCode 无更高量级对标（已如实记录）。

## 一、对标项目一览（星标为实测值）

| 项目 | ★ | 编排范式 | 与本项目同构度 |
| --- | --- | --- | --- |
| OpenHands/OpenHands | 94.1K | AI 驱动开发 harness | 低（单 agent 深度） |
| ruvnet/ruflo | 82.3K | swarm+federation+自学习记忆 | 中（harness 定位同） |
| FoundationAgents/MetaGPT | 71.4K | 软件公司 SOP 内嵌框架 | 高（角色=公司职位） |
| microsoft/autogen | 62.0K | 会话编程 GroupChat | 中 |
| crewAIInc/crewAI | 61.2K | Crew+Task+Process 三抽象 | 高（角色+任务卡） |
| agentscope-ai/agentscope | 36.5K | 可观测/可理解/可信 | 中 |
| wshobson/agents | 42.8K | 子代理提示词库+命令 | 高（prompts 同构） |
| langchain-ai/langgraph | 45.3K | 图编排 checkpoint/time-travel | 中 |
| Yeachan-Heo/oh-my-claudecode | 41.0K | staged pipeline 多模式编排 | 高（Claude Code 同宿主） |
| OpenBMB/ChatDev | 34.9K | ChatChain 双角色对话 | 高 |
| VoltAgent/awesome-claude-code-subagents | 26.7K | 100+ 专项 subagent 库 | 高 |
| cft0808/edict | 17.1K | 三省六部制+军机处看板 | 极高（同文化原型） |
| kyegomez/swarms | 7.4K | 企业级 swarm | 中 |

## 二、可借鉴机制与本项目落点（按 ROI 排序）

| # | 机制 | 出处 | 本项目现状 | 落点 | 期 |
| --- | --- | --- | --- | --- | --- |
| 1 | 状态机强制转换：非法看板跳转被拒绝（kanban_update.py） | edict | round-events.jsonl Event Sourcing 雏形但仅 1 条迁移事件，建而未用 | 事件类型扩容 DISPATCH/TOKEN_ISSUE/REPORT/ACCEPT + 状态机门（planned→dispatched→reported→accepted 非法跳转拒绝） | 一期 |
| 2 | 心跳徽章三态 🟢活跃/🟡停滞/🔴告警 | edict 军机处看板 | TEAM-PULSE 有席位活动，无三态徽章 | pulse.mjs 按 mtime 距今阈值出三态 | 二期 |
| 3 | staged pipeline 显式回环：team-plan→prd→exec→verify→fix(loop) | oh-my-claudecode | S-1~S9 线性，verify 不过=「判未完成」，无显式 fix 回环 | DELIVERY-PIPELINE 补 S5-VERIFY→S4-FIX 回环规则（verify 红→定向返工→复跑） | 三期 |
| 4 | 任务级 expected_output 机器可校验 | crewAI Task | dispatch 卡六要素有验收但为散文，机器不可判 | dispatch 卡验收字段结构化（文件存在/exit0/行数阈值三元组），dispatch-guard 补读 | 三期 |
| 5 | checkpoint/time-travel 全程可回放 | langgraph | memory:replay 已有 JSONL 机制（telemetry 同型），轮次事件缺位 | 与 #1 合流：事件日志齐后任意轮回放免费获得 | 一期 |
| 6 | Token 消耗按席位排行榜 | edict 官员总览 | telemetry.jsonl 无席位维度 | telemetry record 补 seat 字段+聚合命令 | 二期 |
| 7 | 多角色会审：同议题多署并行辩论 | edict 朝堂议政 | 谋断四署串行抽巡 | S6 升级「多署会审」：御史/给事中/考功并行独立复核同一批变更 | 四期 |
| 8 | 按任务性质路由建议（Opus plan/Haiku execute） | OMC/Claude-Orchestrator-Skill | sync-seat-model 已实现跟随宿主默认（P15 不钉死） | 席位路由**建议层**（只读席建议轻模型），只建议不钉死，与 P15 相容 | 四期 |
| 9 | 旨意数据清洗：派单自动剥离路径/元数据/无效前缀 | edict | dispatch-guard 查写域转述，无清洗 | dispatch 消息体生成时清洗「见卡/待派」类占位转述 | 四期 |
| 10 | 模板库+工作量预估 | edict 旨库 | ux-templates.json 6 场景已有 | S1 拆分卡补工作量预估字段（S/M/L） | 四期 |

## 三、对本项目的约束清单（采风结论）

1. 〔已实现〕派活六要素（阶段/目标/产物/写域/验收/证据）覆盖 crewAI Task 抽象的字段面，差距在验收可机判性（#4）。
2. 〔已实现〕11 门统一 gate-kit 协议优于对标项目普遍缺失的机器门禁层——这是本项目相对对标的独有优势，保持。
3. 〔待验→实证〕edict 与本项目同为朝廷制式，其「权限矩阵白纸黑字」对应 AGENTS §1 目录所有权表，等价；其多出的是「谁能给谁发消息」的**通信权限矩阵**——本项目 AGENTS §5 已禁成员间直连，等价覆盖。
4. 〔缺口已立案〕Gitee/GitCode 无更高量级同类对标，后续采风以 GitHub 为主源。
5. 〔教训〕ruflo 定位「Agent = Model + Harness」与本插件 lib/index.js SOP 注入层同构：框架价值=harness 不绑模型。P15「不限制模型」规约与业界主流一致，不得回退。

## 四、版本化分期建议

一期（行为变更，1.15.0 MINOR）：#1+#5 事件源激活+状态机门（与通道统一 P0 同批）。
二期（1.16.0 MINOR）：#2+#6 可观测增强。
三期（1.17.0 MINOR）：#3+#4 流程回环+验收结构化。
四期（PATCH 累积）：#7~#10。
