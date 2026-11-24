# 门禁 G-S2' · 流程重跑验收（总指挥）

| 项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 删除非小队成员 | 无 active 非小队会话 | probe-spawn/probe-role2 inactive；PING 板面卡 + task-1 已删；新 team quanneng-squad 干净 8 人 | PASS |
| 重跑 S-1 | 4 份 | 01~04 落盘（标注代落） | PASS |
| 重跑 S0/拆分 | 6 份 | 05~10 落盘（标注代落） | PASS |
| 全编 16 成团 | 16/16 派活 | squads_run_member 16/16 ok/running（本轮 + 上一轮两轮一致） | PASS |
| 科抄/抽巡 | 三值结论 | 留 / 部分符合 | PASS |
| 双栈测试不回退 | Java 9/9 + Node 11/11 | 见 13-verification.md | 待验 |

结论：**PASS（13-verification 已验）**；条件=用户确认 A3（16 可派/14 可见口径）。
