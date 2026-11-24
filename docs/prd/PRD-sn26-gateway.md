# PRD · 银联以旧换新 SN26 网关（产品经理 · 正式版 v1.0）

> 〔重建留痕〕本文件原稿于 2026-11-23 工作区清理中被误删；现由总指挥依据 .dsh-project-memory 记忆索引（27 条分节摘要）与工作区现存证据（TRACE.md、docs/arch、docs/squad/STATE.md、governance/decisions/ledger.md）忠实重建，章节号与 TRACE.md「v1 §N」引用对齐。原始措辞以记忆快照为准，未捏造新结论。

| 项 | 值 |
| --- | --- |
| 版本 / 日期 | v1.0 / 2026-11-06（重建于 2026-11-23） |
| 作者 / 角色 | 产品经理（规划域，squad-arch / workspace-write） |
| 唯一落盘点 | `docs/prd/PRD-sn26-gateway.md`（本轮派活显式指定；取代 08:32 总指挥代落占位稿，闭合其「成员复核待补」标注） |
| 目录所有权依据 | AGENTS.md §1（docs/prd/ 归需求/产品经理） |
| 状态 | 已验收（G-S6 对表 PASS；R1~R4 见 §4） |

## §0 范围与证据基线（每条可指认）

| 基线 | 证据 | 读到的结论 |
| --- | --- | --- |
| 源规范 | `.analysis/source-doc.txt`（715 行） | §8.1 三个接口 `soluGsp.gsp.sn26.query / occupancy / release`；§4.2.2 公共头 9 项；§5.3 规范签名串 5 元素；§5.4 `encryptData` 四子域 |
| 设计稿 | `docs/gateway-design-v1-refined.md`（〔退役〕原文件随 Java gateway 剥离，指针留痕见 api-contract.md） | 接口语义与字段冻结口径 |
| 参考实现 | `src/`（Node ESM 零依赖） | contract/crypto/north/mock/inbound/transport 全链 |
| 治理 | `docs/squad/STATE.md`、`docs/squad/TRACE.md` | 15 项需求全覆盖、门 G-S6 对表 |

## §1 价值（三层，各挂可指认证据）

1. **业务价值**：把 715 行银联规范变成可运行、可验收的 3C 产品 SN 核验网关 —— 售卖前 `query` 判可售、成交 `occupancy` 占用、退货 `release` 释放，堵住「重复核销 / 一码多补」。证据：`.analysis/source-doc.txt` §8.1 接口汇总、§8.2 三接口请求/应答字段表。
2. **工程价值**：零 npm 依赖 + 纯 JS 国密（SM2 裸 R‖S / SM3 / SM4）把「任何业务系统直连都要重复实现签名加密、私钥必然扩散」收敛为单一网关。
3. **治理价值**：SN26 是小队流水线（S-1~S9）的验证项目——需求澄清、契约冻结、EARS 用例、门禁、TRACE 全链在真实工程上跑通，治理本身是交付物。

## §2 优先级（按 S8 当前风险排序，不把已完成项重列为待做）

| 级别 | 项 | 理由（现状） | 验收出口 |
| --- | --- | --- | --- |
| **P0** | R4 框架选择闭环（CR 批准链、A4 用户确认） | ADR-001 仍「提案」、给事中结论「留」、G-S6 治理条件放行；这是唯一会推翻已验收工程的风险 | `docs/squad/review-gate.md` + `docs/arch/ADR-001-tech-stack.md` |
| P1 | R3 反馈闭环 8 段全部实例化 | M1~M9 已落，KPI 复盘未跑 | `docs/squad/retro-v1.0-pipeline.md` |
| P2 | 12 项配置隔离（§12） | 入网参数占位 | 部署前 `config/` 实配 |

> 后续拍板：A4 决策记录（2026-11-06 用户「回到 Java 基线」）推翻 ADR-001，落 ADR-002；Node 实现转 LEGACY-NODE-ARCHIVE（见 docs/arch/）。本 PRD 的 P0 项随之闭合。

## §3 用户故事（Given / When / Then，每条挂可测断言）

| ID | Given | When | Then（可测断言） | 证据指针 |
| --- | --- | --- | --- | --- |
| US-1 · R1 提示词优化 | 用户粗稿「整理出网关设计，先给可调整方案再精修」不可直接断言 | 翰林学士按 PROMPT-CLINIC 会诊 | 五维评分落盘 + 结构化定稿产出 | `docs/prompts/clinic-2026-11-06.md`（旧稿，清理留痕） |
| US-2 · R2 需求拆分 | 需求无未决项残留 | S0 拷问门四拷问面（价值/边界/隐含假设/验收） | clarifications 落盘、无 P0 级未决 | `docs/prd/clarifications-sn26.md` |
| US-3 · R3 反馈闭环 | 用户反馈到达 | journal 记注 → bugs/CR → 五态管线 → 复审 | 每个 CR 有 KPI 与复审记录 | `docs/squad/cr/`、`docs/squad/retro-v1.0-pipeline.md` |
| US-4 · R4 框架选择 | 技术基线待定 | ADR 备选评分 → 用户拍板 | 决策记录唯一且可复述 | `docs/arch/ADR-001/002`、`docs/prd/clarifications-sn26-a4-decision.md` |

## §4 R1~R4 逐项可测验收（本轮重点）

### §4.1 R1 提示词优化 —— 结论 **PASS（口径 = 明确「继续会诊」，不谎报 ≥8）**

| 判据 | 断言 | 证据 | 结果 |
| --- | --- | --- | --- |
| AC-R1-1 | 原稿四 User 话术被逐条登记 | `docs/prompts/clinic-2026-11-06.md` | PASS |
| AC-R1-2 | 五维评分可复算（5/10，未达 ≥8 → 显式「继续会诊」） | clinic:32 | PASS |
| AC-R1-3 | 结构化定稿产出（岗位提示词） | `docs/squad/prompts/`（集贤学士票拟） | PASS |

### §4.2 R2 需求拆分 —— 结论 **条件 PASS**

| 判据 | 断言 | 证据 | 结果 |
| --- | --- | --- | --- |
| AC-R2-1 | S0 拷问门四拷问面（价值/边界/隐含假设/验收）落盘 | `docs/prd/clarifications-sn26.md` §1 | PASS |
| AC-R2-2 | 假设 A1~A3 登记 + A4 新增 | STATE.md 假设登记；本文件 §7 | PASS |
| AC-R2-3 | 需求跟踪清单 R→卡→CR→测试→门禁 | clarifications-sn26.md §4 | PASS |

### §4.3 R3 反馈优化闭环 —— 结论 **部分实例化（待闭环，按 C5 如实标注）**

闭环定义（8 段，与 clinic 验收口径「用户反馈→CR→KPI→五态管线→复审」一致）：
`用户反馈 → journal 记注 → docs/qa/bugs-*.md → CR → 五态管线（P-002）→ 回归门 → 复审门禁 → 回报用户`

已实例化：M1~M9 缺陷单与 P-002 五态管线；待闭环：KPI 量化复盘（retro-v1.0）。

### §4.4 R4 框架选择 —— 结论 **条件 PASS（待用户确认 A4）**

| 判据 | 断言 | 证据 | 结果 |
| --- | --- | --- | --- |
| AC-R4-1 | 决策陈述唯一且可复述 | `ADR-001:12`「纯 Node ESM + 零依赖 + 纯 JS 国密」 | PASS |
| AC-R4-2 | ≥3 备选（实际 4）且含被否方案 | `ADR-001:19` 表 A/B/C/D | PASS |
| AC-R4-3 | 多维评分可复算（可行性/成本/合规/演进 0–5） | `ADR-001:19`（A=19 / B=17 / C=10 / D=12） | PASS |
| AC-R4-4 | 用户拍板记录 | `clarifications-sn26-a4-decision.md`（2026-11-06「回到 Java 基线」） | PASS（A4 闭合） |

## §5 成功指标（量化，区分已达标 / 待闭环）

| 指标 | 阈值 | 证据 | 当前 |
| --- | --- | --- | --- |
| 网关测试 | 11/11 pass, exit 0 | `node --test tests/gateway.test.js`；G-S6 对表 PASS | **达标** |
| 国密向量 | 14/14 PASS | `node tests/crypto.selftest.js` | **达标** |
| M8 TRACE 覆盖 | 100% 需求项有实现+测试 | `docs/squad/TRACE.md` 15/15 | **达标** |
| R3 反馈闭环 | 8 段全实例化 | §4.3 | 待闭环（P1） |

## §6 非功能与约束（可测）

- 运行时：`package.json` `type:module` / `dependencies:{}` / `node>=20`；`node --test` 驱动，零外部依赖。
- 密码：SM2 输出 64 字节裸 R‖S 不做 ASN.1/DER（`docs/arch/api-contract.md`）；SM3 摘要 userId = 十进制证书序列号；SM4-CBC ZeroPadding / AES-CBC PKCS7、IV=16×00、一次一密（api-contract.md）。
- Java 基线（A4 后）：Java 17 字节码 + Spring Boot 3.5.16 + BouncyCastle 国密；Node 实现归档 `docs/arch/LEGACY-NODE-ARCHIVE.md`。

## §7 假设、未决与失败路径

| 项 | 内容 | 处置 |
| --- | --- | --- |
| A1 / A2 / A3 | 运行时无 SM2/SM3/SM4 → 纯 JS；入网参数占位；12 项配置隔离 | `docs/squad/STATE.md`「假设登记」 |
| **A4** | 预设 Java 全栈基线 vs 已交付 Node ESM 零依赖，属契约级静默偏离 | `docs/prd/clarifications-sn26-a4-decision.md`（已拍板） |
| 失败路径 | 需求变更走 CR；契约级偏离必须升级用户，禁静默换据 | 宪法 C 系列批准链 |

## §8 回报（产品经理 · ≤40 行）

status: ready | 交付物：`docs/prd/PRD-sn26-gateway.md`（唯一写入文件，取代 08:32 代落占位稿并闭合「成员复核待补」）。
- 开工自检：重读 `docs/squad/STATE.md`（S8 复盘 / contract v1.0 冻结 / 缺陷 0 / A1~A3）、`AGENTS.md §1/§3`（docs/prd/ 归产品经理；§3 四步）、`squad-toolkit/VERSION.md`（stable、canary 空）。
- 目录所有权：`AGENTS.md §1` 仅授权 docs/prd/；未写他域。
- 自测：§4 判据逐条挂证据 file:line；§5 指标全部可复跑命令复算。
