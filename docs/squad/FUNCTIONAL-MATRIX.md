# 全能小队 · 功能完整性矩阵（基础设想 → 实现状态）

| # | 基础设想 | 设计出处 | 实现状态 | 证据 |
| --- | --- | --- | --- | --- |
| F1 | 三省六部流水线（起草→科抄→终审→抽巡→记注→考功） | 落地手册 §1B | ✅ 已跑 | review-gate*.md、patrol-*.md、journal/、retro-*、PIPELINE.md |
| F2 | 谋断四署 S-1（翰林会诊/采风/集贤/太傅票拟） | 手册 §1B | ✅ 已跑（部分代落） | clinic / intel / brainstorm / ticket-001 |
| F3 | S0 拷问门四拷问面 | 手册 §1B | ✅ | clarifications-SN26.md（成员正式版 52 行） |
| F4 | PRD + 用户故事 GWT | 手册 | ✅ | PRD-sn26-gateway.md（产品经理正式版 197 行） |
| F5 | 技术框架 ADR + CR 批准链 | 手册 §1B | ✅ | ADR-001 → ADR-002（用户 A4 推翻）→ CR-002 五步闭合 |
| F6 | 需求拆分 EARS 故事卡 | STORY.md 模板 | ✅ | stories/SN26-001.md（后端经理正式版 67 行，E1-E10） |
| F7 | 目录所有权 / 并发互斥 | AGENTS.md §1 | ✅ | 已被宿主注入；本轮零并发覆写 |
| F8 | 文档总线三律 | CONSTITUTION.md C4 | ✅ | dispatch/inbox 各 16 份；消息只做指针 |
| F9 | 门禁 G-S1~S7 | 手册 §2 | ⚠️ 部分 | G-S2(PASS) / G-S6(CONCERNS)；G-S1/S3/S4/S5/S7 缺 |
| F10 | 编制分级 轻5/中8/全16 | 手册 §1 | ✅ 全编激活 16/16 | ROSTER-16.md |
| F11 | 反馈优化闭环（CR→KPI→五态管线→复审） | METRICS.md | ✅ | CR-001/002、retro-v1.0-pipeline、P-002、PIPELINE-CHECK 11/11 |
| F12 | L4 五态管线 / canary | 手册 §7.6 | ⚠️ 等数据点火 | VERSION.md canary 空、PIPELINE.md 如实报阻塞 |
| F13 | 等保 2.0 三级 & 御史一票否决 | 手册 | ✅ 机制在，整改未闭 | patrol-CR002.md 4 条整改条件 |
| F14 | 独立签名服务 / KMS-HSM / 全掩码 HMAC | v1 精修 | ⚠️ 沙箱占位 | ADR-002 遗留转 G-S6 |
| F15 | 员工角色稿 squadRole 注入 | AGENTS.md §4 | ✅ 12 份权威稿 | squad-toolkit/roles/ |
| F16 | 16 人成团可见 | 用户本轮诉求 | ⚠️ 16 可派 / 14 可见 | 宿主 8 名额硬限制，见 ROSTER-16.md |

## 仍缺（不掩饰）
1. **G-S1 / S3 / S4 / S5 / S7 门禁**未实例化（模板已在 squad-toolkit/templates/GATE.md）。
2. **stories/** 仅 1 张实例化卡，TRACE 15 项中仍有「(补卡)」标记。
3. **Vue3 前端栈**本轮零范围（纯后端网关、无 UI 需求，已记 STATE）。
4. **Java 端 A15 全掩码 + HMAC 索引 / 生产 KMS/HSM / EARS 负向断言 / RSA2 用例**（御史 4 条整改）。
5. **L4 点火**：1 玩具夹具 + 1 真实项目 S8 基线未满足，金丝雀/全量/固化仍阻塞。
6. **16 人同时 list_agents 可见**：宿主 cap=8，需宿主升级或多 team。
