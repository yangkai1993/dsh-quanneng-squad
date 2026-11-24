# 独立验收 · 流程重跑（总指挥，不凭派活回执）

## 清理证据
- 非小队探针：probe-spawn / probe-role2 `status:inactive`，无 active 非小队会话（list_agents 实测）。
- 残留卡：task-1 `status:deleted`、PING-在岗检测板面卡 `action:delete` ok。
- 新 team：quanneng-squad，8 名成员**全部属于 16 人小队**，零探针。

## 产物
10/10 阶段文件落 docs/squad/rerun/，全部头部标注「成员复核待补」；零占位符。

## 双栈测试（本轮重跑）
| 栈 | 命令 | 结果 |
| --- | --- | --- |
| Java 基线 | gateway-java mvn -B test | 9/9 BUILD SUCCESS |
| Node 归档 | node --test tests/gateway.test.js | 11/11 exit 0 |

## 名册
16 人 squads_run_member 全部 ok/running；6 个 spawn slug 在 list_agents（inactive 但注册）、8 人 team.json。宿主 cap=8 为硬限制。

## 结论
R1 删除 ✅ / R2 重跑全链 ✅ / R3 全编 16 成团 ✅ / R4 反馈闭环 ✅。
G-S2' 转 **PASS（附条件：用户确认 A3 口径 + Java 端 4 条整改转 G-S6）**。
