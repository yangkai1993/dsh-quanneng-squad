# 第 49 轮简报 · 小队成熟度到达 L4（机器判定）

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户纠正「我指的是小队到达 L4」（非项目按初始规范重构）。按《全能编程小队-落地手册》§7.6 定义，把「到达 L4」做成机器可判定，补齐真实差距，而不是嘴说。

## 拆解与交付

1. **成熟度门 `scripts/l4/maturity.mjs`（M1~M11）**：逐条判定五态引擎/夹具、点火前置（1 玩具夹具+1 S8 基线）、分层自治（宪法拒绝）、熔断冷却、固化本体复核(A8)、豁免不稀释计绿(A13)、自动点火、账本机器渲染、G-REFLOW 新模式进提案池、无假绿固化、判定时刻 hard-green。
2. **首跑 6/10 未到达** → 实读核实：M9/M10 是我判据自身的编号映射/回滚识别 bug（修）；M6 真差距（facts 把带豁免 exit 0 当 full green）、M7 真差距（P-010 自 11-14 起 history=0 从未点火）。
3. **修真差距**：① facts 增 `greenLevel=hard-green|soft-green|red` + `activeExemptions`，`run.mjs` 计绿只认 hard-green（A13 闭合）；② G-REFLOW 11 条 P 全部登记进 L4 提案池（7 条新增从 proposal 起，非手刷 codified）；③ **整文件重建 `run.mjs`**：提案源从 G-REFLOW 动态生成（原硬编码 3 条导致其余 8 条点火到 regression 后永远卡住——半截闭环），主循环覆盖全池，逐态走 canary/rollout/codified。
4. **M11 自纠**：9/10 时门曾报 `reached:true`，但同一实跑 `greenLevel=red`（名册快照过期 30h → audit-roster=1、pluginTests=1）。按 A11/C5 补「判定时刻必须 hard-green」判据并回退到达结论；重导实时名册后 audit=0、tests 46/46、全链无豁免 exit 0，门才 11/11 真到达。
5. **接入链**：成熟门 fail-closed（未到达 exit 1）接 release（22→23 步）+ verify 增「成熟度门在位且接入」断言（51→52）。

## 发现的问题

- 用 L4 自己的方法判定 L4 时，判据自身先被抓了 3 次（M9 编号、M10 回滚识别、M11 缺硬绿前置）——这恰是 L4 该有的自指性。
- `run.mjs` 硬编码 PROPOSALS 3 条是 P12「真源覆盖」缺陷的实证：自动点火看似工作，但全池循环缺失导致 8 条卡在 regression。
- 名册快照过期第三次由 audit-roster 抓到（P2 fail-closed 正确），重导即归零。

## 门禁变化

```
maturity 11/11 reached:true（建立在 hard-green 上）
release 23 步 exit 0 · verify 52/52 · tests 46/46 · installed=true · exemption=false
七门全 0 · supervise java=green · 在途 0 · attention 0
L4: 链内终态：5 codified（P-001/002/004/010/011）、6 rollout（P-003/005/006/007/008/009）、0 canary
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无（本轮只改 scripts/l4/、package.json、verify.mjs、账本，未碰 src） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 抽验本段 exit 0 |

## 风险 / 下一步

1. 6 条停 rollout：本体锚点/迭代门槛未齐，按 fail-closed 等下一真实 hard-green 迭代，禁止手刷。P-010/P-011 已凭 round-48+round-49 两个不同迭代的 hard-green 合法固化（iterationsSeen 可查）。
2. 云端 Hindsight ECONNRESET，本地 DECISIONS.jsonl 为权威，OUTBOX 待回放。
3. 对外上线仍待外部参数（KMS/HSM、appId、入网 IP、certId）。


## 第四十九轮补记 · 链内外一致与 M5 真源修复

- 链内 `l4/run` 按跨迭代 hard-green 自然把 P-010/P-011 推进到 codified；链后 maturity 一度 10/11（M5 报 bodyMissing=P-010,P-011），实读是 **M5 的 bodies 表硬编码只认 3 条老提案**（P12 真源覆盖同型）→ 改为与 run.mjs 的 BODY 同源动态取锚点（未登记者回退 G-REFLOW 该 P 行），复验 11/11。
- 核查固化合法性：P-010/P-011 的 iterationsSeen = canary:round-48 / rollout:round-48 / rollout:round-49，跨两个不同 round-N、去重键真实累积，非同轮刷出；P-003 等 6 条停 rollout 属 fail-closed。
- 终态双验：release 链内 `[L4 到达] 全部 11 项判据通过`，链后单独跑 maturity 仍 11/11 reached:true；七门全 0、在途 0、attention 0、exemption=false。

