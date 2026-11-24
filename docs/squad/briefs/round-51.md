# 第 51 轮简报 · D5 / 夹具边界 / D10 推进

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户「下一步」：按上轮候选推进 D5（席位滚动窗口）、proposals 负向边界夹具、D10（CR 会签正式派发）；D6/D8 留下一批。

## 交付与验收

1. **D5**：`seat-utilization.mjs` 增 `rolling` 双指标（近 5 轮 dispatch 卡中有结构化令牌的席位 / 16），与原有「累计工件数」并列；中文轮次经 `cn2num` 归一。`supervise.mjs` 读取该指标并在覆盖偏低时写入 attention。实测 `activeSeats=4/16、闲置 12 席`——真实暴露 A5「16 席有产出 ≠ 本轮被驱动」，不是误报（实读各卡轮次：后端/测试停 47、考功 47、集贤 50）。
2. **夹具边界**：`toy-fixture.mjs` 增 5 条 `proposals.mjs` 契约检查（P3↔P-003 双向映射、P11↔P-011、未登记提案回退 G-REFLOW 行、缺输入工作区返回空池不崩），21→**26/26 全过**。
3. **D10**：TK-47-04 由「非投递登记」正式 wake 考功郎中@v17，`squadRole: e2e-engineer-v2.md`，写域仅 `pipeline/DESIGN-PRINCIPLES.md`，要求追加「## 会签记录」+ P11 一致性清单（不改技术结论，冲突即 hand_back）。在途。
4. **自检**：D5 首版 `WINDOW=3` 得 1/16 属口径过窄，改 5 轮；我一度误把中文轮次字符串直接 `Math.max` 得 NaN（实读中间值后确认 `cn2num` 转换本身正确，是判定窗口语义而非 bug）；attention 文案曾拼成 `4/124`，单点修正为 `4/16`。

## 发现的问题

- 全链/三件套终验必须用正确 argv 串行跑；本轮首查再次出现 `cjs/loader:1503` 是核验脚本把 `.mjs` 拼成 `.mjs.mjs`，非门故障（A11 不计入）。
- `maturity`/`supervise`/`audit-roster` 单独复跑均正常：11/11 `[L4 到达]`、七门全 0、名册未过期。

## 门禁变化

```
seat-utilization rolling 5 轮窗口·supervise 可见
toy-fixture 26/26
release 23 步 exit 0 · verify 52/52 · tests 46/46
maturity 11/11 · exemption=false · installed=true
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无（只改 scripts/seat-utilization.mjs、scripts/supervise.mjs、scripts/l4/toy-fixture.mjs、dispatch 卡、账本；未碰 src） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 抽验本段 exit 0 |

## 风险 / 下一步

1. TK-47-04 回报待收；到齐后验收会签段 + drift/reflow，D10 收口。
2. D6（OUTBOX 63 条 SLA + 本地最终权威声明）、D8（双端 parity 机器门）、D5 闲置 12 席按 ROSTER-16 轮次补派，为下一批。
3. 云端 Hindsight ECONNRESET 仍持续，本地 DECISIONS.jsonl 为权威。


## 第五十一轮补记 · TK-47-04 未回报（Correction）

- 终验脚本一度报 `tk4704InInbox=true`，实读 captain inbox 尾条为「集贤学士 TK-48-01」历史回报，TK-47-04 命中来自派活文本/历史卡提及，**不是成员回报**。
- 实读 `docs/squad/pipeline/DESIGN-PRINCIPLES.md`：32 行、无「## 会签记录」；近 20min 落盘文件列表无该文件。按 A1/A9 判定 **TK-47-04 仍在途、D10 未闭合**，不凭 inbox 命中宣布完成。
- 串行三件套终验的 exit 1 为核验脚本把 `.mjs` 拼成 `.mjs.mjs` 的参数 bug（非门故障）；用正确 argv 复跑：maturity 11/11、fixture 26/26、supervise exit 0。
- 本轮终态：七门全 0 / release 23 步 exit 0 / verify 52/52 / tests 46/46 / maturity 11/11 / fixture 26/26 / exemption=false / installed=true / java=green / 在途 TK-47-04 / attention 含「席位滚动覆盖偏低 4/16」。


## 第五十二轮补记 · TK-47-04 闭合（D10 收口）

- inbox 这次真回报来自考功郎中@v17（与上一轮误读不同：逐条核对 from 字段）。
- 会签段 L32「## 会签记录」/ L36 会签人 / L43 一致性清单（6 条数据行，每条双向锚点）；技术正文 L1~L30 与插件 assets 旧副本 3377B 逐字一致，写域仅该文件。
- captain 独立实跑 drift 0 问题 / reflow 12 模式 P11=4；全链 exit 0 / verify 52/52 / maturity 11/11 / exemption=false。D10 闭合。
