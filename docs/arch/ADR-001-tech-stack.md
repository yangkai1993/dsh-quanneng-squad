# ADR-001 · 技术框架：纯 Node.js ESM 零依赖

| 项 | 值 |
| --- | --- |
| 编号 / 状态 | ADR-001 / **Superseded by ADR-002（用户 A4 拍板，见下方状态注记）**；本文为第六轮成员交付物存档 → 待给事中科抄 / 总指挥终审 / CR-002 链归档 |
| 日期 / 起草 | 2026-11-06 / 架构经理（正文）；总指挥代落占位稿 08:32:03Z（见附录 A） |
| 阶段 / 契约版本 | S8 复盘（治理资产整改） / contract.js v1.0 冻结（STATE.md） |
| canary | (空) — squad-toolkit/VERSION.md stable v2.7，无 canary 标注 |
| 唯一落盘点 | `docs/arch/ADR-001-tech-stack.md`（AGENTS.md §1：docs/arch/ 规划域可写） |
| 上游源 | `.analysis/source-doc.txt`（中国银联以旧换新应用接口技术指引，2024-12-14 发布/实施） |
| 关联 | `docs/arch/sys-arch.md:25-30` ADR-1..5（ADR-1 为本决策下的国密实现路径，本 ADR 为其上位框架决策，不覆写） |
| 文档性质 | 架构决策记录；C8「回报 ≤40 行」约束成员回报消息，非本文正文 |

> ## ⚠ 状态注记（2026-11-06 第七轮 · 本文件已被取代，按 STATE.md 唯一权威补记）
>
> **本 ADR 的「采纳 A 纯 Node ESM 零依赖」结论已被用户 A4 拍板推翻**：
> `docs/squad/STATE.md` 全局段（第七轮·A4 拍板）、`CHANGELOG.md [v2.0.0]`、
> `docs/arch/ADR-002-java-baseline.md`（标题「取代 ADR-001」）、
> `docs/squad/cr/CR-002-java-baseline.md`、`docs/prd/clarifications-SN26-A4-decision.md` 一致记载：
> 技术栈改为 **Java 17（JDK21 release 17）+ Spring Boot 3.5.16 + MySQL 8 + Redis + BouncyCastle**，
> 旧 Node 实现保留归档为历史参考实现，契约常量/签名串/encryptData/应答码/状态机语义不变；
> 前端 Vue3 栈本轮不建（零 UI 需求）。工具链实测 JDK21 / Maven3.9.9 / Central 200。
>
> 触发的是本文 §7-T2「用户书面指定 Java 基线 / 总指挥或用户强制切换技术栈」——推翻条件成立，
> 决策权在用户，**合规（对齐预设基线）为硬约束，不适用纯分数排序**（ADR-002 原文明示）。
> `docs/squad/TRACE.md` 的 R15 仍指向本文，故本文保留为历史记录，不删除、不改结论、不伪称现行。
>
> 本文是**第六轮派活的架构经理交付物**（任务验收：技术框架 ADR、≥3 备选、四维评分、被否理由、
> 推翻条件、CR 批准链、证据可指认），其内容按当时口径完整保留于 §1–§10 与附录 A；
> 现行技术框架以 ADR-002 / CR-002 / A4-decision 为准。状态由「Accepted（追认）」更正为
> **Superseded by ADR-002（用户 A4 拍板）**；G-S2 保持 CONCERNS 至 Java 编译验收通过。
>
> 补记依据：AGENTS.md §3「STATE.md 是状态唯一权威，不凭记忆重建」+ 宪法 C5 证据纪律 + G16 锚点重读。

## 0 产出来源与并发处置（宪法 C4 / C5，如实披露）

- 本会话收到 captain 正式派活（ts 2026-11-06T08:30:32.011Z），指令「必须产出文件 / 唯一落盘点 ADR-001-tech-stack.md / 仅写你自己的唯一落盘文件」。
- **时间线如实记录**：开工只读检查时目标 `exists=false`；取证期间由**总指挥按模板代落占位稿**（birthtime 2026-11-06T08:32:03.123Z，晚于派活消息约 91 秒），其首行自述「成员会话未回传正文；由总指挥按模板代落并标注『成员复核待补』，不得声称已由成员独立完成」。即：这是派活之后、成员执行期间发生的一次真实时间重叠写入。
- **并发判定**：重叠写入方是总指挥 —— AGENTS.md §1 的归属裁决者、`docs/squad/{gates,STATE,TRACE}` 的唯一写者 —— 不是另一个并行成员任务；占位稿显式预留「成员复核待补」，性质为「代落占位 → 成员补全正文」的预期协作，而非上一轮 6 轮「两个并行实现任务互相覆写同一文件」。据此不 hand_back、不停手；但如实向总指挥披露重叠，交回唯一归属裁决权。
- **处置**：本会话补全升级为正式 ADR 正文；总指挥代落占位稿 **3178 字节原样存档于附录 A，零删改、零信息丢失**；本轮对目标文件仅 `writeFileSync` 2 次（补全 1 次 + 本事实订正 1 次），未写任何其他文件；docs/arch 其余 4 文件 mtime 写前后未变。
- 不谎报：本文只声称「架构经理已产出 ADR 正文」，不声称决策已获批准（科抄/终审/用户确认 A4/归档均待办）；11/11 测试结论引自 STATE.md 既有记录，本会话未重跑（见 §5）。

## 1 背景与冲突（必须显式裁决 — 沿用总指挥代落稿口径）

### 1.1 源文档把约束钉在报文层，而非应用栈层

| 约束 | 源文档位置 | 对技术栈的要求 |
| --- | --- | --- |
| JSON / UTF-8 报文，HTTP 头承载公共参数 | L133、L166 | 只需 HTTP + JSON，无需 ORM / 模板引擎 |
| signMethod 推荐 SM2（SM3 摘要 + SM2 签名）、RSA2 备选 | L161 | 须可控实现 SM2/SM3/SM4 原语 |
| 算法表 SM3WithSM2 / SM4(CBC, 16 字节全 0 IV) / SSL 套件含 ECC_SM4_CBC_SM3 | L267-270 | 国密行为须逐位可控 |
| SM2 签名值**不做 ASN.1/DER 编码**，验签亦不做 DER 解码 | L308、L319 | 第三方库默认 DER 输出即违约点 |
| 专线/公网 HTTPS TLS1.2+；≤10M 压缩文件走联机、>10M 走 SFTP | L115-122、L129 | 需 HTTP + gzip + 本地暂存，无需消息中间件 |
| 签名/加密证书 5 年、新旧并行、一次一密 / 一日一密 | L278-287 | 需证书库 map<signId,cert> 与密钥作用域 |

### 1.2 关键冲突：预设基线 vs 实际交付（契约级静默偏离）

> 以下三点为总指挥代落占位稿原文裁决前提，逐字保留，不在成员补全中软化：

1. `cordis.patch.yml` 的 `squad-arch` persona 写死技术基线：**Java 17 + Spring Boot 3.x + MySQL 8 + Redis；Vue 3 + TypeScript + Vite + Pinia + Element Plus**。
2. 实际交付：`package.json` 为 `type:module / dependencies:{} / engines.node>=20`，20 个 `.js` 模块，无 Java、无 Vue、无 MySQL/Redis。
3. **用户从未明示覆盖该基线 → 属契约级静默偏离，不是单纯技术选型；必须走 CR**（架构/产品会签 → 给事中封驳 → 御史安全预审 → 总指挥批准 → 交付归档 + CHANGELOG + 版本 +1）。

现状佐证（STATE.md 实现域/质量域段 + 本会话只读实测）：`src/` 20 个 `.js` 共 2076 行、57 条 ESM import/export-from、`package.json:5` `{"type":"module"}`、`:14` `node>=20`、`:16` `{"dependencies":{}}`；`tests/gateway.test.js` 11/11、`tests/crypto.selftest.js` 14 向量。本 ADR 回答：在 v1.0 契约已冻结前提下，为什么是「纯 Node ESM 零依赖」，以及什么条件下才允许推翻。

## 2 决策（Decides）

采用 **纯 Node.js（≥20）ESM + 零 npm 依赖 + 纯 JS 国密（SM2/SM3/SM4）** 作为参考实现的技术框架；不引入前端、不引入关系库、不引入密码设备（生产接 KMS/HSM adapter 时另立 ADR）。具体：

- 运行时仅 `node:` 内置模块（`node:test`、`node:assert/strict`、`node:crypto`、`node:zlib`、`node:fs`、`node:http` 等）；
- SM2/SM3/SM4 纯 JS 实现 + GM/T 标准向量 + `n·G=∞` 自洽校验兜底（STATE.md 假设 A1、sys-arch.md:26 ADR-1）；
- 存储用内存 + JSON 原子写（`src/core/store.js` tmp+rename），不引入 MySQL/Redis；
- 不引入 UI 框架（本系统是对外报文网关，无浏览器端）；
- `package.json` 依赖保持为空，任何增依赖 = 触发 §7 推翻条件与 §8 CR 链。

> 本决策是**对已冻结 v1.0 实现的如实记录 + 对预设基线偏离的显式裁决**，不等于批准链已走完；落地合规以 §8 为准。

## 3 备选方案 · 四维评分

维度（沿用总指挥代落稿口径，0–5，5 最优，等权满分 20）：**可行性 / 成本 / 合规 / 演进**。

| 备选 | 可行性 | 成本 | 合规 | 演进 | 合计 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| **A 纯 Node ESM + 零依赖 + 纯 JS 国密（现状）** | 5 | 5 | 4 | 5 | **19** | **采纳** |
| B Node ESM + 引入认证 npm 国密库 | 4 | 4 | 5 | 4 | 17 | 否决 |
| C 预设基线 Java17+SpringBoot3+MySQL8+Redis + Vue3 全栈 | 2 | 1 | 4 | 3 | 10 | 否决 |
| D Node + wasm 国密 + SQLite | 3 | 3 | 4 | 3 | 13 | 否决 |

评分依据（四维逐项可复核）：

- **A**：已交付且 11/11 测试 + 14/14 向量通过 → 可行性 5；单运行时、无依赖 → 成本 5；纯 JS 国密自担认证 → 合规保留 4；模块边界清晰、另立 ADR 可接 KMS → 演进 5。
- **B**：库成熟 → 合规 5，但 `package.json:16` 零依赖冻结被破、供应链/CVE 面扩大 → 成本 4、可行性 4。
- **C**：20 模块与 11 测试全废、迁移成本最高、无 UI 需求 → 可行性 2 / 成本 1；合规 4（生态成熟）；演进 3。
- **D**：新增 wasm 构建链、SQLite 与内存/JSON 存储重叠 → 成本 3 / 可行性 3，收益不抵复杂度（YAGNI）。

## 4 被否方案理由（逐案，证据可指认）

**B · Node + 认证 npm 国密库（17/20）**
1. 直接违反 `docs/arch/sys-arch.md:26` ADR-1「否决引入 npm 国密库（零依赖约束）」与宪法 C10；`package.json:16` 的 `{"dependencies":{}}` 是需 CR 才能改的冻结项。
2. 第三方库 SM2 签名默认 DER 输出 → 违反源文档 L308「不做 ASN.1/DER 编码」；且 ADR-2「签名串一次序列化复用」受库内部序列化影响，破坏确定性。
3. 依赖黑盒使 14 条标准向量与 `n·G=∞` 自洽校验无法逐位审计；外部 CVE 供应链面扩大（宪法 C7）。

**C · Java+SpringBoot+MySQL+Redis+Vue3 预设基线（10/20）**
1. **栈与问题不匹配**：源文档 L133/L166 是 JSON-over-HTTP 报文接口，L115-122 是专线/SFTP 文件通道，无浏览器 UI 需求 → Vue3 无落点；SpringBoot 的 Web/ORM 能力对「签名→转发→状态机→对账」无增量。
2. **打破零依赖冻结基线**：引入 MySQL/Redis 即把 `src/core/store.js` 内存/JSON 原子写换成连接池 + schema 迁移 + 中间件运维，与 STATE.md「20 模块 2076 行、11/11 通过」已交付基线冲突，属重写而非演进（D4 低分主因）。
3. **国密行为不可控**：Java 侧 SM2/SM3/SM4 需 BouncyCastle 或经认证模块，SM2 签名默认 DER 与 L308 冲突须额外适配；生态默认偏 RSA/SHA-256。
4. **治理成本**：宪法 C7（密钥不落盘、TLS 全链路、最小组件面）、C2（并发 ≤3 与目录互斥）下，5 组件令部署/监控/等保面成倍放大；手册 §1 编级「全编 16 对照实验出结论前不用于真实项目」，本轮为治理资产整改，不承载整栈迁移。
5. 该基线由 persona 单方声明、用户从未确认（§1.2），不能作为推翻现状的默认前提。

**D · Node + wasm 国密 + SQLite（13/20）**
1. 新增 wasm 构建/工具链，纯 JS 实现已通过 14 标准向量与 `n·G=∞` 自洽校验，YAGNI。
2. SQLite 与 `src/core/store.js` 的 JSON 原子写职责重叠，引入第二套持久化语义，成本 3 / 可行性 3。

## 5 决策理由与证据（宪法 C5：全部 file:line 指认）

| 依据 | 位置 | 支撑点 |
| --- | --- | --- |
| `{"type":"module"}` / `node>=20` / `{"dependencies":{}}` | `package.json:5 / :14 / :16` | ESM + 零依赖已是冻结事实 |
| 20 个 `.js` / 2076 行 / 57 条 ESM import-export-from / **0 条非 `node:`、非相对 import** | `src/` 本会话只读统计 | 零第三方依赖可指认 |
| `node --check` 20/20 文件 ESM 语法解析通过 | 本会话只读执行，无写盘 | 模块形态自洽 |
| 测试仅 `node:test` / `node:assert/strict`，无测试框架依赖 | `tests/gateway.test.js:2-3` | 可验证性零依赖 |
| 11/11 测试 + 14/14 国密自检（SM3(abc) 标准向量、SM4 ECB 681edf34…、SM2 裸 R‖S 64B） | `docs/squad/STATE.md` 质量域段 | 既有真实 node.exe exit 0 记录 |
| A1 运行时无 SM2/SM3/SM4 → 纯 JS | `docs/squad/STATE.md` 假设登记 | 决策与已登记假设一致 |
| ADR-1 零依赖约束、ADR-2 一次序列化、ADR-5 A13 文件通道 | `docs/arch/sys-arch.md:26-30` | 本 ADR 为其上位框架决策 |

> 证据纪律：本会话**未重跑** `node --test`，因 `tests/gateway.test.js:122` + `src/transport/filechannel.js:9` 的 sftp 分支会写 `.data/sftp-test`，与「仅写唯一落盘文件」约束冲突；11/11 结论引自 STATE.md 既有记录，本会话自证为 `node --check` 20/20 与零第三方 import 统计（均只读）。不谎报「测试已跑」。

## 6 后果与保留风险

- **正面**：单运行时、无供应链依赖、`node --test` 即全量回归、签名串与国密输出逐位可审计、容器面最小（C7）、回滚 = 单文件替换。
- **负面 / 风险**：纯 JS 国密需自担正确性与侧信道防护；单进程内存/JSON 存储不含跨实例事务；吞吐受单 Node 进程约束；自实现密码模块在密评/等保场景可能不被认可（§7-T1）。
- **生产化前置（沿用代落稿）**：私钥改由 KMS/HSM 托管（当前沙箱密钥仅占位）；SSL 证书不得 pin；入网参数替换占位（STATE.md A2）。
- **缓解**：向量回归纳入每次 CR 验收项；状态机/对账与文件通道已按 ADR-4/5 实现；跨实例需求出现时按 §7 走 CR，而非就地加库。

## 7 推翻条件

总指挥代落稿三条（保留）：**用户书面指定 Java 基线 / 银联入网要求必须调用国家认证密码设备 / 零依赖约束被解除**。下文细化为可度量、带证据要求的 T1–T6：

| 编号 | 触发条件（可度量 / 可指认） | 证据要求 |
| --- | --- | --- |
| T1 | 密评/等保或监管要求 SM2/SM3/SM4 必须来自**经认证**密码模块，纯 JS 自实现不予认可 | 合规结论文书 + 御史大夫安全预审 |
| T2 | 用户书面指定 Java 基线 / 总指挥或用户强制切换技术栈 | 总指挥批文或用户拍板记录 |
| T3 | 单进程容量不达标：压测峰值 QPS > [THRESHOLD_QPS] 或 P99 > [THRESHOLD_MS]，水平扩展后仍不满足 | 压测报告 + 运维经理签署 |
| T4 | 需跨实例持久化事务 / 关系型查询 / 多租户强一致，内存 + JSON 原子写不满足 | 需求基线变更 + 需求经理会签 |
| T5 | `contract.js` 升 v2.0 / `package.json` 增依赖 / 宪法或 AGENTS.md 目录所有权变更 / 零依赖约束解除 | 宪法 C10：契约/宪法/AGENTS 变更走 CR |
| T6 | S5 修复循环 > 3 轮仍无法收敛 | 宪法 C6：第 4 轮升级为架构变更或上报用户 |

> 推翻不等于就地改栈：一律先落 `CR-<编号>`，按 §8 链批准后方可动 `src/` / `package.json` / `contract.js`。阈值占位 `[THRESHOLD_QPS]` / `[THRESHOLD_MS]` 由运维经理压测后回填（A2 入网参数占位口径）。

## 8 CR 批准链（缺一无效，宪法 C10 + CHANGE-REQUEST.md）

因 §1.2 定性为**契约级静默偏离**，本决策的合规落地必须走 `squad-toolkit/templates/CHANGE-REQUEST.md` 五步链；`docs/arch/` 本域可写使本文可作为记录落盘，但记录 ≠ 批准：

1. **架构经理 / 产品经理会签** — 影响面分析与目标版本（`docs/arch/api-contract.md`、`CONSTITUTION.md`、`AGENTS.md §2`、`package.json`、`tests/`、`deploy/` 均在影响面内）；
2. **给事中封驳审核** — 抄可 / 封驳 / 留（+条件与期限），手册 §1B 门材料必经科抄，落 `docs/squad/review-gate.md`；
3. **御史大夫安全预审** — 契约/宪法必过，C3/C7 安全一票否决，落 `docs/qa/patrol-SN26-001.md`；
4. **总指挥批准** — 日期 + 结论；**须先经用户确认 A4**（A4 = 契约基线偏离确认，为总指挥待登记假设；STATE.md 当前假设登记列仅 A1–A3，A4 由总指挥补登，本文不代填）；
5. **交付发布经理归档** — `CR-001` + CHANGELOG + 版本 +1 + `CR_PATH`。

approved 后由交付发布经理发起**变更召回**；逾期未完成由起居注官在 `docs/squad/audit/doc-freshness.md` 将相关故事卡标「冻结」。同步更新 `docs/squad/TRACE.md` / `STATE.md` / `gates/` 由总指挥执行 —— AGENTS.md §1 三处属总指挥、所有成员禁写，本成员越界即 `status: hand_back`，不在本文内代写。

## 9 与既有文档的关系及写入边界

- `docs/arch/sys-arch.md:25-30` ADR-1..5 保持不变：ADR-001 是「运行时/语言/依赖」上位框架决策，ADR-1 是「国密实现路径」下位决策，引用而非覆写。
- 不修改 `contract.js`、`package.json`、`docs/squad/CONSTITUTION.md`、`tests/`、`src/`；不写 `docs/squad/{gates,STATE.md,TRACE.md,journal,audit}`、`docs/qa/`、`deploy/`、他人 inbox。
- 生效审批位次：本文件 → 给事中科抄 → 总指挥终审 → 用户确认 A4 → §8 CR 归档（手册 §1B）。

## 10 自校验（对派活验收逐条）

| 验收项 | 结论 | 证据 |
| --- | --- | --- |
| 唯一落盘文件 | PASS | 本轮 `writeFileSync` 2 次（补全 + §0 事实订正），均落在唯一文件 `docs/arch/ADR-001-tech-stack.md`；docs/arch 其余 4 文件 mtime 写前后未变 |
| 决策：纯 Node ESM 零依赖 | PASS | §2 + `package.json:5/:14/:16` |
| ≥3 备选且含预设 Java+SpringBoot+MySQL+Redis+Vue3 基线 | PASS | §3 共 4 案，C 即预设基线全栈 |
| 四维评分 | PASS | §3 可行性/成本/合规/演进 0–5 等权满分 20 + 逐项依据 |
| 被否理由 | PASS | §4 B/C/D 逐条带 `file:line` |
| 推翻条件 | PASS | §7 总指挥三条 + T1–T6 可度量 + 证据要求 |
| CR 批准链 | PASS | §8 五步链 + 用户确认 A4 + 召回 + 冻结 |
| 证据可指认 | PASS | §1/§5/§10 全带 `文件:行号` 或命令输出 |
| 禁写 src/ 与他人文件 | PASS | 未调用任何 `src/`、`tests/`、他人 inbox 写入 |
| 回报 ≤40 行 | PASS | 回报走原生消息通道、一行指针；C8 约束对象是回报消息 |
| 并发铁律 / 不谎报 | PASS | §0 如实披露代落占位、附录 A 原稿零删改、未声称已获批准 |
| 状态与 STATE.md 一致 | PASS | 表头 + 状态注记如实补记「已被 ADR-002 / 用户 A4 推翻」，未伪称现行 |

---

## 附录 A · 总指挥代落占位稿存档（原样，未删改）

> 以下为 2026-11-06T08:32:03.124Z 由总指挥按模板代落的占位全文，逐字保留，作为来源痕迹与信息零丢失凭据。

> 状态：派活已发（agent_teams wake / squads_run_member running），成员会话未回传正文；由总指挥按模板代落并标注「成员复核待补」，不得声称已由成员独立完成。

# ADR-001 · 技术框架选择（架构经理 · 需 CR 会签）

| 项 | 值 |
| --- | --- |
| 状态 | **提案（待给事中科抄 + 总指挥批准 + 用户确认 A4）** |
| 日期 | 2026-11-06 |
| 影响面 | 契约 docs/arch/api-contract.md、宪法 CONSTITUTION.md、AGENTS.md §2、package.json、tests/、deploy/ |

## 决策
采用 **纯 Node.js ESM + 零 npm 依赖 + 纯 JS 国密（SM2/SM3/SM4）** 作为本参考实现的技术框架；不引入前端、不引入关系库、不引入密码设备（生产接 KMS/HSM adapter 时另立 ADR）。

## 背景与冲突（必须显式裁决）
- `cordis.patch.yml` 的 `squad-arch` persona 写死技术基线：**Java 17 + Spring Boot 3.x + MySQL 8 + Redis；Vue 3 + TypeScript + Vite + Pinia + Element Plus**。
- 实际交付：`package.json` 为 `type:module / dependencies:{} / engines.node>=20`，20 个 `.js` 模块，无 Java、无 Vue、无 MySQL/Redis。
- 用户从未明示覆盖该基线 → 属**契约级静默偏离**，不是单纯技术选型；必须走 CR（架构/产品会签 → 给事中封驳 → 御史安全预审 → 总指挥批准 → 交付归档 + CHANGELOG + 版本 +1）。

## ≥3 备选与四维评分（可行性/成本/合规/演进，0–5）
| 备选 | 可行性 | 成本 | 合规 | 演进 | 合计 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| A 纯 Node ESM + 零依赖 + 纯 JS 国密（现状） | 5 | 5 | 4 | 5 | **19** | **采纳** |
| B Node ESM + 引入认证 npm 国密库 | 4 | 4 | 5 | 4 | 17 | 否：违反零依赖约束；外部 CVE「未查到」需补采风 |
| C 预设基线 Java17+SpringBoot+MySQL+Redis+Vue3 全栈 | 2 | 1 | 4 | 3 | 10 | 否：20 模块与 11 测试全废，迁移成本最高，且用户未要求前端 |
| D Node + wasm 国密 + SQLite | 3 | 3 | 4 | 3 | 13 | 否：新增构建链，收益不抵复杂度 |

## 被否方案理由
- B：`package.json` 零依赖是已验收基线；引入国密库需重跑 14 项向量与供应链审计。
- C：预设基线由 persona 单方声明，未与用户确认；且本任务为纯后端网关，无 UI 需求（前端经理本轮零范围）。
- D：YAGNI，纯 JS 实现已通过标准向量与 n·G=∞ 自洽校验。

## 关键约束与后果
- 国密算法正确性证据：tests/crypto.selftest.js 14 PASS（SM3(abc) 标准向量、SM4 ECB 681edf34…、SM2 裸 R‖S 64B）。
- 生产化前置：私钥改由 KMS/HSM 托管（当前 config/local-keys.json 仅沙箱）；SSL 证书不得 pin；入网参数替换占位。
- 推翻条件：用户书面指定 Java 基线 / 银联入网要求必须调用国家认证密码设备 / 零依赖约束被解除。

## 批准链（缺一无效）
1. 架构经理 + 产品经理会签：待补
2. 给事中科抄：见 docs/squad/review-gate.md
3. 御史大夫安全预审：见 docs/qa/patrol-SN26-001.md
4. 总指挥批准：待用户确认 A4 后
5. 交付发布经理归档 CR-001 + CHANGELOG + 版本 +1：待执行
