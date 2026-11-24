# 变更请求 CR-001 · 技术框架基线追认

| 项 | 值 |
| --- | --- |
| CR 号 | CR-001 |
| 提出人 / 日期 | 架构经理（总指挥代落）/ 2026-11-06 |
| 影响面 | docs/arch/ADR-001-tech-stack.md、CONSTITUTION.md、AGENTS.md §2、package.json、docs/arch/api-contract.md、CHANGELOG.md |
| 类型 | 契约 / 宪法 / 技术基线（最高风险文书） |
| 当前 → 目标 | 预设 Java17+SpringBoot+MySQL+Redis+Vue3（未明示） → 追认 纯 Node ESM 零依赖 + 纯 JS 国密 |

## 变更内容
把「纯 Node.js ESM + 零 npm 依赖 + 纯 JS 国密」写入 ADR-001 与宪法技术基线段；预设 `squad-arch` persona 的 Java/Vue 基线在本项目范围内不适用（不修改全局预设，避免影响其他项目）。

## 理由与证据
- cordis.patch.yml `squad-arch` persona「技术基线」行（配置事实）。
- package.json `dependencies:{}` / type:module / 20 个 .js（实现事实）。
- tests/gateway.test.js 11/11 exit 0、tests/crypto.selftest.js 14 向量 PASS（验收事实）。
- 用户连续三轮指出「没按小队设计跑 / 没做框架选择」（反馈事实，journal 2026-11-06）。

## 批准链（缺一无效）
1. 架构经理 / 产品经理会签：成员会话未回传 → 待补（指挥代落标注）
2. 给事中科抄：**留**（docs/squad/review-gate.md，条件=本 CR 闭环 + 用户 A4）
3. 御史大夫安全预审：**部分符合**（patrol-SN26-001.md，整改条件同上）
4. 总指挥批准：待用户确认 clarifications-SN26.md 的 A4
5. 交付发布经理归档 + CHANGELOG + 版本 +1：待执行

## 变更召回
approved 后由交付发布经理发起召回；逾期由起居注官在 doc-freshness 台账将 SN26-001 标「冻结」。
