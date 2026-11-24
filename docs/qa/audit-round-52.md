# 第 52 轮机器门 · S6 封驳抽巡（「制定者自身也在约束面内」）

> token: TK-53-03 ｜ 席位：给事中@v17 ｜ 阶段：S8 记注与度量（ROSTER-16.md:59 W4）｜ squadRole: docs/squad/prompts/security-auditor-v5.md
> 命题：复核第 52 轮全部机器门是否「制定者自身也在约束面内」（G-REFLOW.md:16 P8；p8-cross-audit-2026-11-11.md:42-52 早报未闭合）。
> 方法：只读复核 + 3 门正向实跑 + 4 组负向/旁路探针（探针一律落系统临时目录，仓库零写盘、零残留）+ 全量 read/grep。禁照抄简报自报。
> 写域：仅本文件 docs/qa/audit-round-52.md（派活授权）。同轮 TK-53-01→docs/squad/metrics/iteration-52.md、TK-53-02→docs/squad/journal/2026-11-15.md，三卡 inbox 实测互异，无并发覆写（AGENTS.md §1 铁律）。
> 边界：未碰 src/、scripts/、gates/（AGENTS.md:12 gates/ 归总指挥）；未改任何门脚本；未派生子智能体（fork 剩余 0）。
> 开工四读：DELIVERY-PIPELINE.md:19（S6 抽巡）/ FUNCTION-LEDGER.md:18 / STATE.md:7（S8 复盘）/ squad-toolkit/VERSION.md:4（canary 空）/ AGENTS.md §1:12、§3、§4 / ROSTER-16.md:59。

## 一、判据（把命题拆成四问，逐门可测）
- Q1 负向：制定者制造的违规，门是否真会阻断（exit≠0 / ok:false 被消费）？
- Q2 自洽（P1）：门及其判据是否被第二实现或外部真值交叉核对，还是同改同变永真？
- Q3 旁路（P8）：制定者是否持有 env / EXEMPTIONS 自签 / 改脚本 / 注入 W 使门失效的钥匙，且无第二人联签？
- Q4 生效（P2/P7）：门的 `ok:false`/阻断是否有下游消费者，还是「报了等于没报」？

## 二、实跑命令清单（本会话实测，cwd=E:\workspace\trade-in，node v24.16.0）
| # | 命令 | 关键输出 |
| --- | --- | --- |
| C1 | `node packages/dsh-quanneng-squad/scripts/memory-sla.mjs` | exit 0；decisions=82 / pendingReplay=68 / limit=100 / ok=true / problems=[] |
| C2 | `node packages/dsh-quanneng-squad/scripts/l4/maturity.mjs` | exit 0；11/11 [L4 到达]；M11 greenLevel=hard-green activeExemptions=none；M1 fixture=26/26 |
| C3 | `node packages/dsh-quanneng-squad/scripts/squadctl.mjs help` | exit 0；列出 20 个子命令 |
| C4 | `QUANNENG_ALLOW_L4_GAP=1 node --input-type=module -e "import {traceExemption} …"` | `PROBE={"exempted":true,"active":{}}` + stderr「[豁免生效] 门=l4-maturity 来源=env QUANNENG_ALLOW_L4_GAP」 |
| C5 | `QUANNENG_WORKSPACE=D:/captain-picked node … import {W}` | `W_RESOLVED=D:/captain-picked` |
| C6 | 临时工作区 fixture：README 含权威声明 + OUTBOX 101 行 + QUANNENG_WORKSPACE 注入 | `ok:false, problems:["OUTBOX 积压 101 > 上限 100：须回放或书面降级"]`，`NEG_EXIT=0` |
| C7 | `grep -n 'squadctl' packages/dsh-quanneng-squad/scripts/verify.mjs` | `NO_MATCH: verify.mjs 无 squadctl 断言` |
| C8 | `node --input-type=module -e "import {readExemptions} …"` | `ACTIVE_EXEMPTIONS={}`（当前文件表为空） |
| C9 | `grep -nE 'process.exit\|QUANNENG_ALLOW\|traceExemption\|MAP\|LIMIT' 三门+lib` | 见下文逐门行号 |

> 时序说明：C1 实测 82/68 与 briefs/round-52.md:26 自报 80/66 不一致，系轮次推进 OUTBOX 自然增长，取实测不取简报（抽巡口径）。

## 三、三门三值结论（每门附 file:line + 实测命令）

### 门1 `scripts/l4/maturity.mjs` —— **部分符合**
- **在约束面内的部分（真行为级）**：M1 实跑夹具 `toy=run(['scripts/l4/toy-fixture.mjs'])`（maturity.mjs:24-26，C2 evidence `fixture=26/26 exit=0`）；M11 `await import('./facts.mjs'); liveFacts=mod.collectFacts(W)`（:108-110，C2 evidence `greenLevel=hard-green … gateResults 全 0 / resultVerify:0 / pluginTests:0`）。制定者造的假绿/项目红态会在此被检出。
- **制定者豁免/自洽缺口**：
  - E1 env 自免：:117 `traceExemption('l4-maturity','QUANNENG_ALLOW_L4_GAP',…)` + `if(!ex.exempted) process.exit(1)`；exemptions.mjs:38 `process.env[varName]==='1'` 直接放行。C4 实测 `exempted:true` 且 `active:{}`——**当前文件豁免表为空，env 仍单独生效**。
  - E2 env 豁免对 M11 隐身：facts.mjs:60 `activeExemptions = Object.keys(readExemptions(W)||{})` 只读文件表、不读 env；故 env 下 `greenLevel` 仍 `hard-green`（facts.mjs:62-63），M11 仍 pass。env 钥匙「既放行 exit、又不污染 M11」，双重自洽。
  - E3 核心判据为源码文本匹配（P1/P3）：M2 `hardcoded=/toyFixturePassed\s*:\s*true|baselineCaptured\s*:\s*true/.test(facts)`（:34）、M6 `a13=/hardGreen|…|readExemptions/.test(facts)`（:67）——判「计绿不被豁免稀释」只查 facts.mjs 有无这些词，改注释即绿，无第二实现/外部真值（G-REFLOW.md:8 P1 反例、p8 报告:21 已列）。
  - E4 判定对象可调包：W 来自 gate-kit.mjs:17 `process.env.QUANNENG_WORKSPACE || WORKSPACE`（C5 实测）；facts.mjs:54-58 用注入 W 拼 PKGDIR 跑五门、:30 读注入 W 的 baseline、:41 读注入 W 的 STATE。制定者可造「全绿工作区」过 M11（P5/P6）。
- 结论：**部分符合**——有 M1/M11 真判据，E1~E4 使制定者不在完整约束面内。

### 门2 `scripts/memory-sla.mjs` —— **不符合**
- **结构性无阻断**：全文 23 行，C9 grep 确认**无任何 `process.exit`**；:22 仅 `console.log(JSON.stringify(snap))` 后自然 exit 0；:23 注释自认「监督门不阻断：积压是已登记风险，不把云端故障转嫁成构建红」。
- **负向实测 C6**：OUTBOX=101 > `LIMIT=100`（:6）→ `ok:false`（:21）、`problems:["OUTBOX 积压 101 > 上限 100…"]`（:17），但 `NEG_EXIT=0`。制定者（及任何人）写超 100 条恒不阻断；package.json:53 release 链 `node scripts/memory-sla.mjs` 恒绿。
- **红态零消费（P2/P7）**：supervise.mjs:12 七门列表不含 memory-sla、:66-71 attention 不读其 problems；verify.mjs:45 只断言「文件存在 + release 链含字符串」，不验行为。`ok:false` 无任何下游。
- **声明判据亦叙述匹配（P3）**：`localAuthorityDeclared=/本地.*(最终)?权威|local-primary|权威真源/.test(declaration)`（:14），README.md:63 一句「本地 DECISIONS.jsonl 为最终权威」即绿。
- 结论：**不符合**——连「约束别人」都不成立，制定者完全在约束面外。

### 门3 `scripts/squadctl.mjs` —— **部分符合**
- **有效部分（行为级）**：:49 `spawnSync(NODE,[join(PKG,file),…])`、:51 `process.exit(r.status??1)` 透传子脚本退出码；:44-46 未知子命令 exit 2；C3 help exit 0。
- **自身不在约束面内**：
  - E5 MAP 硬编码（:10-31）无完整性校验：C7 实测 `verify.mjs` 全文无 `squadctl` 断言，supervise.mjs:12 亦不消费。制定者删任一 `gate:*` 映射或改 `release` 分支（:39-42 `cmd.exe /c npm run release`），briefs/round-52.md:24「verify 54/54」与 :28「七门全 0」均不受影响——无人报「统一入口缺门」。
  - E6 入口可绕过：package.json:53 release 链直接 `node scripts/xxx.mjs`，不经 squadctl；MAP 非强制路径。制定者改 scripts/ 时不受该入口约束（G-REFLOW.md:16 P8 原始命中形态）。
  - E7 help 自报 20 命令（:36）无人交叉核对（P1 自洽绿灯）。
- 结论：**部分符合**——exit 透传有效，但入口自身/MAP 不在任何门验证面内，制定者可把自己从约束面摘除。

## 四、否决项（制定者豁免路径 · 封驳项）
| 编号 | 严重度 | 制定者豁免路径 | file:line 证据 | 实测 |
| --- | --- | --- | --- | --- |
| V-52-01 | **blocker** | memory-sla 结构性无阻断 + `ok:false` 零消费；release 链恒绿 | memory-sla.mjs:21-23 / package.json:53 / supervise.mjs:12 / verify.mjs:45 | C6 `ok:false` 但 `NEG_EXIT=0` |
| V-52-02 | **blocker** | maturity env 自免钥匙 + EXEMPTIONS 单人自签；env 对 facts.greenLevel 隐身 | maturity.mjs:117 / exemptions.mjs:38 / facts.mjs:60 | C4 `exempted:true, active:{}`；C8 `{}` |
| V-52-03 | 高 | QUANNENG_WORKSPACE 注入使判定对象可调包（跨 maturity/facts/supervise 全门） | gate-kit.mjs:17 / facts.mjs:30,41,54-58 | C5 `W_RESOLVED=D:/captain-picked` |
| V-52-04 | 中 | squadctl MAP 硬编码且自身/MAP 不在 verify/supervise 验证面内；入口可绕过 | squadctl.mjs:10-31,39-42,51 / verify.mjs 全文 / supervise.mjs:12 | C7 NO_MATCH + C3 |
| V-52-05 | 中 | 核心判据源码文本形态匹配（M2/M6/D6 权威声明），同改同变永真（P1/P3） | maturity.mjs:34,67 / memory-sla.mjs:14 / verify.mjs:45,47 | C9 grep + p8 报告:21 |
| V-52-06 | 中（制度） | gates/ 归总指挥、P8 拦截席位仍「总指挥（交叉审计）」自审、豁免无第二人联签 | AGENTS.md:12 / G-REFLOW.md:16 / p8-cross-audit-2026-11-11.md:52,66 | C8 当前表空 ≠ env 路径收口 |

## 五、横向共性（跨三门）
1. **旁路钥匙单点**：env（exemptions.mjs:38）、EXEMPTIONS.md 自签行（:15-31，登记人列无校验）、直接改脚本、W 注入四类钥匙全在制定者一人手里；C8 `ACTIVE_EXEMPTIONS={}` 仅证明**文件表**当前为空，不约束 env。
2. **历史未闭合**：p8-cross-audit-2026-11-11.md:52「所有旁路钥匙都在 captain 一人手里，无第二人登记/复核豁免的要求」、:66 建议「EXEMPTIONS.md 增加登记人≠被豁免门禁改动人校验或第二人联签」；第 52 轮 briefs/round-52.md:28 自报 `exemption=false` 仅覆盖文件表，未收口 env/W/squadctl-MAP 三类路径。
3. **自报绿 ≠ 交叉验**：briefs/round-52.md:24-28 的 54/54、11/11、七门全 0 均由同一套门 + 同一 verify 文本断言产出（P1 自洽），本抽巡以 C4/C5/C6/C7 四组外部探针给出反证。

## 六、总判定
- **核心命题「第 52 轮全部机器门制定者自身也在约束面内」：不成立**（Q1/Q3 四组实测命中）。
- 三值：maturity=**部分符合** / memory-sla=**不符合** / squadctl=**部分符合**。
- 封驳结论：**不符合（触发封驳，整改条件）**。V-52-01、V-52-02 为 blocker；整改并附负向复验前，briefs/round-52.md:27-28 的「maturity 11/11 [L4 到达] / 七门全 0 / exemption=false」只能作为「未被 env/W 旁路时的机器态」，不得作为「制定者亦被约束」的证据。
- **不触发代码回滚**：本轮为 S8 复盘抽巡，封驳对象是第 52 轮机器门结论的自洽性；整改落在 scripts/、gates/、package.json（AGENTS.md:12 总指挥写域），本席按派活约束只读复核、不越界改门。
- 整改建议（供 captain 裁决，非本席执行）：① memory-sla 增 `process.exit(1)` 或把 `ok:false` 接入 supervise attention / result-verify；② env 豁免纳入第二人联签或写入可被 `facts.readExemptions` 读取的登记；③ verify 增「squadctl MAP ↔ 治理门全集」一致性断言；④ M2/M6 改行为级探针替源码文本匹配；⑤ `QUANNENG_WORKSPACE` 注入限定为测试夹具专用、生产判定拒绝注入值。

## 附：C4/C5/C6/C7 实跑关键行
```text
$ QUANNENG_ALLOW_L4_GAP=1 node --input-type=module -e "…traceExemption('l4-maturity','QUANNENG_ALLOW_L4_GAP',3,…)"
[豁免生效] 门=l4-maturity 来源=env QUANNENG_ALLOW_L4_GAP 未阻断项=3（L4 gap）
PROBE={"exempted":true,"active":{}}
$ QUANNENG_WORKSPACE=D:/captain-picked node … import {W} …   → W_RESOLVED=D:/captain-picked
$ 负向 fixture（OUTBOX=101 行, README 含权威声明）            → ok:false / problems:[积压 101 > 上限 100] / NEG_EXIT=0
$ grep -n 'squadctl' scripts/verify.mjs                       → NO_MATCH: verify.mjs 无 squadctl 断言
```

## 领卡口径（如实登记）
`agent_teams_status` 返回 `tasks:[]`；`agent_teams_claim_task({task_id:"TK-53-03"})` 返回 `no task "TK-53-03" in team "quanneng-squad"`。本次为 inbox 原生 wake 派活（与 captain inbox 内多轮成员先例一致），无 board task_id/attempt_id（n/a），按 AGENTS.md §6 以「文件落盘 + `agent_teams_send_message(to=captain)`」交付，未伪称 claim/update_task，未自建 task。
