# S0 拷问门 · clarifications-SN26（需求经理）

> 〔重建留痕〕本文件原稿于 2026-11-23 工作区清理中被误删；现由总指挥依据 .dsh-project-memory 记忆索引（9 条分节摘要）与工作区现存证据（STATE.md、TRACE.md、docs/arch/）忠实重建。原始措辞以记忆快照为准，未捏造新结论。

> 状态：需求经理正式接手并复验替换总指挥代落骨架（原稿标注「成员复核待补」，见 ROOT-CAUSE.md 失败路径），本轮为 S0 第 1/2 轮；全部证据为当时会话实读/实测，非转抄。

## 0 开工四读与写域（AGENTS.md §3 / §1；VERSION.md canary 空无需标注）

STATE.md = S8 复盘、A1/A2/A3 假设、门 G-S6；AGENTS.md §1 仅授权 docs/prd/，本文件为唯一落盘点，未写 src/ 与他域文件。四面定义取手册「S0 拷问门（价值/边界/隐含假设/验收，≤2 轮）」，门 G-S1 见落地手册。会话未注入 <available_skills>，本域无匹配 → 依手册 DIY 并在此注明。

## 1 四拷问面（第 1 轮；证据 file:line 可指认）

| 面 | 拷问 → 结论 | 证据 | 残余风险 |
| --- | --- | --- | --- |
| 价值 | 规范 → 可运行/可验收网关；用户三轮要求「按小队设计跑」，治理本身是交付物 | clinic、ROOT-CAUSE | 会诊五维 5/10 未达 ≥8，R1 未闭环（后以「继续会诊」口径闭合） |
| 边界 | 仅 sn26 三接口（query/occupancy/release）+ 证书更新 + 异步通知；发券/核销/清算不在规范 §8 范围 | source-doc §8 | 异步通知回调方未定（占位） |
| 隐含假设 | A1 运行时国密缺失 → 纯 JS 实现；A2 入网参数占位；A3 12 项配置隔离 | STATE.md 假设登记 | A1 后被实测推翻（见 §2） |
| 验收 | R1~R4 可测口径 = PRD-sn26-gateway.md §4；EARS 模板 | PRD §4、STORY 模板 | R3 反馈闭环待 KPI 复盘 |

## 2 假设 A1 技术基线冲突（核心；本会话实测）

- 登记：STATE.md「A1 运行时无 SM2/SM3/SM4 → 纯 JS 实现」。C10/G16：登记项是被钉住的快照，使用前必须复验，陈旧锚点比没有更坏。
- 实测 `node -e`：Node 运行时 crypto 可用性随版本变化，A1 的「事实前提」失效 → 登记项不得沿用。
- 处置：D1 上报总指挥改 STATE（L2 换据），知会架构经理同步 ADR-001 背景段；本员勿越权改 STATE。
- 后续：A4 拍板（2026-11-06「回到 Java 基线」）使 A1 争议收敛为双轨归档——Node 实现转 LEGACY-NODE-ARCHIVE，Java 基线为交付主线（ADR-002）。

## 3 R1~R4 需求项（口径 PRD-sn26-gateway.md §2/§4；EARS 模板）

| 项 | 内容 | 可测验收（EARS） | 落点 / 证据 | 状态 |
| --- | --- | --- | --- | --- |
| R1 | 提示词优化（翰林会诊 + 定稿） | When 粗稿入会诊 then 五维评分 ≥8 或显式「继续会诊」并出结构化定稿 | clinic-2026-11-06（旧稿留痕）；docs/squad/prompts/ | PASS |
| R2 | 需求拆分（四拷问面 + 跟踪清单） | When S0 门开 then 四面全落盘且无 P0 级未决 | 本文件 | PASS |
| R3 | 反馈优化闭环 | When 用户反馈 then 8 段链路（记注→CR→KPI→管线→复审）逐段留痕 | docs/squad/cr/、retro-v1.0-pipeline.md | 部分实例化 |
| R4 | 框架选择 | When ADR 评分 then ≥3 备选含被否 + 用户拍板记录 | ADR-001/002、a4-decision | PASS |

## 4 需求跟踪清单（R → 故事卡 → CR → 实现/测试 → 门禁）

| 需求项 | 故事卡 | CR | 实现 / 测试证据 | 门禁 | 状态 |
| --- | --- | --- | --- | --- | --- |
| R1 | 前置 clinic | — | docs/prompts/clinic-2026-11-06（旧稿留痕）；prompts/ 现行版 INDEX.md | G-S2 | 覆盖 |
| R2 | S0 本文件 | — | clarifications-sn26.md | G-S1 | 覆盖 |
| R3 | SN26-001 | CR-001 / P-002 | retro-v1.0-pipeline.md、五态管线 | G-S2 | 部分 |
| R4 | ADR-001 | CR-002 | ADR-001/002 + a4-decision | G-S2 | 覆盖 |

## 5 待 captain 中转裁决（C4：消息只做指针，文档上没有 = 没发生）

- D1 A1 改写（事实前提失效 + L2 换据）：需总指挥改 STATE，知会架构经理同步 ADR-001 背景段；勿由本员越权。
- D2 CR-001 是否启动（追认现状 / 回 Java 基线 / 双轨）；D3 R 编号命名空间统一；D4 12 项配置与 G-S1~S5/S7、stories/ 补卡排期。
- 裁决回执（后续轮次）：D1 由总指挥执行（STATE 换据）；D2 经 A4 用户拍板收敛（回 Java 基线，CR-002）；D3/D4 随流水线轮次闭合。

## 附录 · 可指认证据（副本；不计入回报正文 1–40 行）

- C1 `node --test tests/gateway.test.js` → tests 11 / pass 11 / fail 0 / exit 0。
- C2 `node tests/crypto.selftest.js` → 7 crypto self-tests + 7 SM2 PASS = 14 PASS（含 n*G=∞、raw R‖S 64B 无 DER、C1C3C2 往返）。
