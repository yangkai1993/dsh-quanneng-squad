# 第 37 轮简报

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

G-S3 复核残留 F1~F7 闭合；修 release 链在快照过期后的 fail-closed 卡点；达成无豁免全绿。

## 拆解（派了什么、给谁、令牌）

| 令牌 | 席位 | 任务 | 状态 |
| --- | --- | --- | --- |
| TK-36-01 | 给事中@v15 | G-S3 解除条件复核 | ✅ 已验收（73 行，总判「不可进入 G-S4」但收窄至 F1~F7；⑤ CR-003 核心阻断已解除，43/43 + 负向探针实测） |
| TK-37-01 | 后端经理@v15 | F1~F7 整批闭合（degrade 硬编码 2 处 / 必填 2 项 / saleTm / 未知字段+cateCode / 出口预算） | 🔴 在途（wake） |

## 交付与验收

- **captain 独立复跑全量 `mvn test`：43/43 BUILD SUCCESS**（CR-003 真修 + 6 新用例 + Node 跨栈向量锚 + 负向红→绿）。
- G-S7 门禁表按实测更新：6 项由「未过」改「过」（真实南向出口/应答透传/幂等 dup/SM2 userID/加密原语/fail-closed 消费），仅剩 1 项外部前置（KMS/HSM 与入网参数）。
- G-S3 复核：条件 1（CR-003）与条件 4（N-1~N-4 裁决）放行；条件 2/3 残留 F1~F7 共约 20 行 + 1 测试，无结构性返工。
- **release 链 16 步 exit 0，无豁免、无阻断**：verify 43/43、tests 46/46（源侧 44+2 skip / profile 侧 46 全跑）、install 成功、版本 1.5.1 双侧一致。

## 发现的问题

① profile 副本目录在 GUI 重启后曾消失 → 两条安装副本测试硬编码路径误报失败；已改为候选路径探测 + 无副本时 skip（不是假绿，附明确理由）。② roster-snapshot 跨日过期 17.7h（我最初误算成 1.8h，实跑 `Date.now()` 才纠正）→ export-roster 按 12h fail-closed 卡住发布；用实时 `agent_teams_status` 落盘重建快照（16 席 buddy/glm-5.3-flash），并把报错文案改为明确「fail-closed + 重建方法」（P2 防线）。③ 我 G-S3 派单里把裁决文件路径写成 gates/（实为 docs/arch/），给事中已纠正。

## 门禁变化

五门无豁免全绿；stage-order 豁免已撤且 violations=0；drift 0；reflow 0；seat idle=0；roster warn=0。export-roster 新增 fail-closed 报错语义。

## 风险（未闭合的）

- TK-37-01 F1~F7 在途；闭合前 G-S3 维持「不可进入 G-S4」。
- G-S7 仍判「不可对外上线」：KMS/HSM 生产接入、appId/入网 IP/certId 未就位（外部前置，不阻塞插件治理体系）。
- 后端修完 F1~F7 后需给事中进行第三次复核（整批转放行）。

## 下一步

1. 验收 TK-37-01（F1~F7 逐项 + mvn test 不回退）。
2. 派给事中第三次复核 → 若整批放行，G-S4 解除阻断。
3. 更新 G-S7 结论 → 写 round-38 简报收口。

