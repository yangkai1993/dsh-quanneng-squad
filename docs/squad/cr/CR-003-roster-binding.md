# 变更请求 CR-003-roster-binding · 轮次绑定规则入册（S8 架构侧复盘）

> 命名说明：本票为「轮次绑定规则」专项，与既存 `CR-003-java-crypto-params.md`（Java 国密参数缺陷）
> 是两张不同 CR，`docs/squad/cr/` 下按文件名区分；本票不改前者一字。

| 项 | 值 |
| --- | --- |
| CR 号 | CR-003-roster-binding |
| 派活令牌 | TK-55-03（回报首行必含；无令牌不验收） |
| 提出人 / 日期 | 架构经理@v17 承办 / 2026-11-15 |
| 阶段 | S8 架构侧复盘（W4） |
| squadRole | `docs/squad/prompts/sys-architect-v2.md`（INDEX 主表现行版指针） |
| 影响面 | `docs/squad/ROSTER-16.md` §七（追加小节）；本 CR 文件；`docs/squad/briefs/round-54.md` 已记修正过程；`packages/dsh-quanneng-squad/scripts/squadctl.mjs` 的 roster 子命令为既有实现（只读对齐，不改） |
| 类型 | 治理文档 / 轮次名册口径（宪法 C10 文档变更走 CR） |
| 当前 → 目标 | §七 只有 W1~W4 名册、**无可成文的绑定规则**，`round-N→W` 靠指挥记忆判定 → §七 追加「轮次绑定规则」小节，与 `squadctl roster` 同一口径 |
| 写域 | 仅 `docs/squad/ROSTER-16.md`、`docs/squad/cr/CR-003-roster-binding.md`（dispatch/架构经理.md:37 登记） |
| 约束 | 不碰 `src/`、`scripts/`、`gates/`（治理域属指挥）；只读复核 + 本域产出 |

## 一、变更内容

在 `docs/squad/ROSTER-16.md` §七（`:52` 起，W1~W4 表 `:56-59`，别名说明 `:61`）**追加**
「### 轮次绑定规则」小节，不改 W1~W4 表任何一行。规则两条，按优先级二选一（P9：禁止跨基准合并）：

1. **最近简报明确记载优先**：取 `maxRound`（briefs 最大编号），按文件名倒序遍历 `round-N.md`，
   取第一篇正文明确写出某 W 轮次的简报，以其明示 W 为 `current`、`basis=简报明确记载`、
   `statedIn=该简报`。**明确记载覆盖取模推定**。
2. **无记载按 4 轮推定**：全部简报都无明确 W 记载时，`basis=无记载·按4轮推定`、
   `statedIn` 为空，`current` 取 W1~W4 表 0-based 下标 `((maxRound-1)%4+4)%4`（W1↔0…W4↔3）。
   兜底推定不是绑定真源；后续简报一出现明确记载即回到第 1 级。

## 二、理由与证据（结论附 file:line）

| # | 事实 | 证据（file:line / 命令输出） |
| --- | --- | --- |
| 1 | 旧口径自造 `(N-1)%4` 与简报明示冲突 | `docs/squad/briefs/round-54.md:12`：上一版 `squadctl roster` 由 `(N-1)%4` 得 W1，与 round-53 明示 W4 冲突；`round-54.md:18` 判「绑定规则从未落盘，靠指挥记忆判定 → 应写进 ROSTER-16 §七 作为真源」 |
| 2 | 现行脚本已实现同一口径（只读对齐，不改脚本） | `packages/dsh-quanneng-squad/scripts/squadctl.mjs:50-51` 注释「简报明确记载优先 / 无记载才按 4 轮推定并标 basis=inferred」；`:53-58` 倒序遍历取 stated；`:59` `stated ? rows.findIndex(...) : (((max-1)%4+4)%4)`；`:61-63` 输出 basis/statedIn/current/note |
| 3 | 最近明确记载 = round-53 的 W4 | `docs/squad/briefs/round-53.md:13`「按 W4（S8 复盘+门禁）在席 8 角色」；`round-54.md`、`round-55.md` 未再明确记载 W（实读正文 + squadctl.mjs:56 正则比对） |
| 4 | 取模分支确实会与之相反 | 实跑 `maxRound=55`，`(55-1)%4=2` → 表下标 2 = **W3**；明示为 **W4**。二者不同，证明优先级不可合并（P9） |
| 5 | §七 是派活轮次名册的既有真源 | `AGENTS.md` §6 v2.13「每轮按 docs/squad/ROSTER-16.md §七 轮次名册上场，≤8 席」；`ROSTER-16.md:52` 章标题、`：56-59` 四行表、`：61` 别名说明 |
| 6 | 本票属宪法 C10 文档变更 | `docs/squad/CONSTITUTION.md` C10（文档变更走 CR，架构经理会签）；`docs/squad/pipeline/DESIGN-PRINCIPLES.md:30` 同款条款 |

## 三、影响面分析

| 资产 | 影响 | 需同步 |
| --- | --- | --- |
| `docs/squad/ROSTER-16.md` §七 | 追加 `### 轮次绑定规则` 小节；W1~W4 表 `:56-59` 与别名行 `:61` 逐字未动 | 本票（已完成） |
| `docs/squad/cr/CR-003-roster-binding.md` | 新建本 CR | 本票（已完成） |
| `squadctl.mjs` roster 子命令 | 既有实现即本规则；规则成文后脚本成为其机器实现 | 属指挥写域，本票不触碰；若后续改口径按本小节真源同步 |
| `docs/squad/briefs/round-54.md` / `:55` | 已记录修正过程与派活登记 | 无需改动 |
| `docs/squad/dispatch/架构经理.md` | `:34-38` 登记 TK-55-03 写域与在途状态 | 闭合状态由 captain 更新（指挥写域），本票不碰 |
| `src/`、`scripts/`、`gates/`、`docs/squad/pipeline/DESIGN-PRINCIPLES.md` | 零改动 | 只读复核 |

## 四、复核结论：DESIGN-PRINCIPLES.md 会签后结构无漂移

派活要求「复核 DESIGN-PRINCIPLES.md 会签后结构无漂移」。实读 + 双侧字节比对（只读，未改）：

| 检查项 | 结果 | 证据（file:line） |
| --- | --- | --- |
| 会签记录存在且完整 | ✅ | `docs/squad/pipeline/DESIGN-PRINCIPLES.md:32` `## 会签记录`；`:34-41` 会签表六行（会签人/日期/令牌 TK-47-04/会签对象/会签确认/写域）齐备 |
| 技术正文未被会签改写 | ✅ | `:40` 明示「第 1~30 行逐字未动，未改脚本/门禁/AGENTS」；实读 `:1-30` 为 §1/§2/§3 三段技术正文，`:30` 仍为「4. 本文件变更走 CR（宪法 C10），由架构经理会签」，`:31` 空行，`:32` 紧接会签记录 |
| 三章结构 + P11 清单齐全 | ✅ | §1 `:6` / §2 `:16` / §3 `:25`；`### v1.0 与 G-REFLOW P11 一致性逐条核验清单` `:43`；`:47-52` 六行核验结论全为「一致」；`:54` 核验方式行 |
| 会签依据可指认 | ✅ | `:40` 声明「P11 检查项 ↔ 本文件 §N:行号 双向锚点」；逐行比对 `docs/squad/gates/G-REFLOW.md:19` P11 四项（gate-kit / §10 K1~K4 / DESIGN-PRINCIPLES 版本化 / 改前改后等价验证）与清单 6 行一致 |
| 主文档 ↔ 插件资产副本字节一致 | ✅ | SHA-256 双侧同为 `7a265caa8885a1ca028b4a3fb70b27291bb8a55c5afac58e1d587f6127571ee7`；各 6574 字节 / 56 行（副本：`packages/dsh-quanneng-squad/assets/workspace/docs/squad/pipeline/DESIGN-PRINCIPLES.md`） |
| 会签写域声明与 AGENTS 一致 | ✅ | `:41` 声明仅本文件、pipeline/ 属测试经理/考功郎中写域；对表 `AGENTS.md` §1 第 8 行 |

**判据**：会签追加段落未移动/改写 §1~§3 技术正文，未引入死指针、未改章节序、双侧副本一致 →
结构无漂移、技术结论未改。本票不修改该文件（其写域属考功郎中，不属架构经理）。

## 五、批准链（缺一无效）

1. 架构经理承办 / 会签：✅ 本票（架构经理@v17，S8 复盘，TK-55-03）。
2. 给事中封驳审核：留待 captain 按流程投递（本票不代封驳、不越写域）。
3. 御史大夫安全预审：留待 captain 按流程投递。
4. 总指挥批准：以 captain 对 TK-55-03 的验收为准（dispatch 卡 `:38` 状态由指挥更新）。
5. 交付发布经理归档 + CHANGELOG + 版本 +1：留待 captain 排期（不在本票写域）。

> 说明：2~5 为流程性步骤，属指挥/对应席位写域；本票只产出架构侧 CR 与 §七 追加，
> 不代替会签/封驳/归档，也不写「已批准」。

## 六、变更召回

approved 后由交付发布经理发起召回；逾期未完成由起居注官在 doc-freshness 台账将相关故事卡标「冻结」。
若后续 `squadctl roster` 判定与本小节不一致，以本小节为真源修正脚本（指挥写域），并另开 CR 留痕。

## 七、验收实跑输出（本票落盘后，captain 复跑同命令可复现）

```
$ node packages/dsh-quanneng-squad/scripts/squadctl.mjs roster
{ "maxRound": 55, "rotation": ["W1","W2","W3","W4"],
  "basis": "简报明确记载", "statedIn": "round-53.md",
  "current": { "round": "W4", "stage": "S8 复盘 + 门禁",
               "seats": ["考功","起居注","给事中","御史","交付","需求","产品","架构"] },
  "note": "按 ROSTER-16 §七轮次名册推荐当前上场 8 席；补派须受 C2 并发<=3 约束" }   # exit 0

$ node packages/dsh-quanneng-squad/scripts/drift-check.mjs
{ "gate": "drift-check", "pointersAlive": 128, "deadPointers": 0,
  "staleClaims": 0, "intelOldestDays": 4, "intelFreshLimit": 7,
  "problems": [], "truncated": false }                                          # exit 0

$ node packages/dsh-quanneng-squad/scripts/reflow-check.mjs
{ "gate": "reflow-check", "ok": true, "gateFailure": null,
  "gatePatterns": 12, "problems": [],
  "coverage": {"P1":11,"P2":2,"P3":5,"P4":2,"P5":2,"P6":15,"P7":2,
               "P8":6,"P9":6,"P10":4,"P11":4,"P12":2} }                    # exit 0
```

> 三条命令的改前基线（本票落盘前独立实跑）与改后终验输出逐字段一致：
> roster 同为 `basis=简报明确记载 / statedIn=round-53.md / current=W4`；
> drift 同为 deadPointers=0/staleClaims=0/problems=[]；reflow 同为 ok=true/12 模式/problems=[]。
> 追加小节只含 `###`/正文/一行 4 列表格（表头为「情形」非 W1~W4），
> 不命中 `squadctl.mjs:48` 的 `^\|\s*(W\d)` 名册正则，故 `rotation` 仍恰为 4 轮。
