# 变更请求 CR-002 · 技术框架回到 Java 基线

| 项 | 值 |
| --- | --- |
| CR 号 | CR-002（取代 CR-001 的「追认现状」方向） |
| 提出人 / 日期 | 用户 A4 拍板触发，架构经理承办 / 2026-11-06 |
| 影响面 | 契约、宪法技术基线段、AGENTS.md §2、全部 src/、tests/、deploy/、package.json |
| 类型 | 契约 / 宪法 / 技术基线（最高风险文书） |
| 当前 → 目标 | 纯 Node ESM 零依赖 → Java 17 + Spring Boot 3.5.16 + MySQL 8 + Redis (+Vue3 栈后续可选) |

## 理由与证据
- 用户原话「回到 Java 基线」（决策权在用户）。
- cordis.patch.yml `squad-arch` persona 技术基线行。
- 工具链实测：JDK 21 / Maven 3.9.9 / Spring Boot 3.5.16 缓存 / Central 200。

## 批准链
1. 架构经理 / 产品经理会签：✅ 架构经理 ADR-001 交付并标注 Superseded by ADR-002；产品经理 PRD v1.0 正式版交付（成员回执 delivered:live）
2. 给事中科抄：✅ 抄可（docs/squad/review-gate-CR002.md）
3. 御史大夫安全预审：✅ 部分符合·整改条件（docs/qa/patrol-CR002.md，不触发一票否决）
4. **总指挥 / 用户批准：✅ 已满足（用户原话「回到 Java 基线」）**
5. 交付发布经理归档 + CHANGELOG + 版本 +1：✅ 本文件 + CHANGELOG v2.0.0 + pom version 2.0.0

## 变更召回
approved 后由交付发布经理发起召回；逾期由起居注官在 doc-freshness 台账标「冻结」。
