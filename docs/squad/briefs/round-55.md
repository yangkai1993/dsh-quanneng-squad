# 第 55 轮简报 · D7 闭合 + 三票投递

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户「继续下一轮」：D7 按定义修复、投递 D9 与 W4 余席、轮次绑定规则走 CR。

## 交付与验收

1. **D7 闭合**：实读发现 `EXEMPTIONS.md` 已有 `## 当前豁免`/`## 历史` 双 section、verify 已有「历史表不计」用例，但 `readExemptions` 仍靠 `split('## 历史')[0]` 隐式切分 → 改为**显式只认 `## 当前豁免` 段**（无该段即 fail-closed 返回 {}）。`verify` 增 2 条 D7 断言（57→59/59）；独立负向探针「历史段含未来日期 → readExemptions={}」通过、临时脚本清理。`D7-PENDING.md` 状态改「已闭合」并附证据。
2. **两处演练用例同步**：新解析器要求显式标题，`verify.mjs` 双因素演练与 `release-scripts.test.js` 的 audit-roster 双因素演练临时表都补 `## 当前豁免` → 46/46 恢复，真实 EXEMPTIONS.md 未污染。
3. **三票投递（C2=3）**：TK-55-01 后端（D9 剖面切换门，写域 application.yml + config/ProfileGuard + test）、TK-55-02 需求（规范覆盖差异清单，写域 intel/）、TK-55-03 架构（轮次绑定规则 CR，写域 ROSTER-16 + cr/）。`dispatch-guard` 三票写域互斥 0 问题；旧 TK-53-04 标「已取代」不再算在途。

## 发现的问题

- 改 D7 解析器时首版 verify 断言用 `s.includes("split('## 历史')")` 把**注释**当代码 → 假红；改为过滤注释行后判定。
- 双因素演练临时表缺 `## 当前豁免` 标题导致 reflow/audit-roster 两处用例红，属用例需跟上解析器契约，非门故障；两处补齐后全绿。
- 首查 `EXEMPTIONS.md` 双 section 已存在（D7 并非从零开始），按 A11 只补「解析器显式认段」这一真实剩余缺口，不重复造结构。

## 门禁变化

```
readExemptions: 显式 ## 当前豁免 段（fail-closed）
verify 57→59/59 · tests 46/46 · release 24 步 exit 0
maturity 11/11 [L4 到达] · 七门全 0 · exemption=false · installed=true
dispatch-guard: 3 在途票写域互斥 0 问题
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无（只改 scripts/lib/exemptions.mjs、scripts/verify.mjs、tests/release-scripts.test.js、gates/D7-PENDING.md、dispatch 卡、账本；未碰业务 src） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 抽验本段 exit 0 |

## 风险 / 下一步

1. TK-55-01/02/03 回报待收；到齐后按六要素独立验收（D9 负向探针、规范覆盖差异、CR 一致性）。
2. W4 余 3 席（御史/交付/产品）与前端/测试/运维等按下轮 C2 余量补派。
3. 滚动覆盖 5/16 仍偏低，按轮次名册常态化补派。
4. 云端 Hindsight ECONNRESET 持续，本地 DECISIONS.jsonl 为最终权威。


## 第五十五轮补记 · 在途收敛机制与陈旧卡消歧

- 用户「一直迭代至没有 token」：全量扫描 dispatch 卡发现在途 4 张，其中 **TK-46-02 是陈旧态**（第四十七轮段已「已闭合｜验收通过」、SchedulerBootstrapTest 6/6、inbox 2 回报，仅第四十六轮重投段仍留在途）→ 按 A1/A9 补结构化「被取代」状态行，不删历史，卡级在途从 4 降到 3。
- `supervise.mjs` 在途判定补「过程记录/被…取代」排除（与 dispatch-guard 同源）；`verify.mjs` 增「A1 无陈旧在途卡」断言（只拦「后段已终止、前段仍在途」，不禁止合法在途）→ 57→**60/60**；独立负向探针构造同令牌陈旧卡 `staleDetected:true`、临时脚本清理。
- `supervise.mjs` 增 `tokenConverged` 机器标记：inFlight=0 且 attention 无在途/门红/真回归时置 true。当前 false（三票在途），不靠指挥记忆宣告收敛。
- 三票 TK-55-01/02/03 成员仍 running、产物未落盘、inbox 零回报 → 按 R-W 不催、不动其写域；C2 已满不补派。
- 终态：release 24 步 exit 0 / verify 60/60 / tests 46/46 / maturity 11/11 [L4 到达] / 七门全 0 / exemption=false / installed=true / java=green。


## 第五十五轮续 · TK-55-01/03 独立验收闭合

- **TK-55-01（D9 剖面门）**：后端@v17 交付 application.yml（GATEWAY_PROFILE:sandbox，不设 spring.profiles.active 以免污染 4 个 @ActiveProfiles("test")）+ config/ProfileGuard.java（EnvironmentAware+InitializingBean，prod 双通道判定、读 Environment 原始 env/sysprop 不读 yml ${VAR:占位} 解析值 → 防默认值伪装已注入）+ ProfileGuardTest 7 用例。captain 独立实跑 mvn 85/85 BUILD SUCCESS；成员负向探针摘校验分支 4 红还原复绿。P6 口径复核「根 src/ 是 Node 参考实现、写域全在 gateway-java/」成立。
- **TK-55-03（轮次绑定 CR）**：架构@v17 在 ROSTER-16.md §七 追加「轮次绑定规则」（W1~W4 表逐字未动）+ CR-003-roster-binding.md 112 行 7 节。captain 实跑 squadctl roster=W4/basis=简报明确记载/statedIn=round-53.md、drift 0 问题、reflow 12 模式 0 问题。
- 两个 `false`（hasDualProd / ymlNoActive）经实读判为 captain 正则过窄，非实现缺陷（A11 不派假票）。
- TK-55-02 需求经理仍 running、spec-coverage 未落盘、inbox 0 → 按 R-W 不催；在途从 3 收敛到 1，tokenConverged 仍 false（机器标记诚实）。
- 终态：release 24 步 exit 0 / verify 60/60 / tests 46/46 / maturity 11/11 / mvn 85/85 / 七门全 0 / exemption=false / installed=true。

