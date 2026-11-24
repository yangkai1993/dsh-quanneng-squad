# 抽巡报告 · SN26-001（御史大夫 · squad-court/read-only · 本人独立复核）

| 项 | 值 |
| --- | --- |
| 抽中 | stories/SN26-001.md:3；三值 符合/部分符合/不符合（templates/GATE.md:18、roles/security-auditor.md:7） |
| 基准 | .analysis/source-doc.txt、docs/arch/api-contract.md、data-arch.md、gateway-design-v1-refined.md、stories/SN26-001.md:25-30 EARS |
| 开工 | AGENTS.md §1/§3、STATE.md、VERSION.md（canary 空）已读；活体抽验 2 条 exit 0、零文件副作用 |

## 一、contract.js ↔ api-contract.md ＝ 符合
- 签名串 5 元素序：contract.js:40-43 ↔ api-contract.md:19 ↔ 源文档:293-303；活体 `version=1.0.0&appId=A1&bizMethod=soluGsp.gsp.sn26.query&reqId=R1&body={"a":1}`。
- 9 头 contract.js:12-16 ↔ api-contract.md:16；5 个 bizMethod contract.js:5-11 ↔ :22；裸 R‖S 64B contract.js:62、provider.js:65、gateway.test.js:47 ↔ :21、源文档:308。
- encryptData 四子域全 M / 一次一密 / IV=16×00：provider.js:8,104,113-116 ↔ api-contract.md:24-25、源文档:511-515。
- 应答三层：SUCCESS_CODES contract.js:17、GENERATORS :28、CODE_REASON :23-27、response.js:73-76,47-53 ↔ api-contract.md:27-28、源文档:258；活体 `SUCCESS=["0000000000","200"]`、`totalMs=10000`（源文档:525）。
- 轻提示非漂移：api-contract.md:16 第 9 头 signPubKeyCert 标 (C)，provider.js:86-95 实写 8 头。

## 二、tests/gateway.test.js 覆盖 EARS ＝ 部分符合
- 11 顶层 test（:23,38,43,55,65,77,88,104,120,136,147）；Ubiquitous 64B 裸 R‖S 真断言 :43/:47 ✅。
- Event-driven「验签先行才进业务」(SN26-001.md:27)：仅 :48/:51-52 单元正向；编排级「失败→不进业务→SECURITY_REJECT」(orchestrator.js:61-67) 无断言；E2E :163/:168 仅成功路径。
- State-driven 并存 (SN26-001.md:28)：:111-113 断言 active()=2 ✅；「按 signId 命中新旧证书验签」(provider.js:49-59) 无断言。
- Unwanted「二次序列化/顺序错→SECURITY_REJECT」(SN26-001.md:29)：:52 仅 canon+'x' 验签 false；未断言 kind、未测顺序错。
- Optional RSA2 (SN26-001.md:30)：**零覆盖**，全测试走 cfg() 默认 SM2+SM4（config.js:13），provider.js:13-15,64,78,107-111 分支无用例。
- stories/SN26-001.md:42「EARS 真实现：待复核」仍待复核；TRACE.md:17「11/11 覆盖」= 实现+测试存在，非五类逐条真实现。

## 三、审计脱敏 ＝ 部分符合（附安全整改条件）
- ✅ 底线守住：审计不写签名串原文、body 经 sanitize（orchestrator.js:86-88）；provider.js:152-156 掩码；gateway.test.js:166-167 断言含 '*'、IMEI 明文不落。
- ❌ 全掩码未落实：api-contract.md:31 / data-arch.md:29 / v1-refined.md:24(A15) 要「全量掩码」，provider.js:151 实留首2尾2；活体 `860000000000001 → 86***********01`。
- ❌ HMAC 索引未落地：provider.js:150 hmac() 定义、:164 导出，全 src 零调用；store.js:11、orchestrator.js:54,65,88 无 hmacIndex。
- ❌ headers_sanitized 缺失：data-arch.md:19 / v1-refined.md:189 要求，orchestrator.js:87-88 仅 body。
- ❌ S 级全集不全：signId/私钥/encryptData.key 未入 config.js:16（仅 5 字段）；测试 :166-167 未验上述三项。

## 总判定：部分符合（符合 / 部分符合 / 部分符合）
安全底线（无敏感明文、无签名串原文落审计）成立，不触发 security-auditor.md:7 一票否决；但 A15 全掩码+HMAC 索引、headers_sanitized、S 级全集属**安全类整改条件**，G-S6 放行前须闭环（G-S6.md:17「御史大夫等保核查 尚未出具」应改记本结论）。若视 A15 为强制基线，项三升「不符合」。
整改 4 条：① mask 改全掩码并纳入 S 级全集 ② hmac() 接线写 hmacIndex ③ 审计补 headers_sanitized ④ 补 Event/State/Unwanted 编排级负向断言 + RSA2 分支用例。

> 本件由御史大夫本人覆写 08:32:03 总指挥代落占位稿（原稿三项「符合」无 file:line、首行自注「成员复核待补」，非成员独立完成）；仅写 docs/qa/patrol-SN26-001.md，未触 src/、tests/ 及他人文件。C8 ≤40 行。
