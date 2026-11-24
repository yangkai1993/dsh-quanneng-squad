# 门禁 <GATE_ID> · <阶段名>

| 项 | 值 |
| --- | --- |
| 结论 | <PASS / CONCERNS / FAIL> |
| 日期 / 主判 | <DATE> / <OWNER> |
| 相关故事卡 | <STORY_IDS> |
| 相关文档 | <DOC_PATHS> |
| 保鲜钩子 | doc-freshness 台账无未闭环漂移/召回：<YES/NO> |

## 对表结果
| 验收项 | 证据 | 结论 |
| --- | --- | --- |
| <ITEM> | <EVIDENCE_PATH_OR_CMD> | <PASS/FAIL> |

## 抽巡（御史大夫）
- 抽中故事：<STORY_ID>（每 gate 落盘后抽 1 个已通过故事）
- 独立复核结论：<符合 / 部分符合 / 不符合>
- 报告：docs/qa/patrol-<STORY_ID>.md

## 结论与放行
<VERDICT + 遗留问题 + 下一门禁>
