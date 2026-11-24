# 竞品差距评估 · 四期收口后（2026-11-24）

> 〔采风留痕〕用户问"现在插件相比较竞品还有哪些不足需要补充"。基于三份既有采风（multi-agent/eng-skill/master-benchmark）+ 当前 1.18.0 实采对照，逐项给差距→建议分期。
> 结论先行：**门禁层/真源纪律/零依赖是本项目对竞品的独有优势；差距集中在分发面、交互面、计量面、并行面**。

## 一、差距矩阵（按影响排序）

| # | 差距 | 竞品对照 | 本插件现状 | 影响面 | 建议 |
| --- | --- | --- | --- | --- | --- |
| G1 | **多宿主适配** | wshobson/agents 一源七宿主（Codex/Cursor/OpenCode/Antigravity/Copilot/Pi），marketplace.json 清单 | 只适配 DeepSeek Harness profile（install.mjs 写 cordis.patch.yml）；无 .claude-plugin/plugin.json、无 marketpalce 清单、无 slash-commands 导出 | 分发面×用户基数 | 五期①：canonical 真源已具备（presets.yml+SKILL.md 规范化），加「适配器生成层」：marketplace.json/claude-plugin 清单生成器（生成期转换，Invariant：生成物不手改） |
| G2 | **hooks/MCP 面缺失** | 官方插件五件套 hooks/（事件钩子）+.mcp.json（外部工具） | 0 hooks、0 MCP；全程靠 CLI 主动跑门 | 自动化时机（提交前/派活前自动触发门） | 五期②：若宿主支持 hook 注入则接派活前 dispatch-guard 自动触发；MCP 暂缓（零外部依赖红线） |
| G3 | **token 级计量** | edict 官员总览 Token 消耗排行榜、OMC 成本可见 | telemetry.jsonl 无 usage/seat 字段（rank 空转）；pnl 只到门级 | 成本可见性×优化依据 | 五期③：telemetry record 补 seat+usage（若宿主事件流可取）；至少补 seat 维度让 rank 活起来 |
| G4 | **并行执行面** | OMC tmux workers 多进程并行、sandcastle run() 沙盒并行、autogen GroupChat | autopilot 只产计划（串行逐条 subagent），无工作池/无沙盒隔离 | 吞吐量×隔离 | 五期④：dispatch-plan 已是计划真源，宿主侧按 jobs[] Promise.all 并行 subagent（写域互斥已由 dispatch-guard 保证——这是并行安全的前提，本项目已具备） |
| G5 | **安装器体验** | SuperClaude PyPI 一键安装、davila7 CLI 脚手架、OMC marketplace 安装 | install.mjs 只对已知 profile 布局；无 npm bin/全局入口 | 新用户首里 | 五期⑤：npm bin（squadctl 全局入口）+非交互 init（对标 ruflo init wizard 的最简版） |
| G6 | **文档站** | OMC github.io、davila7 docs-site、sandcastle aihero.dev | README 双语+SKILL.md 渐进披露（内容齐），无站点 | 触达面×SEO | 低优先：skills 内容已按触发语组织，站不过是渲染层；等用户量再说 |
| G7 | **trace 层评测** | wshobson LLM judge/Monte Carlo（自家标注 experimental） | 已裁决不做（B7/evalite 教训） | 维护成本 | 维持不做——竞品自己都没敢标稳定 |
| G8 | **测试密度** | nanochat 每组件一测（6 文件全覆盖）、wshobson pytest 三门 | 6 测试文件 47 用例 vs 112 mjs——lib/ 国密/协议 27 文件有测试但 scripts/ 门层靠 verify 断言而非单测 | 重构安全网 | 中优先：门脚本行为抽 3~5 个黄金路径单测（dispatch-guard/gate-rotation/state-machine-gate） |
| G9 | **GUI 可视化** | edict 军机处 10 面板、OMC VS Code 集成 | CLI+TEAM-PULSE.md 文本 | 观感 | 已 OUT-OF-SCOPE 拒绝（第 3 篇）；若宿主 GUI 有 webview 扩展点可另立项 |
| G10 | **技能市场** | 官方/第三方 marketplace 分发 | 技能只随包分发 | 生态 | 远期：依赖 G1 多宿主清单先行 |

## 二、不应补的（对照竞品反例）

1. **LLM judge 评测**（G7）：wshobson 自己标注 experimental 未过人类标注校验；Pocock evalite 弃维。静态快照层已够。
2. **外部 Web 看板**（G9）：edict 是独立产品形态；本插件零依赖红线+部署形态不变优先。
3. **Rust/Go 重写 CLI**（davila7 cli-rust）：零外部依赖是铁律，node-only 保持。

## 三、五期建议（若用户批准）

| 期 | 版本 | 内容 | 新增文件预估 |
| --- | --- | --- | --- |
| 五期 多宿主分发 | 1.19.0 | G1 适配器生成层（marketplace.json+claude-plugin 清单+commands 导出）+G5 npm bin 入口 | ~8 |
| 六期 计量+并行 | 1.20.0 | G3 telemetry seat/usage+rank 激活+G4 主对话并行投递指引（写域互斥已备） | ~4 |
| 七期 质量密度 | 1.20.x PATCH | G8 门层黄金路径单测 3~5 个 | ~5 |
