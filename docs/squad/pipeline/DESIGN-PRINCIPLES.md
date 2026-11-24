# 全能小队工具链设计依据 v1.0（2026-11-14）

> 用户要求「以经典软件设计思想和书籍作为依据进行实时改进」。本文件是依据的**唯一落盘点**；
> 每次改进在 round-N 简报里引用本文件条款号，禁止口头引书名却不落到判定动作。

## 1. 组件化 / 工程化

| 原则 | 出处 | 本项目落地 | 可验证判据 |
| --- | --- | --- | --- |
| DRY（Don't Repeat Yourself） | Andrew Hunt & David Thomas《The Pragmatic Programmer》 | `scripts/lib/gate-kit.mjs` 抽取 `W`/`cn2num`/`maxBriefRound`/`runGate`；此前 10 脚本各写 W、2 门各写 cn2num | `verify.mjs` 断言组件存在 + 被 ≥2 门引用；新增门不得再自带 W 解析 |
| SRP（单一职责） | Robert C. Martin《Clean Code》/《Agile Software Development, Principles, Patterns, and Practices》 | 门脚本只保留领域判定；路径解析、豁免、退出码由 gate-kit 承担 | 门脚本不得直接 `process.exit(1)` 或 `traceExemption`（走 runGate） |
| ISP / DIP（SOLID） | 同上 | 门依赖 `runGate({...})` 契约，不依赖具体豁免实现；K1 派票要求 `SignatureService` 依赖 `SignIdCertRegistry` 接口而非具体 Map | 组件化后改前/改后门 exit 与 problems 逐一等价（里氏替换） |
| Fail-fast / 单一出口 | Michael Nygard《Release It!》 | `runGate` 统一「默认阻断 + 到期豁免 + stderr 留痕」；无豁免即 `failFast(1)` | 8 门出口形态一致；`EXEMPTIONS.md` 无过期当前行（verify 断言） |
| 高内聚低耦合 | Stevens/Myers/Constantine《Structured Design》 | lib/ 从 1 个共享件扩到 2 个；业务代码不改（C1） | `kitRefs>=2`、组件单测通过 |

## 2. 合规化

| 原则 | 出处 | 本项目落地 | 可验证判据 |
| --- | --- | --- | --- |
| Compliance as Code | Jez Humble & David Farley《Continuous Delivery》 | `api-contract.md` §10 K1~K4 每条带规范原文行号 ↔ 实现锚点 ↔ 机器断言 ID | `result-verify.mjs` 输出 `compliance:K<n>` 行 inContract/inImpl |
| 规范原文优先（P9） | G-REFLOW P9（实案判例） | K1~K3 措辞逐字取自 `.analysis/source-doc.txt:314/318/365/526`，不合并互斥语义 | 条款表含行号；K2 曾因断言正则写错误报，实读现码后修正（不派假票） |
| 不写假绿（C5 / P1） | 项目宪法 / G-REFLOW | K1 当前无 `map<signId,cert>` → 机器断言如实报红，登记带到期日豁免（2026-11-15，闭合条件写明），不掩盖 | `result-verify` gaps 含 K1；豁免 stderr 留痕；`verify` 断言当前豁免表无过期行 |
| 密钥/证书生命周期 | 银联规范 :365「新旧证书并行期建议 3 个月」、`NIST SP 800-57`（密钥轮换/重叠期） | K1 注册表需支持两套 signId + notAfter + 旧证到期前切换 | TK-47-02 用例：新旧并存/按 signId 选证/过期判定/未知 signId fail-closed |

## 3. 实时改进闭环

1. 每轮审计：只读反查重复代码与合规缺口（先证据后结论，A11）。
2. 改进必须小步可回滚：组件化前后门 exit/problems 等价验证（本轮 dispatch-guard 曾被正则吞掉 `byToken`，整文件重建后复验）。
3. 依据落本文件 → G-REFLOW 增 P 编号 → 提示词内化 → release 链断言，四步缺一不算改进完成。
4. 本文件变更走 CR（宪法 C10），由架构经理会签。

## 会签记录

| 项 | 值 |
| --- | --- |
| 会签人 | 考功郎中（@v17） |
| 日期 | 2026-11-15 |
| 令牌 | TK-47-04（S9 改进反哺 / 宪法 C10 文档变更会签，闭合 D10） |
| 会签对象 | 本文件 v1.0（2026-11-14 落盘，第 1~30 行为技术正文） |
| 会签确认 | ① 内容与 G-REFLOW P11 一致；② 技术结论未改（本次仅追加本节，第 1~30 行逐字未动，未改脚本/门禁/AGENTS）；③ 依据条款号可指认（下表每条给出「P11 检查项 ↔ 本文件 §N:行号」双向锚点） |
| 写域 | 仅 docs/squad/pipeline/DESIGN-PRINCIPLES.md（AGENTS §1：pipeline/ 属测试经理/考功郎中写域，第 47 轮由指挥越界创建，本票移交合法归属） |

### v1.0 与 G-REFLOW P11 一致性逐条核验清单

| # | P11 强制检查项 / 判定方式（G-REFLOW.md:19） | v1.0 对应条款（可指认） | 核验结论 |
| --- | --- | --- | --- |
| 1 | ① `lib/gate-kit.mjs` 抽 W/cn2num/maxBriefRound/runGate/failFast（DRY/SRP/ISP） | §1:10 DRY（`scripts/lib/gate-kit.mjs` 抽取 W/cn2num/maxBriefRound/runGate）；§1:11 SRP（路径解析/豁免/退出码由 gate-kit 承担）；§1:12 ISP/DIP（门依赖 `runGate({...})` 契约）；§1:13 Fail-fast（runGate 单一出口、无豁免即 `failFast(1)`）；§1:14 高内聚低耦合（kitRefs>=2、lib 由 1 扩到 2） | 一致 |
| 2 | ② `api-contract.md` §10 K1~K4 带规范行号 ↔ 机器断言（Compliance as Code） | §2:20（§10 K1~K4 每条「规范原文行号 ↔ 实现锚点 ↔ 机器断言 ID」）；§2:21 规范原文优先 P9（措辞逐字取自 source-doc.txt:314/318/365/526）；§2:23 密钥/证书生命周期（K1 两套 signId + notAfter + 三个月并行期） | 一致 |
| 3 | ③ `DESIGN-PRINCIPLES.md` 版本化留存书籍依据与可验证判据 | 标题「设计依据 v1.0（2026-11-14）」+ 第 3~4 行「依据的唯一落盘点 / round-N 简报引用条款号」+ §1:8 与 §2:18 两表均设「出处」「可验证判据」列 | 一致 |
| 4 | ④ 组件化前后门 exit/problems 等价验证 | §1:12（改前/改后门 exit 与 problems 逐一等价，里氏替换）；§3:28（改进必须小步可回滚：等价验证）；§3:29（依据落盘 → G-REFLOW 增 P → 提示词内化 → release 断言四步闭环） | 一致 |
| 5 | 判定方式：verify 断言组件存在且 ≥2 门引用、当前豁免表无过期行、compliance:K* 行全部 inContract | §1:10（verify.mjs 断言组件存在 + 被 ≥2 门引用）；§1:13 与 §2:22（EXEMPTIONS 无过期当前行、verify 断言）；§2:20（result-verify 输出 `compliance:K<n>` 行 inContract/inImpl） | 一致 |
| 6 | 拦截席位「架构经理（CR 会签）」+ 宪法 C10 文档变更走 CR | §3:30「本文件变更走 CR（宪法 C10），由架构经理会签」；本节即该条的归档落地 | 一致 |

> 核验方式：只读比对 v1.0 第 1~30 行与 `G-REFLOW.md:19` 的 P11 行，未发现语义偏差或技术结论冲突，故不触发 hand_back。改前/改后 `drift-check`、`reflow-check` 均 exit 0（实跑输出见回报）。本次未新建文件、未改动脚本/门禁/AGENTS/技术结论。

