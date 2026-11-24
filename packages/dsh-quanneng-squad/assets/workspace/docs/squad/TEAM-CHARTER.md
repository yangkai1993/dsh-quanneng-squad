# 全能编程小队 · 成团宪章（2026-11-06 实测版）

## 一句话结论
**16/16 成员全部作为可派活会话在智能体中在岗**（`squads_run_member` 两轮 16/16 ok/running）；其中 14 人额外在 team 总线可见/可消息。宿主 `list_agents` 名额硬上限 8，故「16 人同时出现在名册视图」需宿主放开 cap，已如实标注，不伪装达成。

## 三个通道各司其职
| 通道 | 用途 | 上限 | 实测 |
| --- | --- | --- | --- |
| `squads_run_member({squadId,memberId,task})` | **正式派活（全编 16）** | 无 | 16/16 ok/running |
| `agent_teams_add_member` + `agent_teams_send_message` | team.json 原生消息（前 8 人） | 8 | 8/8 wake / mailbox |
| `spawn_teammate({name:slug,...})` | 绕过 add_member 上限、进 `list_agents`、`send_message` 可达 | 累计 8 名额 | 6 人 + 2 探针占位 |

## 成团证据
- `docs/squad/ROSTER-16.md`：16 人名册 + preset/权限/slug 映射 + 宿主约束。
- `docs/squad/FUNCTIONAL-MATRIX.md`：16 项基础设想逐项 ✅/⚠️，不掩饰缺口。
- `docs/squad/inbox/<角色>.md` × 16：每员唯一落盘回报点，全部有在岗登记行，零超 40 行。
- `docs/squad/dispatch/<角色>.md` × 16：状态由「未派活」更新为「已成团登记，待正式故事卡」。
- 6 名 spawn 成员回报 `send_message({target:'lead'})` → `sent:true`；8 名 team.json 成员 `agent_teams_send_message` → wake/mailbox。

## 基础设想实现状态（摘要）
已落地：三省六部流水线、S-1 谋断门、S0 拷问门、PRD、ADR-001→ADR-002（用户 A4 推翻）、CR-002 五步闭合、EARS 故事卡、目录所有权、文档总线、反馈优化闭环、全编 16 激活、G-S2 PASS。
Java 基线（A4）：`gateway-java/` mvn test 9/9 BUILD SUCCESS；旧 Node 实现归档保留，11/11 仍通过。
仍缺（见 FUNCTIONAL-MATRIX）：G-S1/S3/S4/S5/S7、stories 多卡实例化、Vue3 前端栈（零 UI 需求）、Java 端 A15/HMAC/KMS/负向断言、L4 点火、16 人同时可见。

## 下一步（需用户/宿主）
1. 宿主放开 `list_agents` 名额或允许分多 team → 16 人同时可见。
2. 按故事卡正式派活补齐 G-S1/S3/S4/S5/S7 与 stories/ 多卡。
3. 御史 4 条整改条件闭环后进 G-S6。


## 附：v2.13 重设计（cap=8 校准）

- 席位模型由「累计上限」校正为「并发 8 席、可释放、名字永久占额、别名可复用」。
- 全编 16 的实现方式改为「编制常驻 + 4 轮 8 席换班全覆盖」，见 ARCH-REDESIGN-cap8.md / ROSTER-16.md §七。
- W1→W2 演练 4→8→4→8 成功，全编派活 16/16 不受限，见 audit/ROTATION-DRILL.md。



## 附：v2.14 组合架构（多智能体 + 专家团知识层）
- 专家团宿主不可执行，改为 expert-packs/ 落盘知识层，由 squads_run_member 任务书注入。
- 真实项目验证：SN26 Java 网关 6 条安全整改，18/18 通过，自纠正 3 轮收敛，见 audit/HYBRID-VALIDATION.md。

