# 安全预审 · CR-002（御史大夫）

| 检查 | 证据 | 结论 |
| --- | --- | --- |
| 国密算法来源 | BouncyCastle bcprov/bcpkix 1.78.1（pom.xml），非自研 | 符合 |
| SM2 签名口径 | GmCryptoService.sm2SignRaw 输出 64B 裸 R‖S（测试断言） | 符合 |
| SM4 口径 | SM4/CBC/NoPadding + IV=16×00 + ZeroPadding（测试往返） | 符合 |
| 沙箱密钥 | SignatureService 生成临时 KeyPair，application.yml 用占位符；生产须 KMS/HSM | 部分符合（整改条件：入网前替换） |
| 测试隔离 | application-test.yml 排除 DB/Redis 自动配置，无真实外连 | 符合 |
| 审计脱敏 | A15 全掩码 + HMAC 索引在 Java 端尚未接线 | 部分符合（沿用上轮 4 条整改条件） |

## 三值结论
**部分符合（整改条件）**：不触发一票否决；G-S6 放行前须补 ① Java 端全掩码+HMAC 接线 ② 生产 KMS/HSM 替换 ③ EARS 负向断言与 RSA2 用例。工程编译与 9/9 测试不构成安全否决。
