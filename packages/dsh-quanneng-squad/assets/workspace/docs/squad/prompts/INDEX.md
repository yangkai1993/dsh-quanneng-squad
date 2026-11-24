# S1 提示词优化工件索引 · v2

> 产出：集贤学士@v14 ｜ 基线：squad-toolkit/roles/*.md（12 份，全部只读未修改）｜ 依据：DELIVERY-PIPELINE.md S1 必产物 docs/squad/prompts/<角色>-v<n>.md

**独立复核结论**（grep 全 12 份）：输入声明缺失 12/12；下游声明缺失 12/12；S-n 阶段绑定缺失 12/12；出门门缺失 12/12；验收可测缺失 11/12（qa-engineer 出现「验收」二字但为名词提及，不可判 pass/fail）。派活单口径「11 份缺输入与下游」经实测修正为 12 份全缺。

| 角色 | 文件 | 状态 | 主要改动一句话 |
| --- | --- | --- |
| requirements-analyst | requirements-analyst-v2.md | current | 绑定 S-1，补输入（PRD/情报/STATE）与下游（架构、测试直消费场景），clarifications/PRD/TRACE 三产物命名＋P0 未决清零出门门；现行版要点：内化 P3（字段核验命令输出留档）/P5（假设先实测附打印值）/P6（口径复核行），文末 ⑤ 节含 v1→v2 差异与 P 归属 |
| sys-architect | sys-architect-v2.md | current | 绑定 S-2，选型「对比」落成候选×判据×否决理由的必检表，容器图对接 §1 目录所有权，P0/P1 需求零孤项才放行 S-3；现行版要点：内化 P2（接口清单生效路径列 file:line）/P6（口径复核行） |
| biz-architect | biz-architect-v2.md | current | 绑定 S-2，补齐领域模型四件套（流程图/聚合/上下文映射/统一语言），初审从「一句话」变为逐条同意/异议可闭环；现行版要点：内化 P5（集成方式先取真文档或连通实测）/P6（口径复核行） |
| qa-engineer | qa-engineer-v7.md | current | 绑定 S-5，产物路径从无到有（cases/run/缺陷单），退出码级证据＋「未执行如实标注」＋全绿或有 ticket 出门门；现行版要点：内化 P1（外部真值对照证据）/P6（口径复核行）/P8（门禁验证必须覆盖「门禁会拦截其制定者」负向用例＋自查记录，缺一判未验证）/P9（契约用例逐点引用条款号＋行号、跨 §N 合并连接词判不合格并拆点、「基准未扩大」回归用例缺失 S-5 不放行、改写基准 hand_back 等裁决）＋v5 新增 [P10]/[P11] 内化：派活前写域结构化互斥（`dispatch-guard` exit 0）、每轮「本轮 src 变更归属」段（`lead-scope-check` 抽验）、只认最新批次实测并区分探针红/回归红，及组件化 `gate-kit` 改前改后 exit/problems 等价、合规条款带规范原文行号三元组、依据落盘 `DESIGN-PRINCIPLES.md` v1.0 条款号并版本化 |
| qa-engineer | qa-engineer-v6.md | current | v6 新增 [P13] 内化：脉搏机器化（pulse.mjs 每轮刷新＋SUPERVISION.json 落盘）、轮转建议（roster 实跑对照应上未上）、路由实跑探活（add_member 接受≠可用，subagent_fork outcome 为唯一判据）；保留 v5 所有 P1/P6/P8/P9/P10/P11 判据与差异表 |
| security-auditor | security-auditor-v7.md | current | 绑定 S-6，三值结论必须落 gates/ 工件且 16 项基线逐项带 file:line 证据，高危未整改禁止写「符合」；现行版要点：内化 P1（无对照禁写「符合」）/P3（三值结论仅由机器可查属性推出）/P6（口径复核行）/P8（审计门禁必查「约束是否覆盖制定约束的人」＋门禁修改自查记录缺失判部分符合）/P9（任务书/评审意见引用基准必逐点原文引用条款号＋行号、跨基准「或/以及/同时」合并即判缺陷并 hand_back 等裁决）＋v5 新增 [P10]/[P11] 内化：派活前写域结构化互斥（`dispatch-guard` exit 0）、每轮「本轮 src 变更归属」段（`lead-scope-check` 抽验）、只认最新批次实测并区分探针红/回归红，及组件化 `gate-kit` 改前改后 exit/problems 等价、合规条款带规范原文行号三元组、依据落盘 `DESIGN-PRINCIPLES.md` v1.0 条款号并版本化；v6 新增 [P13] 自动化门可见性/[P14] 真源诚实与代理签署双留痕审计 |
| devops-engineer | devops-engineer-v2.md | current | 绑定 S-7，「测试不过不部署/CVE 不上线」改为流水线机器卡点＋回滚演练＋双侧校验，S-5/S-6 未出结论即 blocked；现行版要点：内化 P2（配置改值→行为差异实测＋死配置清单）/P4（整份重写＋实跑＋负向验证三件套）/P6（口径复核行）/P7（卡点生效=真实 run 证据） |
| e2e-engineer | e2e-engineer-v2.md | current | 绑定 S-5 支线，链路→spec 命名一一对应，强制业务结果断言与 3 连跑稳定性，禁止 retry 掩盖 flaky；现行版要点：内化 P1（real/mixed/mock 分节对照）/P4（spec 全文重写＋负向检出）/P6（口径复核行）/P7（回归可用=mtime 晚于 spec 的运行产物） |
| backend-engineer | backend-engineer-v1.md | current | 绑定 S-4 后端实现，按 AGENTS §1 授权目录施工，SQL 全参数化、契约问题走 CR；现行版要点：内化 [P1]（跨 Java/Node 互操作对照证据）/[P6]（口径复核行）/[P9]（契约逐点引用条款号＋行号、禁跨基准合并、TK-41-02 实案主，改写基准 hand_back 等裁决）/[P10]（写域结构化互斥＋dispatch-guard、`## 本轮 src 变更归属` 段＋lead-scope-check、派活令牌、只认最新批次实测）/[P11]（gate-kit／SignIdCertRegistry DRY/DIP、规范原文行号三元组、DESIGN-PRINCIPLES.md v1.0 依据版本化）/[P12]（INDEX 主表为准不硬编码版本、章节连续、编号映射单一真源），⑤ 节含原件→v1 差异与 P 归属 |
| ui-designer | ui-designer-v1.md | current | 绑定 S-2/S-3 设计 handoff（前端开工前双签闸口），四件套＋token 单一真源＋章节连续锚点表；现行版要点：内化 [P1]（设计稿↔前端实现互验证据）/[P6]（口径复核行）/[P9]（PRD 逐点引用、禁跨章节合并、`基准未扩大` 核对行）/[P10]（写域互斥、src 变更数 0 声明、派活令牌、最新批次双签）/[P11]（token DRY、合规标注带规范行号、DESIGN-PRINCIPLES.md v1.0 依据版本化）/[P12]（INDEX 主表为准、锚点表章节连续、映射单一真源），⑤ 节含原件→v1 差异与 P 归属 |

每份文件固定四节：① 现稿缺陷诊断（逐项实测）／② 优化后提示词全文（输入·输出·下游·开工0步·验收·出门门·失败路径·回报格式）／③ 差异说明（8 条改动×理由×消除失效）／④ 必产物路径与出门门。

### P15 内化覆盖（2026-11-19 · TK-72-01）
| 角色 | 现行版 | P15 结构化声明 | 覆盖 |
| --- | --- | --- | --- |
| qa-engineer | qa-engineer-v7.md | current | 4 处（验收口径/出门门/反哺内化/⑤ 差异表） | ✓ |
| security-auditor | security-auditor-v7.md | current | 4 处（验收口径/出门门/反哺内化/⑤ 差异表） | ✓ |

**覆盖声明**：2 份现行提示词各 4 处 [P15] 方括号标记（前三节为 G-REFLOW 反哺规则认可位置），`reflow-check.mjs` 按文件去重后 coverage.P15=2。v6 原件保留未删。
**未覆盖的 3 份**（data-architect、front-engineer、sre-engineer）：缺陷模式与上表完全同构（实测同表可复核）；TK-50-01 已补 backend-engineer / ui-designer 两席现行稿（主表新增两行），后续迭代可按同一四节模板扩展，无需重新设计结构。

---

## v2 小节 · G-REFLOW 反哺（2026-11-11，集贤学士@v14）

依据 docs/squad/gates/G-REFLOW.md P1~P7 内化进 7 份角色提示词 v2（v1 全部保留未删）。每条 v2 新增「G-REFLOW 反哺内化」节＋「验收口径/出门门」内的 [P-x] 判据＋文末「⑤ v1→v2 差异与 P 归属」。

**P 归属表（本席裁定的引用归属；captain 建议 → 实落，差异均在对应文件 ⑤ 节留痕理由）**

| P | 反复模式 | v2 引用角色（判定动作各自专属） | 覆盖 ≥2 |
| --- | --- | --- | --- |
| P1 | 自洽绿灯掩盖跨栈失效 | qa-engineer（外部真值对照证据）/ security-auditor（无对照禁写「符合」）/ e2e-engineer（real/mixed/mock 分节） | 3 ✓ |
| P2 | 入参存在≠生效 | sys-architect（接口清单生效路径列 file:line）/ devops-engineer（配置改值→行为差异实测＋死配置清单） | 2 ✓ |
| P3 | 叙述声明当验收 | requirements-analyst（字段核验命令输出留档）/ security-auditor（三值结论仅由机器可查属性推出） | 2 ✓ |
| P4 | 替换式打补丁引回归 | devops-engineer（整份重写＋实跑＋负向验证三件套）/ e2e-engineer（spec 全文重写＋负向检出） | 2 ✓ |
| P5 | 未验证环境假设 | requirements-analyst（假设先实测附打印值）/ biz-architect（集成方式先取真文档或连通实测） | 2 ✓ |
| P6 | 上级输入未核验 | 全部 7 份（回报固定含「口径复核」行，偏差必留痕） | 7 ✓ |
| P7 | 激活≠驱动 | devops-engineer（卡点生效=真实 run 证据）/ e2e-engineer（回归可用=mtime 晚于 spec 的运行产物） | 2 ✓ |

> 裁定说明：P2 建议原指 backend-engineer，该角色不在 7 份范围（写域外+派单未列），契约侧/配置侧动作分落 sys-architect 与 devops-engineer；各文件 ⑤ 节均写明不引用某 P 的理由，无凑数引用（说明性反向提及不计入本表归属）。

**v1→v2 差异（全部 7 份同构）**：① 版本头标注 v2＋上一版路径；② 派发指针指向 -v2.md；③ 新增「G-REFLOW 反哺内化」节（每条 P＝模式原文＋本席可执行判定动作）；④ 验收口径/出门门各追加 [P-x] 机器可查判据；⑤ 文末新增 ⑤ 节（差异表＋P 集合＋归属裁定理由）。

**验收执行记录**：node packages/dsh-quanneng-squad/scripts/reflow-check.mjs 于 15:21 版脚本因自身缺陷崩溃（:20-21 对 new Set(...) 调用 .map()，TypeError: Set.map is not a function，任何文件状态下均 exit 1，且崩溃点在豁免逻辑之前）。已用等价意图复刻（仅修正运算符优先级）自证：gatePatterns=7, promptFiles=14, roles=7, ok=true, problems=[], coverage={P1:8,P2:7,P3:4,P4:7,P5:2,P6:7,P7:6}（token 级计数，含说明性提及；上表为实质归属）。脚本缺陷已按派活单失败路径上报 captain，未修改脚本。

---

## v3 小节 · G-REFLOW P8 内化（2026-11-11，集贤学士@v15）

依据 G-REFLOW.md 新增 P8（门禁只约束别人，不约束改门禁的人；实证：本轮 P4 在指挥身上命中 5 次）内化进 2 份角色提示词 v3（v1/v2 全部保留未删）。每份 v3 新增 [P8] 声明（验收口径/出门门/内化节三处）＋文末 ⑤ 节补 v2→v3 差异行。

**角色选择理由**：P8 的失效模式发生在最高权限处（指挥改 scripts/ 不受角色提示词约束），监督盲区需要独立于门禁制定者的席位——security-auditor 从**合规审计**侧核查「约束是否覆盖了制定约束的人」（门禁审计必查制定者是否在拦截面内），qa-engineer 从**验证证据**侧实证「门禁会拦截其制定者」（负向用例：以制定者身份制造违规样本实测门禁触发）。二者分别覆盖 P8 的判定方式与拦截动作两侧。

| 角色 | 文件 | v2→v3 主要改动 |
| --- | --- | --- |
| security-auditor | security-auditor-v3.md | current | 新增 [P8]：审计门禁/豁免表/脚本门时逐门给出「制定者自身是否在约束面内」三值结论；发现只拦执行席位 → 开否决项要求制定者补 P4 四步自查记录；门禁修改自查记录缺失 → 该门禁判「部分符合」 |
| qa-engineer | qa-engineer-v3.md | current | 新增 [P8]：门禁产物验证必须覆盖「门禁会拦截其制定者」的负向用例（制定者身份违规样本实测触发）；三项判据（规则覆盖/负向实测/自查记录）缺一 → 判「未验证」，禁止以「门禁已在跑」替代 |

**附带修复**：两份 v2 稿均存在上轮工具遗留的「逗号即换行」字节损坏（连续双逗号、逗号紧随表格竖线、逗号紧随列表横线、有序列表号前逗号——四类形态共 58 处残留非正当逗号），v3 规范化为真实换行，正文文字未改；v2 原稿保留未删（损坏状态随 v2 存档留痕）。

**P8 覆盖**：security-auditor-v3.md（4 处 [P8] 标记）＋ qa-engineer-v3.md（4 处 [P8] 标记）→ 满足 ≥2 份结构化声明。

---

## v4 小节 · G-REFLOW P9 内化（2026-11-12，集贤学士@v16 · TK-42-01）

依据 G-REFLOW.md 新增 P9（任务书转写/合并基准语义；实案 TK-41-02：派活把 api-contract.md §8 第2点（:85 验签失败→释放/不落缓存）与第3点（:86 COMM_FAILURE→落缓存 fail-closed 不静默重发）用「或」合并，两者互斥；后端经理按原文 hand_back 拦下，captain 裁决方案 A）内化进 2 份角色提示词 v4（v1~v3 全部保留未删）。每份 v4 新增 [P9] 声明（验收口径/出门门/内化节各 1 条）＋文末 ⑤ 节补 v3→v4 差异行与归属裁定。

**角色选择理由（采纳 captain 建议，无改判）**：P9 判定方式含「任务书 grep 合并连接词 → 判不合格」与「基准回归用例缺失 → S5 不放行」两侧——security-auditor 承接引用侧封驳（任务书/评审意见逐点原文引用条款号＋行号、改写基准一律 hand_back 等裁决），qa-engineer 承接验证侧（契约用例逐点拆分、「基准未扩大」回归用例必配、缺则不放行）。与 v3 的 P8 双侧闭环同构。

| 角色 | 文件 | v3→v4 主要改动 |
| --- | --- | --- |
| security-auditor | security-auditor-v4.md | current | 新增 [P9]×4：判定动作=引用契约条款必逐点原文引用（条款号＋文件:行号）、禁止跨基准「或/以及/同时」合并、改写基准视为缺陷并 hand_back 等裁决；验收口径=合并连接词跨条款且无逐点引用 → 判不合格；出门门=改写表述未裁决前 S-6 不出三值结论、不进 S-7 |
| qa-engineer | qa-engineer-v4.md | current | 新增 [P9]×4：判定动作=先 grep 原文再逐点转独立用例、任务书与原文不一致 → blocked-pending-ruling＋hand_back；验收口径=跨 §N 合并连接词作单一用例前提判不合格并拆点；出门门=被引条款号缺「基准未扩大」回归用例 → S-5 不放行 |

**P9 覆盖**：security-auditor-v4.md（4 处 [P9] 标记）＋ qa-engineer-v4.md（4 处 [P9] 标记）→ 满足 ≥2 份结构化声明；其余角色最新版声明数不变，无角色最新版零声明。

**验收执行记录**：node packages/dsh-quanneng-squad/scripts/reflow-check.mjs 见本轮回报（exit 0，coverage P9=2）。脚本未修改（写域属指挥）。

---

## v5 小节 · G-REFLOW P10/P11 内化（2026-11-16，集贤学士@v17 · TK-47-03）

依据 G-REFLOW.md P10（:18 时刻监督三件套）/ P11（:19 组件化+合规化+依据版本化）内化进 2 份角色提示词 v5；**v1~v4 全部保留未删**（qa/security 各 4 份＋其余 5 角色 v1/v2 各 2 份＝18 份旧稿零删）。背景：`reflow-check.mjs` 原正则 `P[1-9]` 漏看两位数，P10/P11 从未被门检查；本轮 captain 修为 `P\d+` 并接入 `lib/gate-kit.mjs`，门如实报红（gatePatterns=11、P10/P11 coverage 0、ok=false，靠 EXEMPTIONS.md 2026-11-16 豁免行才未阻断）。本小节闭合该豁免（删除动作属 captain 写域）。

**角色选择理由**：延续 v3(P8)/v4(P9) 双侧闭环拓扑——P10 判定方式含 `dispatch-guard`/`lead-scope-check` exit≠0 即派活无效、`supervise.mjs` 只认最新批次实测（区分 expected-red / regression-red），天然落在 **S-5 验证证据侧**：qa-engineer 持有回归放行判据，可转写域结构化互斥断言、每轮 src 归属抽验、注入陈旧报告的负向用例；P11 拦截席位含「给事中（封驳）」与「架构经理（CR 会签）」，其合规三值结论＋16 项基线核查＋一票否决正是 **S-6 审计侧**：security-auditor 承接 K1~K4 规范原文行号三元组、gate-kit DRY/SRP 核查、DESIGN-PRINCIPLES.md 版本化依据与四步闭环。两席分别覆盖 P10 的监督三件套与 P11 的组件化/合规化/依据版本化，零越界（本轮写域仅 `docs/squad/prompts/`，脚本未改）。

| 角色 | 文件 | v4→v5 主要改动 |
| --- | --- | --- |
| qa-engineer | qa-engineer-v5.md | current | 新增 [P10]×4＋[P11]×4（验收口径/出门门/反哺内化节/⑤ 差异表）：P10＝派活前写域结构化互斥＋`dispatch-guard` exit 0 断言、每轮「本轮 src 变更归属」段＋`lead-scope-check` 抽验、只认最新批次实测＋探针红/回归红区分＋陈旧报告负向检出；P11＝组件化前后 exit/problems 等价配对用例、合规断言「规范原文行号 ↔ 实现锚点 ↔ 机器断言 ID」三元组、依据落 `DESIGN-PRINCIPLES.md` 条款号并版本化 v1.0 |
| security-auditor | security-auditor-v5.md | current | 新增 [P10]×4＋[P11]×4：P10＝写域结构化举证＋`dispatch-guard` 退出码作基线三值判据、本轮 src 归属段＋抽验留痕、`SUPERVISION.json` 只认最新批次实测、缺项开否决项/判「部分符合」；P11＝`gate-kit` DRY/SRP/ISP 核查（≥2 门引用、门不自带 exit/exemption）、K1~K4 规范原文行号三元组＋`compliance:K<n>` 机器断言＋无过期豁免（不写假绿）、依据落盘版本化＋CR 会签（宪法 C10）＋四步闭环 |

**改动表（两份同构，各 6 处元信息改写＋8 行新增）**

| # | 改动 | 理由 | 预期消除的失效 |
| --- | --- | --- | --- |
| 1 | 版本头 v4→v5、上一版指向 -v4.md、增量写 P10/P11、依据行补 `G-REFLOW.md:18/19` 与 `DESIGN-PRINCIPLES.md` v1.0 行号 | P11③ 依据版本化 | 口头引书名不落盘、依据不可追溯 |
| 2 | 派发指针 v4→v5.md | AGENTS §4 提示词现行版 | 派到旧版导致新纪律未生效 |
| 3 | 验收口径各 +2 条 [P10]/[P11] 机器可查判据 | G-REFLOW 反哺规则 1 | 三件套/合规断言无验收锚点 |
| 4 | 出门门各 +2 条 [P10]/[P11] 放行卡点 | G-REFLOW 反哺规则 1 | 越界或陈旧证据仍能收口 |
| 5 | 反哺内化节各 +2 段本席专属判定动作（含实证、规范行号、负向用例） | 派活约束② | 只声明不算数、无角色专属动作 |
| 6 | ⑤ 节标题 v1→v4 改 v1→v5＋新增 2 行 v4→v5 差异＋v4→v5 摘要行＋P 集合扩充＋归属裁定 | 派活约束③ | 差异不可追溯、归属不明 |

**覆盖声明**：每份 v5 含 4 处 `[P10]` 与 4 处 `[P11]` 结构化标记，分布＝「验收口径」1 处＋「出门门」1 处＋「反哺内化」1 处＋「⑤ v1→v5 差异表」1 处（前三节即 G-REFLOW 反哺规则 1 认可位置）；2 份 × 2 条 P → `reflow-check` 按文件去重后 coverage 各 2。无裸写凑数、无说明性反向提及冒充内化。实跑 `node packages/dsh-quanneng-squad/scripts/reflow-check.mjs` → `ok:true`、`gateFailure:null`、`gatePatterns:11`、`problems:[]`、`coverage.P10=2`、`coverage.P11=2`、exit 0（输出见本轮回报）。`EXEMPTIONS.md` 中 2026-11-16 豁免行按闭合条件由 captain 删除。

---

## v1 补录小节 · A10/D4 两席现行稿补齐（2026-11-16，集贤学士@v17 · TK-50-01）

AGENTS §4 已改为「squadRole 以 INDEX.md 主表为准、禁止硬编码版本」；此前 16 席中 backend-engineer / ui-designer 两席无 `docs/squad/prompts/` 现行稿，派活被迫引 `squad-toolkit/roles/` 原件（A10 留痕），且 AGENTS 硬编码「当前 v4」而 INDEX 已 v5（D4，G-REFLOW P12 实证）。本票按原件升级产出两份 v1 现行稿，**原件未删未改**，主表新增两行，A10 收口。

**选择理由**：两席均为「执行前最后拦截面」——backend-engineer 是 P9 实案 TK-41-02 的主角（按 api-contract.md §8 原文 hand_back 拦下合并基准的派活），必须把「逐点引用条款号＋行号、禁跨基准合并」内化为开工前提；ui-designer 的 handoff 双签是前端 S-4 的闸口，基准被转写会整链扩散。两稿按派活约束③④补 P10（写域结构化互斥／`## 本轮 src 变更归属` 段／派活令牌／只认最新批次实测）与 P11（组件化 DRY/DIP、合规条款带规范原文行号、依据落 `DESIGN-PRINCIPLES.md` v1.0 条款号并版本化），并各承一条 [P1] 对照证据动作；P6 全员硬性。

| 角色 | 文件 | 原件→v1 主要改动 |
| --- | --- | --- |
| backend-engineer | backend-engineer-v1.md | current | 四节补齐（输入/输出/下游/S-4/验收/出门门/失败路径）＋⑤ 节；[P1]×4/[P6]×4/[P9]×4/[P10]×4/[P11]×4/[P12]×4；P9 判定动作含 `api-contract.md:85`（§8 第2点 验签失败→释放）与 `:86`（第3点 COMM_FAILURE→落缓存不静默重发）逐点拆用例、改写基准 blocked-pending-ruling＋hand_back |
| ui-designer | ui-designer-v1.md | current | 四节补齐＋handoff 四件套/token 单一真源/章节连续锚点表/双签闸口可核查化＋⑤ 节；同一 P 集合各 4 处；P9 判定动作含 PRD 逐点引用与「基准未扩大」核对行，P12 判定动作含锚点表章节连续与映射单一真源 |

**改动表（两稿同构）**

| # | 改动 | 理由 | 预期消除的失效 |
| --- | --- | --- | --- |
| 1 | 由 `squad-toolkit/roles/*.md` 原件升级为 `prompts/<角色>-v1.md`，原件零删零改 | AGENTS §4 现行版纪律 | 派活引裸 roles/ 原稿（A10） |
| 2 | 版本头／派发指针／依据行补 `G-REFLOW.md:8/13/17/18/19/20` 与 `DESIGN-PRINCIPLES.md` v1.0 行号 | P11③ 依据版本化 | 口头引书名不落盘、依据不可追溯 |
| 3 | 补输入（故事卡六要素＋派活令牌＋契约/情报/INDEX 主表＋就绪判据）与输出（固定路径＋命名规则＋完成定义） | P3 同源：产物可核查 | 带病施工、产物失踪 |
| 4 | 补 S-n 阶段绑定、出门门、验收口径逐条可测项 | S1 四节模板 | 无门禁放行、自报即完成 |
| 5 | 反哺内化节各 6 条 P 带本席专属判定动作；验收口径/出门门各同步 [P-x] 判据 | G-REFLOW 反哺规则 1 | 只声明不算数、纪律未内化 |
| 6 | ⑤ 节「原件→v1 差异与 P 归属」＋差异表＋P 集合＋归属裁定＋P12 边界声明 | 反哺规则 2 | 差异不可追溯、版本真源分叉（D1~D4） |

**覆盖声明**：每份 v1 含 `[P1]`/`[P6]`/`[P9]`/`[P10]`/`[P11]`/`[P12]` 各 4 处结构化标记，分布＝「验收口径」1＋「出门门」1＋「反哺内化」1＋「⑤ 差异表」1（前三节即反哺规则 1 认可位置）。`G-REFLOW.md:20` 的 P12 拦截席位写明「集贤学士（v6 内化）」：P12 深度内化与其余角色扩散由 v6 另票承接；本票交付时门已含 P12（gatePatterns=12），若两稿零 `[P12]` 则 `reflow-check` 必红、派活单「exit 0」不可达，故两稿各落 4 处基础声明使门真绿（P12=2），未改脚本/gates/、未登记豁免。边界按 P6 口径复核留痕，请 captain 裁决。

**验收执行记录**：`drift-check.mjs` / `reflow-check.mjs` 实跑输出见本轮回报；主表版本自检 9/9（含新增两席）。
