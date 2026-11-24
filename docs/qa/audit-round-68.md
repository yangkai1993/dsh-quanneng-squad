# 第 68 轮 · W4 S6 抽巡：gate-rotation / pre-verify 数据驱动断言封驳复核

> token: TK-68-03 ｜ 席位：给事中（监察谋断·抽巡）｜ 阶段：S6 抽巡（本轮新门复核）
> 复核对象：packages/dsh-quanneng-squad/scripts/gate-rotation.mjs（第 67 轮选项A新门）、
> packages/dsh-quanneng-squad/scripts/pre-verify.mjs（第 63 轮行为门，68 轮接入 release）、
> 以及 verify.mjs 对两门的数据驱动断言（:78-101、:356-384）。
> 方法：独立现场复算。不引用 STATE/简报的「已修复」陈述作证据；全量 read/grep +
> 系统临时目录夹具实跑（QUANNENG_WORKSPACE 注入，仓库零写盘），探针宿主固定独立 node
> `D:\\Programs\\Dev\\nodejs\\node.exe`（规避 Electron 吞 stdout）。
> 写域：仅 docs/qa/audit-round-68.md。本席未改任何 Java/pom 文件，按任务书规则本卡 commandsRun 无需 mvn test exit0。

## 〇、现场基线（真实仓库实跑）
| 项 | 实测 |
| --- | --- |
| gate-rotation | exit=0；round=68，W4；cardCount=16；8/8 席 covered；missing=[] |
| pre-verify | exit=0；checked=8；problems=[] |
| 真实 team.json 形态 | 8 张在途卡 **kind 全部=work**；completed Java 卡样本数=0 |
| 「轮换缺口：undefined」消息缺陷 | **已修复**：gate-rotation.mjs:36 用 current.round（真源字段，rotation.mjs:23 rows 元素字段=round），受限夹具实跑消息为「轮换缺口：W4 应上席位「考功」本轮(第68轮)未见令牌（dispatch 卡无 TK-68-*）」，problems 不含 undefined/NaN；回归防线 verify.mjs:379-384（.w 残留检测）在场 |
| 本轮 8 席覆盖真实性 | 逐卡核对：8 席 dispatch 卡各含真实交付令牌 TK-68-01..08（本席 TK-68-03 在列）；占位段 TK-68-10..17 并存但未参与本轮判定——当前覆盖为真 |

## 一、gate-rotation 数据驱动断言 —— 三值：**部分成立**
- **成立面**：
  - 轮次/W 绑定单一真源（lib/rotation.mjs，STATE末轮+cn2num+(round-1)%4），gate-rotation/pulse/squadctl 三消费者共用，无字段分叉（verify.mjs:379 回归断言 + 夹具实测通过，见第〇节）。
  - fail-closed：夹具缺 7 席 → exit=1 逐席点名（探针 GR-1）；轮号不可解析 → 仍 exit=1 阻断而非假绿（探针 GR-3）。
  - 豁免通道守既有双签协议：gate-rotation ∈ GATE_IDS（exemptions.mjs:12），夹具实测「双签未过期行 → exit=0 且 stderr 留痕『豁免生效』」（GR-4）；单人自签/5 列旧表在第 58 轮已收口，本轮未见回归。
- **不成立面（封驳项）**：
  - **GR-2 空转覆盖旁路（本轮实测成立，中-高）**：gate-rotation.mjs:29 覆盖判定只匹配卡内任意 `TK-<round>-\d+` 文本，**不区分交付段与非交付段**。夹具：给事中卡只放「TK-68-12（非交付令牌·仅登记移交意图）」→ covered 含给事中、missing 不含 → 该席位零实产出而门绿。真实仓库本轮恰每席都有实派令牌所以未咬人，但「轮换覆盖」语义已从「应上席位有实活」退化为「应上席位被挂过任意号」；用 TK-<round>-10..17 占位号即可长期空转骗绿。词表真源 TERMINAL_RE/PENDING_RE（gate-kit.mjs:59-60）就在手边，A1 断言（verify.mjs:64-72）已有「段级令牌+状态」解析逻辑，门没用。
  - **GR-3 轮号>99 解析崩溃为误导红（低）**：cn2num 无「百」位（gate-kit.mjs:19-31），夹具「第一百轮」→ round=NaN；W 绑定回落 idx=0 → 用 **W1 名册**报 8 条「第NaN轮/TK-NaN-*」缺口。方向仍 fail-closed，但消息把解析失败伪装成名册缺口，排障误导；第 100 轮（按当前节奏 2~3 周内）必触发。
  - GR-5 席位匹配用 startsWith/includes 前缀包含（:32-34）：简称「产品」可被任意含「产品」二字的卡名误命中，属脆弱面非现实缺口（现存 16 卡名无碰撞，实测 covered 全真）。

## 二、pre-verify 行为门 —— 三值：**部分成立（对当前面板数据形态不成立）**
- **成立面**：
  - **无豁免通道（优点，全链最严）**：pre-verify ∉ GATE_IDS（exemptions.mjs:12 不含），夹具双因素（文件表双签行+env=1）仍 exit=1（PV-8 实测）——红只能靠真实修数据消。
  - changedPath 不存在即红（pre-verify.mjs:32-35，夹具 PV-2 实测命中）。
  - 无 mvn exit0 记录即红（:25-28，夹具 PV-4b 实测 exit=1）。
- **不成立面（封驳项，按严重度排序）**：
  - **PV-1 kind 盲区——门对当前面板全量数据是空集（blocker 级）**：pre-verify.mjs:21 `!['implementation','repair'].includes(kind) → continue`，kind 缺省补 'work'（:20）。夹具：completed + changedPaths=[*.java] + commandsRun=[] + kind=work → **exit=0 放行**；同一数据 kind=implementation → exit=1。而真实面板 **8/8 卡 kind=work**，面板通道派活（含本任务书 Kind: work）就是这种形态。即：本轮任务书宣称的「改 Java 的卡 commandsRun 必须含 mvn test exit0」在门内只对面板根本不产出的 kind 值生效——**行为门在当前数据形态下管辖样本=0**。
  - **PV-2 mvn 记录真实性零校验（高）**：门只验「字符串匹配 MVN_RE 且自报 exitCode===0」的记录存在（:25）。夹具伪造 `{command:"mvn -o test", exitCode:0, evidence:"echo fabricated"}`（从未跑过）——该记录**本身不被任何检查拒绝**；PV-2 实测门红仅因 changedPath 路径不存在，把路径造真即全绿。脚本注释:9「验证的是 mvn 真的跑过且通过」超出实际能力，是给 captain 的虚假保证。
  - **PV-3 时序锚点承诺悬空（高）**：pre-verify.mjs:30-31 明文「精确时序由 supervisor 的 SUPERVISION.json 时间戳复核」——grep supervise.mjs：pre-verify/mvn/commandsRun 消费 **=0 命中**（仅有与面板时间无关的报告文件 mtime 众数分桶）。被承诺的第二道复核不存在；「先改坏 Java 后补一条陈旧 mvn 绿记录」的顺序无任何防线。
  - PV-4 MVN_RE 假接受（中）：/mvn[^&]*\btest\b/i（:17）中 `-` 是词边界 → `mvn -o test-compile` exit0 夹具实测 **exit=0 绿**。不跑任何测试的 test-compile/test-verify 满足门。
  - PV-5 any-not-latest（中）：夹具「先 mvn exit0 后 mvn exit1」→ 绿（:25 只看存在性）。最后结果红可被更早绿掩盖。
  - PV-6 面板记录形态假阳性（低，方向安全）：夹具 commandsRun={command:"mvn -o test", status:"passed"}（无 exitCode 数值字段）→ 红。若面板 GUI 落盘形态不带 exitCode，所有合规卡将集体误红；现零样本未咬人，接面板写卡前必须对齐。
  - PV-7 changedPath 无工作区 containment（低）：夹具 `../../Windows/win.ini` + mvn 记录 → existsSync 命中外部真文件，exit=0 绿（:33-34 join 后未校验是否越出 W）。

## 三、verify.mjs 数据驱动断言复核
- **VT-1 篡改演练今日真空绿（高，与 PV-1 同链）**：verify.mjs:78-101「completed Java 卡无 mvn exit0 → 门红」演练，前置 :83-85 `javaCards.length===0 → return true` 且同样按 kind∈{implementation,repair} 过滤。真实 team.json 今日 completed Java 卡=0 → **断言为真空通过**；门与其自测共享同一盲区，「数据驱动」在两处同时是空转。演练另注意：它对真实 team.json 做备份-篡改-还原（:88-99），与面板并发写入存在窗口竞争（低）。
- **VT-2 REAL_NODE 修复半程（中）**：:93 `QUANNENG_NODE||'node'` 已修复第 68 轮补 ① 记录的 Electron 假失败；但 :115-116、:122-125 route-gate 两处 spawn 仍用 `process.execPath`——同型 bug 的第三个实例只修了第二处的一个分支。Electron 宿主跑 verify 时这两条的行为结论不可信。
- VT-3 gate-rotation 接线断言（:356-369）为源码关键字型（includes('runGate(') 等），属文档断言层级，其强制由门自身 exit 承担，口径与 :136-137 共识一致，不另计。

## 四、核心命题最终三值
- **命题「本轮新门的数据驱动断言可承担行为门禁」：部分成立（偏不成立）**。
  - 已入约束面：undefined 字段 bug 修复且有回归防线；fail-closed 方向正确（缺令牌、路径不存在、kind 对口时均真红）；pre-verify 无豁免通道为全链最严设计。
  - 仍在约束面外：① pre-verify 对面板唯一现实 kind 形态（work）零管辖（PV-1，实测放行）；② mvn 绿记录可伪造且时序复核无人兑现（PV-2/PV-3）——「行为门」当前核的是“写过”，不是“跑过”；③ gate-rotation 非交付占位令牌即算覆盖（GR-2）——空转轮换可维持表面全绿。三条相互独立，任一即足以让「面板全绿」与「真做过」脱钩。
- 一句话：两道门的**红样本都是真红**（方向安全），但**绿样本的成因里都有不劳而获的路径**——覆盖绿可以靠占位号，行为绿可以靠 kind=work 绕行或伪造记录；第 58 轮「制定者钥匙」在新门上的变体复现。

## 五、最小闭合建议（供 captain 裁决，本席写域外不动手）
1. pre-verify 过滤改为「凡 completed 且 changedPaths 含 Java/pom 即核」（或对 kind∉{review,requirements} 全量核），同时与面板落盘对齐 exitCode 字段契约（消 PV-1/PV-6）。
2. 兑现 PV-3：pre-verify 计算 max(javaPaths mtime)，与任务完成时间/SUPERVISION 批次时间戳比较并输出；supervise 侧消费 pre-verify 结果进 attention。
3. MVN_RE 收紧为 `/\bmvn\b[^&|;]*\s+(-o\s+)?test(\s|$|"|')/` 排除 test-compile/test-verify（消 PV-4）；取「最后一条 mvn 记录」而非「存在一条 exit0」（消 PV-5）。
4. gate-rotation 覆盖判定复用 verify A1 的段级解析 + gate-kit 词表真源：状态含终止词（非交付/仅登记）的段内令牌不计覆盖（消 GR-2）。
5. cn2num 补「百」或 STATE 轮号强制阿拉伯数字校验，解析失败时消息只报「轮号不可解析」不带名册缺口（消 GR-3）；verify route-gate spawn 换 REAL_NODE（消 VT-2）。

## 六、探针与清理确认
- 夹具工作区全部建于系统临时目录（tk6803-*/tk6803b-*，共 13 个）+ 仓库内 .tk6803-probe 1 个；逐批 rmSync 后 existsSync 全 false，临时夹具零残留；.tk6803-probe 已删。
- 仓库零写盘：门实跑只读；本席唯一写入 = 本文件。真实 team.json 未被篡改（本席未跑 verify.mjs 演练段，避免其备份-写回窗口）。
- 宿主说明：子进程 env 受限时 os.tmpdir 退化「undefined\\temp」为探针路径显示问题，与被审逻辑无关；workspace 下既有 undefined/temp 目录为历轮探针遗存，非本席创建，移交起居注官登记。
- 证据锚点：本文所有「实测」均可用 `D:\\Programs\\Dev\\nodejs\\node.exe packages/dsh-quanneng-squad/scripts/{gate-rotation,pre-verify}.mjs`（真实仓库 exit=0）或同法注入 §一/§二 所列夹具复现。
