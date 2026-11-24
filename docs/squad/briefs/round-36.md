# 第 36 轮简报

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

四张令牌全部回收后，核销 G-S3 封驳与 G-S7 放行条件，推进 release 链首次无豁免全绿。

## 拆解（派了什么、给谁、令牌）

| 令牌 | 席位 | 任务 | 状态 |
| --- | --- | --- | --- |
| TK-34-01 | 后端经理@v15 | CR-003 D1/D2/D3 真修 | ✅ 已验收（43/43 + 负向红→绿探针） |
| TK-34-02 | 架构经理@v15 | N-1~N-4 裁决 v1.2 | ✅ 已验收 |
| TK-34-03 | 测试经理@v15 | 9 条门禁矩阵 | ✅ 已验收（红态证据） |
| TK-34-04 | 测试经理@v15 | 编译阻断修复 | ✅ 已验收 |
| TK-34-05 | 测试经理@v15 | 测试隔离红修复 | ✅ 已验收（方案③修污染源，纠正 captain 的 503 假设，实为 BIZ code 态污染） |
| TK-36-01 | 给事中@v15 | G-S3 解除条件复核转放行 | 🔴 在途（wake） |

## 交付与验收

- **captain 独立复跑全量 `mvn test`：43 run / 0 failures / 0 errors · BUILD SUCCESS**（不信成员自报）。
- CR-003 三项现码核验：D1 `SM2Signer + ParametersWithID` 显式 userID、空值抛异常、BC 默认注释删除；D2 `signId` 真进 ZA 且验签按响应头显式验；D3 `sm2Encrypt/sm2Decrypt` C1C3C2 包裹 SM4 会话密钥，签名包裹路径删除，unwrap/unseal 往返可用。
- 后端负向探针：摘掉 ParametersWithID → CryptoParamBindingTest 2 用例必红，还原复绿；跨栈锚用 Node 固定 k 向量主路径互认（P1 跨实现互操作门禁实锤）。
- 测试隔离红根因被成员纠正：污染终态不是 captain 猜的 503/tamper，而是 Cr004GatesTest 末方法把共享 MockUpstreamChannel 停在 BIZ code 态；修法 `@BeforeEach resetUpstream()`，主源码零改动。

## 发现的问题

① 我（captain）对隔离红的根因假设错了——成员按 P6「上级输入未核验」实测纠正，这正说明派活令牌 + 交叉审计没有把队长变成不可质疑者；② 并发中间态曾两次导致 testCompile 短暂失败，测试经理按 60s 间隔探测至闭合才跑验收，写域始终互斥未冲突。

## 门禁变化

五门全绿且无豁免：seat idle=0 / roster warn=0 / reflow prob=0 / stage-order viol=0 / drift prob=0。G-S7 九条门禁里 CR-003 三条已由红转绿（43/43 含 6 条新增用例）。

## 风险（未闭合的）

- G-S3 尚需给事中按 §八 解除条件复核转放行（TK-36-01 在途）。
- G-S7 放行条件其余项（KMS/HSM 生产接入、appId/入网参数）仍属外部前置，不阻塞本轮「插件治理体系」验收但阻塞真实联调。
- ② 字段拦截 / ③ 枚举落码是否补齐，由 G-S3 复核判定。

## 下一步

1. 验收 TK-36-01（给事中总判定可否进入 G-S4）。
2. 若放行 → 更新 G-S7 门禁表（CR-003/004 已修项改「过」）→ 改判。
3. release 链无豁免全绿收口 → 写 round-37 简报。

