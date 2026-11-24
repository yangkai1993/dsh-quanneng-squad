# 第 43 轮简报 · L4 首次合法固化（stable v2.7→v2.8）

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

验收 TK-42-02（INDEX 漂移修复）并确认 L4 固化是否合法达成。

## 拆解与交付

1. **TK-42-02 验收**：drift-check exit 0、reflow exit 0、INDEX :12/:13 主表指 v4 且两行含 P9 要点 —— 成员交付成立。
2. **我的核验正则误报（已 Correction 入册）**：我一度报「INDEX 主表仍指 v3 / 成员自检不实」，实读 INDEX.md 定位：主表在 :9-14（v4），我按行序取了尾部历史小节 :55-56 的 v3 行。drift-check 取首个匹配（主表在前）是对的；已给脚本加结构约定注释（主表必须位于历史小节前）。纪律：核验脚本与门禁冲突时先假定自己错，不得以「成员声称」处理。
3. **L4 合法固化确认**：P-001/P-002/P-004 = codified；两个 rollout 迭代（round-40、round-42）均以 projectGreenNow=true 计入；07:19:24 那次非绿固化已被熔断回退，history 两段并存可追溯。
4. **规则本体存在性 grep 实证（非声称）**：P-001→AGENTS.md 并发冲突铁律+hand_back；P-002→AGENTS.md §4 每次派活前提（情报先行/派活令牌）；P-004→DELIVERY-PIPELINE.md 结果核对必经 result-verify.mjs。全部命中。
5. **stable 递增自动化**：run.mjs 新增 bumpStable —— 全部固化时机器递增 VERSION.md stable（v2.7→v2.8）并写 stamp 防重复；canary 位自动摘除；sync-ledger 重渲染 PIPELINE.md（「等数据点火」旧文案消失）。

## 发现的问题

- 我自己的核验代码有 bug（行序取末行），差点误判成员交付不实 —— 这是 P1 变体：拿未验证的自检脚本当证据。已入册 D-061。
- 成员自报与门禁一致时无需追问；不一致时先查工具与脚本，再查人。

## 门禁与账本变化

- L4：3 条提案 codified，stable v2.8，canary 位空。
- drift-check 加「主表在前」结构约定注释。
- release 链终验：exit 0、verify 45/45、tests 46/46、五门+result-verify+夹具全绿、无豁免无阻断。

## 风险 / 在途

- TK-41-01（Java 8 条管理路由）、TK-41-02 五点版（Node 幂等）仍在后端，回报未至前不宣布 D-6/D-7 闭合。
- 对外上线仍需外部参数（KMS/HSM、appId、入网 IP、certId）。

## 下一步

1. 验收 TK-41-01/02（含各自的「基准未扩大」回归用例与负向探针）。
2. L4 下一批候选提案：P9（任务书基准转写）、TK-41 系列的门禁化（drift F 类已起步）。
3. 新提案需从 proposal 重新走五态（round-44+ 计绿），固化门槛不变。

