token: TK-68-05
# 面板→发布链行为验收 · completed Java 卡 commandsRun × release mvn 步骤交叉（第 68 轮）

- 席位：交付发布经理 ｜ 阶段：W4 S8 复盘+门禁 ｜ 写域：docs/squad/release/release-panel-behavior-68.md
- 判定：**行为门本体有效（A/B/C 三探针实测红绿正确）；归档切换后当前为真空绿（live 板 0 张 completed Java 卡）；发现 2 处门盲区（详见 §5）**
- 数据源：`.agent-teams/quanneng-squad/team.json`（live，8 卡全在途）+ `.agent-teams/archive/quanneng-squad--2026-11-16-panel-fix/team.json`（28 卡，含全部历史 Java 证据）
- 独立性声明：全部命令本席亲自实跑并记录 exit；未引用指挥结论。

## 1. 发布链中 mvn/pre-verify 的真实位置（实测）

`packages/dsh-quanneng-squad/package.json` scripts.release（27 步）第 8 步为
`node scripts/pre-verify.mjs`，位于 verify/run-tests 之前、install 之后无——即 **release 链本身不含 mvn 步骤**；
mvn 证据唯一入口是面板卡 completed 时的 `commandsRun`，由 pre-verify 交叉核对。pre-verify 判定式（源码实测）：

- 仅扫 `status==='completed'` 且 `kind ∈ {implementation, repair}` 且 changedPaths 含 `.java|pom.xml` 的卡；
- 每卡必须存在 ≥1 条 `/mvn[^&]*\btest\b/i` 且 `exitCode===0` 的记录，否则记问题；
- changedPath 文件必须在工作区实际存在（`join(W, p)`），否则记「不存在」；
- 时序门被源码注释降级为「文件存在 + mvn 证据存在」，精确 mvn-after-edit 时序交给 supervise 的 surefire 解析（SUPERVISION.json `java` 段）——本席复核确认该委托当前成立：SUPERVISION.json（2026-11-17T03:24）`java.verdict:green, failures:[], reports:15`。

## 2. 交叉核对矩阵：completed Java 卡 vs mvn 证据（归档板 28 卡逐卡核）

| 卡 | 轮次 | kind | Java 文件数 | commandsRun 中 mvn 记录 | exit | 门判定 | mtime 时序核（文件 vs 卡关闭） |
| --- | --- | --- | --- | --- | --- | --- | --- |
| t1 TK-59-01 | 59 | implementation | 2 | `cd gateway-java && mvn -o test` | 0 | ✅ 合规 | 两文件均早于关闭 36~37 分钟 ✅ |
| t2 TK-60-01 | 60 | implementation | 4 | `cd gateway-java && mvn -o test` | 0 | ✅ 合规 | 3 文件早于关闭；SnController.java **晚于关闭 18 分钟**（06:24 vs 06:06）——该文件随后被 t16/t18 两张卡再次改动并各跑 mvn exit0，链路覆盖成立，但 **对 t2 本体而言 mvn 证据早于最后一次编辑** ⚠️ |
| t16 TK-61-03 | 61 | implementation | 3 | `cd gateway-java && mvn -o test` | 0 | ✅ 合规 | 全部早于关闭 ✅ |
| t18 review v2 | 61 | **review** | 3 | mvn exit0（有） | 0 | ➖ 不在门扫描范围（kind=review 携 Java changedPaths）| 全部早于关闭 ✅ |
| t25 TK-67-01 | 67 | **work** | 2 | **无 mvn 记录**（仅 2 条 grep） | 0(grep) | ❌ **实质违规逃检**：改 Java 无 mvn，因 kind=work 不被扫描 | 两文件 **晚于关闭 11 分钟**（03:08 vs 02:57）❌ |
| t27 repair(t19 后续) | 67 | repair | **0（changedPaths 空）** | 无 mvn（仅 grep） | — | ➖ changedPaths 空 → 门按规则跳过；但其 objective 就是 t25 那批 Java 文件 ⚠️ |
| t19 TK-64-01 | 64 | implementation | 0（failed） | — | — | ➖ 非 completed，不在范围 | — |

**任务书完成判据「改 Java 的卡 commandsRun 必须含 mvn test exit0」逐卡结论**：t1/t2/t16 三张 implementation 卡全部满足；
t25 是唯一实质违背该判据的落盘历史（改了 SandboxSignIdCertRegistry.java + SignIdCertRegistryTest.java、关闭后文件又被改动 11 分钟、无 mvn 记录），
但因 kind 标为 work 而逃过 pre-verify——**违反的是判据精神，未被机器门拦截**，属门盲区而非执行者伪造。

## 3. 行为门本体有效性探针（隔离工作区注入 QUANNENG_WORKSPACE，不动真板）

| 探针 | 构造 | 预期 | 实测 |
| --- | --- | --- | --- |
| A 正证 | t1 卡原样（mvn exit0 在）+ 文件桩 | exit 0 绿 | exit 0，problems:[] ✅ |
| B 篡改 | t1 卡 commandsRun 清空 | exit 1 红 | exit 1，「改动了 2 个 Java 文件但 commandsRun 无 mvn test exitCode=0 记录」✅ |
| C 伪证 | mvn 记录在但 exitCode:1 | exit 1 红 | exit 1（同上消息）✅ |
| D 归档板重放 | 归档 team.json 作为工作区板 | — | exit 1，9 条「changedPath 不存在」——**归档切换后 changedPaths 相对路径只在原工作区树可解析，历史 mvn 证据不可跨树复验**（数据源切换影响，见 §4）|

verify.mjs 第 78 行断言（篡改→红→还原）当前在 live 板上走 `javaCards.length===0 → return true` 早退分支——**断言在，样本为空，不产生真实约束**；§3-A/B/C 证明其机制本体仍正确。

## 4. 归档→面板重建（数据源切换）影响评估

1. live 板 8 卡（t4–t11，TK-68 批次）全部 in_progress/claimed → pre-verify 实跑 `checked:8, problems:[] exit 0`。**此绿为真空绿**：链健康未验证，只验证了「无样本可判」。W4 各 Java 实现卡 completed 后该门才恢复实际约束力。
2. 历史 mvn 证据（t1/t2/t16/t18 的 commandsRun）随归档 JSON 留存可审计，但 changedPaths 存在性核对在归档位不可复现（探针 D：9 条路径不存在）——归档即脱敏为「只读账本」，不再是门的活动数据源。这是设计后果而非缺陷：真源证据链移交 SUPERVISION.json surefire 解析（java.reports:15，green）。
3. 面板卡 commandsRun 是成员自报字符串；**外部可复核证据只有 supervise 的 target/surefire-reports 解析**。两者交叉当前一致（java green + 三张 impl 卡 mvn exit0 互证）。

## 5. 发现与路由（R6：每项给出处置，不留「记录了但没管」）

| # | 严重度 | 发现 | 处置 |
| --- | --- | --- | --- |
| F1 | 中 | pre-verify 只扫 implementation/repair；kind=work 携 Java changedPaths 不受 mvn 行为门约束（实测 t25 逃检，且文件 mtime 晚于卡关闭 11 分钟）| 本席写域不含 pre-verify.mjs（packages/ 归架构经理 CR），不越权改门。已在本档留证并向 captain 回报，建议下一轮派修门票：扫描条件改为 `kind∈{implementation,repair} 或 changedPaths 含 .java/pom.xml（任意 kind）`。t25 涉及的文件随后被 t27 以 grep 复核且 SUPERVISION java 段当前 green，运行时无残留风险。|
| F2 | 中低 | 归档切换后 live 板 0 张 completed Java 卡 → pre-verify 与 verify:78 断言双双真空绿，「链健康」暂不可证 | 如实记录（本档 §4.1）；等待 TK-68 W4 Java 卡落板后由下任发布验收复跑。不构成当前发布阻断。|
| F3 | 低 | t2 的 SnController.java mtime 晚于 t2 卡关闭 18 分钟，其 mvn 证据相对该次编辑失效；由后续 t16/t18 卡的 mvn exit0 链路覆盖 | 交叉链已在 §2 列明覆盖卡；无需重做。防回归依赖 F1 修门时的 mtime 时序门（当前注释自认移交 supervise）。|
| F4 | 信息 | release 链无独立 mvn 步骤，mvn 真实性完全依赖「卡自报 + supervise 解析」双证 | 与既有设计一致（P10 三件套分工），不改动。|

## 6. 验收对照（任务书判据）

| 判据 | 状态 | 证据 |
| --- | --- | --- |
| completed Java 卡 commandsRun 与 release mvn 步骤交叉 | passed | §1/§2 逐卡矩阵 + package.json release 第 8 步实测引用 |
| 改 Java 的卡 commandsRun 必须含 mvn test exit0（pre-verify 行为门核） | passed（门核对 A/B/C 探针 exit 0/1/1 符合预期；存量卡 t1/t2/t16 全合规，t25 逃检已定级 F1 并路由 captain） | §2/§3/§5 |
| 归档后数据源切换影响评估 | passed | §4 三条 + 探针 D 实测 |
| 必产物落盘 | passed | 本文件 |

- 复跑命令：`node scripts/pre-verify.mjs`（cwd=packages/dsh-quanneng-squad，exit 0）；`node -v` = v24.16.0。
- 探针工作区 `.tmp-gate-probe/tk6805*` 用后已删除；`.agent-teams/` 全程只读，未动真板。
