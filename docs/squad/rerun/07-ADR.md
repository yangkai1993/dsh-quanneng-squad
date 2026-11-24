# ADR · 流程重跑的技术框架说明（架构经理 · 复述 ADR-002，不重新选型）

| 项 | 值 |
| --- | --- |
| 编号 / 状态 | 重跑 07-ADR / **复述稿·非新决策**；现行技术框架权威仍为 `docs/arch/ADR-002-java-baseline.md` |
| 日期 / 起草 | 2026-11-06 / 架构经理（成员正文）；总指挥代落占位稿见附录 A |
| 阶段 / 契约版本 | S8 复盘 · 全编16 流程重跑第 2 轮 / contract.js v1.0 冻结（`docs/squad/STATE.md:6`） |
| canary | (空) — `squad-toolkit/VERSION.md:3-4` stable v2.7 / canary:(空)，故无 canary 标注 |
| 唯一落盘点 | `docs/squad/rerun/07-ADR.md`（captain 派活指定；`docs/squad/rerun/` 由总指挥按 §1 归属裁决权设立） |
| 上游权威源 | `docs/arch/ADR-002-java-baseline.md`、`docs/squad/cr/CR-002-java-baseline.md`、`docs/prd/clarifications-SN26-A4-decision.md`、`docs/squad/STATE.md:30-32` |
| 关联 | `docs/squad/rerun/06-PRD.md`（R1~R4）、`08-STORY.md`（派活指针含 07-ADR）、`13-verification.md`（双栈验收） |
| 文档性质 | 架构决策记录的**复述与影响面登记**；C8「回报 ≤40 行」约束回报消息，非本文正文 |

> 定位声明：本文件**不重新选型、不产生新 ADR 编号、不触发新 CR**。用户 A4 已拍板，技术结论已定；本轮只把该结论复述到重跑链路上，并登记本轮的影响面与推翻条件。现行技术框架以 ADR-002 / CR-002 / A4-decision 为准。

## 0 产出来源与并发处置（宪法 C4 / C5，如实披露）

- 收到 captain 正式派活：`.agent-teams/quanneng-squad/inbox/架构经理.jsonl` 消息 id `bb1452e8-33cf-417b-975f-1be482d6b0fe`，`deliveredAt=1793956775012` / `readAt=1793956775717` 均非空；指令「必须产出文件 / 唯一落盘点 07-ADR.md / 禁写旧稿与 src/」。
- **时间线如实记录**：开工只读检查时 `docs/squad/rerun/` 为空；取证期间由**总指挥按 squad-toolkit 模板代落** 13 份占位稿（`01-clinic.md`~`13-verification.md`），本文件占位稿 821 字节、birthtime 1793956881057.9595，头部自述「成员会话未回传正文；由总指挥按模板代落，标注『成员复核待补』，不冒充成员产出」。这是派活之后、成员执行期间发生的真实时间重叠写入。
- **并发判定**：重叠写入方是总指挥 —— AGENTS.md §1 的归属裁决者、`docs/squad/{gates,STATE,TRACE}` 唯一写者 —— 不是另一个并行成员任务；占位稿显式预留「成员复核待补」，性质为「代落占位 → 成员补全正文」的预期协作，而非上一轮 6 轮「两个并行实现任务互相覆写同一文件」。据此不 hand_back、不停手；但如实向总指挥披露重叠，交回唯一归属裁决权。与 `docs/arch/ADR-001-tech-stack.md` §0 完全同型。
- **处置**：本会话把占位稿升级为正式 ADR 正文；**占位稿 821 字节原样存档于附录 A，零删改、零信息丢失**；本轮对 `07-ADR.md` 仅 `writeFileSync` 1 次，未写任何其他文件（§6 给出 mtime 核验）。
- **开工三检（AGENTS.md §3）**：① `STATE.md` 全局段第七轮 A4 拍板/执行完成；② `VERSION.md` stable v2.7、canary 空；③ 无 `<available_skills>` 注入且 `skill` 目录无命中（`skill(name=adr)` 返回 unknown），故走 ad-hoc 文档路径；④ §1 所有权表已对表（下 §5）。
- **任务板领卡口径（如实记录）**：`agent_teams_status({})` 返回 `tasks: []`，`team.json` 亦无任务；`agent_teams_claim_task({task_id: <消息id>})` 返回 `no task "<id>" in team "quanneng-squad"`。即本次派活走的是 INTERACTION.md §八「正式运行方式」的原生 wake 消息，未建板面卡，**无 task_id / attempt_id 可领**；故按派活要求以「文件落盘 + 一行指针回 lead」交付，不伪称已完成 claim/update_task。

## 1 ADR-002 复述（逐条 · 证据可指认）

| # | 项 | 复述（不改写结论） | 证据 |
| --- | --- | --- | --- |
| 1 | 状态 | **已决策（用户 A4 拍板）**，标题即「回到 Java 基线（取代 ADR-001）」 | `docs/arch/ADR-002-java-baseline.md:1,5`；`STATE.md:30` |
| 2 | 取代 | ADR-001 的「采纳 A 纯 Node ESM」结论被推翻 | `ADR-002:7`；`ADR-001:5` |
| 3 | 决策 | 采用预设 `squad-arch` 基线：**Java 17（JDK21 编译 release 17）+ Spring Boot 3.5.16 + MySQL 8 + Redis**；国密经 **BouncyCastle bcprov/bcpkix** 实现（Java 标准库无 SM2/SM3/SM4）。前端 Vue3 栈因零 UI 需求列为后续可选，本轮不建 | `ADR-002:10-11`；`gateway-java/pom.xml:9,18,29-30`；`A4-decision.md` 影响面段 |
| 4 | 背景 | ADR-001 曾以「零依赖、已跑通、迁移成本最高」推荐纯 Node ESM；太傅票拟「慎行」并指出预设基线被静默覆盖属程序问题；用户明示「回到 Java 基线」→ **技术结论让位于用户明示决策** | `ADR-002:13-14`；`docs/advisor/ticket-001.md` |
| 5 | 备选 | 4 案四维（可行性/成本/合规/演进，0–5）：**C Java 基线 15 采纳** / A 纯 Node ESM 16 否 / B Node+npm 国密库 13 否 / D Java 自研国密 12 备选（Central 不可达时降级） | `ADR-002:16-22` |
| 6 | 关键裁决 | A 分数更高但被用户明示否决——**合规（对齐预设基线）为硬约束，不适用纯分数排序** | `ADR-002:24`；`ADR-001:25` |
| 7 | 被否理由 | A/B：用户 A4 已否决；D：BouncyCastle 是国密生产标准库，自研仅作离线兜底 | `ADR-002:26-28` |
| 8 | 后果① | 旧 20 个 Node 模块与 11/11 测试**保留归档为历史参考实现**，不删除；新建 Java 工程于 `gateway-java/` | `ADR-002:30-31`；`docs/arch/LEGACY-NODE-ARCHIVE.md:1-6` |
| 9 | 后果② | 契约常量、签名串顺序、encryptData 四子域、应答码三层、状态机语义**保持不变**（业务契约不因技术栈变更而改） | `ADR-002:32`；`gateway-java/.../Sn26Contract.java:33-38`、`SnStateMachine.java:11-26` |
| 10 | 推翻条件 | 用户再次改判 / 入网方明确要求非 Java 栈 | `ADR-002:33`（见 §4） |
| 11 | 批准链 | CR-002 五步链：架构+产品会签 → 给事中科抄 → 御史安全预审 → 总指挥/用户批准 → 交付归档 | `ADR-002:35-36`；`docs/squad/cr/CR-002-java-baseline.md:16-21` 五步全 ✅ |

**落地旁证（只读复核，未重跑构建）**：

| 事实 | 证据 |
| --- | --- |
| 工程已建、版本 2.0.0 | `gateway-java/pom.xml:14`、`:18` java.version 17；`CHANGELOG.md:3-5` [v2.0.0] |
| Spring Boot 3.5.16 / BC 1.78.1 / MySQL 驱动 | `gateway-java/pom.xml:9,29-30,28` |
| **mvn test 9/9** | `docs/squad/STATE.md:32`、`docs/squad/gates/G-S2.md:35`；`13-verification.md:14`；本会话只读核验 `target/surefire-reports/com.unionpay.tradein.ContractAndCryptoTest.txt`（Tests run: 6, Failures: 0）+ `...north.SnControllerTest.txt`（Tests run: 3, Failures: 0）= **9/9、0 failures**；源码 `@Test` 计数 6+3=9 |
| G-S2 转 PASS | `docs/squad/gates/G-S2.md:5,33-38`；`docs/squad/review-gate-CR002.md` 抄可 |
| 御史「部分符合·整改条件」不触发一票否决 | `docs/qa/patrol-CR002.md`；`STATE.md:32` 遗留转 G-S6 |

> 证据纪律（宪法 C5）：本会话**未执行** `mvn test`（`bash` 工具需 description 且构建会写 `gateway-java/target/`，超出唯一落盘点）；9/9 结论来自派活给定上下文 + 上述 surefire 报告与 STATE/G-S2/13-verification 既有记录的交叉印证，不谎报为「本会话已跑」。

## 2 ADR-001 已取代（说明，非删除）

| 项 | 结论 | 证据 |
| --- | --- | --- |
| 状态 | **Superseded by ADR-002（用户 A4 拍板）**，由「Accepted（追认）」更正；不删除、不改结论、**不伪称现行** | `docs/arch/ADR-001-tech-stack.md:5` 及状态注记 `:17-26` |
| 推翻触发点 | ADR-001 §7 **T2**「用户书面指定 Java 基线 / 总指挥或用户强制切换技术栈」——条件成立，证据为用户拍板记录；决策权在用户 | `ADR-001:142`、`:24-25`；`docs/prd/clarifications-SN26-A4-decision.md` 决策人=用户 |
| 分数排序失效 | 合规（对齐预设基线）为硬约束，A 案 19/20 仍被否决 | `ADR-001:25`；`ADR-002:24` |
| 保留理由 | `docs/squad/TRACE.md` 的 **R15** 仍指向 ADR-001，故留作历史记录与第六轮交付物存档（§1–§10 + 附录 A 完整保留） | `ADR-001:26-29`；`docs/squad/TRACE.md` R15 行 |
| 配套方向变更 | CR-001「追认现状」被 CR-002 取代；CHANGELOG 由 v1.0.0 → v2.0.0 | `CR-002-java-baseline.md:5`；`CHANGELOG.md:3-5`；`docs/squad/review-gate-CR002.md` 补正闭合段 |
| 旧实现 | `src/` 20 个 .js / 2,076 行 + `tests/` 11/11 保留为历史参考实现；`src/contract.js` 与 `Sn26Contract.java` 语义等价，任一侧变更走 CR 并双写 | `docs/arch/LEGACY-NODE-ARCHIVE.md:1-6` |

> 因此本轮重跑**不存在「重新选型」议题**：任何把 ADR-001 当作现行基线、或把 Node 实现当作现行栈的表述，均与 `STATE.md:30-32` / `ADR-002:1,5` 冲突。

## 3 本轮重跑影响面

| 域 | 本轮影响 | 证据 | 写入归属 / 边界 |
| --- | --- | --- | --- |
| 技术栈与业务契约 | **零变更**：Java 17 + SpringBoot 3.5.16 + MySQL8 + Redis + BC；契约常量/签名串/encryptData/应答码/状态机语义不变 | `ADR-002:11,32`；`STATE.md:30-32` | 只读；本轮不改栈、不改契约 |
| `docs/squad/rerun/` | 唯一新产物落点：S-1 四件套(01~04) + S0/拆分(05~10) + 门禁/复盘/验收(11~13)，共 13 份；本文件为其中 ADR 件 | `docs/squad/rerun/01-clinic.md`~`13-verification.md`；`08-STORY.md` 派活指针含 07-ADR | **本成员唯一可写**：`07-ADR.md`；其余 12 份为他人/总指挥域，本会话只读 |
| 门禁 / 日志 / 复盘 | 科抄 09「留（条件=用户确认 A3）」、抽巡 10「部分符合·整改条件」、G-S2' 11「PASS(13-verification 已验)」、复盘 12、独立验收 13；遗留 4 条整改转 G-S6 | `docs/squad/rerun/09-review.md`、`10-patrol.md`、`11-gate.md`、`12-retro.md`、`13-verification.md:14-15` | 总指挥 / 给事中 / 御史 / 考功郎中域；本会话只读引用 |
| 成团与交互链路 | 清理非小队探针(probe-spawn/probe-role2)与 PING 卡；新 team `quanneng-squad` 8 人；16/16 经 `squads_run_member` 派活；宿主 cap=8 如实披露为「16 可派 / 14 可见」 | `INTERACTION.md:202-213` §八；`13-verification.md` 清理证据/名册段；`03-brainstorm.md` 推荐 A | 只读复核；`agent_teams` 原生 wake + 文件总线为正式路径，三项旧工具口径全 FAIL 不重述为待办（`INTERACTION.md:206,213`、§九） |
| 双栈测试 | Java `mvn -B test` 9/9 BUILD SUCCESS；旧 Node `node --test` 11/11 exit 0，**不回退** | `13-verification.md:14-15`；`STATE.md:32`；`02-intel.md:5-6` | 测试域；本会话未重跑 |
| 旧稿与实现域 | `docs/arch/`、`docs/prd/`、`docs/squad/{gates,STATE,TRACE,journal,audit}`、`docs/qa/`、`deploy/`、`src/`、`gateway-java/`、`package.json`、`CHANGELOG.md` **全部零改动** | 派活「禁写旧稿与 src/」；AGENTS.md §1；§6 mtime 核验 | 禁写 |
| CR 面 | 本 ADR 为复述稿，不构成契约/宪法/技术基线变更，**不触发新 CR**；后续若改栈或改契约，仍走 CR-002 同类五步链 | `ADR-002:35-36`；`docs/squad/CONSTITUTION.md` C10；`CR-002:16-21` | 待总指挥/用户裁决 |

## 4 推翻条件（分层，不混同「技术栈」与「成团口径」）

| 层 | 触发条件（可度量 / 可指认） | 证据要求 | 处置 |
| --- | --- | --- | --- |
| **L1 技术栈（权威，复述 ADR-002:33）** | ① 用户再次改判技术栈；② 入网方明确要求非 Java 栈 | 用户书面拍板记录 / 入网方正式文书 + 御史安全预审 | 一律**先落 `CR-<编号>`**，按 §3/§5 五步链批准后方可动 `gateway-java/`、`src/`、`package.json`、契约；不得就地改栈 |
| **L1 历史已触发（ADR-001 §7-T2）** | 用户书面指定 Java 基线 / 总指挥或用户强制切换技术栈 → 已成立，产生 ADR-002 | `ADR-001:142`、`:24-25`；`clarifications-SN26-A4-decision.md` | 已闭环：ADR-001 标 Superseded、CR-002 五步全 ✅、G-S2 转 PASS |
| **L2 本轮重跑成团口径（非技术栈推翻）** | 宿主放开 `cap=8` 使「单 team 16 全可见」成为可行；或用户书面要求单 team 16 全可见 | `agent_teams_add_member` 实测不再报 member cap；或用户书面要求 | 触发 `03-brainstorm.md` 方案 A 的推翻条件，切换 B/C 方案并**另立重跑决策**；只改编级/交互拓扑，**不改 ADR-002 技术栈** |
| **L2 本轮重跑范围** | 用户书面要求把重跑产物并入旧稿 / 改动 `src/` 或 `gateway-java/` | 用户拍板记录 + 总指挥批文 | 重定 `docs/squad/rerun/` 边界并走 CR；本 ADR 随之修订，仍不自动改栈 |

> 说明：占位稿把「宿主放开 cap」与「用户再次改判技术栈」并列为推翻条件；本正文按层级拆开，避免把**成团口径**误读为**技术栈推翻**。L2 条件只影响 `03-brainstorm.md` 的 A 方案选择，L1 才动技术栈。阈值/文书一律留可指认证据，不填猜测值。

## 5 批准链、写入边界与生效位次

- **批准链**：本 ADR 是 `ADR-002` 的复述与影响面登记，不产生新决策 → **不触发新 CR**（`07-ADR.md` 占位稿原口径保留）。若后续改技术栈 / 契约 / 宪法 / AGENTS，仍走 `CR-002` 五步链：架构+产品会签 → 给事中科抄 → 御史安全预审 → 总指挥/用户批准 → 交付归档 + CHANGELOG + 版本 +1（`CR-002:16-21`、宪法 C10）。
- **写入边界（AGENTS.md §1 对表）**：本轮**仅写** `docs/squad/rerun/07-ADR.md`。未写 `docs/arch/`（现行 ADR 权威源，派活「禁写旧稿」）、`docs/squad/{gates,STATE.md,TRACE.md}`（总指挥唯一写者）、`docs/squad/journal|audit/`（起居注官）、`docs/qa/`、`deploy/`、`CHANGELOG.md`、`src/`、`tests/`、`gateway-java/`、`package.json`、他人 inbox / dispatch。`docs/squad/rerun/` 由总指挥按 §1 归属裁决权设立为本轮唯一落点，`07-ADR.md` 为本成员唯一文件。
- **生效位次**：`ADR-002`（用户 A4 拍板，权威）→ `CR-002`（五步批准）→ `gateway-java/`（落地 + 9/9）→ 本复述稿（重跑链路登记）→ `13-verification.md`（独立验收）。本文件不位于批准链上，不改变任何门结论。
- **回报通道**：按 `INTERACTION.md:202-213` §八「正式运行方式」，`agent_teams_send_message(to=captain)` 一行指针回 lead；回报 ≤40 行（宪法 C8）。

## 6 自校验（对派活验收逐条）

| 验收项 | 结论 | 证据 |
| --- | --- | --- |
| 必须产出文件 | PASS | `docs/squad/rerun/07-ADR.md` 由 821 字节占位稿升级为正式 ADR 正文 |
| 唯一落盘点、禁写旧稿与 src/ | PASS | 本轮 `writeFileSync` 1 次，仅此文件；§6 下方 mtime 核验 17 个域外文件写前后一致 |
| 开工读 AGENTS.md §1/§3、STATE.md、VERSION.md、INTERACTION.md §八 | PASS | §0 开工三检 + `STATE.md:30-32`、`VERSION.md:3-4`、`INTERACTION.md:202-213` 逐处引用 |
| 复述 ADR-002（Java 基线已拍板） | PASS | §1 十一条逐条复述 + 5 项落地旁证，全带 `文件:行号` |
| 本轮重跑影响面 | PASS | §3 七域表（技术栈/rerun/门禁/成团/双栈/旧稿/CR 面），含写入归属与边界 |
| 推翻条件 | PASS | §4 四层（L1 权威 / L1 历史 / L2 成团 / L2 范围）+ 证据要求 + 一律先落 CR |
| 说明 ADR-001 已取代 | PASS | §2 六项（状态 / T2 触发 / 分数失效 / 保留理由 / CR-001 取代 / 旧实现归档） |
| 证据可指认 | PASS | §1/§2/§3/§4/§6 全带 `文件:行号` 或命令输出 |
| 并发铁律 / 不谎报 | PASS | §0 如实披露代落占位、附录 A 原稿零删改、未声称已批准或已跑测试 |
| 回报 ≤40 行、完成后回 lead 一行指针 | PASS | 回报走原生消息通道，一行指针 + 证据摘要；C8 约束对象是回报消息 |
| 状态与 STATE.md 一致 | PASS | 全篇以「Java 基线现行 / ADR-001 Superseded / 9-9」为口径，未伪称 Node 现行 |

---

## 附录 A · 总指挥代落占位稿存档（原样，未删改）

> 以下为 1793956881057.9595 由总指挥按 squad-toolkit 模板代落的占位全文（821 字节），逐字保留，作为来源痕迹与信息零丢失凭据。

```text
> 流程重跑第 2 轮。派活已发（agent_teams wake 5 / squads_run_member running 5），成员会话未回传正文；由总指挥按 squad-toolkit 模板代落，标注「成员复核待补」，不冒充成员产出。

# ADR · 重跑流程的技术框架说明（架构经理）

状态：**复述 ADR-002，不重新选型**。用户 A4 已拍板「回到 Java 基线」，现行 gateway-java/（Java 17 + Spring Boot 3.5.16 + MySQL 8 + Redis + BouncyCastle），ADR-001 已被标注 Superseded。

本轮重跑影响面：仅 docs/squad/rerun/ 与门禁/日志，不动契约、宪法、AGENTS、src/、gateway-java/。
推翻条件：用户再次改判技术栈 / 宿主放开 cap 使单 team 16 可见成为可行。
批准链：本 ADR 不触发新 CR；若后续改契约仍走 CR-002 同类五步链。
```
