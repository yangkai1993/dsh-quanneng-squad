# CR-004-k-anchors · §10 合规基线 K1/K3/K4 文本漂移修订

- 令牌：TK-57-01（第 2 次派发，带精确锚点）
- 阶段：S2 契约修订（宪法 C10：契约变更必须走 CR）
- 影响文件：docs/arch/api-contract.md（v1.3 → v1.3.1）、本文档
- 日期：2026-11-15

## 1. 背景

采风清单 `docs/squad/intel/spec-coverage-2026-11-15.md` 在 `§10` 合规基线行逐字比对中登记三处文本漂移：

- **D-1**（intel :101）：K4 「规范原文」列写 `:78 本契约 §7`，指向契约自身而非 `.analysis/source-doc.txt`；双成功码的规范侧依据应为 `DOC:466`、`DOC:572`。
- **D-2**（intel :102）：K3 「规范原文」列把 `DOC:526`（异常处理通则）当作「无占用状态查询接口」的依据，逐字依据应为 `DOC:540-543` 接口汇总。
- **D-6**（intel :106）：K1 「实现锚点」列仍称「当前单值 `@Value signId`，**待补 map**」；该缺口已由 TK-47-02 闭合，陈述滞后。

本 CR 只修文本（DOC 行号与实现锚点陈述），不改裁决、不改断言 ID、不改语义。

## 2. 影响面分析

| 维度 | 判定 |
| --- | --- |
| 机器断言 | `compliance:K1~K4` 四个 ID 字符串原样保留，result-verify 依赖不变；各命中 1 次。 |
| 章节结构 | § 编号 1..12 连续性不变，无新增/删除章节。 |
| 其他章节 | §1~§9、§11 零字节变化；§12 仅追加 1 行。 |
| 代码/门禁 | 不碰 scripts/、gates/、src/、pom、AGENTS.md；无行为变更。 |
| 下游消费者 | 引用 `§10` 原文的文档：本 CR、intel 清单 D-1/D-2/D-6；行号变化：文件由 128 行 → 130 行（§12 追加）。 |
| 风险 | 低：纯文本，可逐字回滚。 |

## 3. 改动清单

逐字替换，执行前每个锚点「找到次数」自检均恰为 1。

1. **K4 行「规范原文」列**（api-contract.md:105）：`:78 本契约 §7` → `DOC:466「成功应答码为0000000000」/ DOC:572「200」`
2. **K3 行「规范原文」列**（api-contract.md:104）：`:526（无占用状态查询接口）、:672/:674「稍后发起查询」` → `DOC:540-543 接口汇总仅 query/occupancy/release 3 接口（无占用状态查询）、DOC:672/674「稍后发起查询」`
3. **K1 行「实现锚点」列**（api-contract.md:102）：旧 `Java SignatureService.java:26,42（当前单值 @Value signId，**待补 map**）` → 新 `Java crypto/SignIdCertRegistry.java + SandboxSignIdCertRegistry.java（map<signId,cert>，K1 已由 TK-47-02 闭合）`
4. **§12 变更记录追加一行**：`v1.3→v1.3.1：TK-57-01 · §10 K1/K3/K4 规范原文列补 DOC 行号、K1 滞后陈述更新为已闭合（CR-004-k-anchors.md）`

## 4. 会签复核

| 库 | 角色 | 复核要点 | 状态 |
| --- | --- | --- | --- |
| 架构经理 | CR 受理 | §10 行级别只改文本，裁决/口径列未动 | 待会签 |
| 后端经理 | K1 锚点真实性 | `crypto/SignIdCertRegistry.java` / `SandboxSignIdCertRegistry.java` 与 TK-47-02 闭合记录一致 | 待会签 |
| 测试经理 | 断言不变 | `compliance:K1~K4` 原样保留，result-verify 27 项 0 缺口 | 待会签 |
| 总指挥 | 写域与令牌 | 仅 2 文件；令牌 TK-57-01 | 待会签 |

## 5. 验收证据

- 锚点自检：替换前各锚点找到次数均为 1（K4 `§10:105`、K3 `§10:104`、K1 `§10:102`、§12 追加点 `:127`）。
- 结构复核：§ 编号扫描结果 `1,2,...,12` 连续；`compliance:K1/K2/K3/K4` 各命中 1 次。
- 实跑门禁：`node packages/dsh-quanneng-squad/scripts/result-verify.mjs` exit 0；`node packages/dsh-quanneng-squad/scripts/drift-check.mjs` exit 0（输出见成员回报）。
- 契约行数：修订后 130 行（修订前 128 行，§12 新增 2 行：空行 + 变更行）。

## 6. 回滚

非 git 仓库，回滚靠逐字恢复：将本文档 §3 的 4 项改动按「→ 右侧换回左侧」顺序递归替换，并删除 `§12` 追加的 `v1.3→v1.3.1` 一行（及其前空行）；删除本文件即回到修订前状态。回滚后重跑两个脚本应依旧 exit 0。

引用：docs/squad/intel/spec-coverage-2026-11-15.md（D-1、D-2、D-6）
