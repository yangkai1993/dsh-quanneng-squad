# 智能组织对标调研 · 业界方案与全能小队差距

> 用户指令「参考 GitHub 上所有专家团/专家/skills 完善全能编程小队」。本文件记录调研事实，改进必须引用此处。

## 一、本会话可用资源（实测）
- 专家团 1 个：team-technical（架构/安全/验收三维，coordinator=template；引擎 disabled 因 Agent Team 宿主未就绪）。
- 专家 65 名 / 6 分部：company 1 / design 10 / engineering 40 / security 3 / specialized 10 / testing 1。
- 对小队高价值专家：Agents Orchestrator（自主流水线 leader）、Reality Checker（默认 NEEDS WORK、压倒性证据才通过）、Codebase Archaeologist（多工具多会话漂移检测）、AI-Generated Code Security Auditor、Automation Governance Architect、Agentic Identity & Trust Architect。
- GitHub：VoltAgent/awesome-agent-skills（1497+，官方团队维护、非 AI 批量生成）、awesome-claude-code（58k stars）。

## 二、Anthropic 官方《How We Built Our Multi-Agent Research System》要点（权威）
1. **orchestrator-worker**：lead 分析→拆解→并行 specialized subagents；多 agent 比单 agent 高 90.2%，前提是正确拆解。
2. **token 是核心资源**：token 用量解释 80% 方差；subagents 用独立 context 做「压缩」（distilling insights），每个 subagent 带独立工具/提示词/轨迹，降低 path dependency。
3. **委派要写清**：每个 subagent 需要 objective + output format + tools/sources 指导 + clear boundaries（对应我们 AGENTS §4 六要素）。
4. **errors compound / stateful**：长运行 agent 不能出错从头重启；用 durable execution + retry + checkpoints + 从出错点续跑。=> 这正是我们虚报事故的跨域根因（叙述补状态 vs durable checkpoint）。
5. **生产可观测**：full production tracing 才能诊断「为什么没找到明显信息」；监控 agent decision patterns。
6. **评估 rubric**：factual accuracy / citation accuracy / completeness / source quality / tool efficiency；单个 LLM judge 输出 0.0-1.0 + pass/fail 最一致。
7. **失败模式**：agent 在已有足够结果时仍继续、查询过冗长、选错工具——靠准确的 mental model 与提示词纠正。

## 三、全能小队差距（对照上述事实）
| 差距 | 业界做法 | 我们现状 | 优先级 |
| --- | --- | --- | --- |
| token/context 预算门 | Anthropic：token 解释 80% 方差，独立 context 压缩 | 无 token 预算，context 靠压缩摘要人工管 | 高 |
| checkpoint/从出错点续跑 | durable execution + retry + checkpoint | 事件真源已有，但无 checkpoint 恢复协议 | 高 |
| rubric 式质量评分 | 单 judge 0-1 + pass/fail，5 维 | 我们只有 pass/fail 布尔，无多维评分 | 中 |
| 生产 tracing | full decision tracing | pulse/supervise 有观测，但无 agent 决策轨迹 | 中 |
| 专家能力缺口 | Reality Checker / Archaeologist / Orchestrator | 无专职验收怀疑者、漂移考古、自治编排 | 高 |

## 四、改进原则（第一性原理）
- 不照搬专家团配置（其引擎 disabled）——借鉴其**职责设计**：架构/安全/验收三维独立、默认怀疑、证据分级。
- 每项改进必须落成机器可验证（门/夹具/断言），禁止 MD-only 纪律。

