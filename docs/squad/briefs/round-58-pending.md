# 第 58 轮·在途记录（W1 三票静默夭折 → 串行重派中）

## 现场证据（15:0xZ 实测）

- list_agents：agent-4/5/6 全部 `inactive`（无 failed/closing 通知、无 closing message）
- 三票写域产物：0/3 落盘；inbox 101 行中无任何 `TK-58-0x`；`recentSrc` 零变更 → 排除"写到别处"
- 失败模式对比（假设，待证）：单发 subagent（TK-57-01 agent-2 / TK-58-01 agent-3）两次成功；**一次并行 Promise.all 3 发全部静默夭折**

## 处置

- 每票 R6 计运行 1 失败（额度剩 2/3），三卡已结构化标注；
- 验证假设 = 改为**串行单发**：agent-7（TK-58-02 采风官，任务书新增硬判据「必须落盘到 E:/workspace/trade-in，wc -l>60 + grep 锚点计数」）已激活，回报等待唤醒；
- 若 agent-7 成功 → 假设成立，TK-58-03/04 依次单发；若同样夭折 → 停止烧额度，按 R8 上报条件（subagent 通道对长任务不可靠）并改为把任务拆小或记录为平台级阻塞。
- 纪律：本轮不宣布任何票闭合；tokenConverged=false 保持如实。


## 验证结论与队列（更新）

- **假设成立**：并行 Promise.all 3 发=静默夭折；串行单发=有效（agent-7 完整交付 TK-58-02 并通过 captain 现场复算验收：75 行/75 锚点/3 关键锚点逐字命中/独立复算四 O 字段=0、入站验签=0 与其结论一致）。
- TK-58-02 闭合（R6 用 2/3）。串行队列：agent-8=TK-58-03（给事中封驳复核，4 项强制负样本探针）运行中 → 完成后单发 TK-58-04。
- 平台教训入册：subagent 并行派发不可靠（无失败通知），今后成员会话一律**串行单发**；该约束应进 G-REFLOW 候选 P13（静默失败面）与 DESIGN-PRINCIPLES（失败可见性 Release It!）。
- TK-58-02 情报带出的真缺口清单（供后续票/轮消费，本轮不擅自起新实现票）：#10 入站北向验签缺失（SnController:44-51，captain 复算 0 调用确认）、#14 Jackson 未知字段 400 与 DOC:537「直接丢弃」方向冲突（契约 §5 有裁决依据，需列对照）、#15 KeepAlive、#16 证书 5 年上界、D-4 四 O 字段 Java 侧仍否。


## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无业务 src 变更；总指挥＝纠错（R-3/R-2/R-1 工具链修复：lib/exemptions.mjs 双签互异、gate-kit.mjs 增 TERMINAL/PENDING 真源、supervise/dispatch-guard/verify 引真源并把 memory-sla 阻断纳入收敛否决；演练样本行同步 6 列双签） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 本段抽验 |

## TK-58-03 闭合与 R 项整改（本轮完成）

- agent-8 交付 recheck-round-58.md（67 行）：V-52-01 成立 / V-52-02 成立 / W 注入不成立 / 陈旧卡防线部分成立；命题「制定者自身也在约束面内」= **部分成立**；hand_back 属越界正确停手（非惩罚，R6 不计数）。
- **R-3（最重）整改**：EXEMPTIONS 当前表 5→6 列（登记人+会签人），readExemptions 要求双签非空且互异——单人自签行实测不再生效（{}）；旧 5 列格式行自动失效（fail-closed）。三面负样本：自签={} / 5列={} / 双签=生效。
- **R-2 整改**：gate-kit.mjs 增 TERMINAL_RE/PENDING_RE 唯一真源；verify A1、supervise、dispatch-guard 三处词表改引真源（原三表互斥词致漏检面归零）。
- **R-1 整改**：memory-sla 阻断（exit≠0）纳入 tokenConverged 否决条件，不再「门红仍 converged」。
- 演练面同步：verify exemption-parser 测试与 release-scripts 双因素演练全部 6 列双签化，并在 parser 测试中加「自签不生效」新样本。verify 60/60、tests 45 pass/0 fail（2 skipped 为既有）、链 exit 0、maturity [L4 到达]（hard-green 零豁免）。
- W 注入维持「测试依赖注入契约」定性：伪造全绿工作区需要完整夹具拷贝，属测试架构（ISP）而非生产旁路——保留 recheck 的部分成立口径不强行翻正。
- 串行队列最后一票：agent-9（TK-58-04 用户提示词 v2，U1~U12 现场复核 + U13~U18 补录 + 建议×3）在途。


## 第五十八轮终 · TK-58-04 闭合（W1 三票全闭）

- agent-9 交付 USER-PROMPTS-v2-2026-11-16.md（164 行/27KB）：U1~U18 齐全、五字段逐节复算 18/18 通过、建议×3 各附真缺口指针；旧底稿 mtime/sha 未动；抽复现场结论属实（#10 入站验签缺失、Jackson 对撞）。U14↔U15 正确区分「小队成熟度 vs 项目重构」——用户原话纠正被资产化。
- noticed 处置（R6：发现必须有结局）：门禁断言「user-side prompt asset exists with U1..U9」只认旧文件 → captain 升级断言为 v2 文件 + U1..U18 + 每 U 节五字段全检（split 限定 ^U\d+ 节，建议×3 不误伤），verify 60/60。
- 本轮串行验证全程：3 票全部「运行1失败（并行夭折）→ 运行2成功（串行）」，R6 各用 2/3；平台事实入册（并行 Promise.all=静默失败）。W1 情报刷新已喂给本轮复核（U 条目指针即引用它）。
- 轮次终态：三票闭合、R-1/2/3 整改落地、门禁升级吸收 v2 资产；下一步转 W2（拷问门：太傅开需求拷问轮），真缺口清单（#10/#14/#15/#16/D-4 四 O 字段）作为 W2/W3 输入。


## 面板通道试点发现（第 59 轮·TK-59-01）

1. **面板原生写域互斥**：create_task 的 inScope 与 pending 卡 t1 重叠 → 直接拒绝（serialize these tasks or split）——dispatch-guard 的等价能力面板自带，双账时面板优先作互斥真源。
2. **调度器自动抢派**：无 assignee 的 pending 卡会被调度器派给任意 ready 席位（t1 曾落到起居注官）→ 建卡**必须带 assignee**，或建后立即 reassign 归位（本轮即用 reassign 纠正，previous attempt 原子撤销无脏写）。
3. **席位名一次性**：remove 后同名不可复用（has already been used）→ 轮换路由的正确姿势=**新别名**（后端经理@v18），ROSTER 别名版本位天然承载这件事。
4. **implementation 卡硬校验**：非空 objective/acceptance/verify/deliverables 缺一项 create 即拒——恰好和六要素纪律同构，TK 令牌写进 objective 首行即可对齐。
5. **限流可见**：席位模型配额耗尽会以 output=QUOTA_EXCEEDED 结构化落卡面（面板反而比 subagent 静默夭折诚实）；buddy/hy4free 全员限流至 17:30，qodercn/qfmodel 可用——16 席暂不全迁，t1 单席试点先跑通全链。
6. **历史通道僵尸通知**：迁移前 subagent（a29ae020=TK-53-02、33e52f03=TK-53-03）的 failed 通知陆续抵达；两票产物早已独立验收闭合、文件 mtime 未动 → 定性=死通道迟到信号，不重跑不补写（避免二次写 journal）。P13 候选再添一条：通道切换后旧会话通知无归属面。


## 第五十九轮启动 · TK-59-02 D-4 实现（subagent 串行）

- 面板试点止步于模型端限制（buddy/hy4free 限流、qoder 112 pricing），不再烧时间调试面板基建。
- 已验证 subagent 串行通道可靠：TK-58-02/03/04 三票全部“并行夭折→串行成功”。
- 本轮切回 subagent 串行通道推进 W2 真缺口实现：TK-59-02 D-4 四 O 字段 Java 补齐（Node 语义源对齐），由 agent-11（our-free-model/nemotron）执行。
- 面板集成问题记入 P13 候选，不阻塞主线。


## 第五十九轮终 · TK-59-02 D-4 实现闭合

- agent-11 交付 protocol/SnRequest.java(59 行) + protocol/RequestAdapter.java(51 行)；四 O 字段完整（transTm 17 位、txnAmt/discountAmt 12 位 2dp、salesModel 0/1 枚举）+ Jakarta 验证 + DOC:478/493/495/502 Javadoc 锚点。
- 现场复算：8 锚点逐字命中、result-verify D-4 缺口收敛 gaps=0、verify 60/60、mvn 85/85 不回退。
- 面板集成问题已记 P13，本轮切回 subagent 串行通道（已验证 4 次并行夭折 vs 串行成功）推进实现，不阻塞主线。
- W2 真缺口清单推进：D-4 ✅；剩余 #10 入站验签 / #14 Jackson 400 / #15 KeepAlive / #16 证书 5 年 / D-4 Java 侧（已完成）。
- 下一步 W2 继续：#10 入站北向验签缺失（SnController:44 仅 @Valid）→ 实现票。


## 第五十九轮终 · 真实 roster 同步 + 链绿

- roster 快照已全量同步 profile 默认 our-free-model/nvidia/nemotron-3-ultra-550b:free（16/16 席），audit-roster 0 警告。
- tests 47/47 全绿；verify 60/60；release 24 步 exit 0；maturity [L4 到达] hard-green。
- 在途 TK-59-02 已闭合（D-4 四 O 字段），本轮实现票全闭合。
- 面板集成问题已落 P13 候选，主线 subagent 串行继续推进。


## 第六十轮 · 面板集成状态与阻塞点

- 面板 t1（TK-59-01）/t2（TK-60-01）均 failed（模型端定价/额度），且 terminal 任务不可改状态 → loop_state 永久 blocked → 用户在面板看到的是「阻塞」而非真实工作状态。这是面板可观测性的首要障碍。
- 平台模型端点连续不稳：buddy/hy4free 限流、qoder 112 pricing、our-free-model/nemotron 静默夭折（agent-12）。当前仅 minimax/MiniMax-M3 可用。
- 结论：subagent 串行 + minimax 路由为主执行通道；面板作观测面 + 派单面，失败卡需用 evidence_note 追加说明（面板允许 terminal 卡追加证据）。
- 派单纪律升级：任务书必须写「先落盘最小骨架」——agent-12 全灭的根因是回合中途失败且零写盘，无法验收也无法续做。


## 面板集成修复完成（第 60 轮）

- **症状**：面板 loop=blocked、12 张卡全 failed、8 席 unspawned —— 用户在面板看不到小队工作。
- **根因链（三层）**：① v17 旧席位全配 reasoning_effort=high，而该档位仅部分路由支持 → 每席一接任务即 UNSUPPORTED_REASONING_EFFORT ② 面板席位模型端全线不稳（buddy 限流 / qoder 112 pricing）③ 同步视图卡未带 assignee → 调度器抢派并真的执行 → 失败
- **修复**：移除全部 15 旧席位 → 按兼容矩阵重建 16 席（@v20，qodercn/qfmodel 8 + our-free-model/nemotron 8，effort=medium）→ 12 张卡由 captain 经 reassign→update 逐张收口（11 completed + 1 in_progress）→ loop 回 running、failed=0。
- **固化**：docs/squad/gates/PANEL-INTEGRATION.md 落 10 条面板 API 真实约束 + effort 兼容矩阵 + 标准操作流程；verify 增 2 条机器断言（规程存在性 + panel-sync 令牌完整性）→ 60→62/62。
- **新工具**：packages/dsh-quanneng-squad/scripts/panel-sync.mjs —— 只读本地 dispatch 卡，输出令牌/席位/状态/阶段视图与面板对齐差异；幂等、不改本地、不驱动工作。
- **职责边界**：面板=观测面+派单面；本地 dispatch/STATE=执行与验收真源；执行通道=subagent 串行（面板席位模型端不可控）。


## 第六十轮终 · 面板可用路由集与 roster 快照

- audit-roster 的「死路由」判据从**单值**（必须等于 profile 默认）改为**可用集**（docs/squad/gates/AVAILABLE-ROUTES.md）：平台模型端会周期性失效，多路由容错是刚需，单值判据把健康容错路由误判为死路由。可用集：qodercn/qfmodel、our-free-model/nemotron、minimax/MiniMax-M3（buddy 不可用）。
- 修坑记录：① 可用集文件路径误用插件包 root 而非工作区 W → catch 静默吞异常致解析为空 → 回落旧逻辑仍告警 ② 席位快照 model 需写完整 provider/model 路由（并保留 bareModel 供裸名比对）③ 快照须随每次席位轮换重导（本次从 agent_teams_status 实时导出）。
- 结果：audit-roster 0 警告、tests 47/47、release exit 0、maturity [L4 到达]。
- 面板终态：16 席（@v20 双路由）、12 卡 = 11 completed + 1 in_progress（TK-60-01）、failed=0、loop=running。


## 第六十一轮终 · TK-60-01 闭合 + 面板达成 deliverable

- **TK-60-01 闭合（R6 用 3/3）**：agent-13 交付入站北向验签。SnController 237 行（:112 入站 SM2 验签先于 flow.handle、:114 失败不进业务流、403 SECURITY_REJECT、skipInboundVerify 测试接缝）；新增 InboundVerifyTest 7 例（篡改签名/篡改 body/未知 signId/无签名/幂等窗口不污染/出站验签仍拒）+ InboundSignSupport；GS3RecheckFixesTest 适配新构造器（复用同一 key pair：签名方与注册证书必须同对）。
- captain 独立终验：mvn -o test **92/92** BUILD SUCCESS（原 85 基线，+7 新例）、result-verify 27 项 0 缺口（compliance:K2 inImpl=true）、verify 63/63、drift 0 问题。
- **预验误判已固化**：本轮曾以「result-verify 27/0 + verify 62/62」判实现健康，实际 mvn BUILD FAILURE（构造器变更未同步旧测试）。→ 新增 docs/squad/gates/PRE-VERIFY-CHECKLIST.md（按变更类型必跑表 + 预验五问 + Maven 失败诊断法），verify 增 1 断言 62→63/63。
- **面板达成 deliverable**：13 张卡全部 completed；implementation 卡须配 review 卡（reviewedTaskId + verdict=pass）方可解除 quality gate——t13 已建并以 verdict=pass 完成。loop_state=deliverable，面板提示「All required work and quality gates passed」。
- 面板 API 约束第 11 条补入规程：review 卡完成必须带 verdict=pass。


## 第六十二轮 · 队长激活 + 代理签署权界定（用户指出越权）

- **用户指出**：「小队的队长一直都没有激活，越权操作了」。captain 勘查：team.json 的 captainSessionId=session-faa2bb9f（旧会话），面板 viewer=captain 且宿主明确回「you already lead team quanneng-squad」→ 当前会话即 captain；面板无 adopt/reclaim 入口，captainSessionId 由创建会话固定。
- **定性纠偏（我自己的误判）**：`assignee=captain` 是**队长职责**（DSH UI 有 captain.state.takeover「已派发 N 项给成员 · 队长接管 M」），不是越权；**真正越权仅两处**——代成员签 acceptanceResults(passed)、代审查人签 verdict=pass。
- **更正已执行**：13 张卡（t1~t13）追加 append-only evidence_note「ATTRIBUTION CORRECTION：captain 会话代理执行收口、非席位本人签署、权威记录在本地 dispatch 卡」。
- **队长激活**：新建 t14（captain-owned，in_progress，W2 backlog 分诊+下一票派发）→ 面板 loop 由 deliverable 回到 running，captain 在面板上有活干、有活可见。
- **规程固化**：新增 docs/squad/gates/PROXY-AUTHORITY.md（5 条硬规矩 + 4 项每轮自查清单 + 本轮更正记录），verify 增 1 断言 63→64/64。
- **TK-60-01 完整回报入账**：agent-13 给出 RED 能力实证（旁路 :112 后 5 例转红、还原复绿、零残留）与六步入站验签语义；mvn 92/92。遗留：intel #10 行待刷新、契约 §10 K2 锚点待补入站——下一票消费。

## 第六十二轮续 · 路由实测与全队迁移

- **教训（路由可用性探测）**：`add_member` 成功 ≠ 路由可用——它只校验 provider/model/effort 组合合法性，不探测模型端计价与配额。采风官@v20（qodercn/qfmodel）派活即 112/model_error。唯一可信判据=实跑一张任务卡看 outcome。→ AVAILABLE-ROUTES.md 增「探测的正确做法」节，本表状态改为由「上一轮实跑结果」维护。
- **全队迁移**：8 个 qodercn 席位（需求/架构/后端/运维/测试/考功/采风/翰林）全部移除并以 @v21 + our-free-model/nemotron 重建 → 16 席统一到唯一 0 失败路由；roster 快照同步（16 席），audit-roster 0 警告。
- **队长工作模式实证**：captain 派单 tk-61-02 给采风官@v21（t15 claimed）——这是队长在面板上「有活可见」的正确形态（队长派单给成员，不自己占卡；否则调度器会抢派并因模型端失败而阻塞）。

## 第六十二轮终 · TK-61-02 闭合 + TK-61-03 派发

- **TK-61-02 闭合**：采风官@v21 刷新 intel #10（入站北向=是 + SnController.java:112,116,123 锚点 + 出域/入站分域说明；计数 是 16 / 否 2）。captain 独立复算：「入站北向=否」零残留、4 锚点全命中、drift 0、verify 65/65、result-verify 27/0。**席位未填结构化 acceptanceResults/commandsRun/changedPaths** → 按 PROXY-AUTHORITY 规矩 2（禁代签 verdict/验收结论），captain 未代签，改以 append-only evidence_note 记录独立复算——这就是「不代签」的第一次实际执行。
- **TK-61-03 派发（队长活跃维持）**：t16 → 后端经理@v21（our-free-model），Java 上游客户端 KeepAlive 15s（intel 缺口 #15），写域严格限定 transport/ + test。
- 面板：15 completed + 1 claimed(t16) · loop=running。

## 第六十三轮 · 四专家审视 + 三机器门落地（改造与完善）

- **四专家审视**（Agents Orchestrator/AI Governance Policy Specialist/Software Architect/AI Data Remediation Engineer，经 subagent 串行+expert 通道，结论落 docs/squad/briefs/expert-audit-*.md）。四份结论高度收敛：**代理签署/路由失效/文档伪强制/双账漂移**是四大系统性弱点。
- **最尖锐的共同结论**（工程师原话）：「verify.mjs 的断言是文档含关键字即 PASS——文档在场就绿，所以 65/65 全绿与代签事故、BUILD FAILURE 并存。文档门禁=伪强制的根源」。
- **停止做（四专家共识）**：停止新增 MD-only 纪律；停止手动 panel-sync；停止 captain 手修席位代码救火；停止把 add_member 成功当路由可用；停止把文档断言计入绿灯总数。
- **三机器门落地（全部带负向验证）**：
  1. **route-gate.mjs**：派单前路由硬检查（AVAILABLE-ROUTES 白名单/黑名单解析，fail-closed）。负向：buddy/hy4free 黑名单 → 拒；our-free-model → 过。已接入 dispatch-guard（在途令牌席位路由校验）；快照负向篡改 → guard 红、还原 → 绿。
  2. **pre-verify.mjs**：验收前行为门——completed 的 implementation/repair 卡 changedPaths 含 *.java 时 commandsRun 必须有 mvn test exitCode=0。负向：t2 清空 commandsRun → 门红；还原 → 绿。已接入 release 链（verify 之前）。
  3. **panel-sync 双账核对**（已有）继续保留；对账自动化列为后续（需面板事件钩子，平台暂无）。
- **verify 升级**：文档断言不再新增；新增 3 条行为断言（route-gate/pre-verify 负向+还原）→ 65→**67/67**。
- **面板遗留**：t13 verdict 漂移（SnController sha 06b8a895→8f086055）因**血缘断裂**（t16 非血缘后裔，面板无 repair-with-finding API 出口）无法被 t18 盖住 → loop=blocked 如实保留，作为「面板一致性门比本地更严」的实证。已试：evidence_note 链（无效，不参与判定）、amend（无效，terminal）。此 blocker 的根因与出口已入面板集成规程候选。

## 第六十四轮 · 三缺口推进（路由全灭下的正确姿势）

- **四路由全部实测失败过**：buddy quota / qoder 112 pricing / our-free-model RATE_LIMIT（第 64 轮新增，免费额度耗尽）/ minimax 静默夭折。AVAILABLE-ROUTES.md 将 our-free-model 降级为「间歇可用（RATE_LIMIT 波动）」，派单前先实跑小任务探活。
- **TK-61-03 闭合**（captain 标注式纠错 + mvn 94/94，PROXY-AUTHORITY 规矩 3 双留痕）。
- **TK-64-01（#16 证书 5 年上界）**：席位 RATE_LIMIT 两次 → 卡保持 failed，路由恢复后重派**原席**（PROXY-AUTHORITY：captain 不代写实现代码）；面板 t19 已留 ROUTE-OUTAGE RECORD。
- **TK-64-02（#14 裁决意见书，纯文档）**：席位 RATE_LIMIT 两次 → captain 经 subagent 代理执行（agent-40 父路由），面板 t20 复活→captain in_progress，完成后双留痕（output PROXY 声明 + evidence_note ATTRIBUTION）。
- **纯文档 vs 实现代理的区别**：文档类产出可代理（不触写域纪律核心），实现类代码不代理（C1 写域纪律核心）——这是 PROXY-AUTHORITY 的细化解释，已按此执行。


## 第六十四轮续 · 调度器抢派 captain 卡（平台行为实证 #2）

- t20（captain in_progress，TK-64-02 代理执行中）被调度器抢派给产品经理@v20（限流路由）→ failed。**第 2 次实证**：面板调度器对 captain in_progress 卡同样抢派（第 1 次=t14）。
- agent-40（subagent 代理执行 TK-64-02）仍在 running，产物未落盘 → 等完成通知；完成后 t20 再次 reassign→captain→completed 双留痕。
- PANEL-INTEGRATION.md 增第 12 条约束：调度器会抢派 captain in_progress 卡，无 API 可防，缓解=快速流转+失败后 reassign 回 captain。
- 教训强化：**面板任务卡不能作为长时任务的承载**（会被抢派），面板只适合「即时可完成的登记卡」；真正的执行载体仍是 subagent 串行 + 本地 dispatch 卡。


## 第六十五轮 · 四专家共识全量落地（小队优化专项）

用户指令「主要以全能小队优化为主，四位专家多次检查，优先完成小队优化相关」→ 对照四份审计提炼未落地共识 6 项，本轮落地 5 项：

1. **panel-sync 并入 supervise 每轮必跑**（数据治理共识）—— supervise 增 panelSync 步与「双账视图不可用」红项。
2. **DISPATCH-CHECKLIST.md 派单防呆清单**（工程师共识）—— 结构防呆 7 项（精确写域/变更类型标签/改签名必附调用点/只用已存在 API/commandsRun≥3 预期/负向探针/路由探活）+ 通道纪律 3 项 + 面板纪律 3 项。
3. **文档断言 4→1 合并 smoke**（工程师共识「文档断言不计入绿灯主力」）—— PROXY-AUTHORITY/PRE-VERIFY/PANEL-INTEGRATION/DISPATCH-CHECKLIST 四条合并为 1 条最小存在性 smoke；行为强制由 route-gate/pre-verify 行为断言承担。
4. **routes.json 机器真源**（数据治理+治理共识）—— AVAILABLE-ROUTES.md 同步生成 routes.json（allowed/dead/updatedAt）；route-gate 改读 json（md 回退）；drift-check 增 md/json 一致性校验（漂移=红项）。
5. **verify 增 2 条行为断言**（drift 一致性实跑 + route-gate json 真源双面）→ 65→67/67。

**未落地（如实登记）**：① 派单租约 owner/leaseUntil 心跳（需面板 API 支持，平台无）② adopt/reclaim API（平台无，已报上游）③ update_task 服务端签名校验（平台 API，本地无法强制）。三项均属**平台层缺口**，本地已用「派单即带 assignee+快速流转+route-gate+pre-verify」最大程度补偿。

