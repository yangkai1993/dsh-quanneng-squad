# S6 封驳抽巡整改记录（2026-11-15）

> 来源：docs/qa/audit-round-52.md（给事中@v17，TK-53-03）。命题「制定者自身也在约束面内」原判不成立。
> 指挥按 R6 逐条整改；本报告只记指挥写域（scripts/、gates/）的动作，不改成员审计原文。

| 否决项 | 原问题 | 整改 | 实证 |
| --- | --- | --- | --- |
| V-52-01 (blocker) | memory-sla.mjs 无 process.exit，ok:false 零消费 | 改 runGate/failFast 默认阻断；GATE_IDS 增 memory-sla；supervise 消费 problems 进 attention | 正常 exit0；OUTBOX=101 → ok:false / exit1 / 门阻断；负向临时目录清理 |
| V-52-02 (blocker) | env 单因素自免（active={} 仍 exempted:true）且对 facts.greenLevel 隐身 | exemptions.mjs 改「envSet && byFile」双因素；facts.mjs 把 env 尝试计入 activeExemptions | C4 复现 exempted:false/envIgnored:true；facts greenLevel=red + env:QUANNENG_ALLOW_L4_GAP |
| C7 squadctl | verify 无断言、release 不经入口 | verify 增 MAP/ctl-help 断言 + V-52-01/02 回归断言 | verify 全绿 |
| W 注入 / MAP 硬编码 / 文本匹配 / 制度自审 | 制定者可注入 W、MAP 静态、源码文本匹配、门自身未自审 | 本记录 + verify 3 条回归断言把「制定者也在约束面内」变成机器可查；W 注入属测试依赖注入契约（ISP），保留但由 facts 对 env 可见 | verify 断言实跑 |

## 复核口径

- verify.mjs 的「exempted gate traces on stderr」用例已改为双因素（临时 EXEMPTIONS.md + env），负向「仅 env、无文件表」实跑 [门阻断]。
- 云端 Hindsight 不可达，本地 DECISIONS.jsonl 为最终权威；OUTBOX 待恢复 replay。

