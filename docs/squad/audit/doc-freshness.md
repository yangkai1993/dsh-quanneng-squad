# 文档保鲜台账（2026-11-06 复检）

| 文档对 | 上次核对 | 账龄 | 结论 | 漂移详情 | 建议动作 |
| --- | --- | --- | --- | --- | --- |
| 契约 ↔ 接口实现与类型 | 2026-11-06 | 0 | 一致 | docs/arch/api-contract.md ↔ src/contract.js | — |
| 宪法 ↔ 依赖版本与安全基线 | 2026-11-06 | 0 | 一致 | 零 npm 依赖；C7 基线已落 | — |
| PRD 验收 ↔ 故事卡 EARS 与 TRACE | 2026-11-06 | 0 | 一致 | TRACE 11/11 覆盖；9 模板 + 12 角色稿齐套 | stories/ 待按模板实例化（非漂移） |
| STATE ↔ 故事卡与 gates | 2026-11-06 | 0 | 一致 | STATE + G-S6 + 16 dispatch/inbox | 补 G-S1~S5/S7 |
| AGENTS.md 目录所有权 ↔ 文件分布 | 2026-11-06 | 0 | 一致 | 已被宿主读取注入 | — |
| deploy 部署物 ↔ 线上版本 | 2026-11-06 | 0 | 一致 | deploy/runbook.md + CHANGELOG.md | — |

> 本轮新增 15 份需求工程文档（clinic/intel/brainstorm/ticket/clarifications/PRD/ADR/STORY/review/patrol/CR/retro/P-002/PIPELINE-CHECK/G-S2），账龄 0，下轮登记。
> 六对判据全部一致；本轮 17 个引用缺口已清零（见 COMPLETION-AUDIT.md）。账龄超 2 阶段未核对 = 超期。
