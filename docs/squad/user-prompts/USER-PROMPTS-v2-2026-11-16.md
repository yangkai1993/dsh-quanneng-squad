# 用户原始提示词 · 结构化升级稿 v2（2026-11-16 · TK-58-04）

> 令牌 token: TK-58-04 ｜ 席位：产品经理 ｜ 阶段：S-1 谋断（W1 轮转）
> 底稿：docs/squad/user-prompts/USER-ORIGINAL-PROMPT.md（实测 56 行，13 条原话→U1~U9，只读未改）
> 本版差异：① U1~U12 每条按**现行事实现场复核**（禁用旧文件结论作证据）② 补录第 45 轮之后用户原话 U13~U18
> ③ 结尾「给用户的下一句提示词建议」×3，各挂一个当前真缺口指针。
> 复核输入（全部本席实读/实跑，非引用旧结论）：docs/squad/intel/SN26-约束清单-refresh-2026-11-16.md（75 行）、
> docs/qa/recheck-round-58.md（67 行）、docs/squad/metrics/iteration-52.md（119 行）、gateway-java/src/ 现码、
> src/ 现码、packages/dsh-quanneng-squad/scripts/ 实跑输出。
> 五字段口径：原话 → 意图 → 隐含验收 → 已兑现证据（file:line / 实跑值）→ 未兑现缺口。

## 一、U1~U12 · 底稿原话的现场复核（v1 结论逐条重新判定）

### U1 · 网关设计：先可调整方案，再精修
- 原话：「根据这份文档整理出一个网关设计，先给出一个可调整的方案，然后再去精修」（底稿 §一:1）
- 意图：分阶段交付 + 规范可追溯，不接受一步到位的黑盒。
- 隐含验收：DOC→v0→v1→契约→实现 五级各有落盘物，且每级能被行号回指。
- 已兑现证据（本席实读）：.analysis/source-doc.txt 实测 715 行；docs/gateway-design-v0-draft.md:1 标题「v0（可调整草案）」（102 行）；docs/gateway-design-v1-refined.md（308 行）；docs/arch/api-contract.md:1 首行 v1.3.1、:107 §10 版本注、:131 变更记录；契约锚点 DOC:314/318/365/537/150/364 本席逐行实读语义一致；实跑 result-verify.mjs → checked=27 / gaps=0；实跑 stage-order.mjs → S-1/S0/S1/S2/S3 present=true。
- 未兑现缺口：v0→v1→契约 的**行号可追溯性靠人肉**，无一条断言校验「契约引用行号 == DOC 原文内容」（intel refresh :44 仍记 #9「userId==真实证书序列号」只有沙箱自证）；v0 草案本身无版本冻结记录。

### U2 · 是否调用了整个小队的资源，没有实现的全部调整
- 原话：「是否调用了整个小队的资源，没有实现的请全部调整」（底稿 §一:2）
- 意图：16 席不是注册表，必须每席有真实产出。
- 隐含验收：席位级「有产出」+「本轮被驱动」两指标同时可见。
- 已兑现证据：实跑 seat-utilization.mjs → seats=16 / utilized=16 / idleCount=0（逐席 artifacts：后端经理 71、集贤学士 22、御史大夫 12、架构经理 8、给事中 6、测试经理 5、采风官 3、考功郎中 2…）。
- 未兑现缺口：**滚动动用面仍不达标**——同次实跑 rolling.window=5 / maxRound=58 / activeSeats=6 / coverage=6/16（闲置 10 席），supervise 实跑 attention 首条即「席位滚动覆盖偏低：近 5 轮仅 6/16 席有派活」；v1 记「16/16 ✅」只覆盖累计面，滚动面自第 45 轮 A5 起从未收敛（HEALTH-AUDIT-2026-11-12.md:27-30、iteration-52.md:64-66）。

### U3 · 提示词优化 / 拆分 / 反馈优化 / 技术框架选择是必经工序
- 原话：「全能小队针对需求没有做提示词优化、没有拆分、更没有反馈优化、也没有技术框架选择」（底稿 §一:3）
- 意图：四职能从「可选装饰」变成派活前置闸口。
- 隐含验收：每次派活文本可指回现行版角色稿 + 情报清单新鲜度达标。
- 已兑现证据：docs/squad/prompts/ 实测 22 份版本稿 + INDEX.md（134 行，主表 :9-17 标 P 内化）；AGENTS.md:43-44「情报先行/提示词现行版」成文；实跑 reflow-check.mjs → gatePatterns=12 / problems=[] / coverage P1:11 P6:15 P10:4 P11:4；实跑 drift-check.mjs → pointersAlive=127 / deadPointers=0 / staleClaims=0 / intelOldestDays=4（限 7 天内）。
- 未兑现缺口：**用户侧提示词资产仍是 1 份 v1**（docs/squad/user-prompts/ 实测仅 USER-ORIGINAL-PROMPT.md，本 v2 为第 2 份）；verify.mjs:245-248 对「用户侧提示词」的断言只检 USER-ORIGINAL-PROMPT.md 含 U1/U5/U7/U8/U9 五个串——即门禁承认 v1 存在，但不承认 v2、也不校验 U10~U18 是否成形。

### U4 · 不停留在叙述，用实际项目验证，出问题自纠正
- 原话：「请尽可能的迭代至好用，而不是停留在叙述上，可以自行进行实际项目的实现来验证结果，出现问题请自纠正」（底稿 §一:6）
- 意图：结论必须由实跑/实读产生，纠正过程留痕。
- 隐含验收：命令 + 退出码 + 负向探针（红→还原→复绿）三件套。
- 已兑现证据：gateway-java/target/surefire-reports 实测 14 个 XML、tests=85 / failures=0 / errors=0 / skipped=0（与 STATE.md:203「mvn 85/85」一致）；实跑 verify.mjs → 60 passed / 0 failed；实跑 l4/maturity.mjs → passed=11/11、reached=true、stderr「[L4 到达] 全部 11 项判据通过」、M11 evidence greenLevel=hard-green activeExemptions=none；自纠留痕 STATE.md:151 A11（虚构过失已撤回）、:153 A14（指挥越界改 src）、DECISIONS.md:61/66/70。
- 未兑现缺口：surefire 报告 mtime 全部为 2026-11-15（本席实测），即「85/85」是**上一批次产物**，本席未重跑 mvn（写域限制不碰 gateway-java/）；负向探针的「还原复绿」证据散在 STATE/简报文本里，无一条机器断言。

### U5 · 本地记忆为主、云端为辅助
- 原话：「本地记忆为主，云端为辅助，继续优化插件」（底稿 §一:7）
- 意图：云端不可达不得污染结论。
- 隐含验收：本地台账数 + 降级路径 + 积压上限都有机器口径。
- 已兑现证据：实跑 memory-sla.mjs → exit=0 / ok=true / decisions=95 / pendingReplay=81 / limit=100 / localAuthorityDeclared=true / cloudState="unreachable (probe: memory.mjs cloud)"；docs/squad/memory/DECISIONS.md 实测 100 行、DECISIONS.jsonl 实测 95 条；supervise.mjs:15-16 真实消费 memorySla。
- 未兑现缺口：pendingReplay=81 / limit=100 —— **距门红仅 19 条**，且无一条断言定义「回放在第几轮必须清零」（HEALTH-AUDIT-2026-11-12.md:35-36 已把 OUTBOX 积压列为 A7，本轮数值只增未减）。

### U6 · 全员在线 / 做成 DSH 插件 / 适应模型变化
- 原话：「现在我想要全员在线，却无法突破限制」「把我的全能小队做成 dsh 插件来进行迭代使用」「使小队能适应 LLM 模型的变化而不影响自身」（底稿 §一:5、§一:10）
- 意图：容量限制不封死编制；小队资产可插件化复用；路由变化不致全灭。
- 隐含验收：16 席可派、插件有版本号与装配点、模型切换后 audit-roster 归零且靠真钉定而非豁免。
- 已兑现证据：packages/dsh-quanneng-squad/package.json:3 version=1.5.2（description「7 预设 + 16 人全编 profile + maxMembers16」）；实跑 audit-roster.mjs → seats=16 / profileDefaultModel=qodercn/qfmodel / expectedModel 一致 / warnings=[]；STATE.md:205「两条 2026-11-18 当前豁免移入历史 → greenLevel 回 hard-green」；实跑 exemptions 现状：docs/squad/gates/EXEMPTIONS.md:10 当前豁免表**空**（仅表头），:11-24 历史段。
- 未兑现缺口：STATE.md:199/201/203 记录同一路由问题三次处置（豁免 → 钉定 → 删豁免），即「适应模型变化」目前靠**人工改 profile 钉定 + 豁免到期**，无「模型切换→自动重导快照→复验」的机器闭环；briefs/round-58-pending.md:7,:21 还记录了「并行 subagent 3 发全部静默夭折」这一平台级失效面，P13 候选未进 G-REFLOW。

### U7 · 过程可见：队长拆解与汇总要实时看到
- 原话：「与队长的交互、团队交互不利于观察，队长拆解和汇总我都没看到」（底稿 §一:11）；「过程我也没有看到」（§一:13）
- 意图：观察窗口是运行时的，不是事后补的长文。
- 隐含验收：每轮有实时界面调用 + 拆解在派活前可见（非收尾追述）。
- 已兑现证据：docs/squad/briefs/ 实测 29 份 round-N.md（最新 round-58-pending.md 43 行，含「现场证据/处置/验证结论」三段）；docs/squad/TEAM-PULSE.md:1-3 生成 2026-11-16T02:18:23Z、:5-12 七门逐项取数；AGENTS.md:46 把「简报与脉搏」定为每轮必产物；STATE.md:139 记 round-40 补做 LIVE-DASHBOARD.html + ui_present 首次实调用。
- 未兑现缺口：**实时面又回到「事后 md」**——docs/squad/LIVE-DASHBOARD.html mtime 停在 2026-11-12T07:10Z（本席实测），第 41~58 轮共 17 轮无刷新；本会话无任何 ui_present 调用记录；拆解仍是 round-58-pending.md:17-21 那种「跑完之后回写」。v1 把 U7 标 ❌（:32），本轮判**部分兑现**。

### U8 · 优化「我的」提示词（用户侧资产）
- 原话：「提示词一直都没有优化我的提示词」（底稿 §一:13）
- 意图：用户口语诉求要被结构化成可复用契约，而不是被 captain 转述。
- 隐含验收：用户侧目录有版本化资产，且每条能追到原话与现行事实。
- 已兑现证据：底稿 USER-ORIGINAL-PROMPT.md 13 条原话逐字保留（:8-20）+ U1~U9 约束表（:24-34）+ 可复用模板（§三）+ captain 硬规则（§四:51-54）；本 v2 为首轮现场复核版，写入 docs/squad/user-prompts/USER-PROMPTS-v2-2026-11-16.md。
- 未兑现缺口：**「优化」只到登记为止**——底稿 §四:51「用户提需求→先读本文件映射 U1~U9」无任何脚本执行（grep 全库仅 §四文本自身与 verify.mjs:247 的字符串存在性检查）；U10~U12 在 v1 里根本不存在（v1 只到 U9），原话 8/9/12 三条从未被映射；本条即本 v2 补录的 U10~U12。

### U9 · 验证最后的结果（不是门禁绿）
- 原话：「整套任务跑下来了，没有验证最后的结果」（底稿 §一:13）
- 意图：验收对象是「最初输入 → 最终产物」逐项对得上，门禁绿只是代理指标。
- 隐含验收：端到端覆盖核对表（规范 API / 决策项 / 冲突项 / 冻结约束逐项命中）。
- 已兑现证据：result-verify.mjs 实跑 checked=27 / gaps=0（含 parity:claim/释放键/COMM_FAILURE 落缓存/UNKNOWN 不自动重发/验签先于业务 5 条，脚本 :54-62 双侧正则同时命中；compliance K1~K4 :45-52）；STATE.md:197 记 D-A1/A2 真缺陷独立复现并修（gaps 补 r.contract===false、25→27 项）。
- 未兑现缺口：**「0 缺口」与「现场有 3 否 1 部分」并存**——intel refresh :41-44 实算 19 行约束中 是=15 / 否=3 / 部分=1，而 result-verify 27 项里没有 #10 入站、#14 未知字段方向、#15 Java KeepAlive、#16 5 年上界的检查项；即覆盖核对工具的集合 ≠ 规范约束的集合（v1 :53 要求的「逐项命中表」口径已实现但项目不全）。

### U10 · 每个席位都要起作用（补录自底稿原话 8，v1 未映射）
- 原话：「我的每个席位都是有作用的，要共同起到作用，现在好多席位没有起到作用，如负责提示词优化、拆分任务、信息收集都没有被使用」（底稿 §一:8）
- 意图：席位是工位不是荣誉编制，闲置即缺陷。
- 隐含验收：闲置席位被机器列出并成为阻断条件，而不是 attention 提示。
- 已兑现证据：seat-utilization.mjs 输出 rolling.idleSeats 逐个点名（本席实跑 10 席：集贤学士/翰林学士/前端经理/测试经理/御史大夫/运维经理/交付发布经理/起居注官/考功郎中/太傅）；supervise.mjs:72 阈值 <8 写入 attention；AGENTS.md §3.0「席位是工位不是编制」。
- 未兑现缺口：**滚动覆盖只报不断**——supervise 实跑 exit=0 而 attention 含「6/16」，tokenConverged 式（supervise.mjs:76）不含覆盖项，故「闲置 10 席」永远不构成阻断；集贤学士（提示词优化席）本身此刻就在闲置名单里，正是 U10 原话点名的岗位。

### U11 · 提示词优化与情报对标是每次问答的前提，起居注官防腐化（底稿原话 9，v1 未映射）
- 原话：「提示词优化和情报对标是每次问答的前提，起居注官要是盯住文件的更新和变化，防止文件腐化和过时」（底稿 §一:9）
- 意图：前提 = 派活前必做，不是收尾补写。
- 隐含验收：情报清单有到期机制、文档腐化有漂移门、记注有对账产物。
- 已兑现证据：AGENTS.md:43「距上次更新 >7 天…先派采风官重扫」+ :47 记注对账；drift-check.mjs 实跑 intelOldestDays=4 / intelFreshLimit=7 / deadPointers=0 / staleClaims=0（新鲜度已机器化，脚本有该字段）；docs/squad/journal/ 有落盘（2026-11-06.md 等）；ROSTER-16.md:56 W1 含翰林、采风、集贤、太傅（谋断轮次成文）。
- 未兑现缺口：**drift 的 SCAN 面仍是有界的**——HEALTH-AUDIT-2026-11-12.md:32-33 A6 记「覆盖面 15/325，其余 310 份 md 无腐化保护」，本轮仅能证实 pointersAlive=127（较 15 扩大，本席无历史值可比对增量），但无一条断言给出「应扫文件数 vs 实扫文件数」，覆盖率本身不可证；起居注官当前处于 idleSeats 名单（本轮未驱动）。

### U12 · 清理非小队智能体 + 队长权限不被架空（底稿原话 12，v1 未映射）
- 原话：「现在 60 个智能体需要将不是小队的智能体清理掉」「队长权限被架空了」（底稿 §一:12）
- 意图：编制边界要能被审计；指挥权不能被成员/工具绕过。
- 隐含验收：在册席位与实派席位一一对账；指挥改 src 有拦截门；成员不得自造令牌。
- 已兑现证据：audit-roster.mjs 实跑 seats=16 / squadId=baa0a893… / warnings=[]；lead-scope-check.mjs 实跑 exit=0 brief=round-58-pending.md problems=[]；AGENTS.md:45「令牌由 captain 签发并登记，成员不得自造」+ 本任务书首行令牌纪律；round-58-pending.md:25-31「本轮 src 变更归属」段（本席核到 lead-scope-check 已消费该段）。
- 未兑现缺口：指挥权边界仍有**一处未机器化**——lead-scope-check 取的是「简报里写的归属段」，STATE.md:151 A12 / :153 A14 记录指挥两次直接改业务源码（第一次靠事后自纠，第二次仍复发），说明该门是「对文本核对」而非「对 src mtime/归属实算核对」；无仓库内 git（recheck §七 实测 fatal: not a git repository），缺少不可伪造的变更主体证据链。

## 二、U13~U18 · 第 45 轮之后用户原话补录（现场反推自 STATE.md / DECISIONS.md 各轮记录）

### U13 · 指出三缺口：无验证 / 无过程 / 提示词未优化
- 原话（反推）：「整套任务跑下来了，没有验证最后的结果，过程我也没有看到，小队也没有完善，提示词一直都没有优化我的提示词」
- 意图：同时否定「结果口径、过程可见性、资产完整性」三件事，属结构性纠正而非加需求。
- 隐含验收：三处各自有补救产物 + 该产物被门禁承认。
- 已兑现证据：STATE.md:139（第 40 轮·被用户纠正后的补做，明记「实测全中」）；DECISIONS.md:61（L-20261112064058-v5ju Correction 条目）；产物实存：result-verify.mjs（实跑 27 项）、USER-ORIGINAL-PROMPT.md（56 行）、LIVE-DASHBOARD.html（40 行）。
- 未兑现缺口：三缺口中**「过程可见」唯一退回**（U7：dashboard 停更 17 轮、ui_present 本轮 0 调用）；「小队也没有完善」被后续轮次转写成「L4 项目重构」而偏离，需 U15 纠回。

### U14 · 通过项目实践见证优化提升，向 L4 发展
- 原话（反推）：「（优化提升）要通过项目实践来见证，小队向 L4 发展」
- 意图：成熟度必须落在可实跑判据上，不接受自评等级。
- 隐含验收：L4 判据机器化、状态机不可刷绿、固化条款可回指本体。
- 已兑现证据：STATE.md:141（第四十一轮·L4 建成，门槛由实跑/实读产生）；DECISIONS.md:62（五态状态机 proposal→regression→canary→rollout→codified，surefire javaTests 实算 58）；本席实跑 l4/maturity.mjs → 11/11、reached=true、hard-green、无 activeExemptions。
- 未兑现缺口：同条目记「我自己的两次假绿」+ DECISIONS.md:66「第三次假绿：非绿迭代被计绿」——三次失效都是**判据自身**造假绿，现由 facts.mjs projectGreenNow 前置堵住；但 iteration-52.md:49/:99（D-B）显示 maturity 在并发批次下首跑 10/11、串行复跑 11/11 的瞬态仍在，须「收口串行复跑」这条纪律本身没有进门禁。

### U15 · 纠正：L4 指小队成熟度，不是项目重构
- 原话（反推）：「纠正——到达 L4 指的是小队成熟度，不是把项目重构成 L4」
- 意图：把成熟度指标的作用域钉回治理侧，防止用代码工程量冒充团队能力。
- 隐含验收：M1~M11 每一项度量的是小队动作（提案/固化/会签/覆盖），不是业务代码量。
- 已兑现证据：STATE.md:169（第四十九轮·小队成熟度到达 L4，「用户纠正指『小队到达 L4』」）；maturity 实跑 11 项判据的 evidence 全部为治理侧对象（M5 codified=12、M7 maxRound=53/stuckAtProposal=none、M9 gatePatterns=12、M10 fakeGreen=none、M11 hard-green）；STATE.md:171（链内/链外一致，P12 真源覆盖，杜绝硬编码 3 条老提案）。
- 未兑现缺口：M3/M4 仍混入实现侧事实（layers/refuseConst/greenBound + fuseImpl/toyFuse/fuseHistory），「小队成熟度」与「项目实现」在这两项上未彻底解耦；STATE.md:171 的 10/11→11/11 漂移属判据自身缺陷（M5 硬编码 bodies），说明纠正只到口径层、未到判据分层。

### U16 · 组件化 / 工程化 / 合规化，以经典设计书籍为依据
- 原话（反推）：「要组件化、工程化、合规化，改进要有经典软件工程书籍作为依据，代码不能重复」
- 意图：重复实现是可审计缺陷，重构理由要能被书目条款回指。
- 隐含验收：依据唯一落盘 + 抽公共层前后门输出等价 + 会签归档。
- 已兑现证据：docs/squad/pipeline/DESIGN-PRINCIPLES.md:3「用户要求『以经典软件设计思想和书籍作为依据进行实时改进』…依据的唯一落盘点」（实测 56 行），:10 DRY↔Hunt&Thomas《The Pragmatic Programmer》，:11 SRP↔Martin《Clean Code》，:12 ISP/DIP↔SOLID；STATE.md:161（第四十七轮续：实测 10 脚本各写 W、2 门各写 cn2num、8 门各重复 traceExemption+exit → 落 lib/gate-kit.mjs）；STATE.md:181（TK-47-04 会签记录 L32 起 + P11 双向锚点，drift/reflow 双 exit 0）；本席实跑复核 gate-kit.mjs:17/20/46/56 真源存在、reflow-check coverage P11=4。
- 未兑现缺口：**gate-kit 化的 W 是全局单值，不是注入缝**——gate-kit.mjs:17 `process.env.QUANNENG_WORKSPACE || WORKSPACE` 无条件采用注入值，recheck §三（docs/qa/recheck-round-58.md:37-43）实测「伪造全绿包 → verify 59/60 通过」，且本席 grep 证实 17 个脚本直读该 env、无 isProduction/夹具白名单分支；即 DRY 抽层反而把「换包钥匙」集中到一处；STATE.md:179 亦记 DESIGN-PRINCIPLES 会签曾被 inbox 命中误判为完成（Correction）。

### U17 · 先改进再代收，时刻监督 / 检验 / 改进
- 原话（反推）：「先改进（把缺陷修掉）再收口，我要时刻监督、检验你们的改进」
- 意图：不允许「带着已知缺陷宣布收口」；监督本身要被机器见证。
- 隐含验收：派活前写域互斥校验、每轮 src 变更归属、收尾生成监督快照，任一红不得收口。
- 已兑现证据：STATE.md:157（第四十七轮·先改进后收口，三件套接入链，release 19→22、verify 45→50）；AGENTS.md:49 三件套成文；本席实跑三件套全绿：dispatch-guard exit=0（inFlight 仅 TK-58-04，paths=本 v2 文件，problems=[]）、lead-scope-check exit=0、supervise exit=0 且 tokenConverged=false / attention 2 条如实、resultVerify.gaps=[]；STATE.md:209（第 58 轮 captain 对 R-1/R-2/R-3 同轮整改）。
- 未兑现缺口：**「代收」的门仍握在制定者手里**——recheck-round-58.md:59-62 终判「制定者自身也在约束面内 = 部分成立」，:61 列出三把钥匙；本席复核整改落地情况为：R-3 已落地（exemptions.mjs:31-33 要求登记人≠会签人，旧 5 列行自动失效）且 EXEMPTIONS.md:10 当前表空；R-2 已落地（gate-kit.mjs:59-60 TERMINAL_RE/PENDING_RE 唯一真源，verify.mjs:59 引用、supervise 引真源）；R-1 已落地（supervise.mjs:76 把「memory-sla 阻断」并入 tokenConverged 否决）。**未落地的是 W 注入（recheck:61②）与 A1 格式/跨文件旁路（recheck:61③）**：A1 现按单文件 by Map 比对（verify.mjs:57-72），跨文件同令牌仍不判陈旧。

### U18 · 一直迭代到没有 token（零在途收敛）
- 原话（反推）：「一直迭代，直到没有（未闭合的）token」
- 意图：不允许令牌沉淀；「派了没做」要变成可见红灯而不是遗忘。
- 隐含验收：在途令牌数机器可算、陈旧卡被拦、收敛与否有布尔标记。
- 已兑现证据：STATE.md:193（第五十五轮补·用户要求迭代至没有 token；卡级在途 4→3；verify 增 A1 无陈旧在途卡 57→60；supervise 增 tokenConverged）；STATE.md:203/:205（第五十七轮 terminal 在途=0、tokenConverged=true）；本席实跑 supervise → tokenConverged=false、inFlight=["TK-58-04"]、singleFlightAge 给出「R-W 等待回报；下一轮无回报且席位转 inactive 按 A1 重投或 hand_back 裁决」——即当前布尔如实为 false 且原因就是本席。
- 未兑现缺口：达成过一次 true 又被本票重置，说明该指标**只反映瞬时快照**：briefs/round-58-pending.md:7,:21 证实「并行 Promise.all 3 发全部静默夭折」（agent-4/5/6 inactive、0 产物、inbox 无 TK-58-0x）——令牌静默失败无告警面，收敛只能靠人工扫卡发现；该失效面（P13 候选）未进 reflow 12 模式，也未进 verify。

## 三、给用户的下一句提示词建议（×3，各消费一个当前真缺口）

### 建议 1（消费 TK-58-02 情报暴露的 #10 入站验签缺口）
> 「以 intel SN26 refresh 判否的 #10 入站北向验签为唯一目标：派后端在 SnController 的 @PostMapping 入口加『验签先于 flow.handle』链路（signId 取证书、失败 40030000/403 SECURITY_REJECT），并**先把 result-verify 增加一条入站 parity 断言、让它当前必红**，再改码复绿；同票带上 #15 Java KeepAlive 15s 与 #14 未知字段方向裁决（引用契约 §5 与 DOC:537 的冲突，给三值结论，不许静默择一）。写域只给 gateway-java/src/main/java/com/unionpay/tradein/north/ + crypto/ + 本条 parity 行。」

真缺口指针：docs/squad/intel/SN26-约束清单-refresh-2026-11-16.md:22（#10 入站判否）、:43（否=3 项）、:59①②③④（未闭合清单）；本席复算 gateway-java/.../north/SnController.java:44-52 仅 `@Valid` 即 `flow.handle`，grep 入站验签标识符 0 命中；对照出域 Sn26FlowService.java:115（verifyResponse）→ :122（normalize）；契约 docs/arch/api-contract.md:65（未知字段北向拒绝裁定）vs :116（D-3 陈述滞后）。

### 建议 2（消费 recheck「部分成立」后的收口验证）
> 「recheck 判『制定者自身也在约束面内 = 部分成立』。不要再派整改票，派一张**只验不修**的独立复核票：对已落地的 R-1/R-2/R-3 跑强制负样本（自签行不生效 / 5 列旧格式不生效 / memory-sla 红必使 tokenConverged=false / 跨文件同令牌陈旧必被检出），并对未落地的 W 注入给出裁决——要么写进契约成『仅限测试注入 + 生产 profile 拒绝』并补断言，要么撤销该 env 的读取面；结论必须是三值，且明确写出『哪两把钥匙仍在制定者手中』。」

真缺口指针：docs/qa/recheck-round-58.md:59-62（部分成立 + 三把钥匙）；整改落地实读 packages/dsh-quanneng-squad/scripts/lib/exemptions.mjs:31-33（双签互异）、scripts/lib/gate-kit.mjs:59-60（词表真源）、scripts/supervise.mjs:76（memory-sla 入否决）；**仍未落地**：gate-kit.mjs:17（QUANNENG_WORKSPACE 无条件采用，本席 grep 实测 17 处直读、无生产拒绝分支）与 scripts/verify.mjs:57-72（A1 by Map 单文件比对 → 跨文件旁路面）。

### 建议 3（消费 W2 拷问门开工）
> 「按 CR-003 轮次绑定，本轮 W1 收口后下一轮走 W2（S0 拷问门 + 架构）：让需求经理在 clarifications-SN26 的第 1 轮四拷问面上**开第 2 轮**，只拷问三件当前无主的事——① A1 技术基线（Java/Node 双栈谁是权威口径，D1 待裁决至今未裁）、② 范围口径冲突（A13 文件通道已实现却被写为『不在范围』）、③ 12 项外部确认 E1~E12 零答复时的默认处置规则；产物写进 docs/prd/clarifications-SN26.md 第 2 轮小节，并把「G-REFLOW 缺 P13（静默失败面）」「user-prompts 目录 verify 只认 v1」两条作为拷问门的输入缺陷带入；不允许在拷问结论出来前派任何实现票。」

真缺口指针：docs/squad/ROSTER-16.md:56-57（W1=谋断 / W2=S0+架构，含需求、产品、架构、给事中、御史、后端、测试、交付）、:63-72（轮次绑定两级判定，简报明示优先）；docs/prd/clarifications-SN26.md:8（第 1 轮，≤2 轮上限尚余 1 轮）、:12（A13 口径需统一）、:13（A1/A4 冲突未裁决、§12 的 12 项未答复）、:22（D1 待裁决，本席无权改 STATE/ADR-001）；docs/squad/gates/G-S2.md:15（S0 拷问门曾 PASS，但 PASS 前提正是这些残余风险）；intel refresh :45（E1–E12 本轮无一新答复落地）；缺陷输入：packages/dsh-quanneng-squad/scripts/verify.mjs:245-248（用户提示词断言只检 U1/U5/U7/U8/U9，不认本 v2 与 U10~U18）。

## 四、本席复核口径声明（防照抄）
1. 本文件所有「已兑现」结论都来自本席本会话实跑或实读（脚本名 + 实测字段值随行给出），未把 iteration-52 / refresh / recheck 的判定当作证据本身，只当索引。
2. 与底稿 v1 的判定差异：U7 ❌→**部分兑现**（dashboard 存在但停更）；U2 ✅→**部分兑现**（累计 16/16 真、滚动 6/16 未收敛）；U9 ✅→**部分兑现**（27 项 0 缺口 ≠ 19 行约束全覆盖）；U1/U4/U5/U6/U8 判兑现但各留一条具体缺口。
3. U10~U12 为本轮新增编号（v1 只有 U1~U9，底稿原话 8/9/12 此前从未映射）；U13~U18 为第 45 轮之后原话补录。
4. 写域：仅新建本文件；USER-ORIGINAL-PROMPT.md 只读未改；未碰 src/、scripts/、gates/、契约、intel/、qa/（本席对脚本与 Java 码的全部操作均为 read/grep，无写）。
