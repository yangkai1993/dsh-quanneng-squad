# 大师级工程化补充采风 · Karpathy + Matt Pocock（2026-11-23 · 第三批）

> 〔采风留痕〕S-1 第三批：应用户点名"matt pocock 工程化大神怎么能不借鉴，Karpathy 更是一个值得借鉴的，要多次借鉴优秀项目和产品，站在巨人的肩膀去综合搭建"。每条附实测出处；星标为 GitHub API 实测值。

## 一、标的实测画像

### Matt Pocock（TypeScript 工程化大神 · ai-hero.dev）
| 仓库 | ★ | 定位 |
| --- | --- | --- |
| **mattpocock/skills** | **330.9K** | "Skills for Real Engineers. Straight from my .agents directory"——他本人日常用的技能库，已是 GitHub 星标前五级别的技能工程 |
| mattpocock/sandcastle | 9.2K | TypeScript 编排沙盒：`run({agent,sandbox,promptFile})` 一调用完成 沙盒→agent→分支→合并回；provider-agnostic（Bubblewrap/Seatbelt/Docker/Daytona/E2B/Fly/Modal/Vercel 可插拔） |
| dictionary-of-ai-coding | 5.6K | AI 编码术语白话词典 |
| agent-rules-books | 606 | AGENTS.md 规则书（Codex/Cursor/Claude Code） |
| evalite | 1.7K(弃) | 评测工具教训：自己维护评测器不可持续，转 Langfuse |

### Andrej Karpathy（从零可复现哲学）
| 仓库 | ★ | 定位 |
| --- | --- | --- |
| nanochat | 60.8K | "The best ChatGPT that $100 can buy"——最简全栈 LLM harness：tokenizer→pretrain→SFT→RL→eval→inference 一仓打通，$48 复现 GPT-2 能力 |
| nanoGPT | 65.0K / llm.c 31.5K / micrograd 19.1K / minbpe 11.1K | 同一哲学四部曲：极简、可读、教育性、从零可复现 |

## 二、Pocock/skills 工程化纪律解剖（六大机制）

1. **SCOPE.md 范围纪律（最高价值）**：issue 只在同时满足 ①"Observed failure"（描述真实会话里发生了什么、期望什么，假设性改进不算）②"fits the philosophy"（不撞 .out-of-scope/ 与历史拒绝）才保留；+1 和表情不算票；misc/ 冻结、issue 全关。→ **本项目映射**：G-REFLOW 已是同哲学（≥2 次才入表），但缺 **.out-of-scope/ 机制**（明确拒绝清单+理由留痕，防止同一被拒提议反复回来）。
2. **语言契约（GLOSSARY.md）**：每个术语一个正名 + _Avoid_ 反例词表（如 Issue tracker；_Avoid_: backlog manager/backend/host）——技能间词汇强制一致。→ 本项目映射：提示词/门禁/脚本对同一概念存在「席位/角色」「回报/产出」等变体；值得建立 GLOSSARY 正名表，drift-check 扩一门。
3. **技能双桶制**：engineering/（21 个：tdd/code-review/diagnosing-bugs/domain-modeling/implement/triage/retro/wayfinder…）+ productivity/（8 个：grilling/grill-me/handoff/teach/wait-what…）+ in-progress/（灰度）+ misc/（冻结）+ deprecated/。**生命周期显式化**。→ 本项目映射：26 提示词版本无生命周期标记（弃用/冻结/现行只有 INDEX 一列），可加 status 字段。
4. **SKILL.md 写法范式**：frontmatter 触发语 + 开篇"这是什么/何时用" + 正文引用伴生文件（tests.md/mocking.md 分层）。tdd 样本金句："Tests live at seams, never against internals"、"Before writing any test, write down the seams and confirm with the user"——**先确认接缝再动手**。→ 与本项目"写域先于派活"同构，可提炼为提示词语言。
5. **changesets 版本工程**：每个技能变更一个 changeset 文件，发布自动聚合版本。→ 本项目 CHANGELOG 手写，可改 changeset 式（每期一个片段文件，release 聚合）。
6. **.out-of-scope/ 9 篇**：每篇一个被拒绝方向的完整理由（harness-name-collisions/lazy-load/subagent-recursion/question-limits…）。→ 本项目"明确不做"只在 ROADMAP 一行，缺逐项理由文档。

## 三、Karpathy 工程化纪律解剖（四大机制）

1. **一仓全栈、阶段完整**（nanochat）：tokenizer→pretrain→SFT→RL→eval→inference 全生命周期在一个最小仓里，**无隐藏阶段**。→ 本项目映射：S-1~S9 已是全生命周期，等价✅。
2. **成本与可复现性作为一等公民**：README 直接给 $48/$15 复现账、Time-to-GPT-2 排行榜、单 8XH100 节点约束。→ 本项目映射：seat-utilization/metrics 有席位利用率，但**无"一轮编排成本账"**（每轮派几卡/几令牌/几个门红）——可给 TEAM-PULSE 加成本三数。
3. **tasks/ 评测即代码**：ARC/GSM8K/HumanEval/MMLU 每个任务一个类（num_examples/get_example/eval_type），tests/test_tasks.py 逐个机器验证。→ 与 crewAI expected_output、wshobson case.json 三源同构——**验收三元组+protected_paths（三期 A6）获得 Karpathy 背书**。
4. **tests/ 全组件覆盖**：tokenizer/optim/engine/execution/tasks 每个组件一个测试文件，无例外。→ 本项目 tests 47 用例已覆盖，等价✅。

## 四、sandcastle 编排原语（对 L1 dispatch 抽象的直接参照）

- **一次调用三件事**：`run({agent,sandbox,promptFile})` = 创建沙盒+启动 agent+分支策略，返回 `{iterations[], commits[], branch}` 机器可读结果。
- **Provider 两维可插拔**：agent provider（claudeCode()/codex()）与 sandbox provider（docker()…）都是函数，注入即换。**结果按 iterations 流事件返回**。
- **术语表驱动文档**：docs/guide 一页一术语 + glossary.md 全术语。
→ **L1 dispatch-plan.mjs 接口设计定型**：`createDispatchPlan({round,w,seats,cards}) → {jobs[], missingCards[]}`，每 job = {seat,token,card,domain,deliverable,goal,artifacts,acceptance,message}——与 sandcastle 的"调用返回机器可读结果"同构；roster 三接口同理。provider 两维可插拔映射为本项目的「预设 provider + 通道 provider」（subagent 主通道/agent_teams 兼容通道即两个通道 provider）。

## 五、落点并入（ROADMAP 更新）

| # | 机制 | 出处 | 落点 | 期 |
| --- | --- | --- | --- | --- |
| B1 | .out-of-scope/ 拒绝清单机制（逐项理由留痕） | Pocock SCOPE.md | docs/squad/OUT-OF-SCOPE.md 首篇（改宪法/回钉模型/外部看板 3 篇起步）；G-REFLOW 拒绝议题引它 | 一期（文档轻量） |
| B2 | GLOSSARY.md 正名+Avoid 反例词表 | Pocock/Glossary | docs/squad/GLOSSARY.md：席位/令牌/写域/回报/门 五正名起步；drift-check 扩术语漂移检测 | 二期 |
| B3 | 成本三数（轮均卡数/令牌数/门红数） | Karpathy 成本账 | pulse.mjs 输出补 cost:{cards,tokens,gateReds} | 二期 |
| B4 | 技能生命周期 status 字段（current/frozen/deprecated） | Pocock 双桶制 | prompts/INDEX.md 主表加 status 列 | 三期 |
| B5 | changeset 式 CHANGELOG（每期片段文件，release 聚合） | Pocock changesets | CHANGELOG.d/ 目录 + release 链聚合步 | 三期 |
| B6 | dispatch 接口对齐 sandcastle 返回形态（jobs[]+missingCards[] 机器可读） | sandcastle run() | 一期 dispatch-plan.mjs 接口规格已按此定型 | 一期 |
| B7 | evalite 教训：评测器不自研重维护，用快照+静态层即可 | Pocock evalite 弃维声明 | A1 评分快照只用静态层（P 覆盖/长度/结构/触发语），LLM judge 不做 | 二期（A1 边界） |

## 六、三条采风总结论

1. **"极简可复现"是 Karpathy 的唯一纪律**：nanochat 53 个文件做完别人几万文件的事——本项目 60 脚本/384 文件对齐S-1~S9全周期，方向一致，但**每期必须守"新增≤12 文件"红线**，防止 feature creep 背离极简。
2. **"真实会话观察"是 Pocock 的准入铁律**：Observed failure 门槛 + .out-of-scope 拒绝留痕 + misc 冻结——本项目 G-REFLOW 同哲学，补 B1/B4 把生命周期闭环。
3. **两人在"评测"上汇合**：Karpathy tasks 即代码、Pocock evals 快照+弃维自研 judge——三期验收三元组+A1 静态快照是汇合点，LLM judge 明确不做（B7）。
