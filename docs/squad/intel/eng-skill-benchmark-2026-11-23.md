# 工程化技能面补充采风 · GitHub/Gitee/GitCode（2026-11-23）

> 〔采风留痕〕S-1 第二批：面向「插件工程化/技能工程化」维度，补 ROADMAP-2026H2.md 的技能层方案。每条附出处与实测证据。
> Gitee：仅 jeesite（★9992，Java 低代码+国密+MCP）与既有工程可用，无多智能体技能工程化对标；GitCode：API 400/429（限流），无有效样本——两站结论同第一批，主源仍为 GitHub。

## 一、工程化标杆一览（星标实测）

| 项目 | ★ | 工程化亮点 | 与本项目关系 |
| --- | --- | --- | --- |
| anthropics/skills | 199.2K | **官方 SKILL.md 规范**：YAML frontmatter(name/description 触发语)/渐进披露/References+assets 分层/535 技能 | 技能格式真源，直接采纳 |
| anthropics/claude-code | 156.8K | **官方插件结构**：.claude-plugin/plugin.json + commands/agents/skills/hooks/.mcp.json 五件套 | 插件形态真源 |
| anthropics/claude-cookbooks | 55.1K | 配方库 | 参考 |
| hesreallyhim/awesome-claude-code | 58.6K | 资源索引 | 参考 |
| wshobson/agents | 42.8K | **一源七宿主适配器 + evals 评测工程 + Invariants/Quality gates**（详见 §二） | 最高价值：工程纪律+评测 |
| davila7/claude-code-templates | 34.1K | 组件 registry+CLI 脚手架+component-validation | registry 模式 |
| SuperClaude-Org/SuperClaude_Framework | 24.0K | 30 命令+认知人格+PyPI 安装器 | 安装器形态 |
| VoltAgent/awesome-claude-code-subagents | 26.7K | 100+ 专项 subagent | 提示词库对照 |

## 二、wshobson/agents 工程纪律解剖（最高价值标的）

1. **Invariants（不变量）**：单一真源（手写只发生在 plugins/<name>/，生成物 gitignore 永不手改）+ 唯一上下文文件（AGENTS.md 为源，CLAUDE.md 软链）。→ 对本项目：canonical/presets.yml + build-patch.mjs 已符合同一范式，但 **AGENTS.md/CLAUDE.md 双文件为各自手写**，未建立软链/生成关系。
2. **Quality gates 三机械门**：validate（结构校验）/garden（漂移检测：死链/陈旧产物/超长技能/marketplace 孤儿，按严重度排序）/test（适配器+验证器+回程测试）。→ 对本项目：drift-check 已有死指针检测；缺「超长技能」「清单孤儿」「回程一致性」三类。
3. **evals 评测工程**：static-score-snapshot.json 按技能内容 sha256 键控评分快照——改技能→digest 变→测试自动跳过（永不误红）；case.json 机器可执行（task/test_command/protected_paths 三要素）；LLM judge 层如实标注 experimental。→ 对本项目：提示词 26 版本**无任何评分/回归机制**，提示词改版全靠人工 diff。
4. **Model tiers**：四级模型别名表（Opus/inherit/Sonnet/Haiku）+ 适配器在生成期映射、映射到各宿主 ID、inherit=用户选。→ 与 P15「不钉死」完全相容的**建议层实现范式**：别名只存在于适配器映射表，运行时永不硬编码。

## 三、官方规范要点（anthropics/skills + claude-code plugins）

1. SKILL.md frontmatter 双字段硬规范：name（目录同名）+ description（必须含触发语 "Use when/Use this when"）；正文渐进披露（SKILL.md 精简，细节在 references/，模板在 assets/）。
2. 插件五件套：plugin.json 元数据 + commands/ + agents/ + skills/ + hooks/ + .mcp.json。
3. marketplace.json 清单式分发：name/source/description/version/author/license/category 全字段。

## 四、本项目差距与落点（按 ROI 排序，并入 ROADMAP 分期）

| # | 差距 | 现状 | 落点 | 期 |
| --- | --- | --- | --- | --- |
| A1 | **提示词评分快照**：26 版本无回归机制，改版无机器对照 | prompts/ 全靠人工 diff | scripts/prompt-score.mjs：静态评分（P 内化覆盖/长度/结构四节/触发语）+ score-snapshot.json（sha256 键控，改版自动跳过）+ verify 断言 | 二期 1.16.0 |
| A2 | **技能化改造**：28 个 ux/gates 脚本用法散在 help/README，无渐进披露 | help JSON+README | assets/skills/<n>/SKILL.md 十二个（quickstart/status/upgrade/rollback/gates/pulse/l4/memory/autopilot/diagnostics/obs-rank/state-machine），frontmatter 带 "Use when" 触发语；sop-inject 按 description 触发注入而非全文注入（token 降耗） | 二期 1.16.0 |
| A3 | **AGENTS.md 单源化**：与 harness 上下文文件为各自手写 | 双手写 | CLAUDE.md 软链/生成自 AGENTS.md（wshobson Invariant 1 同款） | 三期 1.17.0 |
| A4 | **garden 类漂移门扩容**：死指针已有；缺清单孤儿/超长工件/回程一致性 | drift-check 单类 | drift-check.mjs 补三检测器（孤儿=assets 未入 MANIFEST.docs；超长=prompt >500 行；回程=pack 产物 hash 对账） | 三期 1.17.0 |
| A5 | **模型建议层别名表**：路由建议不带字面量 | sync-seat-model 跟随默认 | lib/model-tiers.mjs：tier 别名→「建议跟随宿主」映射；建议层输出与 P15 断言共存 | 四期 1.18.0 |
| A6 | **评测夹具 protected_paths**：验收三元组参照 case.json（task/test_command/protected_paths） | 验收散文 | 三期验收三元组扩展 protected_paths 字段（防改测试凑绿） | 三期 1.17.0 |
| A7 | marketplace 清单完整性 | pack 白名单+MANIFEST | 采纳 category 字段；pack --check 补清单-文件对账 | PATCH |

## 五、约束清单（采风结论）

1. 〔已符合〕单一真源+生成物不手改（presets.yml→build-patch）与官方/头部项目范式一致，保持。
2. 〔已符合〕零外部依赖（davila7 用 Rust CLI，本项目 node-only 维持）。
3. 〔缺口已立案〕A1~A7 共 7 项；A1/A2 价值最高——「技能=渐进披露+触发语」直接降 sop-inject 的 token 成本，评分快照补齐提示词回归盲区。
4. 〔教训〕wshobson 的 snapshot-digest 模式（改内容→digest 变→断言自动豁免）是「防误红+防漏检」双解，值得成为本项目门禁设计惯例。
5. 〔数据〕Gitee/GitCode 在技能工程化维度无对标样本（jeesite 为 Java 低代码域），后续此维度采风不再重复两站，除非用户点名。
