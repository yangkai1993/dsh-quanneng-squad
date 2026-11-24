# 第 57 轮简报 · runtime 迁移处置

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户「继续」。上轮遗留：TK-57-01（契约 §10 修订）首次派发后 agent-1 失败、无产物无回报；runtime 已切换（qodercn/qfmodel，agent_teams 通道卸载）。本轮处置迁移影响并带精确锚点重派。

## 拆解与交付

1. 现场勘查：契约 §10 未被半途改坏（1..12 连续、K1/K3/K4 仍旧文本、CR-004 不存在）→ agent-1 失败于开工前，无需回滚。
2. audit-roster 真红：profile 默认已随 runtime 切到 qodercn/qfmodel，16 席仍是 buddy/hy4free 遗留快照；新 runtime 已卸载 agent_teams 通道、无法 remove+re-add。按 P2 不伪造：登记成对到期豁免（audit-roster + l4-maturity，2026-11-18，闭合条件=席位在 quanneng-16 profile 显式钉定或通道恢复，两行同批删除）。M11 如实报 soft-green、链内 [L4 未到达] 1 项差距但不阻断 —— fail-closed 联动正确。
3. verify D7 断言修复：旧断言依赖「真实当前豁免表为空」，被合法迁移豁免证伪 → 改独立 mkdtemp 负样本；60/60。
4. release-scripts audit-roster 测试修复：emptyTable.replace 把豁免行拼到分隔行尾（粘连），门读不到豁免 → 数组逐行 join + dead 场景用空豁免表隔离真实登记。tests 46 → 47/47 全过。
5. TK-57-01 第 2 次派发：subagent provider=qodercn model=qfmodel（授权两半已核对），任务书带 4 处逐字锚点、每锚点唯一性自检（找到次数不等于 1 即 hand_back）、compliance ID 保留约束。R6 剩 1 次额度。

## 发现的问题

- runtime 切换是第 4 次触发 audit-roster 同型告警（P2 持续有效），但这次修复通道本身不可用，迁移豁免是当前唯一诚实处置。
- 我在测试构造再次踩字符串拼接陷阱（P4 同型）。教训：表格内容一律数组 join。

## 门禁变化

```
release 24 步 exit 0（exemption=true，两条迁移豁免，problems 可见）
verify 60/60 · tests 47/47 · mvn 85/85
maturity 10/11（M11 soft-green = 迁移豁免联动，如实不阻断链）
audit-roster 豁免放行 + stderr 留痕，其余六门全 0
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无业务 src 变更；总指挥＝纠错（V-52-02 双因素契约变更致 audit-roster/D7 两处用例失效，本次仅把用例恢复到新契约合法态，未放宽断言）；契约 §10 修订由架构会话（TK-57-01/TK-58-01，写域仅 docs） |
| 涉及业务 src 文件 | 无 |
| 门禁 | lead-scope-check exit 0 |

## 风险 / 下一步

1. 等 agent-2（TK-57-01）回报：独立验收 result-verify / drift + 锚点自检；若再失败按 R6 转 R8 上报裁决。
2. 席位在 quanneng-16 profile 显式钉定 model 是 audit-roster 豁免的真正闭合路径。
3. OUTBOX 74 条待回放；滚动覆盖 6/16。

## 第五十七轮补记 · TK-57-01 闭合（agent-2 第 2 次成功）

- captain 独立复核（不采信回报）：3 新锚点全命中（DOC:466+572 / DOC:540-543 / SignIdCertRegistry）、3 旧锚点残留 0、compliance:K1~K4 各恰 1 次原样、§1..12 连续、§12 已追加 v1.3→v1.3.1、CR-004-k-anchors.md 59 行 6 段；复跑 result-verify 27 项 0 缺口、drift 0 问题、文件 15788B。R6 计数：agent-1 失败=1 次，agent-2 成功，额度内闭合。
- noticed-not-handled 两项（§10 注 line107 K1 滞后陈述、文件头仍写 v1.2）：按 R6 不并入本票扩大范围 → 立 **TK-58-01** 新票（3 处逐字锚点 + 唯一性自检 + compliance ID/章节不动约束），已派 agent-3（qodercn/qfmodel），卡状态在途。
- 链现状：maturity 仍 [L4 未到达] M11（迁移豁免 soft-green 联动，如实）；其余全绿。


## 第五十七轮终 · TK-58-01 闭合，在途清零

- agent-3 三处版本指针统一：captain 独立复核 3 新文本×1、旧残留×0、compliance×4、§1..12 连续、双门 exit 0 → 闭合。
- noticed（v1.3→v1.3.1 前缀×2）：captain 裁决接受现状不修——两行均真实变更记录，cosmetic 再走 CR 成本高于收益，登记已知外观项。
- 在途卡全量扫描 = 0；链内 maturity 仍如实 [L4 未到达] M11（runtime 迁移豁免 soft-green 联动，2026-11-18 到期或席位钉定后同批删豁免即恢复到达）。


## 第五十七轮终二 · 迁移豁免真闭合（席位钉定）

- 按豁免行闭合条件执行真修复：cordis.patch.yml 的 quanneng-16 profile 为 16 席逐一显式钉定 provider/model（qodercn/qfmodel，幂等跳过已有 model 的条目），改前备份 .bak-1794793393712；席位 16/16、钉定 16/16。
- 从 profile 真源重导实时快照 → audit-roster 无豁免 exit 0 / warnings 0；两行 2026-11-18 当前豁免按闭合条件移入历史（3 列，留完整闭合说明）→ readExemptions={}。
- 联动验证：facts.greenLevel=hard-green（无豁免、全门绿）→ maturity 11/11 reached:true → 链内 [L4 到达] 且 exemption=false → tokenConverged=true。
- 已知外观项：api-contract §12 存在两行 v1.3→v1.3.1 前缀（TK-57-01/TK-58-01 各一），captain 裁决接受不修。

