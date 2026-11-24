# iteration-52 · 第 52 轮 S8 度量报告（W4 补派 · 考功郎中@v17）

| 项 | 值 |
| --- | --- |
| 令牌 / 对应卡 | TK-53-01 · `docs/squad/dispatch/考功郎中.md:29-37` |
| 阶段 / 席位 | S8 记注与度量 · ROSTER-16.md:59「W4 = S8 复盘+门禁」· 本席在册（该行名册含考功） |
| 度量对象 | 第 52 轮收口态（`docs/squad/STATE.md:183`、`docs/squad/briefs/round-52.md`）；由第 53 轮 W4 补派产出，命名沿必产物路径 `iteration-52.md` |
| 生成时刻 | 2026-11-15T14:26–14:28Z（实测窗口；各脚本 `at` 字段见各节） |
| 数据口径 | 全部数值来自 `supervise.mjs` / `l4/maturity.mjs` / `seat-utilization.mjs` / `result-verify.mjs` 本轮实跑 stdout；趋势对照取落盘文件行，零自报零记忆。命令见 §七 |
| canary | `squad-toolkit/VERSION.md:4` canary:(空) → stable v2.8 口径，无 canary 标注义务 |
| 写域 | 仅本文件；未碰 src/、scripts/、gates/。实跑 supervise 的固有副作用见 §六 D-D |

## 一、五门（L4 项目绿判定子集）与七门（监督全集）

口径辨析：派活所称「五门」= `packages/dsh-quanneng-squad/scripts/l4/facts.mjs:54` 的 `seat-utilization / audit-roster / reflow-check / stage-order / drift-check`，是 `projectGreenNow`（`facts.mjs:61`）的判定子集；`supervise.mjs:12` 报的是加入 P10 三件套后的七门（另含 `dispatch-guard` / `lead-scope-check`）。两处本轮实跑均全 0。

```
命令：node packages/dsh-quanneng-squad/scripts/supervise.mjs   # exit 0，at=2026-11-15T14:27:05.244Z
gates: seat-utilization=0 audit-roster=0 reflow-check=0 stage-order=0
       drift-check=0 dispatch-guard=0 lead-scope-check=0
resultVerify: { "exit": 0, "gaps": [] }
```

逐门口径：上表七门退出码取 `supervise.mjs:12` 内部 spawnSync 的结构化返回（脚本自身契约），本席另**独立实跑**的四门/一项为：`drift-check` problems=[] pointersAlive=128 deadPointers=0；`reflow-check` exit 0、gatePatterns=12、problems=[]、P11=4；`seat-utilization` exit 0（§四）；`verify.mjs` 54 passed 0 failed（`verify.mjs:46` D8 断言在内）。`audit-roster` / `stage-order` / `dispatch-guard` / `lead-scope-check` 四门本席未逐一单独 spawn，取 supervise 内取值，如实标注不冒充独立实跑。落盘后复跑 drift/reflow/seat 三脚本仍 exit 0、problems=[]。**五门/七门连续三轮全 0，无回归。**

## 二、监督（supervise.mjs 实跑全字段）

| 字段 | 实跑值 | 说明 |
| --- | --- | --- |
| `at` | 2026-11-15T14:27:05.244Z | 本轮实跑时刻 |
| `java.verdict` | `green` | `failures=[]`、`reports=13`、`staleIgnored=0`、`batchFallback=false`（`supervise.mjs:41-55` 批次众数判据生效） |
| `freshness` | `pulseHours=0, briefHours=0` | 与 `TEAM-PULSE.md:3` 生成 14:26:45Z 同批刷新 |
| `l4` | 12 条提案全 `codified` | P-001/002/003/004/005/006/007/008/009/010/011/012 |
| `inFlight` | 3 票 | TK-53-03(给事中) / TK-53-01(考功郎中) / TK-53-02(起居注官)，均「在途（running 宽限）」= W4 首批，`briefs/round-53.md:13` |
| `expectedProbes` | 2 条 | auditNoSourceReturns501 / reconTickSurfacesRealSchedulerTick（探针红与真回归红分报，`supervise.mjs:66-68`） |
| `attention` | 4 条 | 席位滚动覆盖偏低 5/16 + 三条在途；**无门红、无 Java 真回归红、无脉搏过期** |

唯一实质 attention = 席位滚动覆盖（`supervise.mjs:70` 阈值 <8 触发），见 §四。

## 三、成熟度（l4/maturity.mjs 实跑 · 含瞬态留痕）

两次实跑，按 C5/P8 如实并列，不掩盖首跑红、不误判稳定红：

| 运行 | 时刻 | passed | reached | M11 / greenLevel | exit |
| --- | --- | --- | --- | --- | --- |
| 首跑（与 §五批量并发同批） | 14:26:42.370Z | **10/11** | false | M11=false · `greenLevel=red` · `pluginTests=1` | **1** |
| 串行复跑 | 14:27:40.367Z | **11/11** | true | M11=true · `greenLevel=hard-green` · `pluginTests=0` · stderr `[L4 到达] 全部 11 项判据通过` | **0** |

根因（只读定位，未改任何脚本）：`facts.mjs:58` 用 spawnSync 跑 `run-tests.mjs`，`facts.mjs:65` 把 `tests.status` 记为 `pluginTests`；`facts.mjs:61-63` 据此定 `projectGreenNow` / `greenLevel`。首跑该子进程取到 status=1 → M11 红；**独立实跑 `run-tests.mjs` 为 46/46、fail 0、skipped 0，`verify.mjs` 54/54，串行复跑 maturity 11/11** → 判定为并发批次瞬态，非代码回归。交叉印证：`docs/squad/TEAM-PULSE.md:16` 于 14:26:45Z（首跑同刻）亦记「L4 maturity 10/11」，与本席首跑一致；该类瞬态在 `briefs/round-47.md:64`、`briefs/round-52.md:19` 已有先例（复跑后绿）。

11 项判据 evidence（复跑 stdout 原样）：M1 `files=5/5 syntax=true fixture=26/26`；M2 `baseline.javaTests=58 surefire=78 factsHardcoded=false`；M3 `layers=true refuseConst=true greenBound=true runPassesGreen=true`；M4 `fuseImpl=true toyFuse=true fuseHistory=true`；M5 `codified=12 bodyMissing=none`；M6 `factsHasExemptionAwareness=true`；M7 `maxRound=53 stuckAtProposal=none handBrushed=none recentHistory=12`；M8 `rendered=true proposals=12`；M9 `greflowPatterns=12 queuedMissing=none`；M10 `fakeGreen=none`；M11 `activeExemptions=none` + 五门全 0 + resultVerify=0 + pluginTests=0。

## 四、席位滚动面（seat-utilization.mjs 实跑）

```
命令：node packages/dsh-quanneng-squad/scripts/seat-utilization.mjs   # exit 0
{"seats":16,"utilized":16,"idleCount":0,"idle":[],
 "rolling":{"window":5,"maxRound":53,"activeSeats":5,"coverage":"5/16",
 "idleSeats":["采风官","翰林学士","需求经理","产品经理","架构经理","前端经理",
              "测试经理","御史大夫","运维经理","交付发布经理","太傅"]}}
```

- **累计工位面**：16/16 席有必产物工件，`idleCount=0`（逐席 artifacts：集贤学士 22、后端经理 69、御史大夫 12、架构经理 8、给事中 6、测试经理 3、起居注官 2、考功郎中 1…）。口径 = `seat-utilization.mjs:51` 按文件名模式计数。
- **滚动动用面**：`WINDOW=5`（`seat-utilization.mjs:56`）、`maxRound=53`、`activeSeats=5/16`、闲置 11 席（`seat-utilization.mjs:65,74`）；`supervise.mjs` 实跑 `seatRolling` 同值 `5/16`，两脚本一致。
- 两指标背离（累计 16/16 vs 滚动 5/16）即 `briefs/round-53.md:18` 所记 A5「16 席有产出 ≠ 本轮被驱动」，为真实暴露而非误报。
- **落盘后复核（同席 append，不改写采集时点值，沿 `iteration-21.md:174-193` §八 先例）**：本报告落盘后复跑 `seat-utilization.mjs` 仍 exit 0、`utilized=16 idleCount=0`、rolling 仍 `5/16`；唯一变化 = `考功郎中 artifacts 1→2`（本文件 `docs/squad/metrics/iteration-52.md` 命中 `seat-utilization.mjs:26` 的 `/\.md$/`，即本席必产物清零后的自增）。§四采集时点的 1 与此处 2 均为实测，差异可指认，不回溯改写。

## 五、双端 parity（result-verify.mjs 实跑）

```
命令：node packages/dsh-quanneng-squad/scripts/result-verify.mjs   # exit 0
{"checked":25,"gaps":0,"gapItems":[],
 "rows":[ ... 5 × {"item":"parity:*","inSpec":true,"inV1":true,"inContract":true,"impl":true} ... ]}
```

5 条 parity 全 `impl=true`（`result-verify.mjs:54-59` 定义、`:62` 双侧 Java+Node 正则同时命中）：`parity:claim 在途占位` / `parity:验签失败释放键` / `parity:COMM_FAILURE 落缓存` / `parity:UNKNOWN 不自动重发` / `parity:验签先于业务`。另 `compliance:K1~K4` 全 `inContract=true, inImpl=true`（含 K1 证书并行，已由 TK-47-02 闭合，见 `briefs/round-47.md:76-81`）。`verify.mjs:46` 的「>=5 条双端 parity 行」断言本轮实跑 PASS。

## 六、趋势（round-51 → 52 → 53，每条附落盘行或实跑）

| 指标 | round-51 | round-52 | 本轮实跑（W4 / round-53） | 来源 |
| --- | --- | --- | --- | --- |
| 七门 | 全 0 | 全 0 | 全 0 | `briefs/round-51.md:26` / `briefs/round-52.md:28` / §一 supervise |
| verify | 52/52 | 54/54 | **54 passed 0 failed** | `briefs/round-51.md:26` / `STATE.md:183` / `verify.mjs` 实跑 |
| release 链 | 23 步 | 24 步 | 24 步 | `briefs/round-51.md:26` / `briefs/round-52.md:24` / `TEAM-PULSE.md:15` |
| maturity | 11/11 | 11/11 | 10/11→**11/11**（瞬态→稳定） | `briefs/round-51.md:27` / `briefs/round-52.md:27` / §三两次实跑 |
| result-verify | 20 项 | 25 项（+5 parity） | **25 项 0 缺口 / 5 parity 全 true** | `briefs/round-52.md:13,25` / `STATE.md:183` / §五 |
| 双端 parity 条数 | 0 | 5（D8 新增） | 5/5 `impl=true` | `briefs/round-52.md:13` / `result-verify.mjs:54-59` |
| 滚动覆盖 | 4/16 | 1/16（窗口滑动） | **5/16**（W4 补派重算） | `briefs/round-51.md:11` / `briefs/round-53.md:18` / §四、`TEAM-PULSE.md:21` |
| java | green | green | green / reports=13 / staleIgnored=0 | `briefs/round-52.md:28` / §二 supervise |
| L4 提案池 | 5 codified + 6 rollout | 11/11 到达 | 12 全 codified | `briefs/round-49.md:29` / `briefs/round-52.md:27` / §二 `l4` |

**趋势判读**：① 稳态项（七门 / verify / java / result-verify）连续三轮零回归；② 容量单调增长（verify 52→54 加 D6/D8/L4 断言、result-verify 20→25 加 5 条 parity、release 23→24 步加 memory-sla、L4 12/12 codified）；③ 波动项两位——maturity M11（并发瞬态，§三）与滚动覆盖 4→1→5（`WINDOW=5` 窗口语义，`briefs/round-53.md:18` 已判「指标本身正确，旧卡过期」），**均非代码回归**；④ 唯一未闭合 attention = 滚动 5/16，W4 余 5 席待补派（`briefs/round-53.md:41`）。

### 口径发现（本席只报不改，交指挥裁决）

| # | 发现 | 证据 | 影响 |
| --- | --- | --- | --- |
| D-A | 「五门」与「七门」在不同文档混用 | `facts.mjs:54` 五门为 L4 判定子集；`supervise.mjs:12` 七门为 P10 扩展全集；`briefs/round-52.md:28` 写「七门全 0」，本派活写「五门」 | 数值都真、口径不同，建议文档统一标注集合名 |
| D-B | maturity 首跑 10/11 为并发批次瞬态 | §三两次实跑 + `TEAM-PULSE.md:16` 同刻 10/11 + `run-tests.mjs` 46/46 独立绿 | 收口终验应串行复跑；与 `briefs/round-47.md:64` / `briefs/round-52.md:19` 既有处置一致 |
| D-C | iteration-52 命名 vs 第 53 轮派活 | `ROSTER-16.md:59` W4 名册、`briefs/round-53.md:13` 补派记录 | 非冲突：度量对象为 52 轮收口态，产出在 W4 轮次 |
| D-D | 实跑 supervise 刷新 `docs/squad/SUPERVISION.json` | `supervise.mjs:72` writeFileSync 为脚本固有契约；AGENTS §4 定义其为每轮治理动作 | 验收命令固有副作用，本席未手工编辑治理文件；写域仍仅本文件 |

## 七、可复算命令清单（本轮逐条实跑，Windows 单命令）

```bash
node packages/dsh-quanneng-squad/scripts/supervise.mjs            # exit 0 · §一/§二 七门+监督
node packages/dsh-quanneng-squad/scripts/seat-utilization.mjs     # exit 0 · §四 16/16 + rolling 5/16
node packages/dsh-quanneng-squad/scripts/l4/maturity.mjs          # 串行复跑 exit 0 · §三 11/11
node packages/dsh-quanneng-squad/scripts/result-verify.mjs        # exit 0 · §五 25 项 0 缺口
node packages/dsh-quanneng-squad/scripts/run-tests.mjs            # exit 0 · §三 46/46（pluginTests 根因旁证）
node packages/dsh-quanneng-squad/scripts/verify.mjs               # exit 0 · 54 passed 0 failed
node packages/dsh-quanneng-squad/scripts/drift-check.mjs          # exit 0 · problems=[]
node packages/dsh-quanneng-squad/scripts/reflow-check.mjs         # exit 0 · 12 模式 0 问题
```

## 八、结论

第 52 轮 S8 收口态在 W4 复核下成立：五门/七门全 0、verify 54/54、result-verify 25 项 0 缺口（5 条双端 parity 全绿）、java green、L4 串行复跑 11/11 hard-green、累计工位 16/16。**三个须带走的数**：滚动动用面 5/16（唯一 attention，补派未完成）、maturity 首跑 10/11 的并发瞬态（须串行终验，不可凭单次红判回归、也不可凭简报 11/11 掩盖首跑红）、verify/result-verify 的容量增长 52→54 / 20→25（D6/D8 反哺已机器化）。按 C5，本席不以任何文档声明替代上列实跑输出。
