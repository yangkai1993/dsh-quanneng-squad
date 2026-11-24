# 历史参考实现 · Node ESM（v1.0，已归档保留）

用户 A4 拍板「回到 Java 基线」后，原 `src/`（20 个 .js 模块 / 2,076 行）、`package.json`、`tests/` 保留不动，作为**历史参考实现**，不再作为现行技术栈。

- 现行：`gateway-java/`（ADR-002 / CR-002）。
- 保留理由：① 11/11 网关测试 + 14 国密向量仍有回归价值 ② 契约语义（签名串、encryptData、应答码、状态机）是 Java 移植的对照基准 ③ 不删除已验收资产（宪法 C5 证据纪律）。
- 注意：`src/contract.js` 与 `gateway-java/.../Sn26Contract.java` 必须保持语义等价；任何一侧变更走 CR 并双写。
