# SEMVER · 版本纪律

> 本插件遵循 [Semantic Versioning](https://semver.org/)；本文件是版本号递增的机器可判纪律（P15 相关：版本号不随意跳）。

## 格式

`MAJOR.MINOR.PATCH`

| 位 | 递增条件 | 示例（本插件历史） |
| --- | --- | --- |
| MAJOR | 破坏性变更：配置结构改、流程语义改、门禁语义改、依赖最低版升 | 1.8.0（架构 v3 subagent-first）→ 未来 2.0.0 |
| MINOR | 新组件/新能力/兼容新增（向后兼容） | 1.9.0（架构切换曾用 minor——见 breakingChanges 补记）、1.10.0（配置适配层）、1.12.0（L2 交付层） |
| PATCH | 修复、文档、无行为变化的内部重构 | 1.10.1/1.10.2/1.10.3（重构零行为变化）、1.12.4（R1） |

## 规则

1. 递增版本必须同步五点：package.json / compatibility.json（version+bundleVersion）/ lib/index.js / cordis.patch.yml（build-patch）/ CHANGELOG.md。
2. CHANGELOG 每段必须含日期与分类（Added/Changed/Fixed/Removed，Keep a Changelog）。
3. breakingChanges 数组必须记录行为变更（架构/配置结构/发布物范围）。
4. 版本号递增在 release 之前完成（build-patch 会把版本打进 patch 头注释）。
5. 修复类不递增 MINOR；能力类不递增 PATCH（历史 1.8→1.9→1.10→1.11→1.12 的跳版已补记说明）。

## 门禁

- verify 的 "version declarations agree across artifacts" 断言自动核对五点一致；
- compatibility.json 的 breakingChanges 由人工/总指挥维护（无法机器判定语义）。
