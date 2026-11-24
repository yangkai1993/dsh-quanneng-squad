# 第 38 轮简报

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

验收 TK-37-01（F1~F7），派给事中第三次复核整批转放行，更新 G-S7。

## 拆解

| 令牌 | 席位 | 任务 | 状态 |
| --- | --- | --- | --- |
| TK-37-01 | 后端经理@v15 | F1~F7 整批闭合 | ✅ 已验收 |
| TK-38-01 | 给事中@v15 | G-S3 第三次复核（可否进入 G-S4） | 🔴 在途（wake） |

## 交付与验收

- **captain 独立复跑 `mvn test`：52 run / 0 fail / 0 error · BUILD SUCCESS**（43→52：新增 GS3RecheckFixesTest 7 例 + HttpTotalBudgetTest 2 例）。
- F1/F2 degrade 配置化、F3 必填、F4 saleTm、F5 未知字段、F6 cateCode、F7 出口预算逐项现码核验通过；后端负向探针六项全摘→5 fail+1 error、还原复绿、探针零残留。
- 五门无豁免全绿；release 16 步 exit 0（verify 43/43、tests 46/46 双侧同绿、install 成功）。
- G-S7 补入 F1~F7 实测结论段，放行条件 1 标记完成。

## 发现的问题

我（captain）对 F7 用字面正则 `timeout(budget)` 判定为 false，实际代码是 `.timeout(Duration.ofMillis(budget))` —— 判定规则本身未验证就下结论（P6 同型）。已改以 HttpTotalBudgetTest 的 9.2s/10.5s 行为断言为准，结论 F7 通过。

## 门禁变化

五门保持无豁免全绿；G-S7 九条内部条件全核销，仅剩外部前置。

## 风险

- TK-38-01 复核未回收前，G-S3 维持「不可进入 G-S4」（程序性，不是缺陷）。
- G-S7 仍不可对外上线：KMS/HSM 生产接入 + appId/入网 IP/certId（外部参数）。

## 下一步

1. 验收 TK-38-01 总判定；2. 若整批放行 → G-S4 解除阻断 → G-S7 改判「内部联调可放行 / 对外上线待外部参数」；3. 最终收口。

