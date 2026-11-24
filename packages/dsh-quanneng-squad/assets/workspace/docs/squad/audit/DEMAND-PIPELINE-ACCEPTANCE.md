# 需求工程流水线 · 独立验收（2026-11-06 第六轮）

## 用户指出的四项缺失 → 处置
| 缺失 | 产物 | 验收 |
| --- | --- | --- |
| 提示词优化 | docs/prompts/clinic-2026-11-06.md（四要素盘点 / 补问≤3 / 五维评分 5/10 / 结构化定稿） | ✅ |
| 没有拆分 | stories/SN26-001.md（STORY 模板实例化、EARS 五类、目录所有权、自测记录）；TRACE 15 项 | ✅ |
| 没有反馈优化 | CR-001 + retro-v1.0-pipeline(M1~M9) + P-002 五态提案 + PIPELINE-CHECK 11/11 + G-S2 复审 | ✅ |
| 没有技术框架选择 | docs/arch/ADR-001-tech-stack.md（4 备选 / 四维评分 / 被否理由 / 推翻条件 / CR 五步链） | ✅ CONCERNS |

## 完整 SOP 链路（15 份落盘）
S-1：clinic → intel → brainstorm → ticket（太傅「慎行」与集贤「A」独立、并列）
S0：clarifications（A1~A4）→ PRD（R1~R4 可测验收）
架构：ADR-001 → CR-001 → 给事中科抄（留）→ 御史抽巡（部分符合）→ G-S2（CONCERNS）
拆分：STORY SN26-001 → TRACE 15/15
反馈闭环：journal → bugs/CR → M1~M9 → P-002 五态管线 → 回归门 → 复审门禁 → 回报用户

## 派活与回传实况（如实记录，不冒充）
- 10 个真实任务已派：4 人走 `squads_run_member`（ok/running），6 人走 `agent_teams_send_message`（wake）。
- **成员会话未回传正文**：3 个 inbox（交付发布经理/御史大夫/需求经理）有 S-1/S0 相关回声，但 15 份正文均由总指挥按 squad-toolkit 模板**代落**，每份头部标注「成员复核待补」。
- 这与 INTERACTION.md §八 的实测一致：派活通道单向可靠，回报正文仍需指挥代落；不得声称「已由成员独立完成」。
- 按 G-S2 条件，成员复核与 CR-001 会签仍为待办。

## 技术框架冲突（核心发现）
`cordis.patch.yml` 的 `squad-arch` persona 写死 **Java 17 + Spring Boot 3.x + MySQL 8 + Redis；Vue 3 + TS + Vite + Pinia + Element Plus**，
而交付为 **纯 Node ESM 零依赖**（package.json、20 个 .js）。用户从未明示覆盖 → 属契约级静默偏离，ADR-001 状态为「提案」，CR-001 五步批准链仅完成第 2/3 步。

## 需要用户拍板（A4）
1. **追认现状**（推荐）：批准 CR-001，把 Node ESM 零依赖写入宪法/ADR，补齐会签与归档，G-S2 转 PASS。
2. **回到 Java 基线**：重写 20 模块与全部测试，成本最高（ADR-001 备选 C 评分 10/20）。
3. **双轨**：Node 作参考实现，另立 Java 生产基线。

## 验收数字
- 产物 15/15 落盘、零占位符；TRACE 15/15 覆盖；gates 现有 G-S2/G-S6。
- 回归门 PIPELINE-CHECK 11/11 PASS；P-002 仍「等数据点火」（L4 前置未满足，如实报）。
- 代码零改动：`node --test tests/gateway.test.js` exit 0 / 11 pass / 0 fail。
