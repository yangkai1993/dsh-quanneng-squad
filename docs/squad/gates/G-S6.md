# 门禁 G-S6 · 一致性 + 等保

| 项 | 值 |
| --- | --- |
| 结论 | CONCERNS |
| 日期 / 主判 | 2026-11-06 / 总指挥（御史大夫结论待补） |
| 相关文档 | docs/squad/TRACE.md, docs/squad/audit/doc-freshness.md, docs/IMPLEMENTATION-STATUS.md |

## 对表结果
| 验收项 | 证据 | 结论 |
| --- | --- | --- |
| 契约 ↔ 代码 ↔ 测试 ↔ 宪法 | node --test tests/gateway.test.js → 11/11 pass (exit 0) | PASS |
| 国密标准向量 | tests/crypto.selftest.js → 14 PASS | PASS |
| TRACE 覆盖 | 11/11 需求项有实现与测试 | PASS |
| 无残留 stub | 源码扫描零 TODO/占位 | PASS |
| 保鲜钩子 | doc-freshness 有 2 项「部分符合」+1 项「过期」 | CONCERNS |
| 御史大夫等保核查 | 尚未出具 | CONCERNS |

## 结论
代码层面放行；治理层面条件放行：需补御史大夫等保结论、实例化 stories/、补齐 G-S1~S5/S7 与 deploy 资产。不因记录而静默带病交付。


## 组合架构验证后更新（2026-11-06）
6 条整改全部闭环（audit/HYBRID-VALIDATION.md），Java 18/18、Node 11/11；御史抽巡「不符合」项已消除。G-S6 维持 CONCERNS 仅因生产 KMS/HSM 实际接入与入网参数未下发，非代码缺陷。

