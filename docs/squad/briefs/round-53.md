# 第 53 轮简报 · 下一批（squadctl / OUTBOX 演练 / W4 补派 / D9 登记）

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户「下一批继续」：推进 D5 席位补派、D9 剖面门、OUTBOX 回放演练、squadctl 统一入口。

## 交付与验收

1. **squadctl 统一入口**：新建 `scripts/squadctl.mjs`（20 个子命令 → 既有脚本的纯映射，DRY/ISP，不重复实现门逻辑）+ `npm run ctl`。实跑 `help` 20 命令、`gate:result` 经入口 25 项 0 缺口。21 个 .mjs / 35 个 npm scripts 收口到单一 CLI。
2. **OUTBOX 回放演练（隔离）**：临时工作区构造 2 条 OUTBOX，`memory.mjs status` 报 2/2、`replay` 在云端不可达时**只返回「逐条调用 Hindsight 工具 + 成功后 --clear」指令、不谎称成功**；真账本未污染（无 DRILL-1），临时目录已清理。证明 D6「本地最终权威」可复现。
3. **D5 W4 补派（ROSTER-16 §七）**：round-52 滚动覆盖落到 1/16 → 按 W4（S8 复盘+门禁）在席 8 角色，先按 C2 并发≤3 派 3 票：TK-53-01 考功（iteration-52 度量）、TK-53-02 起居注（记注对账）、TK-53-03 给事中（S6 封驳抽巡）。`dispatch-guard` 三票写域互斥 0 问题。其余 5 席与 D9 排下一轮。
4. **D9 登记（非投递）**：TK-53-04 剖面切换门派活单落 `后端经理.md`，状态「非投递｜按 C2 排下一轮」，防 G 类黑洞；要求 profile=prod 缺外部参数即 fail-closed 拒绝启动、sandbox 保留占位、负向探针必红。

## 发现的问题

- D5 窗口滑到 round-52 后覆盖从 4/16 掉到 1/16：滚动指标本身正确（旧卡过期），暴露「补派必须按轮次名册常态化」而非一次性。
- W4 的考功郎中 squadRole 初查误取 `squad-toolkit/roles/e2e-engineer.md`，实读 INDEX 得 `e2e-engineer-v2.md` 并修正（A10 已闭合后的版本真源纪律）。
- OUTBOX `replay` 的 `case` 源码检索用 `case 'replay'` 未命中（实现是 if/usage 分支），但实跑输出证明行为正确——按 A11 以实跑为准，不改判据。

## 门禁变化

```
dispatch-guard: 3 在途票写域互斥 0 问题
squadctl help 20 命令 / gate:result 25 项 0 缺口
OUTBOX 演练 2 条隔离、真账本零污染
maturity 11/11 · 七门全 0 · 在途 3（W4 首批）
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无（只改 scripts/squadctl.mjs、package.json、dispatch 卡、账本；未碰 src） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 抽验本段 exit 0 |

## 风险 / 下一步

1. TK-53-01/02/03 回报待收；到齐验收后补派 W4 余 5 席。
2. TK-53-04（D9）下一轮投递，闭合后生产误启风险消除。
3. OUTBOX 67 条待云端恢复；逼近 100 上限按 D6 门报。
4. 云端 Hindsight ECONNRESET 持续，本地 DECISIONS.jsonl 为最终权威。

