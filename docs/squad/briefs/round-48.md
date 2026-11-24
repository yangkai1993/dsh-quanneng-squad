# 第 48 轮简报 · 门真源化 / 组件推广 / 写域移交

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户「请继续」。按上轮列出的三项候选推进：gate-kit 推广到其余门、P10/P11 提示词内化、DESIGN-PRINCIPLES 经 CR 会签；先只读反查上轮遗留问题。

## 拆解与交付

1. **发现门自身假绿（最重要）**：`reflow-check.mjs` 正则 `P[1-9]` 只认个位数 → G-REFLOW 表已有 P10/P11，但门只收 P1~P9，所以长期 exit 0 是**漏看**而非满足。按 DRY/SRP 整文件重建：`P\d+` + 接入 gate-kit（W/runGate/failFast）。重建后 `gatePatterns:11`、P10/P11 coverage=0 → 门如实报红。
2. **组件推广（DRY 第二步）**：gate-kit 从 2 门扩到 **10 个脚本**；`const W` 重复从 8 处降到 **0**；4 个门（seat-utilization/stage-order/audit-roster/result-verify）出口统一为 `runGate`，改前改后 exit 与输出键逐一等价（audit-roster 一度因残留 W 重名语法错，按行号删除后复验全等）。
3. **P10/P11 内化按程序派票**：TK-47-03 集贤学士@v17（v5 两稿，[P10]/[P11] 结构化声明、验收口径/出门门各一条、v4→v5 差异表），写域 prompts/；`reflow-check` 红登记带到期日豁免 2026-11-16（闭合条件写明，problems 仍可见、stderr 留痕）。
4. **写域 hand_back（A14 复发防御）**：上轮我创建的 `docs/squad/pipeline/DESIGN-PRINCIPLES.md` 按 AGENTS §1 属测试经理/考功郎中写域，captain 越界 → 不代改、不移动，登记 TK-47-04 移交考功郎中会签归档（只确认一致 + 追加会签行，不改技术结论）。
5. **A10 留痕**：TK-47-03 的 squadRole 指向 v4 现存稿；后端席位仍无现行稿（上轮已用 roles/ 原件并留痕）。

## 发现的问题

- 门自己「绿」不等于真的检查过：两位数 P 编号被正则漏掉，是 P4 型边界缺陷的变体（自检脚本自身没被检验）。
- 批量组件化时链式正则替换把 `/gm` 拼坏、audit-roster 的 W 变体没匹配上 → 按 P4 教训整文件重建 + 按行号删除残留，每步实跑，未带语法错收口。
- 链内曾出现 `tests 45/1`（audit-roster 语法错连带测试进程读到坏脚本），单独跑 46/46 后判定为中间态误读，如实留痕。
- `runGate` 统一出口后，各门 problems 仍原样打印，豁免不掩盖缺口（本轮 reflow 2 项可见）。

## 门禁变化

```
reflow-check: gatePatterns 9→11，P10/P11 如实红（到期豁免 2026-11-16 放行）
gate-kit 引用 2→10，const W 重复 8→0
全链 22 步 exit 0 / verify 51/51 / tests 46/46 / installed=true / exemption=true（仅 P10/P11）
七门全 0 · supervise java=green(reports=13, staleIgnored=0) · 在途 TK-47-03
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无（本轮只改 scripts/、gates/、briefs/、TEAM-PULSE 等治理域，未碰 src） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 抽验本段 exit 0 |

## 风险 / 下一步

1. TK-47-03 回报后：验收 v5 两稿 → 删 EXEMPTIONS.md 2026-11-16 行 → reflow 无豁免绿。
2. TK-47-04 待正式派发考功郎中（本轮仅登记移交，未投递）。
3. P12 候选（程序内化）：门禁脚本自身须做「真源覆盖」断言（P 编号位数、新增模式被识别），防止再次漏看。
4. 云端 Hindsight ECONNRESET，本地 DECISIONS.jsonl 为权威。


## 第四十八轮补记 · TK-47-03 / TK-48-01 闭合与组件契约修复

- **TK-47-03**：集贤学士交付 qa/security-auditor v5（各 [P10]×4/[P11]×4，三节+差异表）、INDEX v5 小节、v4 零删。captain 独立实跑 reflow-check exit 0 / gatePatterns=11 / problems=[] / P10=P11=2；**负向探针**：移走两稿 → P10/P11 coverage 归 0 门必红，还原复绿、零残留。按闭合条件删除 EXEMPTIONS.md 中 reflow-check 2026-11-16 豁免行，删后门仍绿。
- **组件契约修复**：删最后一条当前豁免后 `verify` 报 `exempted gate traces on stderr` 失败——真因是 gate-kit 的 W 写死真实根、吞掉了测试用 `QUANNENG_WORKSPACE` 注入的「缺输入」场景（ISP/DIP 违反）。修组件 W 为 `process.env.QUANNENG_WORKSPACE || WORKSPACE`，verify 51/51 恢复；不改测试、不写假绿。
- **TK-48-01**：v5 交付后 drift-check 抓到 INDEX 主表仍指 v4（同型第三次复发）→ 按 §1 派回集贤学士（不代改成员写域）。成员回填 :12/:13 到 v5、尾部历史小节保留、7/7 自检；captain 独立核验主表 v5、drift problems=0、reflow 仍绿。drift 的 2026-11-16 豁免**从未生效即删除**（闭合条件已由真修复达成）。
- **G 类终止态统一**：TK-47-04 是「登记移交意图、未 wake 席位」，G 类原只认 已闭合/作废/... 误判黑洞 → 加「非投递/仅登记移交意图」；supervise 的 TERMINAL 同步（DRY 同源判定），在途列表清零。
- 链内一次 `verify 50/1` 与 `drift=1` 均逐条实读定位（组件契约 + INDEX 漂移 + G 类误判），未带红收口；`readExemptions` 复跑 {} 确认无当前豁免。

