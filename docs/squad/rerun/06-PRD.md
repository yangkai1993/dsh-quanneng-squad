> 流程重跑第 2 轮。派活已发（agent_teams wake 5 / squads_run_member running 5），成员会话未回传正文；由总指挥按 squad-toolkit 模板代落，标注「成员复核待补」，不冒充成员产出。

# PRD · 流程重跑（R1~R4 可测验收）

| 需求 | 验收判据 | 证据 |
| --- | --- | --- |
| R1 删除非小队成员 | list_agents 中无 active 非小队；PING 板面卡与 task-1 已删 | 本轮实测 |
| R2 重跑全链 | S-1(4) + S0/拆分(6) 共 10 份 rerun 产物 + 门禁 + 复盘 | rerun/ |
| R3 全编 16 成团 | squads_run_member 16/16；team.json 8；spawn slug 6 | ROSTER-16.md |
| R4 反馈闭环 | journal → CR → KPI → 五态提案 → 复审门禁 | 11-gate.md / 12-retro.md |

成功指标：双栈测试不回退（Java 9/9、Node 11/11）；零并发覆写；成员回报 ≤40 行。
反馈优化闭环定义：用户反馈 → journal → 缺陷/CR → M1~M9 → P-* 五态管线 → 给事中复审 → G-S6 → 回报用户。
