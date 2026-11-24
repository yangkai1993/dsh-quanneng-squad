# 门禁矩阵 · CR-003 / CR-004（测试经理@v15，token TK-34-03，2026-11-11）

> 依据：G-S3-sn26-contract-v11.md（给事中封驳⑤+解除条件五条）、CR-003、CR-004、p8-cross-audit-2026-11-11.md。
> 9 条门禁 = CR-003 三条（D1/D2/D3 侧）+ CR-004 五条（E1~E5 侧）+ P8 负向一条。
> 方法：全部红/绿状态来自本席实跑命令输出，禁伪造绿。CR-003 三条当前为红（未修），红即证据。
>
> **实跑环境说明（重要）**：原仓 `mvn test` 当前**编译失败**（见 §三 编译阻断），门禁测试在原仓不可执行。
> 本矩阵全部实跑在副本 `.tmp-gate-probe/`（gateway-java 的 xcopy 副本，仓库零写盘）内完成：
> 副本内唯一差异 = ① Sm2Interop.java 修正 BC API 引用（org.bouncycastle.asn1.gm.GMNamedCurves、
> ASN1Sequence/ASN1Integer、FixedKSigner 改固定 SecureRandom 实现）② 删除缺依赖的 SeatRunner.java
> ③ 增加两个探针类 ProbeCr003Red.java / ProbeGate9ContractRoutes.java（证据载体，非仓库门禁）。
> 仓库源文件在探针全程零改动（曾试改 Sm2Interop.java 已精确回滚，backToOriginal=true）。

## 一、总表

| # | 门禁用例 | 源 | 实跑命令（cwd=E:\\workspace\\trade-in\\.tmp-gate-probe） | 当前状态 | 红态关键输出 |
| --- | --- | --- | --- | --- | --- |
| G1 | 跨实现互操作：主路径签名必须被显式 userID (888888) 验签通过 | CR-003 门禁1 / D1 D2 | `mvn test -Dtest=ProbeCr003Red#red1_mainPathSignatureIgnoresDeclaredUserId` | **红** | `RED1_SPEC_VERIFY=false`（Tests run: 2, Failures: 0 的探针内断言主路径失败） |
| G2 | userID 敏感性：不同 userID 必产不同签名；跨 userID 验签必须 false | CR-003 门禁2 / D1 D2 | `mvn test -Dtest=ProbeCr003Red#red1_mainPathSignatureIgnoresDeclaredUserId` | **红** | `RED1_DEFAULT_VERIFY=true` → 实际生效 userID = BC 默认 1234567812345678，声明 userID 未进入 ZA |
| G3 | 密钥包裹往返：seal 必须用 SM2 加密包裹且可 unwrap 还原 | CR-003 门禁3 / D3 | `mvn test -Dtest=ProbeCr003Red#red3_sealUsesSignPrimitiveNotEncrypt` | **红** | `RED3_ENCRYPTDATA_USES_SIGN_RAW=true`、`RED3_GMCRYPTO_HAS_SM2ENCRYPT=false`（EncryptData.java:25-26 签名原语包裹，GmCryptoService 全文无 sm2Encrypt） |
| G5 | 禁止硬编码成功：上游 subCode=000001 北向不得 SALEABLE | CR-004 门禁1 / E2 | `mvn test -Dtest=Cr004GatesTest` | **绿** | `Tests run: 8, Failures: 0`（gate1_upstreamNotSaleableIsNeverSaleableNorth / gate1_businessFailureCodePassesThrough / gate1_sourceScanForbidsHardcodedSuccessLiteral 全绿） |
| G6 | 出口存在性：src/main 必须有真实南向 HTTP 调用点 | CR-004 门禁2 / E1 | `mvn test -Dtest=HttpUpstreamChannelTest` | **绿** | `Tests run: 7, Failures: 0`（真 socket 断言 9 头齐达 + 503→COMM_FAILURE） |
| G7 | 幂等 dup 可达：同键两次提交命中同一 idemKey，第二次 dup 且 reqId 复用 | CR-004 门禁3 / E3 | `mvn test -Dtest=Cr004GatesTest#gate3_secondSubmitIsDupWithSameReqId` | **绿** | 断言 dup=true / kind=DUP_REQ / subCode=000002 / reqId 复用 / bizMethod 进键，全过 |
| G8 | 三类失败分型：网络/验签/业务落不同 kind | CR-004 门禁4 / E4 | `mvn test -Dtest=Cr004GatesTest#gate4_networkVsSignatureVsBusinessAreDistinguishable` | **绿** | COMM_FAILURE(502) / SECURITY_REJECT(403+alert) / BIZ_FAILED / PARAM_INVALID(400) 四路断言全过 |
| G9 | 契约路径映射：api-contract.md 声明的每条路径在实现中可达 | CR-004 门禁5 / E5 D-4 | `mvn test -Dtest=ProbeGate9ContractRoutes` | **红** | `G9_ADMIN_AUDIT_HTTP=404` `G9_ADMIN_METRICS_HTTP=404` `G9_ADMIN_ALERTS_HTTP=404`（带 Bearer LOCAL_DEV_TOKEN 通过鉴权后仍 404；契约 v1.1:12 已声明三条 /admin 路径，Java 0 路由） |
| P8 | 负向：门禁会拦截其制定者（注入硬编码成功 → 门禁必须红） | p8-cross-audit-2026-11-11.md §P8 | 副本向 SnController.java 注入 `static final String HARDCODED_PROBE = "0000000000";` 后 `mvn test -Dtest=Cr004GatesTest` | **有效（有条件）** | 注入后 `gate1_sourceScanForbidsHardcodedSuccessLiteral:64 north must not hardcode the success code ==> expected: <false> but was: <true>`，Tests run: 9, Failures: 1 —— 门禁真会红；但御史实测 captain 持 env/EXEMPTIONS 旁路钥匙，拦截非无条件 |

## 二、CR-003 三红的复现步骤（当前必红，禁伪造绿）

```bash
# 0) 建探针副本（仓库零写盘）
cmd /c "xcopy /e /i /q gateway-java\src .tmp-gate-probe\src\ && copy /y gateway-java\pom.xml .tmp-gate-probe\pom.xml"
# 副本内需修复编译（原仓测试代码三处缺陷，修复属后端 D-c 写域，本席不越界）：
#   src/test/.../gates/Sm2Interop.java: 包名 org.bouncycastle.asn.gm.SM2P256V1 → org.bouncycastle.asn1.gm.GMNamedCurves
#     + Asn1Sequence→ASN1Sequence + 补 import ASN1Integer + FixedKSigner 改固定 SecureRandom
#   删除 src/test/java/SeatRunner.java（pom.xml 缺 junit-platform-launcher test 依赖，编译必败）

# 1) G1/G2 红：主路径签名 userID 未生效
cd .tmp-gate-probe && mvn test -Dtest=ProbeCr003Red#red1_mainPathSignatureIgnoresDeclaredUserId
# 输出关键行：RED1_SPEC_VERIFY=false；RED1_DEFAULT_VERIFY=true
# 语义：GmCryptoService.sm2SignRaw(GmCryptoService.java:39-45) 收 userId 但 initSign 不包 ParametersWithID
#      （:41 注释自认 BC 默认），SignatureService.java:38 传 signId 无效 —— D1+D2 复合命中。

# 2) G3 红：密钥包裹用签名原语
cd .tmp-gate-probe && mvn test -Dtest=ProbeCr003Red#red3_sealUsesSignPrimitiveNotEncrypt
# 输出关键行：RED3_ENCRYPTDATA_USES_SIGN_RAW=true；RED3_GMCRYPTO_HAS_SM2ENCRYPT=false
# 语义：EncryptData.java:25-26 sm2SignRaw 包裹 SM4 会话密钥，无 sm2Encrypt/sm2Decrypt，
#      unwrap 数学上不可能（签名无逆）—— D3 命中。

# 3) 红态的解除条件（G-S3 §八 条1）：GmCryptoService 接 ParametersWithID 显式 userID（D1）
#    + EncryptData 改 SM2 C1C3C2 包裹（D3）后，G1/G2/G3 三探针断言翻转 → 绿，给事中复核放行。
```

## 三、编译阻断（原仓 mvn test 当前不可执行 —— 门禁无法求值 = 最高级红）

```text
$ cd gateway-java && mvn test
[ERROR] SeatRunner.java:[1,1] 程序包 org.junit.platform.launcher 不存在（pom.xml 缺 junit-platform-launcher test 依赖）
[ERROR] Sm2Interop.java:[18,31] 程序包 org.bouncycastle.asn.gm 不存在（bcprov 1.78.1 无该包，正确为 org.bouncycastle.asn1.gm.GMNamedCurves）
[ERROR] Sm2Interop.java:[34,48] 找不到符号 SM2P256V1；[79,9] 未覆盖抽象方法（generateK 签名不匹配）
[ERROR] BUILD FAILURE（testCompile 阶段，75 个错误行，涉 SeatRunner/Sm2Interop）
```

- 影响：原仓任何门禁用例当前都无法编译执行；上文全部实跑基于副本。
- 归属：pom.xml 与 test 代码属后端经理 D-c 写域（CR-003 派工表）；本席写域仅 docs/qa/，已按 hand_back 纪律停在原仓侧。

## 四、CR-004 五绿证据（实跑输出关键行）

```text
$ mvn test -Dtest=Cr004GatesTest            → Tests run: 8, Failures: 0, Errors: 0
$ mvn test -Dtest=HttpUpstreamChannelTest   → Tests run: 7, Failures: 0, Errors: 0
$ mvn test -Dtest=SnControllerTest          → Tests run: 3, Failures: 0, Errors: 0（单类）
$ mvn test -Dtest=SecurityRemediationTest   → Tests run: 9, Failures: 0, Errors: 0
$ mvn test -Dtest=ContractAndCryptoTest     → Tests run: 6, Failures: 0, Errors: 0
```

- G5 证据锚点：Cr004GatesTest.java:41-66（上游 000001 → NOTSALEABLE + 源码扫描禁字面量）。
- G6 证据锚点：HttpUpstreamChannel.java:26（三值 timeout 常量）、HttpUpstreamChannelTest 真socket 9 头断言。
- G7 证据锚点：Sn26FlowService.java:52-67（idemKey claim + dup 回放 + reqId 复用）、Cr004GatesTest.java:82-107。
- G8 证据锚点：SnController.java:59-71（catch 分型）、Cr004GatesTest.java:110-137。

## 五、两条新发现（本席实跑，未登记缺陷单）

1. **测试隔离缺陷（中）**：全套混跑时 `SnControllerTest.queryBuildsCanonicalAndNineHeaders:29` 失败
   （`$.ok expected:<true> but was:<false>`），单类跑绿。根因：Cr004GatesTest 的 @BeforeEach 只重置本类，
   共享 Spring 上下文的 MockUpstreamChannel 泄漏 503/tamperSign 状态到 SnControllerTest。
   复现：`mvn test`（全套）vs `mvn test -Dtest=SnControllerTest`（单类）。修复指针：mock 状态改 per-test 注入或全局 reset。
2. **G9 红 = 给事中封驳①的实证闭环**：契约 v1.1:12「补前门禁5 判红」自述与本席 404 实测一致；
   E-a 收尾（补三条 /admin 路由）后 G9 翻绿是 G-S4 解除条件之一。

## 六、结论

- CR-003 三条（G1/G2/G3）：**全红，红即证据**，与给事中⑤封驳「D1/D2/D3 原样在码/形修实未修」一致。
- CR-004 五条（G5~G9）：**4 绿 1 红**（E1/E2/E3/E4 已修实锤；E5/D-4 未修）。
- P8 负向：门禁能红（注入即红实证），但 captain 旁路钥匙仍在（御史 §P8 实测），判定「有效（有条件）」。
- 总判定与 G-S3 一致：**不可进入 G-S4**；解除条件以给事中 §八五条为准，本矩阵为其提供逐条验证入口。

—— 测试经理@v15 · S5 质量验证 · 2026-11-11 · 全部状态出自本席实跑命令与输出关键行。
