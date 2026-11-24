# 第 35 轮简报

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

推进第 34 轮重派的四张令牌；独立验收已落产物；修复原仓编译阻断与测试隔离红。

## 拆解（派了什么、给谁、令牌）

| 令牌 | 席位 | 任务 | 状态 |
| --- | --- | --- | --- |
| TK-34-01 | 后端经理@v15 | CR-003 D1/D2/D3 真修 | 🔴 在途（席位 running，产物未落） |
| TK-34-02 | 架构经理@v15 | N-1~N-4 裁决 v1.2 | ✅ 已验收（ruling 76 行四项三值 + 双端修正清单；api-contract v1.2 113 行） |
| TK-34-03 | 测试经理@v15 | 9 条门禁矩阵 | ✅ 已验收（99 行；CR-003 三条红 + G9 红，红态证据齐全） |
| TK-34-04 | 测试经理@v15 | 原仓编译阻断修复 | ✅ 已验收（方案 B：删 SeatRunner + Sm2Interop 三处修正；mvn -q test -DskipTests exit 0） |
| TK-34-05 | 测试经理@v15 | 全量 mvn test 隔离红 | 🔴 在途（wake） |

## 交付与验收

- captain 独立复现编译失败（SeatRunner 缺 junit-platform-launcher + Sm2Interop 错包 org.bouncycastle.asn.gm），派 TK-34-04；修复后独立复跑 `mvn -q test -DskipTests` exit 0。
- 全量 `mvn -q test` = 37 run / 1 failure（SnControllerTest.queryBuildsCanonicalAndNineHeaders 期望 ok=true 实得 false）；单跑 SnControllerTest exit 0 → 隔离红实锤。
- 根因定位：ok=false 来自 SnController.java:63 UpstreamNetworkException；application.yml 默认 channel: real 在测试上下文真发 socket 无上游。派 TK-34-05（写域仅 src/test/ 与测试 resources，与后端 crypto 写域互斥）。

## 发现的问题

① 原仓 mvn test 此前根本编译不过 → 此前「Java 18/18」「CR-004 37/37」均不可复现（P1 同型：自洽绿灯掩盖编译阻断）；② 测试经理在副本 .tmp-gate-probe 里跑门禁，仓库零写盘，方法正确但需把 CR-004 门禁的真实验证迁回原仓（TK-34-04 已做到 Cr004GatesTest 8/8 原仓通过）；③ 后端 TK-34-01 长时间 running 无回报，需观察是否又遇 credential/限流。

## 门禁变化

五门维持全绿（无豁免）：seat idle=0 / roster warn=0 / reflow prob=0 / stage-order viol=0 / drift prob=0。stage-order 豁免已按闭合条件撤销。

## 风险（未闭合的）

- CR-003 D1/D2/D3 仍未修（GmCryptoService 无 ParametersWithID、注释仍写 default userID、EncryptData 仍用签名原语）→ G-S7 不可放行。
- G-S3 总判「不可进入 G-S4」维持：⑤ 未闭合。
- 全量 mvn test 仍有 1 个隔离红（TK-34-05 在途）。

## 下一步

1. 验收 TK-34-05（全量测试转绿）。
2. 等待/催办 TK-34-01；后端修正落盘后测试经理把 G1/G2/G3 三条红转绿。
3. 给事中按 G-S3 解除条件复核转放行 → 撤除 G-S4 阻断。
4. G-S7 九条门禁先红后绿 → 改判「可发」→ release 链无豁免全绿收口。

