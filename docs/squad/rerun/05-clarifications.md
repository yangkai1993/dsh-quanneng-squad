# S0 拷问门 · 05-clarifications（全能小队流程重跑 · 需求经理）

> 状态：正式产出。本文是交付物（主体不受 40 行预算）；§6 回报段 ≤40 行，另经 `agent_teams_send_message(to=captain)` 发一行指针（宪法 C4/C8、派活消息口径）。
> 基线：现行 Java 基线（ADR-002 / CR-002，用户 A4 拍板）；`gateway-java/` `mvn test` 9/9。本轮为「全编16 成团 + 流程重跑」，产出只写 `docs/squad/rerun/` 指定文件。

## 0 开工四读与写域（AGENTS.md §3；每条可指认）

| 动作 | 实读结论 | 证据 |
| --- | --- | --- |
| §1 目录所有权 | `docs/squad/rerun/` 未列入 §1 表；本轮由 captain 派活消息显式授权「唯一落盘点」，同批 5 份落点互异、无第二写入者（§1 并发铁律满足）；补表建议见 D1 | AGENTS.md §1；`.agent-teams/quanneng-squad/inbox/*.jsonl`（5 份派活全文实读） |
| §3.1 STATE.md | S8 复盘 / 编级全编16 / 缺陷0 / 假设 A1~A3 / 门 G-S6；第 30–34 行记 A4 拍板→Java 基线→9/9→成团 cap=8 | `docs/squad/STATE.md:7-12`、`:30-34` |
| §3.2 VERSION.md | stable v2.7、**canary: (空)**、canary_scope 空 → 无需标注「canary 规则生效：P-编号」 | `squad-toolkit/VERSION.md:3-5` |
| §3.3 技能/工具对表 | 本会话未注入 `<available_skills>` 清单；已对表宿主工具目录（含 `skill`/`create_skill`，命中需准确 name，本域无匹配技能名）→ 依手册 §3.6 DIY 并在此注明 | `全能编程小队-落地手册.md:81-84`；工具目录实测 |
| 派活附加读：INTERACTION §八 | 三项原定工具（squads_run_squad/list_agents/send_message）**全 FAIL 且属宿主能力缺失、非待办**；正式链路 = `agent_teams` 原生消息 + 文件总线；重启假设已被证伪（55215→51646） | `docs/squad/INTERACTION.md:202-227`、`:229-233`（§九校准） |
| 四面定义 | S0 拷问门 = 价值 / 边界 / 隐含假设 / 验收，**≤2 轮**；门 G-S1 主判「需求经理 + 给事中」 | `全能编程小队-落地手册.md:31`、`:63` |
| 本轮写域 | 仅 `docs/squad/rerun/05-clarifications.md`；禁写旧稿（`docs/prd/clarifications-SN26*.md`、`docs/arch/ADR-001*` 等）、`src/`、`gateway-java/`、`docs/squad/STATE.md`、`gates/`、他人 inbox/dispatch | 派活消息；AGENTS.md §1 |
| 同批落点互斥（实测） | 05-clarifications（需求）/ 06-PRD（产品）/ 07-ADR（架构）/ 08-STORY（后端）/ 10-patrol（御史）互异；`rerun/` 落盘前为空目录（readdir 实测） | `.agent-teams/quanneng-squad/inbox/*.jsonl`；`fs.readdirSync('docs/squad/rerun') → (empty)` |
| 本会话运行时实测 | `agent_teams_status({})` → members **8 人**（5 running / 3 unspawned）、`tasks: []`、`loop_state: blocked: team has no completed work`；与 cap=8 / 分两批在岗口径一致 | 本会话命令输出（§2.8 引用） |

## 1 四拷问面（第 1 轮，≤2 轮；证据 file:line 可指认）

| 面 | 拷问 → 结论 | 证据 | 残余风险 |
| --- | --- | --- | --- |
| 价值 | 用户要「全编16 成团 + 流程重跑」：把治理流水线在**现行 Java 基线**上复跑一遍，产出 `rerun/05~10` 序列，验证 S-1→S0→PRD/ADR/STORY→抽巡→门禁仍可执行、且与现行基线一致；治理资产本身是交付物 | 派活消息「流程重跑·全编16」；`docs/squad/TEAM-CHARTER.md:21-22`；`docs/squad/FUNCTIONAL-MATRIX.md:5-11` | 重跑是治理演练、非新增业务需求；R1 会诊 5/10「继续会诊」未达 ≥8；L4 五态管线等数据点火（`FUNCTIONAL-MATRIX.md:16`、`:23-28`） |
| 边界 | 写域只到 `rerun/` 各唯一落盘点（禁旧稿 / 禁 `src/`）；业务边界仍为 SN26 三接口 + 证书更新 + 异步通知，发券/核销/清算「是否参与清算=否」；Vue3 前端栈本轮零 UI 需求、不建 | 派活消息；`.analysis/source-doc.txt:540-543`；`docs/arch/api-contract.md:22`；`docs/arch/ADR-002-java-baseline.md:9` | `rerun/` 未列 AGENTS §1 所有权表 → 登记 D1 由总指挥补表；旧稿 `clarifications-SN26.md:9`「文件批次不在范围」与 TRACE R8 A13 已实现口径不一（沿用旧 D3 类风险，本轮不擅改） |
| 隐含假设 | 旧 `STATE.md:12` A1（运行时无国密→纯 JS）在 Java+BC 基线已失效；A4 框架已由用户拍板闭环；**cap=8 是运行时硬上限、不是配置遗漏**；INTERACTION 三项 FAIL 已定论非待办 → 全部按 A 编号重新登记（§2） | `docs/squad/STATE.md:12`、`:30-34`；`docs/arch/ADR-002-java-baseline.md:9`；`docs/squad/ROSTER-16.md:31-43`；`docs/squad/INTERACTION.md:206-213` | STATE.md 仍停留 S8 旧账本、未记本轮重跑（归总指挥，D2）；A2 入网占位 / A3 §12 的 12 项仍未答复 |
| 验收 | 每阶段落盘 + ADR 含被否方案 + EARS 故事卡 + 反馈闭环 + 门禁三值 + 测试实读；本轮 9/9 = surefire 6+3、0 Failures/Errors（本会话实读，不冒称本轮重跑 mvn）；回报 ≤40 行 + 一行指针 | `gateway-java/target/surefire-reports/com.unionpay.tradein.ContractAndCryptoTest.txt:4`（6/0/0）、`.../SnControllerTest.txt:4`（3/0/0）；`docs/squad/gates/G-S2.md:35`；宪法 C5/C8 | G-S1/S3/S4/S5/S7 未实例化（`FUNCTIONAL-MATRIX.md:23`）；stories/ 仅 1 卡；Java 端 A15 全掩码+HMAC / KMS-HSM / 负向断言+RSA2 共 4 条整改未闭（`docs/qa/patrol-CR002.md:13`） |

## 2 假设 A 编号登记（本轮重跑基线；C10/G16：登记=钉住快照，使用前复验）

| 编号 | 假设陈述 | 依据 file:line | 状态 / 复验 | 推翻条件 |
| --- | --- | --- | --- | --- |
| A1 | **旧条作废**：`STATE.md:12`「运行时无 SM2/SM3/SM4 → 纯 JS 实现」在现行基线不成立；改记为「Java 17 标准库无原生国密，SM2/SM3/SM4 经 BouncyCastle bcprov/bcpkix 实现」 | `docs/squad/STATE.md:12`；`docs/arch/ADR-002-java-baseline.md:9`；`docs/prd/clarifications-SN26-A4-decision.md` | 已复验（本会话实读 ADR-002/CR-002）；旧条由总指挥在 STATE.md 标注作废，本人越权不改 → D2 | 用户改回 Node 基线 / 入网方指定非 BC 国密设备 |
| A2 | 入网参数用占位；沙箱密钥为临时 KeyPair、`application.yml` 占位符，生产须 KMS/HSM 替换 | `docs/squad/STATE.md:12`(原 A2)；`docs/qa/patrol-CR002.md:8` | **未复验**（沿用登记，入网前必须替换） | 入网参数正式下发 / KMS-HSM 接线完成 |
| A3 | §12 的 12 项待确认全部配置隔离 | `docs/squad/STATE.md:12`(原 A3) | **未复验**（12 项仍无答复） | 银联/用户书面答复 12 项 |
| A4 | 技术框架 = Java17 + SpringBoot3.5.16 + MySQL8 + Redis + BC；Vue3 栈后续可选、本轮零范围 | `docs/arch/ADR-002-java-baseline.md:5,9`；`docs/squad/cr/CR-002-java-baseline.md:6`；`docs/squad/gates/G-S2.md:34` | **已闭环**（用户 A4 拍板 + CR-002 五步 + G-S2 PASS） | 用户再次改判 / 入网方明确要求非 Java 栈（ADR-002 推翻条件） |
| A5 | 本轮重跑无 UI 需求 `→` 前端经理零范围，不派前端实现 | `docs/arch/ADR-002-java-baseline.md:9`；`docs/squad/STATE.md:30` | 已复验 | 用户新增 UI 需求 |
| A6 | 交互以 INTERACTION §八 为终版口径：三项工具 FAIL 属宿主能力缺失（重启无效），正式链路 = agent_teams 原生消息 + 文件总线 | `docs/squad/INTERACTION.md:202-227`、`:229-233` | 已复验；不得再写「待重启复测」 | 宿主升级提供 list-agents 子插件 / 新会话改 preset |
| A7 | **cap=8 运行时硬约束**（见 §2.8 单列显式登记） | `docs/squad/ROSTER-16.md:31-43`；`docs/squad/FUNCTIONAL-MATRIX.md:20,28` | 已复验（本会话 `agent_teams_status` 8 人） | 宿主放开 cap / 允许多 team |
| A8 | 旧 Node 实现归档保留、不删除已验收资产，11/11 仍通过，但**不作本轮基线** | `docs/arch/ADR-002-java-baseline.md:29`；`docs/squad/TEAM-CHARTER.md:22` | 已复验 | 用户要求删除归档 |
| A9 | 本轮重跑只写 `docs/squad/rerun/` 各唯一落盘点；旧稿与 `src/`/`gateway-java/` 禁写；`rerun/` 未列 §1，依派活消息授权 | 派活消息；AGENTS.md §1；本会话 readdir 实测空目录 | 已复验（本文件为唯一写入） | 总指挥改派 / 补 §1 表 → D1 |

### 2.8 显式约束登记 · cap=8（派活指定项，单列不并入普通假设）

| 项 | 内容 | 证据 |
| --- | --- | --- |
| 事实 | `agent_teams_add_member` 8/8 后报 `member cap (8)`；`spawn_teammate` 绕过 add_member 但累计仍 8 名额（6 slug + 2 探针占额，翰林/太傅待位）；`interrupt_agent` **不释放名额**，remove/delete 当前会话不可用 | `docs/squad/ROSTER-16.md:31-34`；`docs/squad/INTERACTION.md:48`、`:125` |
| 可达 | `squads_run_member` 16/16 ok/running（全编唯一派活通道）；team 总线 8+6=**14/16 可见**；`agent_teams_send_message` 8/8 wake / live | `docs/squad/ROSTER-16.md:4-8,39-41`；`docs/squad/TEAM-CHARTER.md:4,10-11`；`docs/squad/INTERACTION.md:208-213` |
| 不达成 | 「16 人同时出现在 `list_agents`」**当前不成立**，属运行时能力边界而非配置遗漏，禁止伪装 PASS | `docs/squad/ROSTER-16.md:43`；`docs/squad/FUNCTIONAL-MATRIX.md:20,28` |
| 本会话实测 | `agent_teams_status({})` → members 8（需求/产品/架构/后端/御史 running；前端/运维/交付 unspawned）、`tasks: []`、`loop_state: blocked「team has no completed work」` | 本会话命令输出（§0 末行） |
| **需求侧不变量（写进 R/跟踪清单）** | 任何「16 人同屏 / 同名册可见」验收项在宿主放开前恒为 **BLOCKED**，不得记 PASS；本轮重跑验收以「16/16 可派活 + 14/16 总线可见 + 文件总线回执」为准 | 本文 §3 / §4；`docs/squad/TEAM-CHARTER.md:26` |
| 解除条件 | 宿主放开 `list_agents` 名额或允许多 team（需用户/宿主侧决策 → D5），且仅在新会话生效 | `docs/squad/TEAM-CHARTER.md:26`；`docs/squad/FUNCTIONAL-MATRIX.md:28` |

## 3 R1~R4 需求项（流程项；口径 `docs/prd/PRD-sn26-gateway.md:88-135`、EARS 模板 `squad-toolkit/templates/STORY.md`）

| 项 | 内容 | 可测验收（EARS） | 本轮重跑落点 / 证据 | 状态 |
| --- | --- | --- | --- | --- |
| R1 | 提示词优化（翰林会诊 + 定稿） | When 粗稿入会诊 then 五维评分 ≥8 出定稿 **或** 显式「继续会诊」并出结构化定稿（含 5 条验收 + 失败路径） | 旧稿 `docs/prompts/clinic-2026-11-06.md:24-44`（5/10 继续会诊，只读引用、禁写）；本轮派活未要求重跑会诊 | **沿用 / 部分**：闭环定义可测，定稿执行待用户确认（PRD §4.1 未决） |
| R2 | 需求拆分（EARS 故事卡实例化） | When 派活 then 每需求项唯一落盘点 + EARS 五类 + 自测记录 + 初审清单，占位符全替换 | 同批 `docs/squad/rerun/08-STORY.md`（后端经理在制：「全编16 成团+流程重跑」）；旧 `docs/squad/TRACE.md:5-15` 仍 10 项「(补卡)」 | **在制 / 部分**：本轮 1 卡实例化，旧补卡遗留列 P1 |
| R3 | 反馈优化闭环 | When 用户提缺陷 then journal→bugs→CR→M1~M9→五态管线→复审→门禁→回报，全程可追溯且不得谎报「已闭环」 | `CR-002` 五步闭合（`docs/squad/cr/CR-002-java-baseline.md:11-15`）；`docs/squad/retro-v1.0-pipeline.md`、`docs/squad/pipeline/P-002-demand-gate.md`、`docs/squad/audit/PIPELINE-CHECK.md`；L4 点火未满足（`FUNCTIONAL-MATRIX.md:16`） | **部分实例化**：定义 + 主链已落，4 段/KPI 读数待点火（PRD §4.3 口径沿用） |
| R4 | 技术框架选择 | Ubiquitous：ADR ≥3 备选含被否理由 + 推翻条件 + CR 批准链；契约级偏离须用户裁决 | `docs/arch/ADR-002-java-baseline.md:17-31`（4 备选 / 被否理由 / 推翻条件）、`CR-002:11-15`、`docs/squad/gates/G-S2.md:33-38`；本轮 `07-ADR.md` 复述 | **已闭环**：用户 A4 拍板 + CR-002 五步 + 9/9 + G-S2 PASS |
| C-cap8 | 成团可见性约束（本轮新增登记，见 §2.8） | Ubiquitous：16/16 可派活为真；Unwanted：若断言「16 人同时 list_agents 可见」then 判 BLOCKED 并记录宿主 cap=8，不得 PASS | `ROSTER-16.md:31-43`、`TEAM-CHARTER.md:4,26`、`FUNCTIONAL-MATRIX.md:20,28`；本会话 `agent_teams_status` 8 人实测 | **显式登记 / 阻塞**（解除需宿主侧） |

> **命名空间告警（沿用旧 D3）**：本表 R1~R4 为「流程项」，`docs/squad/TRACE.md:5-15` 的 R1~R11 为「功能项」，编号撞名会误判手册 §1B.2A「PRD ↔ 故事卡 ↔ TRACE」判据（`docs/prd/clarifications-SN26.md:31`）。建议 PF-1~PF-4 / FR-1~FR-11；本文件不擅改他人文件 → D3。

## 4 需求跟踪清单（R → 本轮落点 → CR → 实现/测试证据 → 门禁）

| 需求项 | 本轮 rerun 落点 | CR | 实现 / 测试证据 | 门禁 | 状态 |
| --- | --- | --- | --- | --- | --- |
| R1 提示词优化 | 本文 §3（旧 clinic 只读引用） | — | `clinic-2026-11-06.md:24-44` | G-S1（缺，`FUNCTIONAL-MATRIX.md:23`） | 沿用 / 部分 |
| R2 需求拆分 | `06-PRD.md` + `08-STORY.md`（同批在制） | — | `gateway-java/` surefire 6+3=9 / 0 fail（本会话实读）；`docs/squad/TRACE.md` | G-S1 / G-S3（缺） | 在制 / 部分 |
| R3 反馈闭环 | `06-PRD.md`（反馈闭环定义） | CR-002（五步闭合） | `retro-v1.0-pipeline.md` / `P-002` / `PIPELINE-CHECK.md` / `review-gate-CR002.md` | G-S6（CONCERNS，`patrol-CR002.md:13`） | 部分实例化 |
| R4 框架选择 | `07-ADR.md`（复述 ADR-002） | CR-002（:11-15） | `ADR-002` / `G-S2.md:33-38` / 9/9 BUILD SUCCESS | G-S2 **PASS** | 已闭环 |
| FR-1~FR-11 功能项 | 本轮不重派（沿用 `docs/squad/TRACE.md`） | — | `gateway-java/src/main/java/...` 10 类 + 2 测试类；9/9 | G-S6 CONCERNS | 功能覆盖 / 治理待补 |
| C-cap8 成团可见 | 本文 §2.8（唯一显式登记点） | — | 本会话 `agent_teams_status({})`：8 人 / `tasks: []` / blocked | 宿主门（非 G-S1~S7） | **BLOCKED**（D5） |

## 5 待 captain 中转裁决（C4：文档上没有 = 没发生；消息只做指针）

- **D1**：`docs/squad/rerun/` 未列入 `AGENTS.md §1` 目录所有权表；本轮依派活消息「唯一落盘点」授权，建议总指挥补表或书面确认（本人不改写 §1 / 宪法）。
- **D2**：`STATE.md:12` 旧 A1（纯 JS 国密）在 Java+BC 基线失效、且 STATE 未记本轮重跑；请总指挥改记并知会架构经理（越权项，本人只登记）。
- **D3**：R 编号命名空间分离（PF-1~PF-4 / FR-1~FR-11）。
- **D4**：A2 入网参数占位 / A3 §12 的 12 项答复，G-S1/S3/S4/S5/S7 门禁、stories/ 补卡、Java 端 4 条整改（A15+HMAC / KMS-HSM / 负向断言+RSA2）排期。
- **D5（cap=8）**：「16 人同时 list_agents 可见」需宿主放开 cap 或多 team（用户/宿主侧决策，新会话生效）；放行前该项恒为 BLOCKED，不得计入 PASS。

## 6 回报（需求经理 · ≤40 行）

status: ready | 交付物：`docs/squad/rerun/05-clarifications.md`（本轮唯一写入文件；`rerun/` 落盘前为空，同批 5 落点互异）。
- 开工四读完成：AGENTS.md §1/§3（rerun/ 未列所有权表→D1，派活消息授权）、STATE.md:7-12/30-34（S8 / A1~A3 / A4→Java / 9/9 / cap=8）、VERSION.md:3-5（stable v2.7、canary 空，无需 P-编号）、INTERACTION.md §八+§九（三项 FAIL 属宿主能力缺失、非待办；重启假设已证伪）。
- 技能对表：本会话未注入 `<available_skills>`，宿主工具目录已对表、无本域匹配技能名 → 手册 §3.6 DIY，已注明（§0）。
- 交付：§1 四拷问面（价值/边界/隐含假设/验收，第 1 轮，≤2 轮）；§2 假设 A1~A9 编号 + §2.8 **cap=8 显式登记**（含本会话 `agent_teams_status` 8 人实测 + 需求侧不变量「16 人同屏恒 BLOCKED」）；§3 R1~R4 + C-cap8 需求项（EARS）；§4 跟踪清单；§5 D1~D5 待裁决。
- 基线一致性：A4 已闭环（ADR-002 拍板 / CR-002 五步 / G-S2 PASS）；A1 旧「纯 JS 国密」作废改记 BC（D2）；A2/A3 沿用未复验如实标注；R4 不重裁决，只复述。
- 证据纪律（C5）：9/9 = `ContractAndCryptoTest.txt:4`(6/0/0) + `SnControllerTest.txt:4`(3/0/0) 本会话**实读**，未冒称本轮重跑 mvn；cap=8 三份权威 ROSTER-16/TEAM-CHARTER/FUNCTIONAL-MATRIX + 本会话 status 输出；每条结论挂 file:line。
- 约束：仅写本文件；未写旧稿 / `src/` / `gateway-java/` / STATE / gates / 他人 inbox/dispatch；未派生子智能体（fork 剩余深度 0）；未建任务、未提交（C9）。
- 回报通道：本 §6（≤40 行）+ `agent_teams_send_message(to=captain)` 一行指针；指挥用 `read` / `grep -n "cap=8\|§2.8\|R1~R4" docs/squad/rerun/05-clarifications.md` 回收。
