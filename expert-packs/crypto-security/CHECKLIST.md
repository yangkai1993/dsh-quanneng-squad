# 国密安全审计专家 · 检查清单

- [ ] C1 签名串 5 元素顺序固定且一次序列化
- [ ] C2 SM2 输出 64 字节裸 R‖S
- [ ] C3 encryptData key/certId/encryptMethod/data 四子域齐全
- [ ] C4 验签失败先于业务处理
- [ ] C5 证书库按 signId 多证书并存
- [ ] C6 敏感字段全掩码 + HMAC 检索索引
- [ ] C7 审计不含 canonical 原文与敏感明文
- [ ] C8 /health 与业务响应不回显 sign/canonical/body
- [ ] C9 生产密钥走 KMS/HSM 可插拔接口

> 逐条对表，未通过项写入自纠正台账 docs/squad/audit/SELF-CORRECTION.md。
