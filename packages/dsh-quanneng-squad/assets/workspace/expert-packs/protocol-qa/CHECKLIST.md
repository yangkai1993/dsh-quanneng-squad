# 国密协议测试专家 · 检查清单

- [ ] C1 EARS 五类各有至少一条断言
- [ ] C2 Unwanted：签名串字段顺序错 → 验签失败
- [ ] C3 Unwanted：body 二次序列化 → 失败
- [ ] C4 Optional：RSA2 分支存在
- [ ] C5 敏感明文不出现在审计序列化结果
- [ ] C6 encryptData C3/摘要篡改被拒
- [ ] C7 mvn test exit 0

> 逐条对表，未通过项写入自纠正台账 docs/squad/audit/SELF-CORRECTION.md。
