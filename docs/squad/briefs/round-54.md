# 第 54 轮简报 · W4 首票验收与轮次口径修正

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户「继续下一轮」：验收 W4 三票、补派余席、投递 D9；受 C2 并发≤3 与两席仍 running 约束，本轮只做可并行部分。

## 交付与验收

1. **TK-53-01 闭合**：考功郎中@v17 交付 `metrics/iteration-52.md`（119 行 8 节）。captain 独立验收：inbox `from=考功郎中@v17` 真实；报告并列留痕「maturity 首跑 10/11（pluginTests=1 并发瞬态）→ 串行复跑 11/11」，未用终态掩盖首跑红；「派活五门=facts 判定子集 / supervise 七门扩展」口径辨析；趋势 51→52→53 每条附 file:line；L4 机器态实读 **12/12 codified** 与报告一致。dispatch 卡补结构化闭合行。
2. **squadctl roster 口径修正（P9）**：ROSTER-16 §七只有 W1~W4 名册、**无取模绑定规则**；上一版 `squadctl roster` 自造 `(N-1)%4` 得出 W1，与 briefs/round-53 明确记载的 W4 冲突。修为「以最近简报明确记载的 W 轮次为准，无记载才按 4 轮推定并标 basis=inferred」。实跑 basis=简报明确记载 / statedIn=round-53.md / current=W4 八席（考功、起居注、给事中、御史、交付、需求、产品、架构）。
3. **D9 卡 squadRole 真源修正**：由 `squad-toolkit/roles/backend-engineer.md` 改为 INDEX 主表 `docs/squad/prompts/backend-engineer-v1.md`（A10 已闭合）。

## 发现的问题

- TK-53-02（起居注）/ TK-53-03（给事中）仍 `running`、产物未落盘、inbox 无回报 → 按 R-W 不催、不动其写域；C2 并发≤3 已满，D9 与 W4 余 5 席本轮不投递。
- 轮次名册的「轮次→W 轮次」绑定规则从未落盘，靠指挥记忆判定 → 已把「简报明确记载优先」写进 squadctl，下一步应把该绑定写进 ROSTER-16 §七作为真源（文档写域属架构经理，按 C10 走 CR）。

## 门禁变化

```
release 24 步 exit 0 · verify 54/54 · tests 46/46
maturity 11/11 [L4 到达] · 七门全 0 · exemption=false · installed=true
squadctl: 21 子命令（新增 roster）· roster basis=简报明确记载 W4
在途 2（TK-53-02/03）· 滚动覆盖 5/16
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无（只改 scripts/squadctl.mjs、dispatch 卡、账本；未碰 src） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 抽验本段 exit 0 |

## 风险 / 下一步

1. TK-53-02/03 回报到齐后验收 → 补派 W4 余 5 席（需求/产品/架构/御史/交付）。
2. 投递 TK-53-04（D9 剖面门）；并把「轮次绑定规则」以 CR 写入 ROSTER-16 §七。
3. D5 滚动覆盖 5/16 仍偏低，按轮次名册常态化补派。
4. 云端 Hindsight ECONNRESET 持续，本地 DECISIONS.jsonl 为最终权威。


## 第五十四轮补记 · S6 封驳整改与三票闭合

- **TK-53-03 独立验收**：qa/audit-round-52.md 91 行 8 节，三值结论（maturity 部分符合 / memory-sla 不符合 / squadctl 部分符合）+ 6 否决项（V-52-01/02 blocker）+ C1~C9 实跑。captain 复现两 blocker：C4 env 单因素 `exempted:true active:{}`、C6 OUTBOX=101 `ok:false` 但 exit 0 零消费。
- **V-52-01 整改**：memory-sla 改 `runGate/failFast` 默认阻断、GATE_IDS 增 memory-sla、supervise 消费 problems 进 attention；实跑正常 exit0 / OUTBOX=101 → `ok:false, exit1, 门阻断`，临时目录清理。
- **V-52-02 整改**：exemptions.mjs 改「envSet && byFile」双因素（env 单独 `exempted:false/envIgnored:true`）；facts.mjs 把 env 尝试计入 activeExemptions 使 greenLevel 不隐身。verify 的 exempted 用例与 release-scripts 的 audit-roster 用例同步改双因素，并加负向「只 env 必阻断」；真实 EXEMPTIONS.md 未被演练污染。
- **C7/制度自审**：verify 增 squadctl MAP/ctl-help、V-52-01/02 三条回归断言（54→57/57）；`docs/squad/gates/S6-REMEDIATION-2026-11-15.md` 落整改闭环（指挥写域，不改成员审计原文）。
- **三票闭合**：TK-53-01(line96 考功)/02(line98 起居注)/03(line97 给事) 本人回报逐一核对，跨票引用属正文提及不否定；产物三件齐。
- **D7 裁决**：起居注报「全仓零命中」，captain 实读 3 处命中全在本轮记注自身 → D7 从未定义/派票/闭合。按 A11 补定义写 `docs/squad/gates/D7-PENDING.md`（status=已登记待办 proposal，不假闭合、不撤销）；原义=豁免表当前/历史混排靠正则区分。
- 终态：release 24 步 exit 0 / verify 57/57 / tests 46/46 / maturity 11/11 [L4 到达] / 七门全 0 / exemption=false / installed=true / 在途清零。

