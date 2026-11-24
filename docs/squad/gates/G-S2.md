# 门禁 G-S2 · 需求基线 + 架构契约 + 技术框架

| 项 | 值 |
| --- | --- |
| 结论 | **PASS（附 G-S6 前整改条件）** |
| 日期 / 主判 | 2026-11-06 / 总指挥（给事中初判「留」、御史「部分符合」） |
| 相关文档 | clarifications-SN26.md、PRD-sn26-gateway.md、ADR-001-tech-stack.md、STORY SN26-001、review-gate.md、patrol-SN26-001.md、CR-001 |

## 对表
| 验收项 | 证据 | 结论 |
| --- | --- | --- |
| 提示词优化 | docs/prompts/clinic-2026-11-06.md 五维评分 5/10 + 定稿 | PASS |
| 情报 | docs/intel/intel-gmssl-sm2.md 8 条带来源 | PASS |
| 风暴/票拟 | brainstorm 4 备选、ticket-001 独立「慎行」 | PASS |
| S0 拷问门 | clarifications A1~A4 + 跟踪清单 | PASS |
| PRD R1~R4 | PRD-sn26-gateway.md | PASS |
| **技术框架选择** | ADR-001 ≥3 备选 + 四维评分 + 被否理由 + 推翻条件 | PASS |
| **需求拆分** | stories/SN26-001.md EARS 五类 | PASS |
| **反馈优化闭环** | CR-001 + retro-v1.0-pipeline + P-002 + PIPELINE-CHECK 11/11 | PASS |
| 框架偏离程序正义 | CR-001 五步链仅第 2/3 步完成，用户 A4 未确认 | **CONCERNS** |

## 保鲜钩子
doc-freshness 六对一致；本轮新增 14 份文档需在下轮台账登记账龄。

## 结论
工程与需求工程层面放行；**条件放行**：需用户确认 A4（追认 Node 基线或回到 Java 基线）并补齐 CR-001 会签/批准/归档。未确认前不得宣称框架选择已获批准。


## A4 更新（2026-11-06）
用户拍板「回到 Java 基线」→ ADR-001 结论被推翻，落 ADR-002 + CR-002 + clarifications-SN26-A4-decision.md。技术框架选择的需求项 R4 已闭环到用户决策；剩余条件=CR-002 五步链补齐（会签/科抄/预审/归档）与 Java 工程编译测试通过。G-S2 在编译验收前保持 CONCERNS。


## A4 执行验收（2026-11-06 终版）
- 用户拍板「回到 Java 基线」→ ADR-002 / CR-002 / A4-decision 落盘。
- gateway-java：Maven 3.9.9 + JDK21(release 17) + Spring Boot 3.5.16 + BC 1.78.1 + MySQL/Redis 依赖；`mvn test` **9/9 pass / 0 fail / BUILD SUCCESS**。
- 业务契约保持：规范签名串、SM2 裸 R‖S 64B、SM3 标准向量、SM4-CBC、应答三层、状态机、UNKNOWN 不重发，均有 JUnit 断言。
- 科抄「抄可」、御史「部分符合·整改条件」。
- 遗留（转 G-S6）：Java 端 A15 全掩码+HMAC 接线、生产 KMS/HSM、EARS 负向断言/RSA2 用例、Vue3 前端栈本轮零范围（无 UI 需求）。
