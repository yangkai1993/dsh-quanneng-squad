# 第 58 轮 · W1 S6 封驳整改独立三值复核（对 audit-round-52 的整改复验）

> token: TK-58-03 ｜ 席位：给事中（监察谋断·抽巡）｜ 阶段：S6 整改复核
> 复核对象：docs/qa/audit-round-52.md（上轮 S6 封驳）的整改落地。
> 核心命题：「制定者自身也在约束面内」——本轮给最终三值。
> 方法：独立现场复算，**不引用 STATE/简报/整改文档的「已修复」陈述作为证据**；6 个被复核文件全量 read/grep + 系统临时目录探针实跑（mkdtemp，仓库零写盘零残留）。
> 探针宿主说明：process.execPath 为 Electron（吞 stdout），实测一律用独立 node `D:\\Programs\\Dev\\nodejs\\node.exe`（v24.16.0）；探针脚本临时目录全部 C:/Windows/Temp/tk5803-*，跑完即 rmSync。
> 写域：仅本文件；未碰被复核文件与任何其他路径。

## 〇、关键 file:line 现状（现场读取，sha 前缀证明本席未改）
| 文件 | mtime | sha256前10 | 关键行 |
| --- | --- | --- | --- |
| scripts/memory-sla.mjs | 2026-11-15T14:38 | 9981b735a6 | :24-26 runGate+failFast；:6 LIMIT=100 |
| scripts/lib/exemptions.mjs | 2026-11-15T15:01 | e022ac7fb4 | :12 GATE_IDS含memory-sla；:46-48 byEnv=envSet&&byFile；:48 envIgnored |
| scripts/l4/facts.mjs | 2026-11-15T14:40 | 78071d445f | :62-65 ENV_EXEMPT_VARS→activeExemptions；:67-68 greenLevel 三值 |
| scripts/supervise.mjs | 2026-11-15T15:38 | 8dcb35e8ac | :15-16 跑 memory-sla；:71 attention 读 memorySla.problems；:75 tokenConverged 式 |
| scripts/verify.mjs | 2026-11-16T01:29 | e4b34b408f | :53-56 V-52-02 断言；:57-76 A1；:98-102 V-52-01 断言 |
| tests/release-scripts.test.js | 2026-11-16T01:32 | 0187870739 | :169-187 双因素行为测试 |

## 一、V-52-01（memory-sla 默认阻断 + supervise 消费）—— **成立**
- 静态：memory-sla.mjs:24 由 `runGate({name:'memory-sla',varName:'QUANNENG_ALLOW_MEMORY_SLA',items:problems})` + :26 `failFast(exitCode)`，gate-kit.mjs:49-53 无豁免即 return 1；supervise.mjs:15-16 实跑消费、:71 把 problems 推入 attention。旧「23 行无 process.exit」形态已消失。
- 实跑①（负样本②）：临时工作区 OUTBOX=101 → memory-sla **exit=1**，stdout ok:false、problems「OUTBOX 积压 101 > 上限 100」，stderr「[门阻断] memory-sla」。
- 实跑②：同 101 积压 + env QUANNENG_ALLOW_MEMORY_SLA=1（单因素）→ **exit=1**（env 不再单独放行）。
- 实跑③：OUTBOX=30 → exit=0 ok=true；真实仓库 memory-sla exit=0（decisions=93/pending=79）。
- 实跑④（端到端消费）：临时工作区制造 memory-sla 红 → supervise exit=0 但 memorySla.exit=1、attention 含「memory-sla 阻断：OUTBOX 积压 101…」。消费确实发生。
- 残留（新反证 R-1）：supervise.mjs:75 `tokenConverged = inFlight===0 && !attention.some(/在途|门红|真回归/)`，而 memory-sla 的 attention 串是「memory-sla 阻断…」不含这三个词 → **仅 memory-sla 红时 tokenConverged 仍=true**（逻辑复算证实）。阻断被“看见”但未纳入“零在途收敛”机器判据。整改声明未覆盖此点，判残留非整改失败。

## 二、V-52-02（env 单因素不豁免 + 对 greenLevel 不隐身）—— **成立**
- 静态：exemptions.mjs:46 `envSet = process.env[varName]==='1'`、:47 `byEnv = envSet && byFile`、:48 无 byFile 时返回 `{exempted:false, envIgnored:true}`；facts.mjs:61-65 把 10 个 env 尝试计入 activeExemptions，:67-68 据此把 greenLevel 从 hard-green 降为 soft-green。
- 实跑①（负样本①，核心）：`traceExemption('l4-maturity','QUANNENG_ALLOW_L4_GAP',3, 空表工作区)` 且 env=1 → 返回 **{"exempted":false,"active":{},"envIgnored":true}**。env 单因素被拒。
- 实跑②（不隐身）：临时工作区仅 env QUANNENG_ALLOW_L4_GAP=1、文件表空 → collectFacts 得 **greenLevel=soft-green, activeExemptions=["env:QUANNENG_ALLOW_L4_GAP"]**。env 对 greenLevel 完全可见。
- 实跑③（穷举）：十个 QUANNENG_ALLOW_* 全置 1 → activeExemptions 全 10 条 `env:*` 入列、greenLevel=soft-green。无遗漏变量。
- 实跑④（行为级）：audit-roster 死路由 + env 单因素 → **exit=1（仍阻断）**；空表默认也 exit=1；文件表+env 双因素 exit=0。与 tests/release-scripts.test.js:169-187 契约一致。
- 实跑⑤：临时副本跑 release-scripts.test.js → **exit=0**，「env alone does NOT lift; file-table+env does (V-52-02)」✔。
- 结论：两子命题现场复算均成立。

## 三、W 注入契约（QUANNENG_WORKSPACE）—— **不成立（仍可调包）**
- 静态：gate-kit.mjs:17 `W = process.env.QUANNENG_WORKSPACE || WORKSPACE` 无条件采用注入值；squadctl.mjs:42、facts.mjs、supervise.mjs、verify.mjs:41/45/46/58/… 共 17 处直读该 env。无任何 isProduction / 夹具白名单 / 生产拒绝分支（grep 生产|isProduction|fixtureOnly 命中 0）。
- 实跑①：`QUANNENG_WORKSPACE=临时目录` → gate-kit 解析 **W=临时目录, IS_INJECTED=true**。
- 实跑②（决定性）：伪造一个「全绿 docs 树」工作区（自制豁免表/自制 DECISIONS/自制 dispatch），把 verify.mjs 整体指向它 → **59/60 通过**（唯一失败仅因未拷 AGENTS.md，非豁免断言）。即制定者可把自己写的门指向自制「全绿包」通过绝大多数文件型断言。
- 实跑③（陈旧卡注入）：同一伪造包内放「加粗表头陈旧在途卡」→ A1 断言仍判 PASS（见第四节）。
- 整改文档 S6-REMEDIATION-2026-11-15.md:10 仅列 V-52-01/02 + C7，W 注入（原 V-52-03）未整改；gates/ 文档对 QUANNENG_WORKSPACE 契约零规定（grep=0）。**制定者仍握换包钥匙，无契约、无第二人。**

## 四、陈旧在途卡防线（verify.mjs A1 断言）—— **部分成立**
- 静态：verify.mjs:57-76 逐文件建 `by:Map`，命中「同令牌后段终止/前段仍标在途」即 return false。正则 `/\| 令牌 \| (TK-\d+-\d+)/` 与 `/\| 状态 \| (…)/` 为逐字单空格硬匹配。
- 实跑①（正向检出）：规范卡（旧段在途、新段已闭合，同文件）→ **检出陈旧 HITS=seat.md#TK-58-01**。防线在标准写法下有效。
- 实跑②（格式旁路）：同语义但「| 令牌 |  TK」（双空格）→ **PASS(漏检)**；「|**令牌**| TK」（加粗表头）→ **PASS(漏检)**。
- 实跑③（跨文件旁路）：令牌在 A 文件标在途、B 文件标已闭合 → **PASS(漏检)**（by Map 只在单文件内比对）。
- 实跑④（词表分叉，反证 R-2）：末段「过程记录」→ verify A1 视为终止态判陈旧，supervise.mjs:31 TERMINAL 却不含「过程记录」而含「仅登记移交意图」（verify 不含）；两门终止态词表分叉：仅登记移交意图 verify=false/supervise=true，过程记录 verify=true/supervise=false。
- 实跑⑤（当前真实覆盖）：真实仓库 16 张卡，宽松匹配=38、严格正则=38、差异文件=0 → **现有卡全部在 A1 面内**（暂无实际漏检，但正则脆弱、任何书写变体即脱检）。

## 五、新反证汇总（任务负样本④：任何新的制定者旁路）
- **R-1**：memory-sla 红不进入 tokenConverged 判据（supervise.mjs:75 正则漏「阻断」）。
- **R-2**：verify A1 与 supervise TERMINAL 终止态词表分叉（过程记录 / 仅登记移交意图互斥）。
- **R-3（最重要 · 单人自签无会签，实测放行）**：文件表单因素即可豁免任意门——memory-sla OUTBOX=101 + 自制行 `| memory-sla | <未来日> | 自签 | captain | 无 |`（无 env）→ **memory-sla exit=0**；audit-roster 死路由同法 → **exit=0（AR-3）**；traceExemption 文件表有行时 env 未设也 exempted=true（P1c）。`登记人` 列（m[3]）**不被任何逻辑校验**——「登记人列留空」仍 exempted:true。全库仅表头出现「登记人」字样，无脚本核验登记人≠门改动人、无第二人联签。此即 audit-round-52 V-52-06 未收口的钥匙，现成实测：制定者一人改 EXEMPTIONS.md 一行即放行自己写的门。
- **R-4**：W 注入无生产拒绝（见第三节），与 R-3 组合=「换包 + 自签」双钥匙，均在制定者一人手。

## 六、核心命题最终三值
- **「制定者自身也在约束面内」：部分成立**（较上轮「不成立」为实质前进，但仍未闭合）。
- 已入约束面：memory-sla 默认阻断且被 supervise 消费（V-52-01 成立）；env 单因素豁免被拒且对 greenLevel 可见（V-52-02 成立，穷举 10 变量无遗漏）。
- 仍在约束面外：① EXEMPTIONS.md 单人自签一行放行任意门、登记人列零校验（R-3，实测 exit=0）；② QUANNENG_WORKSPACE 注入把全部门指向自制全绿包、无生产拒绝（第三节，实测 59/60）；③ A1 陈旧卡格式/跨文件/词表旁路（R-2）。
- 一句话：两把「豁免钥匙」（env、greenLevel 隐身）已锁死，两把「制定者钥匙」（文件表自签、换包）仍无人复核——命题因这两把钥匙未收口而止于「部分成立」。

## 七、探针清理确认
- 临时目录：所有探针落 C:/Windows/Temp/tk5803-*（mkdtemp），逐批 rmSync 后 existsSync 全 false；本会话共创建 24 个临时目录/文件组，清理确认输出 `CLEAN_CONFIRMED=[false×N]`。
- 仓库零写盘：本席唯一写入 = 本文件 docs/qa/recheck-round-58.md；被复核 6 文件 mtime/sha 见第〇节，未变；.tmp-exemption-probe / .verify-exempt-drill / .tmp-meta 在仓库均不存在（残留扫描=空）；无 git 仓库（`fatal: not a git repository`），无从比对 git diff，已用 sha+mtime+目录扫描替代。
