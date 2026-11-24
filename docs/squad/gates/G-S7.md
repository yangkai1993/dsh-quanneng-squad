# G-S7 · 发布门（运维与交付）

签发：总指挥（2026-11-12 终审）。状态：**内部联调可放行 / 对外上线仍 BLOCKED（外部参数）**。

| 检查项 | 依据 | 结论 |
| --- | --- | --- |
| 真实南向出口存在 | CR-004 E1：HttpUpstreamChannel 真 socket + 九头；Cr004GatesTest 8/8 | **过（captain 独立复跑）** |
| 应答非硬编码成功 | CR-004 E2：应答透传上游 code/subCode；gate1_businessFailureCodePassesThrough 通过 | **过** |
| 幂等可达 dup | CR-004 E3：IdempotencyStore 接线、第二次提交 dup=true、reqId 复用 | **过** |
| SM2 userID 生效 | CR-003 D1/D2：ParametersWithID 显式 userID + signId 真消费；CryptoParamBindingTest 6/6 + Node 跨栈向量锚 | **过** |
| 会话密钥用加密原语 | CR-003 D3：sm2Encrypt/sm2Decrypt C1C3C2 包裹，签名路径删除，unwrap/unseal 往返通过 | **过** |
| fail-closed 被消费 | CR-003 D4：degrade: fail-closed 已在异常路径消费（SnController 三失败分型 + ResponseNormalizer） | **过** |
| 发布物双侧一致 | 交付发布经理 release-1.4.1.md（sha256 两侧 SAME、tests 46/46） | 过（仅指插件发布物） |
| 席位无闲置 | seat-utilization idleCount=0（16/16） | 过 |
| 反哺闭环 | reflow-check：P1~P7 未写进角色提示词（13 项） | **未过** |

## G-S3 复核残留闭环（2026-11-12，captain 独立实测）

| 项 | 实测 |
| --- | --- |
| F1/F2 degrade 配置化 | SnController/Sn26FlowService 字面量删除，@Value gateway.reliability.degrade 注入；GS3RecheckFixesTest 断言通过 |
| F3 四 M 必填 | requireFields 补 mchntCd/barcode；缺字段→400 |
| F4 saleTm | @Size(max=32) + 两态 Pattern（yyyy-MM-dd / yyyyMMddHHmmss） |
| F5 未知字段 | 删 ignoreUnknown + JacksonStrictConfig FAIL_ON_UNKNOWN_PROPERTIES → 400 |
| F6 cateCode | CATE_CODES 9 项白名单北向拦截，Z99→400 / A03 放行 |
| F7 出口预算 | `.timeout(Duration.ofMillis(budget))`，旧 min(budget,READ_MS)=9s 删除；HttpTotalBudgetTest 9.2s 通过 / 10.5s UPSTREAM_TIMEOUT |
| 全量 | `mvn test` **52 run / 0 fail / 0 error · BUILD SUCCESS**；负向探针六项全摘→5 fail+1 error，还原复绿 |

## 放行条件

1. ✅ CR-003（D1~D4）与 CR-004（E1~E7）修复完成，43→52 全绿；9 条门禁 + F1~F7 均演示过「先红后绿」负向探针。
2. 跨栈互操作用例（Java↔Node 互为签验）通过。
3. reflow-check 覆盖达标：每条 P 编号 ≥2 份提示词引用（产出 *-v2.md）。
4. 生产参数就位：appId / 入网 IP 白名单 / signId 与 certId / KMS-HSM 接入（G-S6 遗留）。

> 结论（2026-11-12 更新）：插件工具层可发布；Java 基线的 CR-003/CR-004 九条门禁已在原仓 `mvn test` 43/43 全绿（captain 独立复跑），**内部联调条件已具备**。仍不可对外上线：KMS/HSM 生产接入、appId/入网 IP/certId 等外部参数未就位（见放行条件 4）；且 G-S3 复核转放行尚未回收（TK-36-01 在途）。
