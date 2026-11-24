# 派单防呆清单（Dispatch Checklist）· 四专家共识落地（工程师 agent-37）

> 每张任务书**签发前**逐项过；缺项=派活无效（AGENTS §4 六要素之上的增量防呆）。

## 结构防呆

- [ ] **精确写域路径**：逐文件/目录列出，禁「见任务书」「相关文件」
- [ ] **变更类型标签**：[JAVA-CODE] / [NODE-CODE] / [DOC-ONLY] / [CONTRACT] / [GOV-DOC]（决定验收必跑集）
- [ ] **改公开签名必附调用点清单**：`grep -rn "new X\(|X\(" <范围>` 输出贴进任务书
- [ ] **只用已存在 API**：新 API 需附官方文档链接或 JDK 版本行；不确定就写「先探证再写码」
- [ ] **commandsRun ≥3 条预期**：任务书直接列成员必须回报的三条命令（如 mvn/verify/result-verify）
- [ ] **负向探针要求**：fail-closed 改动必须附「该拒的用例+该过的用例」两条
- [ ] **路由探活**：派单前 route-gate 通过（dispatch-guard 已自动执行）+ 该路由上一轮实跑 outcome 为可用

## 通道纪律（路由全灭时）

- [ ] 纯文档类 → 可 captain 代理（PROXY-AUTHORITY 规矩 3 双留痕）
- [ ] 实现代码类 → **保持 failed 等原席**，禁止 captain 代写
- [ ] 所有代理事件写 SUPERVISION.json 与面板 evidence_note

## 面板纪律

- [ ] 面板卡只承载「即时可完成登记」；长时任务走 subagent 串行 + 本地卡
- [ ] 建卡即带 assignee（防调度器抢派）；完成前快速流转
- [ ] captain 每轮至少持有一张带真实 assignee 的在途卡（队长激活判据）
