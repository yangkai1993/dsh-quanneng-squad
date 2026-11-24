# iteration-21 · 本迭代席位度量报告（S8 · 考功郎中@v14）

| 项 | 值 |
| --- | --- |
| 对应卡 | docs/squad/pipeline/P-004-decomposition.md:157（T15 · 考功郎中 · 席位利用率度量） |
| 阶段 / 席位 | S8 记注与度量 / 考功郎中@v14（正式派活自证，非指挥代落） |
| 生成时刻 | 2026-11-11 15:01–15:05Z 窗口内实测 |
| 数据口径 | 全部数字来自脚本输出或文件实读；零自报、零记忆。复算命令见 §六 |

## 一、席位利用率（seat-utilization.mjs 实测输出）

核查脚本实际路径：**packages/dsh-quanneng-squad/scripts/seat-utilization.mjs**。
FUNCTION-LEDGER.md:4 与 DELIVERY-PIPELINE.md:6 写的是 `scripts/seat-utilization.mjs`，仓库根**无 scripts/ 目录**（实测 ENOENT）——口径指针已过期，见 §五 D-2。

### M1 本轮现状（cut=null）

```
workspace=E:/workspace/trade-in  seats=16  utilized=13  idleCount=3
idle = 前端经理 @ S4 可用性评审 | 交付发布经理 @ S7 发布验证 | 考功郎中 @ S8 度量
```
逐席 artifacts 表（脚本 rows[] 原样引用；采集时点 06:59–07:05Z）：

| # | 席位 | 阶段 | artifacts |
| --- | --- | --- | --- |
| 1 | 采风官 | S-1 情报对标 | 1 |
| 2 | 集贤学士 | S1 提示词优化 | 8 |
| 3 | 翰林学士 | S1 任务拆分 | 1 |
| 4 | 需求经理 | S0 需求澄清 | 2 |
| 5 | 产品经理 | S0 PRD | 1 |
| 6 | 架构经理 | S2 架构契约 | 7 |
| 7 | 给事中 | S3 门下封驳 | 2 |
| 8 | 后端经理 | S4 后端实现 | 37 |
| 9 | 前端经理 | S4 可用性评审 | **0 ← 闲置** |
| 10 | 测试经理 | S5 质量验证 | 2 |
| 11 | 御史大夫 | S6 监察抽巡 | 10 |
| 12 | 运维经理 | S7 部署回滚 | 1 |
| 13 | 交付发布经理 | S7 发布验证 | **0 ← 闲置** |
| 14 | 起居注官 | S8 记注 | 2 |
| 15 | 考功郎中 | S8 度量 | **0 ← 闲置（本卡清零，见 §八）** |
| 16 | 太傅 | S9 反馈优化 | 1 |

原样 JSON（rows[] 节选，同次运行 stdout）：
```json
{"seats":16,"utilized":13,"idleCount":3,
 "idle":["前端经理 @ S4 可用性评审","交付发布经理 @ S7 发布验证","考功郎中 @ S8 度量"],
 "rows":[{"seat":"采风官","artifacts":1},{"seat":"集贤学士","artifacts":8},{"seat":"翰林学士","artifacts":1},
  {"seat":"需求经理","artifacts":2},{"seat":"产品经理","artifacts":1},{"seat":"架构经理","artifacts":7},
  {"seat":"给事中","artifacts":2},{"seat":"后端经理","artifacts":37},{"seat":"前端经理","artifacts":0},
  {"seat":"测试经理","artifacts":2},{"seat":"御史大夫","artifacts":10},{"seat":"运维经理","artifacts":1},
  {"seat":"交付发布经理","artifacts":0},{"seat":"起居注官","artifacts":2},{"seat":"考功郎中","artifacts":0},
  {"seat":"太傅","artifacts":1}]}
```
来源命令：`node packages/dsh-quanneng-squad/scripts/seat-utilization.mjs`（exit 0）
利用率 = 13/16 = **81.25%**
> 采集时点：本表数据取自 06:59–07:05Z 窗口；**落盘后同席复跑已变为 utilized=15 / idleCount=1**，差异全部来自并发席位的写入，见 §八。正文按采集时点保留原值，不做回溯改写。

### M2 「6 → 5」变化过程与原因（mtime 回溯复算，非记忆）

脚本只按文件名匹配、不看时间，因此用 mtime 截断复刻同一 SEATS 表（seat-utilization.mjs:9-25 规则逐条照搬）得到曲线。原始 6 席记录见 STATE.md:81「实测 16 席中 6 席必产物为 0」与 P-004-decomposition.md:9 同一名单。

| 步 | 时点(UTC) | utilized | idle | 闲置名单 | 触发事件（来源） |
| --- | --- | --- | --- | --- | --- |
| 基线 | 06:54:23 | 10 | **6** | 采风官/集贤学士/翰林学士/前端经理/交付发布经理/考功郎中 | STATE.md:81 首批 C2 派活 3 席 |
| ① | 06:58:30 | 11 | **5** | 采风官/集贤学士/前端经理/交付发布经理/考功郎中 | 翰林学士落盘 docs/squad/pipeline/P-004-decomposition.md（mtime 06:58:30Z，命中脚本 :12 /decomposition.*\.md$/） |
| ② | 06:59:16 | 12 | 4 | 集贤学士/前端经理/交付发布经理/考功郎中 | 采风官落盘 docs/squad/intel/SN26-约束清单-2026-11-11.md（mtime 06:59:16Z，:10 /\.md$/） |
| ③ | 06:59:58 | 13 | 3 | 前端经理/交付发布经理/考功郎中 | 集贤学士落盘 docs/squad/prompts/*.md 7 份 + INDEX.md（mtime 06:59:58Z，:11 /\.md$/） |
| ④ | 本报告 | 14 | 2 | 前端经理/交付发布经理 | 考功郎中落盘 docs/squad/metrics/iteration-21.md |

**6→5 的原因**：三席首批派活中**翰林学士最先回写文件**，其 P-004-decomposition.md 恰好命中脚本第 12 行的 decomposition 文件名模式，故闲置由 6 递减为 5；随后两席在 88 秒内相继落盘，闲置递减到 3。
→ 变化不是「席位被激活」造成的（16 席早已 16/16 ok/running，COMPLETION-AUDIT.md:31），而是**必产物真的落盘**造成的。这与 STATE.md:72/75 确立的「激活≠驱动」一致。

### M3 三席仍未清零的归因

| 席位 | 模式（脚本行） | 实读结果 | 归因 |
| --- | --- | --- | --- |
| 前端经理 | :18 docs/squad/reviews/ usability-*.md | 目录**不存在**（ENOENT） | 工序已重定义（FUNCTION-LEDGER.md:16「本项目无前端交付，故重定义」），但落点目录从未创建；P-004:38 已自认「T24 脚本口径与 T23 台账不一致 → 假绿或假红」尚未闭合 |
| 交付发布经理 | :22 docs/squad/releases/ release-*.md | 目录**不存在**；CHANGELOG.md 在仓库根存在 | 必产物落点与脚本模式分处两地（FUNCTION-LEDGER.md:20 写 CHANGELOG，脚本查 releases/）——台账/脚本口径冲突 |
| 考功郎中 | :24 docs/squad/metrics/*.md | 目录本席本轮 mkdir 前不存在 | 本卡即为清零动作 |

## 二、各阶段产物计数（目录实数，全部 existsSync 实测）

| 阶段 | 目录 | 文件数 | 明细指针 |
| --- | --- | --- | --- |
| S-1 intel | docs/squad/intel/ | 1 | SN26-约束清单-2026-11-11.md |
| S1 prompts | docs/squad/prompts/ | 8 | INDEX.md + 7 份 *-v1.md（INDEX 为目录索引，非优化稿 → **有效稿 7**） |
| S1 decomposition | docs/squad/pipeline/ | 4 | P-004-decomposition.md（命中）；DELIVERY-PIPELINE.md / P-002-demand-gate.md / PIPELINE.md 不命中 |
| S2 arch | docs/arch/ | 7 | ADR-001 / ADR-002 / api-contract / biz-arch / data-arch / sys-arch / LEGACY-NODE-ARCHIVE（ADR-001 已被 ADR-002 推翻，STATE.md:30） |
| S3 gates | docs/squad/gates/ | 2 | G-S2.md / G-S6.md；**G-S7 缺**（STATE.md:13 门索引列为「待用户确认发布清单」） |
| S6 audit | docs/squad/audit/ | 10 | COMPLETION-AUDIT / DEMAND-PIPELINE-ACCEPTANCE / HYBRID-VALIDATION / PIPELINE-CHECK / RETEST-INTERACTION-6 / ROOT-CAUSE / ROTATION-DRILL / SELF-CORRECTION / doc-freshness / probe-spawn-inbox-archive |
| S5 qa | docs/qa/ | 2 | patrol-CR002.md / patrol-SN26-001.md |
| S7 releases | docs/squad/releases/ | **0（目录不存在）** | 交付发布经理闲置根因，见 M3 |
| S8 metrics | docs/squad/metrics/ | 本卡新建 | 即本报告 |
| S8 journal | docs/squad/journal/ | 2 | 2026-11-06.md / YYYY-MM-DD.md（后者为模板件 → **有效记注 1**） |
| S4 后端 | gateway-java/src + src | 37 | = 17 个 .java + 20 个 .js；其中 src/ 的 20 个属 Node 旧栈归档件（STATE.md:30「旧 Node 实现保留归档」）→ **现役有效 17**，含 3 个测试类 |
| S0 prd | docs/prd/ | 3 | PRD-sn26-gateway / clarifications-SN26 / clarifications-SN26-A4-decision |
| S7 deploy | deploy/ | 1 | runbook.md |
| S9 retro | docs/squad/retro-*.md | 1 | retro-v1.0-pipeline.md |

计数合计口径提示：脚本按**文件名**判定，不看正文也不看文件性质，因此 14 席中有 **3 席的分母含非交付件**（prompts 的 INDEX.md、journal 的模板件、src/ 的归档 .js）。真实交付密度低于表观 artifacts 数。

## 三、M5 返工率线索（全部给文件:行，不含自报）

| # | 事件 | 类型 | 来源指针 |
| --- | --- | --- | --- |
| 1 | 御史抽巡判 Java 端审计脱敏「零接线·不符合」，触发 6 条整改 | 打回 | docs/squad/audit/SELF-CORRECTION.md:5；同判读 audit/HYBRID-VALIDATION.md:25 |
| 2 | W3 三成员派活后 gateway-java/src 13 文件零变化 → 指挥改 Lead-Core 亲自实现 | 自纠正（通道返工） | SELF-CORRECTION.md:8；HYBRID-VALIDATION.md:26 |
| 3 | mvn 编译失败（SecurityRemediationTest:58 throws） | 代码返工 | SELF-CORRECTION.md:9 |
| 4 | application.yml 重复 crypto 键致 3 用例失败 | 代码返工 | SELF-CORRECTION.md:10 |
| 5 | ADR-001 技术栈被用户推翻，改 Java 基线 | 架构返工 | docs/squad/STATE.md:30 |
| 6 | 全流程删除重跑（第九轮） | 流程返工 | STATE.md:36 |
| 7 | 「累计上限」表述被四轮实测推翻，席位模型重定义 | 机制返工 | STATE.md:39 |
| 8 | 「重启即可恢复」结论被实测推翻 | 结论返工 | audit/RETEST-INTERACTION-6.md:21 与 :43 |
| 9 | 三次字符串替换打补丁**各引入一次回归**（cmd TDZ / 相对路径 / exit1 零警告） | 补丁返工 ×3 | STATE.md:78 |
| 10 | 门禁默认分支 skipped/exit 0 造成 profile 副本从不校验 | 假绿返工 | STATE.md:78 |
| 11 | seat-utilization 初版按正文匹配造成**假绿**，改为文件名匹配 | 度量假绿纠正 | STATE.md:81 |
| 12 | 「11 席绑 buddy/hy4free 系 profile 继承」归因被 D-019R 推翻 | 归因返工 | docs/squad/memory/DECISIONS.md:26（末列「此前…错误归因」） |

- **返工事件 = 12 次**（上表逐条可指认；#9 计 3 次则 14）。
- 分母：STATE.md:26-81 全局段记注轮次 = **21 轮**（第六轮→第二十一轮，含同轮双记注 3 处）。
- **返工率线索 ≈ 12/21 = 0.57 次/轮**；按 #9 展开则 14/21 = 0.67。
- 结构性线索：12 次中 **通道/度量/归因类返工 7 次（58%）** > 代码类 2 次 + 架构/流程类 3 次。即本迭代主要返工源不是代码，而是**「绿灯是否可信」**——SELF-CORRECTION.md:7 规定的四分类中，①专家包缺项/②任务书落点冲突/③席位别名 三类共 4 次，④代码缺陷 仅 2 次。

## 四、M4 六要素任务书覆盖率（16 张 dispatch 卡实读逐张统计）

判定脚本：正则匹配每卡的 阶段/目标/必产物/写域/验收/证据/失败路径 七行表项，并要求文件含「六要素任务书」节。

| 结果 | 数量 | 席位 |
| --- | --- | --- |
| 七项齐全且含六要素节 | **3 / 16 = 18.75%** | 采风官、集贤学士、翰林学士 |
| 仍为「待派任务（S0 后填充）」空模板 | 13 / 16 = 81.25% | 其余 13 席（含本席） |

指针样例：填满 docs/squad/dispatch/采风官.md:16-26、集贤学士.md:24、翰林学士.md:24；空模板 docs/squad/dispatch/考功郎中.md:11-12、前端经理.md:11-12、交付发布经理.md:11-12、后端经理.md、太傅.md、御史大夫.md、架构经理.md、测试经理.md、给事中.md、起居注官.md、运维经理.md、需求经理.md、产品经理.md。

对照组（同一口径实读）：P-004 卡集 26 张 **26/26 六要素全满**（P-004-decomposition.md:45-232，逐卡 目标/写域/验收标准/并发位次/失败路径/证据要求 齐全）。
→ **卡内六要素已制度化，席位侧 dispatch 卡仍未回填**：这正是 STATE.md:81 根因句「dispatch 卡全为空模板」的量化确认，且 21 轮后仍剩 13/16 未回填。

## 五、发现的口径缺陷（本席只报不改，交指挥裁决）

| # | 缺陷 | 影响 | 指针 |
| --- | --- | --- | --- |
| D-1 | FUNCTION-LEDGER.md:4 / DELIVERY-PIPELINE.md:6 指向 `scripts/seat-utilization.mjs`，实际在 packages/dsh-quanneng-squad/scripts/ | 按文档命令直跑必失败 | STATE.md:81 同样写 scripts/；journal/2026-11-06.md:49 亦写 scripts/ |
| D-2 | 前端经理 :18 与交付发布经理 :22 的匹配模式对应目录不存在，与 FUNCTION-LEDGER.md:16/:20 的重定义口径不一致 | 补齐后仍判闲置（P-004:38 自认未闭合） | M3 表 |
| D-3 | 判定只看文件名，INDEX.md/模板件/归档 .js 均计入分子 | 表观利用率高于真实交付密度 | §二 末提示 |
| D-4 | gates 缺 G-S7，deploy 仅 1 份 runbook | S7 出门门无落盘证据 | STATE.md:13 |

## 六、可复算命令清单

```bash
# M1 现状
node packages/dsh-quanneng-squad/scripts/seat-utilization.mjs            # exit 0, idleCount=3（本卡后=2）
QUANNENG_STRICT_SEATS=1 node packages/dsh-quanneng-squad/scripts/seat-utilization.mjs   # exit 1 + 闲置阻塞行
# 逐席分子分母复核
ls docs/squad/intel docs/squad/prompts docs/squad/pipeline docs/arch docs/squad/gates \
   docs/squad/audit docs/qa docs/squad/journal deploy docs/prd
ls docs/squad/releases docs/squad/reviews docs/squad/metrics            # 前三者本卡前 ENOENT
# 六要素覆盖率（16 张）
grep -c '六要素任务书' docs/squad/dispatch/*.md
grep -c '待派任务（S0 后填充）' docs/squad/dispatch/*.md
# 返工线索逐条定位
grep -n '不符合\|自纠正\|推翻\|假绿\|回归' docs/squad/STATE.md docs/squad/audit/SELF-CORRECTION.md docs/squad/audit/RETEST-INTERACTION-6.md
# M2 曲线复算（mtime 截断复刻 SEATS 表）
stat -c '%y %n' docs/squad/pipeline/P-004-decomposition.md docs/squad/intel/*.md docs/squad/prompts/*.md
```

## 七、结论（M6~M9 汇总 + 一句话）

- M6 有效交付密度：表观 13/16 席有件，扣除 INDEX/模板/归档件后 **≈12/16 = 75%**。
- M7 门覆盖：S-1..S8 已建 14 个产物目录中的 11 个，**3 个必产物目录从未存在**。
- M8 派活→产出转化：C2 首批 3 席 **3/3 落盘**（88 秒窗口内全部回写），转化即时且可核。
- M9 任务书覆盖：席位侧 3/16 vs 卡集 26/26 —— 制度在卡上，未落到席位。

**一句话结论：机制确实改变了席位闲置——但改变的是「有没有文件」，还不是「活是不是该席干的」。** 硬证据是 M2 那条曲线：派活前闲置 6 席、派活后 4 分钟内降到 3 席，每一次下降都能对应到一个具体文件的一次写入；而剩余 2 席至今为 0，原因不在成员不动手，在脚本模式与台账重定义互相矛盾（D-2）。所以「席位即工位」治理真实有效，但只对**口径已闭合**的席位有效；口径未闭合的席位，机制会持续把它记成闲置——这类闲置该记在门禁账上，不该记在席位账上。

## 八、落盘后实测复核（同席 append，不改写 §一~§七 的采集时点值）

写完本报告后复跑同一脚本，输出变化如下（全部为实测，非推断）：

| 运行 | 时刻(UTC) | utilized | idleCount | idle 名单 |
| --- | --- | --- | --- | --- |
| 本报告采集窗口 | 06:59–07:05 | 13 | 3 | 前端经理 / 交付发布经理 / 考功郎中 |
| 落盘后复跑（默认） | 07:07:20 | **15** | **1** | 前端经理 @ S4 可用性评审 |
| 落盘后复跑（STRICT） | 07:07:20 | 15 | 1 | exit 1，仍报「闲置席位视为迭代阻塞」 |

归因（逐条可指认）：
- **考功郎中 0 → 1**：本文件 docs/squad/metrics/iteration-21.md（脚本 :24 /\.md$/ 命中）——T15 出门条件「本席 artifacts ≥1」**实测通过**。
- **交付发布经理 0 → 1**：并发席位 T14 于 07:05:57Z 落盘 docs/squad/releases/release-1.4.1.md（9,680 B，脚本 :22 /^release-.*\.md$/ 命中）。
  → §一 M3 与 §五 D-2 中「releases/ 目录不存在」在 07:05Z 之后**已不成立**：目录已由该席自行创建。D-2 关于「CHANGELOG 与 releases/ 落点分裂」的口径缺陷仍然成立，但**「补齐后仍判闲置」的担忧在该席上已被证伪**（模式实际可用，缺的只是目录）。
- **前端经理仍为 0**：docs/squad/reviews/ 本刻实测仍不存在（ENOENT）。该席是 15:07Z 之后唯一闲置位，且**其清零不取决于成员动手，取决于 T23/T24 是否先创建目录并核对模式**——即 §五 D-2 未闭合项，与 P-004:38 自述一致。

对 §七 结论的量化修正（不推翻，只收窄）：
- 席位利用率 **13/16 → 15/16 = 93.75%**（本迭代内两次实测之间 +2 席，全部由「文件真落盘」驱动）。
- 剩余 1 席闲置属**门禁口径未闭合**，不属席位不干活。故 §七 那句结论的后半段获得直接实证：同一 40 分钟内，口径已闭合的 3 席全部自行清零，口径未闭合的 1 席至今为 0。
- 新增待指挥裁决项 D-5：T15 验收要求「两次运行输出（补齐前/补齐后）留档」——本 §八 即补齐后运行留档；补齐前运行 = §一 M1（06:59–07:05Z）。**P-004:163 的证据要求由本文件两处输出同时满足。**
