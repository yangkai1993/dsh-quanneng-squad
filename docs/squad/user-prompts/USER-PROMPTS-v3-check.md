> token: TK-68-07

# USER-PROMPTS v3 复检 · U13~U18 与面板卡证据对齐（第 68/69 轮 · 产品经理）

- 令牌：TK-68-07 ｜ 席位：产品经理 ｜ 阶段：W4 S8 复盘+门禁 ｜ 写域：docs/squad/user-prompts/USER-PROMPTS-v3-check.md（仅此一件）
- 复检对象：docs/squad/user-prompts/USER-PROMPTS-v2-2026-11-16.md §二（U13~U18，:100-140）与 §三（建议×3，:144-157）
- 输入面板卡证据（本席实读）：.agent-teams/archive/quanneng-squad--2026-11-16-panel-fix/team.json（28 卡全字段逐卡）、.agent-teams/quanneng-squad/team.json（8 卡实时）、docs/squad/release/release-panel-behavior-68.md（73 行，t8/TK-68-05 交付）、docs/squad/briefs/round-68.md（34 行）
- 全部结论来自本会话实跑/实读；v2 的文本只当索引，不当证据。
- 口径：每条给出「v2 判定 → 现场复算 → 对齐结论（一致／过期／恶化／新增缺口）」。

## 〇、本席实跑基线（下文引用简写 R-实测）

| 命令 | 实测结果 |
| --- | --- |
| cd gateway-java && mvn -o test（经 D:\Programs\Dev\Maven\bin\mvn.cmd） | **exit 0，Tests run: 96, Failures: 0, Errors: 0, Skipped: 0，BUILD SUCCESS**（Total time 43.3s） |
| surefire-reports 逐 XML 复算 | xml=15，tests=96 / failures=0 / errors=0 / skipped=0，mtime 全部 2026-11-17T03:08~03:31（本席本会话重跑产物） |
| node scripts/result-verify.mjs | exit 0，checked=27，gaps=0，gapItems=[] |
| node scripts/verify.mjs | exit 0，**74 passed / 0 failed**（含 :325「user-side prompt asset v2 exists with U1..U18 + five fields」= PASS、:78 pre-verify 行为断言 = PASS、:57 A1 无陈旧在途卡 = PASS） |
| node scripts/pre-verify.mjs | exit 0，checked=8，problems=[]（live 板 0 张 completed Java 卡 → 真空绿） |
| node scripts/supervise.mjs + SUPERVISION.json（at=2026-11-17T03:24:45Z） | 七门全 0、java.verdict=green/reports=15、**tokenConverged=true、inFlight=[]、attention=[]**、seatRolling=14/16（idle：采风官、翰林学士） |
| node scripts/l4/maturity.mjs | 11/11、reached=true、M2 evidence: baseline.javaTests=**58** surefire=**96** factsHardcoded=false；M11 hard-green |
| node scripts/memory-sla.mjs | exit 0，decisions=120、**pendingReplay=100 / limit=100**、problems=[]、ok=true |
| node scripts/drift-check.mjs | exit 0，pointersAlive=127、deadPointers=0、staleClaims=0、**intelOldestDays=5**（限 7） |
| node scripts/gate-rotation.mjs | **exit 1（门阻断）**：round=69 / w=W1 / missing=8 席（翰林·采风·集贤·太傅·需求·产品·给事中·御史），problems=8 条「dispatch 卡无 TK-69-*」 |
| node scripts/audit-roster.mjs | exit 0，**seats=15**（快照 2026-11-17T02:48Z），profileDefaultModel=**buddy/hy4flash-free**，warnings=[] |
| node scripts/panel-sync.mjs | localCount=79 / closed=32 / TK-68-07 state="other"（既非 closed 也非在途） |
| node scripts/reflow-check.mjs | gatePatterns=12、problems=[]、coverage P1:12 P6:16 P10:5 P11:5 P12:2 |
| 词表探针（import gate-kit.mjs 直判） | 「**待批准（staged）**」PENDING=false / TERMINAL=false；「in_progress」「claimed」「failed」同样双 false；「仅登记移交意图」TERMINAL=true |

## 一、U13~U18 逐条对齐

### U13 · 指出三缺口（无验证 / 无过程 / 提示词未优化）
- v2 判定（:104-105）：结果口径与提示词资产有产物；「过程可见」唯一退回（dashboard 停更 17 轮、ui_present 0 调用）。
- 现场复算（R-实测）：① 结果面 result-verify 仍 27/0，本席重跑 mvn 96/96 exit0，验证面比 v2 更硬（v2 当时只能引上一批次 85/85 的旧 surefire）。② 资产面：verify.mjs:325-335 已把「只认 v1 的 U1/U5/U7/U8/U9 五个串」升级为「v2 文件 + U1..U18 齐 + 18 节五字段全检」，本席实跑 PASS → **v2 :33（U3）与 :68（U8）记的「门禁不承认 v2」缺口已闭合**。③ 过程面：docs/squad/LIVE-DASHBOARD.html mtime 仍 2026-11-12T07:10Z（停更 28 轮，非 17 轮），但过程可见性载体已迁移——docs/squad/briefs/round-68.md 实存且刷新（freshness.briefHours=0.1）、TEAM-PULSE.md mtime 2026-11-17T03:24:49Z、SUPERVISION.json 落盘、Web 面板 8 张卡实时可读（live team.json），STATE.md:249 记队长收件箱闭环首次真实运行。
- 对齐结论：**部分过期 + 部分兑现**。v2 把 U13 的过程缺口只挂在 dashboard/ui_present 上，现已失真：dashboard 确已废弃，但新过程面（面板卡 + 收件箱 + 简报）没有一条断言校验「面板卡状态 ↔ dispatch 卡状态」一致（见 U18 新增缺口），因此「过程可见」由「停更」升级为「双账分裂」，**性质变坏**。

### U14 · 通过项目实践见证优化提升，向 L4 发展
- v2 判定（:111-112）：maturity 11/11、hard-green；缺口=「收口串行复跑」纪律未进门禁 + iteration-52 记的 10/11→11/11 瞬态。
- 现场复算：maturity 仍 11/11、reached=true（R-实测）；M2 evidence 现值 javaTests 基线 58 / surefire 实算 96（v2 引的「surefire 实算 58」是旧批次基线口径，现已被 96 覆盖，非矛盾）；本席同时实跑 mvn 96/96 与 maturity，两者互证一致。串行复跑纪律：grep verify.mjs 与 l4/maturity.mjs 无「串行/serial」任何断言（R-实测）→ **缺口原样存在，判定一致**。
- 对齐结论：**一致（未兑现项零进展）**。新增证据：并发批次下的瞬态风险已由「面板批次 + autopilot 自动登记」放大（STATE.md:259 记 squad-autopilot 三模式），若仍无「收口串行复跑」机器断言，第 69 轮的 maturity 结论可信度低于第 58 轮。

### U15 · 纠正：L4 指小队成熟度，不是项目重构
- v2 判定（:118-119）：M1~M11 evidence 治理侧为主；缺口=M3/M4 仍混实现侧事实。
- 现场复算：本席实跑逐项 evidence：M3 = layers/refuseConst/greenBound/**runPassesGreen**，M4 = fuseImpl/toyFuse/fuseHistory → 与 v2 完全同一组实现侧事实，判据分层两轮未动。
- 对齐结论：**一致**。M3/M4 的「项目实现」与 M1/M2 的「测试基线」仍混在同一成熟度门里；用户「L4 指小队」的口径在判据层未被解耦，属可继续追的结构性缺口（非本轮可修，写域不含 scripts/l4/）。

### U16 · 组件化 / 工程化 / 合规化，以经典设计书籍为依据，代码不重复
- v2 判定（:125-126）：DESIGN-PRINCIPLES.md 为唯一依据落盘、gate-kit.mjs 抽层完成；缺口=gate-kit 的 W 是**全局注入而非受控缝**，recheck 实测「伪造全绿包 → verify 59/60 通过」，17 个脚本直读 env、无生产拒绝分支。
- 现场复算：gate-kit.mjs:17 仍为 `process.env.QUANNENG_WORKSPACE || WORKSPACE`（本席实读源码逐字一致）；QUANNENG_WORKSPACE 在 packages 内 findstr 命中 **29 行**（≥ v2 的 17 处口径），无 isProduction/夹具白名单分支命中（R-实测，命中的 profile 字样全属 DSH profile，非生产拒绝）；DESIGN-PRINCIPLES.md mtime 2026-11-15T14:04Z、56 行未变（会签段仍在）。**新增同类证据（面板卡）**：release-panel-behavior-68.md §5 F1 实测 t25 卡改 2 个 Java 文件、无 mvn 记录，因 kind=work 而**不被 pre-verify 扫描**——即 DRY 抽层后新增的 pre-verify 门自带「kind 白名单」第二类钥匙，与 W 注入钥匙同属「制定者手中」。本席复算确认：live 板 8 卡 kind 全为 work，pre-verify 因此 checked=8 / problems=[]（真空绿）。
- 对齐结论：**恶化（同一缺口 + 新钥匙）**。v2 只点出「换包钥匙」，第 68 轮实测再暴露「分类钥匙」；DRY 抽公共层的收益仍成立（gate-kit 真源生效：verify.mjs:59 引用 TERMINAL_RE/PENDING_RE 单一词表），但合规化面缺一条件——「任意 kind 只要 changedPaths 含 .java 就必须有 mvn exit0」。

### U17 · 先改进再代收，时刻监督 / 检验 / 改进
- v2 判定（:132-133）：三件套全绿、R-1/R-2/R-3 已落地；未落地=W 注入 + A1 跨文件旁路（verify.mjs:57-72 单文件 by Map）。
- 现场复算：R-3 exemptions.mjs:31-33（登记人≠会签人，缺会签/同人自签 continue）实读在码；R-2 gate-kit.mjs 词表为唯一真源、verify.mjs:59 与 supervise 均引用；R-1 supervise.mjs tokenConverged 内含 memorySla.exit；三件套本席实跑全 exit 0（dispatch-guard problems=[]、lead-scope-check brief=round-68.md problems=[]、supervise attention=[]）。A1 旁路面：本席实读 verify.mjs:57-76，`by` Map 在单文件循环内构造 → 跨文件同令牌仍不判陈旧，**v2 判定一致**。
- **新增缺口（本席首跑发现，属 U17/U18 交界）**：memory-sla.mjs 判据为 `if (pending > LIMIT)`，当前 pendingReplay=100 恰等于 limit=100 仍 exit 0；OUTBOX.jsonl 实测 101 行 → 台账已顶到门限格子里，**「积压到上限」被实现为不阻断**，与 AGENTS §4「任一红不得收口」的语义冲突。v2 :47 记「距门红仅 19 条」的预警，现已到临界而门仍绿。
- 对齐结论：**部分一致 + 恶化**。落地项全部复核通过；未落地项仍在；新增一条阈值边界缺陷（>` 应为 >=，或书面降级）。

### U18 · 一直迭代到没有 token（零在途收敛）
- v2 判定（:139-140）：tokenConverged 曾 true 又被本票重置；缺口=只反映瞬时快照 + 并行 subagent 静默夭折无告警（P13 候选未进 reflow/verify）。
- 现场复算（三条互相矛盾的面板证据，本席逐一实跑）：
  1. supervise 实跑 **tokenConverged=true / inFlight=[]**，而 live 面板此刻有 **5 张卡 in_progress（t4/t5/t10/t11 + 面板原生状态词）**——收敛布尔与面板真实在途**不一致**。根因由词表探针证明：supervise/dispatch-guard 只读 docs/squad/dispatch/*.md 的「| 状态 |」文本，PENDING_RE=/在途|running|重投|派发中/，TERMINAL_RE=已闭合|作废|验收通过|取代|已撤销|完成|非投递|过程记录|仅登记移交意图；而第 68 轮面板重建后，TK-68-07 卡状态写的是「**待批准（staged）**：面板 Web Approve & Run 后投递」→ 双词表皆不命中，既不算在途也不算终止，被静默吞掉。panel-sync 亦把它归为 state="other"（localCount=79 中 other=47）。
  2. 该吞没不是文本瑕疵而是**门语义缺陷**：v2 说「静默失败面」指 subagent 夭折；第 68/69 轮的同类失效换成了「面板卡状态词不在本地词表」，且第 68 轮补记（STATE.md:253/:255）已经为同一类 bug（current.w 字段名、轮转令牌状态词「已完成」）打过两次补丁，仍没把**面板原生枚举（claimed/in_progress/completed/failed/staged）**纳入词表真源。
  3. gate-rotation 实跑 **exit 1、W1 八席全缺**（round 真源=STATE 末轮=第 69 轮），但第 69 轮的实际派活走面板卡（live 板 8 张）→ 轮换门与面板通道**数据源分裂**：v2 U2 的「滚动覆盖 6/16」现已变 14/16（seat-utilization 实测），覆盖改善的同时，轮换门反被面板通道架空。audit-roster 报 seats=15，live team.json members=16（快照缺翰林学士），v2 U6 记的 profileDefaultModel=qodercn/qfmodel 现场已变 buddy/hy4flash-free —— **v2 的 U6 证据行已过期，本条为面板卡对账的直接产出**。
- 对齐结论：**恶化，且新增机制级缺口**。U18 的隐含验收「在途令牌数机器可算」在第 68 轮后面板通道下**不再成立**：true 的 tokenConverged 是词表漏判造成的**假绿**。静默夭折面（P13）仍未进 G-REFLOW（本席实读：P 表只到 P12，无 P13 行；reflow-check gatePatterns=12），而 [P13] 已内化进 qa-engineer-v6.md:81/:94/:118 —— **提示词承认 P13、门禁真源不承认**，属 G-REFLOW「唯一累加点」规则（:26 第 3 条）被绕过。

## 二、v2 建议×3 的兑现核对（对齐面板卡，防止旧建议被当现行）

| v2 建议 | 现场核对 | 结论 |
| --- | --- | --- |
| 建议1：#10 入站验签 + result-verify 先红后绿，带上 #15 KeepAlive 与 #14 裁决 | 面板 t2（TK-60-01）已交付 SnController:130 verifyInbound 先于 flow.handle、失败 403 SECURITY_REJECT（本席 findstr 实读），t16（TK-61-03）已交付 KEEP_ALIVE_TIMEOUT_SEC=15 于 :55/:136/:147/:155；t20 已落 #14 三选项备忘 docs/squad/intel/gap14-ruling-2026-11-16.md（recommend C） | **已兑现**（v2 建议作废，不再复用）。但 result-verify 仍只有 27 项、不含入站 parity（本席 grep：源码无 keepAlive/verifyInbound/1825/FAIL_ON_UNKNOWN/upperBound 任一字串）→ v2 U9 缺口仍在 |
| 建议2：只验不修的独立复核票 + W 注入三值裁决 | 面板 t13/t17/t18/t21/t26 多为 review/探针卡；R-3/R-2/R-1 落地已被本席实读证实；**W 注入至今无裁决落盘**，第 68 轮 t8 反而发现第二把钥匙（kind 白名单） | **半兑现**，W 注入裁决仍是欠账 |
| 建议3：W2 拷问门开第 2 轮（A1 基线 D1、A13 口径、E1~E12 默认处置） | 轮次现场：第 68 轮 W4、第 69 轮 W1（rotation 实跑 w=W1），并非 v2 假设的 W2 时点；clarifications-SN26.md 仍停在「## 1 四拷问面（第 1 轮）」，:43 D1 仍「待 captain 中转裁决」、:12 A13 口径仍未统一、intel refresh :45 E1–E12 无一新答复 | **未兑现且指针已失效**（W 时点错、≤2 轮上限余 1 轮仍在） |

## 三、给用户的下一句提示词建议 ×3（各挂一个本轮实测真缺口）

### 建议 1（消费 U18 新增机制级缺口：面板状态词不在本地词表 → tokenConverged 假绿）
> 「派一张**只治词表与双账**的给事中整改票（写域限 packages/dsh-quanneng-squad/scripts/lib/gate-kit.mjs + supervise.mjs + panel-sync.mjs + verify.mjs 四条断言，禁碰 src/）：① TERMINAL_RE/PENDING_RE 扩到**覆盖面板 team.json 的全部原生枚举**（claimed/in_progress/completed/failed）与 dispatch 卡的「待批准（staged）/待批/approval=required」，未列枚举一律 fail-closed 记为在途而不是忽略；② 新增断言：live 板任一 status∈{claimed,in_progress} 的卡，必须能在 supervise.inFlight 或 dispatch 卡同令牌段找到，缺一即 tokenConverged=false；③ 负样本必须先红后绿——现板 5 张 in_progress 而 tokenConverged=true，改门后此票必红，还原后复绿，两次输出留档；④ memory-sla 的 `pending > LIMIT` 改 `>=` 或按书面降级条款留痕（实测 pendingReplay=100/limit=100 当前不阻断）。回报必须附 mvn 无关声明（纯脚本票）+ verify 断言计数前后差。」

真缺口指针：本席词表探针（「待批准（staged）」PENDING=false/TERMINAL=false；in_progress/claimed/failed 同）；gate-kit.mjs 词表实读；supervise.mjs inFlight 取数源=DSP=docs/squad/dispatch（源码行实读，不读面板）；agent_teams_status 实测 live 卡 5 张 in_progress；panel-sync.mjs 输出 localCount=79/other=47、TK-68-07 state="other"；memory-sla.mjs `if (pending > LIMIT)` + 实跑 pendingReplay=100/limit=100/exit 0；STATE.md:253/:255 同型字段名 bug 已两次补丁的先例。

### 建议 2（消费 U17/U18 交界：轮换门与面板通道数据源分裂）
> 「第 69 轮收口前先裁一件事，别再让门和面板各算各的：派架构经理 CR 票（写域 docs/squad/gates/ + packages/dsh-quanneng-squad/scripts/lib/rotation.mjs，不改 STATE 轮次真源）**明确「面板任务卡 = 派活记录的唯一真源，dispatch md 降为镜像」**，并据此修 gate-rotation：覆盖核对同时读 .agent-teams/quanneng-squad/team.json 的 assignee+token 与 dispatch 卡，二者取并集判覆盖；实跑现值即为裁决依据——gate-rotation 现 exit 1、W1 八席全缺（round=69，dispatch 无 TK-69-*），而 live 板 8 张卡已在跑、seat-utilization 滚动覆盖 14/16。票内同时要求：audit-roster 的名册快照与面板 members 对账（实测快照 seats=15、live members=16，缺翰林学士；快照 takenAt=2026-11-17T02:48Z 而 profile 默认模型现报 buddy/hy4flash-free，v2 U6 证据行已过期），差异必须写进回报而不是靠豁免消音。结论三值：并集／镜像／回退面板通道，并列出每种对 P10 三件套的影响。」

真缺口指针：gate-rotation 实跑 JSON（round=69/w=W1/missing=8/problems=8 条「dispatch 卡无 TK-69-\d+」/exit 1）；rotation.mjs:6-7「轮次真源=STATE.md 末轮，briefs 陈旧不可用」+ :19-21 ROSTER W 表正则（本席实跑 rows=4 与 W1 名单一致）；ROSTER-16.md §七 W1/W4 名单实读；live team.json 8 卡 assignee 实测；seat-utilization 实跑 coverage 14/16（idle=采风官/翰林学士）；STATE.md:257「面板会话解绑实录」（tasks 从 26 掉到 8）。

### 建议 3（消费 U16 恶化 + U9 老账：两道门钥匙与覆盖集不等）
> 「派一张**行为门扩权 + 覆盖集对齐**的双人票（写域 gateway-java/…/crypto 之外全禁，门侧只许 packages/dsh-quanneng-squad/scripts/pre-verify.mjs 与本席文档引用行）：① pre-verify 扫描条件由 `kind∈{implementation,repair}` 改为「**changedPaths 含 .java/pom.xml 即扫，任意 kind**」，并补 mtime 时序门（mvn 证据时间须晚于被改 Java 文件 mtime；现版 :30-31 自认把时序移交 supervise，而 t8 实测 t25 文件 mtime 晚于卡关闭 11 分钟仍逃检）；② 用面板归档板做负样本复跑（archive/…/team.json 28 卡含全部 Java 证据；本席按现门复算 t25 逃检成立），要求改后「探针 B 清空 commandsRun → 红」「探针 C exitCode:1 → 红」「t25 无 mvn → 红」三红齐全才算过；③ result-verify 的 27 项与 intel refresh 的 19 行约束仍不等集（本席 grep 源码：无 keepAlive/verifyInbound/1825/FAIL_ON_UNKNOWN/upperBound 任一字串），要求新增 4 条 parity 并**先红后绿**；④ 同票附带 W 注入裁决落文档（recheck :61② 至今无处置），二选一：写进契约成「仅限测试注入 + 生产 profile 拒绝 + 机器断言」，或撤销 29 处直读面。回报须含 mvn -o test exit 0 实跑行（本票可能触 Java 面，pre-verify 自身会核它）。」

真缺口指针：pre-verify.mjs:21 kind 白名单 + :25 MVN_RE/exitCode===0 + :30-31 时序自认移交；release-panel-behavior-68.md §2 逐卡矩阵（t25 kind=work 携 2 Java 文件无 mvn「实质违规逃检」；t18 kind=review 携 Java 不在扫描范围；§5 F1 中severity 已路由 captain 未修）与 §4.1「live 板 0 张 completed Java 卡 → 真空绿」；本席实跑 pre-verify exit 0/checked=8/problems=[]；live 板 kind 全为 work（team.json 实读）；result-verify 27 行 item 清单实跑枚举；docs/qa/recheck-round-58.md:59-62「部分成立 + 三把钥匙」与 :61②；gate-kit.mjs:17 + QUANNENG_WORKSPACE 29 处直读实测。

## 四、口径声明与写域
1. 本文所有判定来自本会话实跑/实读（命令 + 实测值见 §〇 与逐条括注）；v2 文本只作索引，v2 记为「已兑现」而现场过期者（U13 过程面载体、U6 路由模型、U14 基线 58→96、建议3 的 W 时点）已在正文标注「过期」。
2. 与 v2 的差异汇总：U13 部分过期＋性质变坏；U14 一致（零进展）；U15 一致；U16 恶化（新增 kind 白名单钥匙）；U17 部分一致＋新增阈值边界缺陷；U18 恶化（tokenConverged 由「瞬时」升级为「词表漏判假绿」）；v2 建议1 已兑现作废、建议2 半兑现、建议3 指针失效。
3. 首行令牌 TK-68-07 按规矩置于文件第一行；本席未改 USER-PROMPTS-v2 与 USER-ORIGINAL-PROMPT.md（只读）。
4. 写域：仅新建本文件。未写 src/、scripts/、gates/、契约、intel/、qa/、.agent-teams/（面板状态一律经 agent_teams_* 工具，文件仅只读实读）；mvn/脚本运行只产生 target/ 构建产物与 SUPERVISION.json 等门自身输出，非本席编辑。
5. 本票为纯文档票（无 Java 改动）；按任务书 Java 卡判据，本席仍附 mvn 实跑证据：`D:\Programs\Dev\Maven\bin\mvn.cmd -o test -f gateway-java/pom.xml` → exit 0 / Tests run: 96, Failures: 0, Errors: 0, Skipped: 0 / BUILD SUCCESS（2026-11-17T11:28:35+08:00）。
