# 10-patrol.md · 只读抽巡（御史大夫 · squad-court/read-only）

**开工**：AGENTS.md §1/§3、STATE.md、VERSION.md（canary 空）、INTERACTION.md §八 已读；captain 正式派活，非 PING。
**基线**：ADR-002 / CR-002 / api-contract.md / data-arch.md / patrol-CR002.md / patrol-SN26-001.md / G-S6.md；三值口径 templates/GATE.md:18、roles/security-auditor.md:7。
**范围**：只读 gateway-java/ 13 源文件 + target/surefire-reports + 基线文书；本轮未重跑 mvn、未写旧稿与 src/。

## 一、契约 ↔ ADR-002 ＝ 部分符合
- ✅ 技术栈全对齐：Java17 pom.xml:18-19,37；SpringBoot3.5.16 :9；MySQL :27-28；Redis :26；BC1.78.1 :29-30；Vue3 按 ADR-002:11 本轮零范围未建。驱动实测 9.7.0（TEST-*.xml classpath）为 connector 版本，MySQL 8 系服务器口径，非漂移。
- ✅ 签名串 5 元素序 Sn26Contract.java:32-37 ↔ api-contract.md:19；裸 R‖S 64B GmCryptoService.java:16,52-61 ↔ :21；断言 ContractAndCryptoTest.java:37。
- ✅ 契约常量 BIZ :10-15 / SUCCESS_CODES :16 / CODE_REASON :21-25 ↔ api-contract.md:22,28；应答三层 ResponseNormalizer.java:21-37；状态机 SnStateMachine.java:14-25,32-34。
- ❌ ADR-002:32「encryptData 四子域保持不变」未平移：Java 端仅 SM4 原语 GmCryptoService.java:96-113 + 开关 application.yml:35-36，全树无 key/certId/encryptMethod/data 信封。
- ❌ 9 公共头（api-contract.md:16）：SignatureService.java:29-32 实写 8 头，缺 signPubKeyCert(C)；SnControllerTest.java:25 名 `...NineHeaders` 未断言头数（同 patrol-SN26-001.md 轻差异口径）。
- ❌ api-contract.md:11,13 的 /admin/{state,audit,metrics,alerts} + mtls/jwt + 200req/s 限流未落地：SnController.java 仅 :25 /health、:32 /api/sn/{method}。

## 二、9/9 证据 ＝ 符合
- 源码 9 个 @Test：ContractAndCryptoTest.java:18,22,26,33,41,50（6）+ SnControllerTest.java:20,25,34（3）。
- gateway-java/target/surefire-reports/com.unionpay.tradein.ContractAndCryptoTest.txt:4 `Tests run: 6, Failures: 0, Errors: 0, Skipped: 0`；同目录 north.SnControllerTest.txt:4 `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0` → 6+3=9。
- TEST-com.unionpay.tradein.ContractAndCryptoTest.xml / ...north.SnControllerTest.xml testsuite `tests="6"/"3" errors="0" failures="0" skipped="0"`；java.runtime.version=21.0.2+13-58，release 17 由 pom.xml:19,37 保证。
- 测试隔离 application-test.yml:3-8 排除 DataSource/JPA/Redis 自动配置，无真实外连。
- 三处记载一致：STATE.md 全局段第七轮「mvn test 9/9 BUILD SUCCESS」；CR-002 批准链第 5 步；review-gate-CR002.md 表格「mvn test 9/9」；patrol-CR002.md「9/9 不构成安全否决」。
- 注：本轮只读核对既有报告，未重跑；9 用例全正向/单元，唯一负向 SnControllerTest.java:34 仅验 HTTP 400，未涉 EARS 编排级/RSA2。

## 三、Java 端审计脱敏 ＝ 不符合（零接线）
- 基线：api-contract.md:31（S 级 加密+全掩码+HMAC 索引；审计不含签名串原文/敏感明文）、data-arch.md:19（t_audit: headers_sanitized/body_sanitized）、:29（A15 全掩码+HMAC）。
- 全树 13 文件 grep：脱敏相关命中仅 application.yml:35-36 两行配置，且无 @Value/@ConfigurationProperties 读取；零 mask/hmac/sanitize/audit/Logger/AuditEntity/t_audit/审计表。
- ❌ SnController.java:48-54 将 `canonical`（签名串原文）、`body`（含 snCode 明文）、`headers`（含 sign 值）原样回显 HTTP 200 调用方；异常分支 :57 回显 ex.getMessage()。非审计日志，但脱敏链路零接线且敏感明文直出。
- ❌ SnRequest.java:18-19 imei1/imei2 明文入参无掩码；无审计落库组件；S 级字段 signId/私钥/encryptData.key 无脱敏入口。
- 沙箱密钥 SignatureService.java:23 `generateSm2KeyPair()` 仍临时 KeyPair（patrol-CR002.md 整改条件未消）；application.yml:5-7 DB 口令明文占位。
- 相对 Node 端回退：patrol-SN26-001.md 记 Node 有 provider.js:151-156 掩码、orchestrator.js:86-88 body sanitize、gateway.test.js:166-167 断言含 '*'；Java 端连部分掩码亦无。按该稿「视 A15 为强制基线则项三升不符合」，本维度即取该值。

## 三值总判定：部分符合（部分符合 / 符合 / 不符合）
不触发一票否决：沙箱态、未入网、无真实敏感数据（patrol-CR002.md 同口径）；9/9 不构成安全豁免。本件即 G-S6.md:17 所候「御史大夫等保核查」结论，供总指挥回填。
G-S6 放行前须闭环 ① A15 全掩码+HMAC 索引 Java 端接线（当前零实现）② 禁回显 canonical/body/headers，补 headers_sanitized/body_sanitized 审计 ③ KMS/HSM 替换临时 KeyPair ④ encryptData 四子域信封 ⑤ EARS 负向/RSA2 用例 ⑥ /admin/* + mtls/jwt + 限流。

> 边界：本轮仅写 docs/squad/rerun/10-patrol.md；未触旧稿、src/、tests/、gates/、STATE/TRACE 及他人 inbox；AGENTS.md §1 无并行写冲突。
