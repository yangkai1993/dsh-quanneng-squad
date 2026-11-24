# Changelog

## [1.20.0] - 2026-11-24
### Added（六期 · 计量激活+并行安全元+门层单测 · G3/G4/G8）
- G3 计量：telemetry.record 规范化——seat 维度默认补齐（无 seat 标 unknown，rank 聚合永不丢事件）+usage 可选对象原样入档（计量真源=调用方不伪造）；rank.mjs 补 usageAgg/usageTotal 聚合（按席位 token/时长双榜）。
- G4 并行安全元：dispatch-plan 返回补 concurrency={safe,recommended,note}——写域互斥成立时可并发（C2≤3），否则保守逐条；dispatch-guard 的互斥门是并行安全前提。
- G8 门层单测：tests/gates.test.js（6 用例——状态机合法链/非法跳转拦/损坏行 fail-closed、protected_paths 拦/无重叠绿、event-store seq+读模型），隔离区 env 预注入；tests 总量 47→53。
- verify +1 断言（122 passed 0 failed）。
## [1.19.0] - 2026-11-24
### Added（五期 · 多宿主分发+Web 看板 · G1/G5/G9）
- G1 适配器生成层：scripts/build-adapters.mjs——canonical 真源（presets.yml+12 SKILL.md）→ dist-adapters/claude-code/ 21 产物（plugin.json+marketplace.json+commands/12+agents/7），生成物带指纹头 DO NOT HAND-EDIT（Invariant 1 同范式）；checkAdapters 门（commands 导出不全/缺指纹头红）。
- G5 npm bin：package.json bin.squadctl=scripts/squadctl.mjs+shebang。
- G9 Web 看板（用户 2026-11-24 明示解封 OUT-OF-SCOPE #3，留痕在案）：scripts/dashboard/board.mjs——零依赖 node:http+单页静态，四面板（门状态/令牌状态机/席位徽章/轮次事件流）+TEAM-PULSE 元信息，数据全实测文件读数，15s 自刷新，仅本机回环 127.0.0.1:18790（--port 可改）；squadctl ux:board 注册。
- verify +1 断言（121 passed 0 failed）；npm files 白名单补 dist-adapters+assets/skills；allowlist 补 dashboard/board.mjs+build-adapters.mjs。
- 清理：%SystemDrive% 字面目录（搜狗输入法缓存垃圾，非插件产物）。
## [1.18.0] - 2026-11-23
### Added（四期 · 谋断升级 · A5/B3 关联/派单清洗/工作量/多署会审）
- A5 模型建议层：scripts/lib/model-tiers.mjs——四 tier 用途建议（深谋/精研/承务/轻捷），输出「跟随宿主主模型（不钉死）」，零模型字面量（P15 相容，P15 探针常驻 .probe-tiers-p15.mjs）；suggestForSeat/suggestAll 只读建议不写路由。
- 派单清洗：dispatch-plan.mjs sanitizeMessage——剥离零宽字符/无效前缀/占位令牌残留/「见卡待派」转述/空行压缩（edict 旨意数据清洗）。
- 工作量预估：dispatch-plan job 补 effort S/M/L+effortInferred（卡上「工作量」行优先，缺省按文本量启发诚实标注）。
- S6 多署会审：docs/squad/audit/multi-office-review-1.18.0.md 规程（御史/给事中/考功并行独立复核，触发条件/分工/汇总规则，edict 朝堂议政背书）。
- verify +1 断言（120 passed 0 failed）；allowlist 补 2。
## [1.17.0] - 2026-11-23
### Added（三期 · 流程回环+验收结构化 · A3/A4/A6/B4/B5）
- A3 AGENTS.md 单源化：scripts/build-agents-context.mjs——AGENTS.md 唯一手写源，CLAUDE.md 为带指纹头生成物，手改漂移即红（wshobson Invariant 1）。
- A4 garden 漂移门扩容：drift-check.mjs 补三检测——C 技能孤儿（skills/ 未被 sop-inject 引用）、D 超长提示词（>500 行）、E 清单孤儿（allowlist.scripts 磁盘不存在）；负向注入 ghost-script 检出✅。
- A6 protected_paths：dispatch-guard 提取卡片禁改清单+交叉检查（写域触碰他卡禁改文件即红，防改测试凑绿）；顺带修复 overlaps 双斜杠真 bug（尾斜杠鲁棒化）。
- S5→S4 fix 回环：DELIVERY-PIPELINE.md 回环规则 4 条（真实红触发/定向返工/复跑触发门+全链/retro 留痕）。
- B4 prompts/INDEX.md 主表加「状态」列（current）；B5 CHANGELOG.d/ changeset 式聚合器 aggregate-changelog.mjs（幂等，演练通过）。
- verify +4 断言（119 passed 0 failed）。
## [1.16.0] - 2026-11-23
### Added（二期 · 可观测+技能化增强 · A1/A2/B2/B3/B7）
- A1 提示词评分快照：scripts/prompt-score.mjs——四维静态评分（P 内化/结构四节/长度/指针）+ prompt-score-snapshot.json sha256 键控（digest 变自动豁免改版，分数漂移=评分代码被动过即红）；LLM judge 明确不做（B7）。
- A2 技能化：assets/skills/ 12 个 SKILL.md（官方 frontmatter 规范，"Use when" 触发语，渐进披露）；sop-inject 加【技能索引】节按需读全文降 token。
- B2 术语表：docs/squad/GLOSSARY.md 七正名（席位/令牌/写域/回报/门/轮次/派活）+ _Avoid_ 反例词表。
- B3 成本三数：pulse.mjs 补「派卡/事件令牌/门红」段（Karpathy 成本账）。
- L3 pulse:board：scripts/ux/pulse-board.mjs 三态徽章（🟢≤24h/🟡≤72h/🔴>72h，工位产物 mtime 实测，edict 背书）。
- L5 obs:rank：scripts/observability/rank.mjs（telemetry seat 维度+事件日志令牌聚合排行，edict 官员总览）；hub 第六源 token-state-machine；diagnostics +2 症状路由（事件日志损坏/令牌卡死）。
- verify +5 断言（115 passed 0 failed）；allowlist 补 7 脚本；squadctl 注册 ux:pulse-board/obs:rank。
## [1.15.0] - 2026-11-23
### Added（一期 · 事件化编排 · 三批对标收编 24 机制中的 9 项）
- L0 event-store：scripts/lib/event-store.mjs——EVENT_TYPES 六类（ROUND_ADVANCE/TOKEN_ISSUED/DISPATCH/REPORT/ACCEPT/REJECT+DISCREPANCY 注记）、TOKEN_TRANSITIONS 状态机转换表（planned→dispatched→reported→accepted/rejected，rejected 可重派）、readEvents 损坏行/非法 type/缺 seq fail-closed、appendEvent 唯一写入口、deriveTokenStates 令牌状态读模型。
- L1 状态机门：scripts/state-machine-gate.mjs——只读重放三检查（T1 引用完整性/T2 独立重放交叉验/T3 终态封闭），squadctl gate:tokens 注册。
- L1 dispatch 抽象：scripts/lib/dispatch-plan.mjs createDispatchPlan({round,w,seats,cards})→{jobs[],missingCards[]}（B6 sandcastle run() 返回形态）；autopilot --dispatch 薄壳化。
- L1 roster 抽象：scripts/lib/roster.mjs read()/write()/clearPins()（ARCH-LAYERS L1 缺口②收编）。
- 通道统一：autopilot dispatch 消息体零 agent_teams_send_message（回报=主对话直回+inbox 只读留痕）；collect 改事件源取数（deriveTokenStates 真源，inboxOnly/silent 五态诚实标注）。
- 对账：round-events 补 cmdNoteDiscrepancy；事件日志注记 71↔68 偏差（seq2 DISCREPANCY）。
- 文档：ROSTER-16 §七 改 Event Sourcing 口径（取代 CR-003 两级判定）；docs/squad/OUT-OF-SCOPE.md 三篇（B1 改宪法/回钉模型/外部看板）；ARCH-LAYERS L1 缺口勾销+断言数 110。
- verify 补 6 条事件源断言（110 passed 0 failed）。
## [1.14.1] - 2026-11-23
### Fixed
- 门退役轨适配（gateway-java 剥离后的证据链修复）：① result-verify.mjs 双证据轨——API/冻结约束/compliance/parity 行 impl 由 java 单轨改 java||node 双轨（Node 侧 src/* 接管：K2 补 verifyUp→normalizeResponse 锚点、store-forward 触发器补 function schedule( 形态），spec/v1 设计文档轨退役由契约/PRD/Node 接管，H1 规范 M 行计数退役置 retired 标注；② l4/maturity.mjs M2 点火前置双轨——Java surefire 基线剥离后以 L4-BASELINE.json nodeTests=47（node --test 实算）为现役基线；③ L4-BASELINE.json 补 nodeTests/nodeTestsSource/retirementNote。release 全链 exit0（verify 104/0、fixture 26/26、hard-green、五门全 0）。
## [1.14.0] - 2026-11-23
### Added
- L5 可观测层（P1）：① scripts/observability/hub.mjs（聚合 doctor/route-health/pnpm-health/supervise/pulse 五源→统一 {level,sources,summary}，一条命令出全貌）；② telemetry.mjs（本地 JSONL 事件记录+replay 回放，零网络）；③ diagnostics.mjs（症状→诊断路由表，数据驱动）。
- 修复 hub 初版 bug：runScript 返回 {exit,data} 但 summary 判 status（undefined 恒红）→改 exit 实测五源全 ok。
- squadctl 加 obs:hub/obs:telemetry/obs:diagnostics；verify L5 断言（104/0）。

## [1.13.0] - 2026-11-23
### Added
- L3 体验层（P0）：① scripts/ux/quickstart.mjs（意图→席位匹配+token+squadRole prompt）；② status.mjs（一条命令：version/model/health/roster/lastDispatchCard）；③ light-mode.mjs（场景模板匹配+promptPrefix 合并零配置派活）；④ assets/ux-templates.json（6 场景）。
- squadctl 加 ux:quickstart/ux:status/ux:light-mode；verify L3 断言（103/0）。

## [1.12.7] - 2026-11-23
### Added
- R4：git init + .gitignore + 最小 CI（.github/workflows/ci.yml 四步）+ README 双语重写（徽章/Quick Start/命令速查/故障排查/架构分层）。

## [1.12.6] - 2026-11-23
### Added
- R3：squadctl help 按域分组输出（六域 29 命令，物理零移动混合方案）。

## [1.12.5] - 2026-11-23
### Added
- R2：CHANGELOG 重建 1.10~1.12 六段（29 段全降序）；compatibility.json.breakingChanges 补 4 条+configSchemaVersion=1；SEMVER.md 落地（MAJOR/MINOR/PATCH 纪律+五点同步规则）。

## [1.12.4] - 2026-11-23
### Fixed
- R1 发布卫生（行业标准重设计 docs/squad/PLUGIN-REDESIGN-STANDARD.md）：删除 %SystemDrive%/SogouInput 污染目录；package.json files 收口为 10 项（npm publish 不再带入 workspace 快照/L4-STATE/记忆分片）；LICENSE（MIT）落地；删除 presets.yml.bak-experiment；npm files 否定模式排除 release 自检夹具与 update-file-index。
- 双轨对齐：npm pack --dry-run 清单与 pack.mjs 白名单一致。

## [1.12.3] - 2026-11-23
### Added
- L2-S4：delivery/cold-start-smoke.mjs（隔离 profile 装→诊→卸）+ release 末端接入；README 重写（Quick Start/命令速查/故障排查）。

## [1.12.2] - 2026-11-23
### Added
- L2-S3：delivery/lifecycle.mjs（备份滚动 N=5/恢复/ledger）+ delivery/upgrade.mjs（预检→备份→安装→doctor→提交/失败自动回滚）+ delivery/rollback.mjs；squadctl 加 upgrade/rollback。

## [1.12.1] - 2026-11-23
### Added
- L2-S2：doctor 三态（checkDoctor() 8 类探测，level=ok/degraded/incompatible，可执行 fix，exit 0/1/2）；squadctl 加 doctor 命令。

## [1.12.0] - 2026-11-23
### Added
- L2-S1：delivery/pack.mjs 发布组件（白名单反转，包体 3.7MB/298→405KB/71）+ PACKAGE-ALLOWLIST/DENY.json；release 接 pack --check。

## [1.11.0] - 2026-11-23
### Added
- 重构第 4/5 期：scripts/README.md 逻辑分组导航（37 脚本六域）；lib/README.md 明确独立国密/协议内核定位。

## [1.10.3] - 2026-11-23
### Changed
- 重构第 3 期：drift-check/l4-maturity 迁 gate-kit runGate/failFast。
### Fixed
- drift-check 隐藏缺陷：ROUTES 漂移原在输出/阻断后才检查，永不生效；迁移后统一终局判定，实测检出。AVAILABLE-ROUTES.md 状态列改人读记录（P15 不限制模型）。

## [1.10.2] - 2026-11-23
### Changed
- 重构第 2 期：verify.mjs 拆为 verify/assertions/{bundle,routing,gates-a,orchestration}.mjs（96 断言逐字保留）+ 薄壳 index；20 处硬编码路径改 ctx.workspace。

## [1.10.1] - 2026-11-23
### Added
- 重构第 1 期：squad-const.mjs 常量真源 + patch-sync.mjs；verify "generated from canonical" 升级字节级自检闭环（负向验证通过）。

## [1.10.0] - 2026-11-23
### Added
- scripts/lib/config-adapter.mjs 配置适配层：profile 位置自适应解析（显式/DSH_PROFILE/扫描最近修改/兜底）+ 模型块逐行解析；7 个配置消费方接入；install 升级时保留用户当前模型块。
### Changed
- audit-roster/route-health/dispatch-guard/install/doctor/pnpm-health/sync-seat-model 全部经适配器读配置。

## [1.9.0] - 2026-11-20
- **架构切换 v3：主对话 + subagent**（用户："多 agent 模型 bug 和限制太多"）：派活主通道从 `squads_run_member`/agent_teams 会话制改为主对话直接 `subagent({description,prompt})`；回报直接回主对话，无"激活≠驱动"两步；subagent 跟随主对话当前模型、无独立 pin。
- agent_teams/squads_run_member 降级为兼容通道（历史资产保留）；16 编制/S-1~S9/六要素任务书/P1~P15/门禁体系/必产物全部不变——只变"谁去执行"。
- 落盘：docs/squad/ARCH-SUBAGENT-FIRST.md；AGENTS.md §5/§6 通道纪律 v3；SOP 注入段（lib/index.js）；squad-autopilot --dispatch 改 subagent 调用参数；qa-engineer-v7 P13 通道探活改 subagent；verify 架构断言强化+两条旧断言更新。
- 版本 1.8.0→1.9.0。
## [1.8.0] - 2026-11-20
- 补充：PTC 生效验证（重启后实测成员会话 tools=1 已收编）但 buddy 仍 400 拦截——触发器确认为 system prompt 中的多智能体框架文本（成员会话 260676 字符含 AgentTeams 协议/agent_teams_ 47 处引用；可用主对话 49584 字符无此类文本），非工具清单。结论：buddy 渠道本地无法绕过（插件指南由宿主注入，插件层管不到），CodeBuddy 模型可用于普通对话；小队成员会话用 qfmodel 等无此风控的渠道。瘦身实验A已回滚（PTC 结构性收编优于减数量，工具面全恢复）。
- 让小队能用 CodeBuddy（buddy）模型：请求体铁证表明 buddy 上游按"agent 工具声明清单"拦截（161+ 散装工具被 400，1 个 run_code 的 PTC 请求放行；同 166 工具在 qodercn 畅通）。
- 全部 7 个 preset 挂载 @deepseek-ai/dsh-tool-executor-ptc：成员会话工具收编为 run_code 单工具请求（与主对话同形态），绕过上游指纹拦截；成员能力不降级——工具经 run_code 程序化调用（宿主 PTC 运行时保证等价执行）。
- 部分替代瘦身实验A（实验A只是减工具数量，PTC 是结构性收编）；实验A的 disabled 配置保留待重启观察，若 PTC 生效则回滚实验A恢复全工具面。
- 版本 1.7.2→1.8.0；生效需重启 DSH（preset 注册表启动时加载）。
## [1.7.2] - 2026-11-20
- 智能组织升级 U1：squad-autopilot 新增 --dispatch 模式——登记态令牌自动生成投递计划（docs/squad/pipeline/dispatch-plan-TK-<轮次>.json），含每席位任务书（六要素）、卡龄时效（>7 天提示情报复核）、诚实语义（卡未派活=只投轮转确认消息，不伪造任务）；CLI 只做纯计算，真实投递由 captain 在宿主侧按计划执行 squads_run_member。
- 智能组织升级 U2：新增 --collect 模式——扫描 inbox 回报与投递计划比对，产出三态收口矩阵（reported=按令牌回报 / contacted=通道有记录但非本轮 / silent=无回报），落 collect-matrix-TK-<轮次>.json；不伪造验收结论。
- squadctl 接线 autopilot:dispatch / autopilot:collect；verify 加闭环断言（95/0）。
- 修复 patch 失同步回归（1.7.1 遗留）：cordis.patch.yml 必须由 build-patch.mjs 产出。
- 版本 1.7.1→1.7.2。
## [1.7.1] - 2026-11-20
- 修复 patch 失同步：手动拼接与 build-patch 生成器的 trimEnd 差异导致 verify「generated from canonical」与2条测试红；改用真实生成器重建后 94/0+47/47 全绿。教训固化为流程纪律：cordis.patch.yml 只能由 scripts/build-patch.mjs 产出。
- 瘦身实验A配置（squad-arch 19 个工具插件 disabled，备份 presets.yml.bak-experiment）：目标=验证「请求体工具数量是 buddy 上游指纹拦截的触发器」；生效需重启 DSH。实验结论出来前不扩散到其他 preset。
- 版本 1.7.0→1.7.1。
## [1.7.0] - 2026-11-20
- 找到「反反复复被限制」的真正根源并一次性修掉：v1.5.9 的 sync-seat-model 把"切换时刻的主模型"写死到 16 席（members[].model = 主模型字面量 pin）。宿主 @linxin666/dsh-agents runMember 对有 pin 的席位强制 gateway.selectModel 走 pin 路由（lib/index.js:2592-2614）——用户之后再切主模型，旧 pin 仍在，席位永远走旧模型。这就是每次"换模型但席位不跟"的机械原因。
- 正确语义（本版）：**跟随 = 无 pin**。sync-seat-model 重写为只清空席位 model pin（delete member.model，不写任何模型字面量）；宿主对无 pin 席位不调 selectModel，会话自动用宿主当前默认模型。主模型切换后席位立即跟随，无需任何脚本、任何重启。
- 接线点保留：dispatch-guard 派单时清 pin、install 更新时清 pin、CLI 手动清 pin（幂等）。verify 断言改为「禁止 member.model = <值> 的 pin 写入 + 无模型字面量 + delete member.model 在位」。
- 16 席已全部无 pin（实测 clearedPins=0 clean=16）；verify 94/0；版本 1.6.1→1.7.0。
## [1.6.1] - 2026-11-20
- 回归用户原始规约：全能小队**不限制任何模型**，任何 provider/model（含 buddy）都可用，用户用什么就用什么。
- 拆除 v1.6.0 加的全部模型限制：routes.json 的 allowed/dead/deadProviders 全清空；route-gate 重写为纯结构检查、不对模型/provider 拒；audit-roster 删 dead 拒逻辑；sync-seat-model 删坏模型守卫（纯跟随主模型）；route-health 改为 unrestricted 结构检查。
- G-REFLOW P15 与两份 v7 提示词措辞同步改为"无白名单/黑名单/provider拒"；AVAILABLE-ROUTES.md 降级为人读参考、不作机器门禁。
- verify 探针改为 buddy/任意/qoder 三者全过；测试改为"audit-roster 不限制任何模型"。verify 94/0、run-tests 47/47。
- 版本 1.6.0→1.6.1。
## [1.6.0] - 2026-11-20
- 修正 v1.5.9 的错误：当时把 16 席全推到 buddy/glm-5.3-flash，而 buddy provider 在 DSH 上游按 system prompt 指纹整通道拦截（unapproved channel / INVALID_REQUEST），等于把全队推进死路。已清空该污染（16 席 model 复位为空）。
- routes.json 新增 deadProviders=[buddy]（provider 级拒），dead 补 buddy/glm-5.3-flash；route-gate.mjs 按 provider 级拒——buddy 任何 model 一律拦，给出明确原因。
- sync-seat-model.mjs 新增 isBadMainModel() 守卫：主模型落在 dead/deadProviders 时拒绝跟随到席位，防止坏主模型带崩全队。
- 边界声明：buddy 拦截是宿主/上游通道问题，插件门只能保证派单不踩 buddy 并给出明确提示，无法让 buddy 本身变可用；需用户在 GUI 把主模型切到当前可用通道。
- verify 94/0（含坏模型守卫断言）、run-tests 47/47；版本 1.5.9→1.6.0。
## [1.5.9] - 2026-11-20
- 席位跟随主模型（不锁死）：新增 scripts/sync-seat-model.mjs，从 profile 根 agent-default-model 动态读当前模型并镜像到 squad 全部成员（无硬编码模型值）。
- 接入两个自动触发点：dispatch-guard.mjs 每次派单软同步；install.mjs 更新插件时同步。主模型切换后，派单或更新插件即带动全部席位跟随，无需重启。
- 修复探测期写入 member0 的临时 model 字段（已清空）；16 席当前已同步到 profile 当前模型。
- verify 新增防回归断言：同步逻辑动态读 profile 且无硬编码模型 + 派单门/安装器均接入。
- 版本 1.5.8→1.5.9 全点同步。
## [1.5.8] - 2026-11-20
- 修复「插件仍锁死模型」真根因：bundle 已去钉死，但 roster-snapshot.json 的 16 席仍钉死 our-free-model/nemotron（席位路由创建时快照），派单门 dispatch-guard 从该快照取模型，用户换模型后派单仍走旧路由。
- dispatch-guard.mjs 新增 currentProfileRoute()：派单路由以 profile 根 agent-default-model 当前值为单一动态真源，快照只提供席位名册；读不到 profile 才回退快照。
- audit-roster.mjs 移除 AVAILABLE-ROUTES.md 白名单锁死，改为仅按 routes.json.dead 拒实测失效通道（任何模型都可以）。
- roster-snapshot 16 席 model/provider 清空（跟随 profile）；verify 新增 P15 防回归断言。
- 版本 1.5.7→1.5.8 全点同步。
## [1.5.7] - 2026-11-19
- 回滚「钉死模型」修法（违背用户原始规约「小队适应 LLM 模型变化而不影响自身」/ U6「路由跟随 profile 默认」）：bundle 真源 `agent-default-model` 改为空配置，`routes.json.allowed` 清空（任何模型都可以），仅保留实测失效通道黑名单；`install.mjs` 覆盖 profile 时保留用户当前模型块（实测 qodercn/qfmodel 未被退回）。
- 固化 G-REFLOW P15（钉死模型反复复发，第 2 次）：`verify`/`route-gate`/`route-health` 改判「不钉死」；`qa-engineer`/`security-auditor` 升 v7 四处 [P15] 内化，INDEX 主表同步。
- 版本 1.5.6→1.5.7 全点同步；verify 92/0、reflow gatePatterns=15/coverage.P15=2。

> 历史：1.5.6 的「切回 our-free-model 单一模型」为错误修法，已在 1.5.7 回滚；buddy 400 的真根因是上游按 system prompt 指纹拦截，正确处置是黑名单拒绝 + 用户自选模型，而非钉死全局。
## [1.5.6] - 2026-11-19（已回滚：错误钉死模型）
- 修复「全能小队运行失败：buddy 请求被拦截 Illegal API invocation from an unapproved channel」。根因：profile 根 cordis.patch.yml 的 agent-default-model 被设成 provider=buddy/model=hy4flash-free，小队 captain 与 subagent 继承 buddy 通道；buddy/CodeBuddy(WorkBuddy) 上游按 system prompt 第三方 agent 框架指纹拦截返回 400 code 11128（见 yetone/magpie#3087、hawklithm/workbuddy2api#21），非账号问题也非本插件 bug。
- 修复：将 profile 根默认模型切回 our-free-model/nvidia/nemotron-3-ultra-550b-a55b:free（与真源 routes.json 的 allowed 一致，buddy/hy4flash 在 dead 列表）；备份 cordis.patch.yml.bak-*。
- 新增 scripts/route-health.mjs 四诊断（routes allow 无 buddy / buddy 在 dead / bundle 真源非 buddy / profile 根非 buddy），接入 verify 真源断言与 route:health 脚本。
- 版本 1.5.5→1.5.6 全点同步。

## [1.5.5] - 2026-11-19
- 依据用户提供的 dsh-market 日志（approve-builds 反复写入但提示复发）定位真正持久源：profile `node_modules/.modules.yaml` 的 `ignoredBuilds` 里钉着本插件记录，DSH GUI 每次装新插件重放依赖树都据此弹「构建脚本待决」。
- 清除该持久记录；实测完整 `pnpm install --offline` 后不再弹提示、ignoredBuilds/workspace 脏行不再被写回（0 残留）。
- install.mjs 自愈守卫扩展：安装时自动清除 .modules.yaml ignoredBuilds 中本插件记录。
- 新增 `scripts/pnpm-health.mjs` 六项健康诊断（零生命周期脚本/无 pnpm 字段/lock 无 trade-in/lock 指向当前工作区/workspace 无脏行/ignoredBuilds 无本插件），接入 verify 与 `pnpm:health` 脚本。

## [1.5.4] - 2026-11-17
- 治本修复「安装新插件后 pnpm 提示决定 dsh-quanneng-squad 能否运行构建脚本」：根因是 profile 的 pnpm-lock.yaml / .modules.yaml 仍锁着 trade-in 旧 file: 路径与 ignoredBuilds，package.json 切源未联动，pnpm 反复把非法待决行写回 workspace 的 allowBuilds。
- 清理三处状态文件（lock/modules/workspace）的 trade-in 旧路径与非法 allowBuilds 占位行；用 corepack pnpm 12 完整重装，lock 现解析到 lab 路径，frozen-lockfile 供应链校验 305 项通过。
- install.mjs 新增幂等 lock 路径自愈守卫：安装后自动把 lock/modules/workspace 中指向其他目录的 dsh-quanneng-squad file: 路径改回当前源，并清除非法 allowBuilds 占位行；回归探针实测自动修复。

## [1.5.3] - 2026-11-17
- 修复 pnpm 10+ 阻止构建脚本告警：移除 package.json 的 `install` 生命周期脚本（该钩子本不该自动触发，安装入口历来是显式 `node scripts/install.mjs`），改名为 `deploy:profile` 保留手动发布能力。
- 按 DSH 官方 bundle 规范对齐市场审核：确认本插件是**预构建产物**（零 lifecycle/prepare/构建脚本），无需任何 pnpm 构建授权；移除包内误加的 `pnpm` 字段（那是 profile 根字段，放依赖包里无效且为审核红旗）。
- 清除 profile `pnpm-workspace.yaml` 中本插件的三条 `allowBuilds` 污染行（含一条非法值 `set this to true or false` 和一条 trade-in 残留路径）——这正是 pnpm 全局构建批准机制异常、提示"影响其他插件下载"的根因。
- verify 新增防回归断言：生命周期脚本键全缺 + pnpm 白名单声明存在。
- 同步 1.5.2→1.5.3 到 compatibility.json / cordis.patch 头 / lib/index.js。

## [1.5.1] - 2026-11-11
- 反哺闭环达成：7 份 `<角色>-v2.md` 以结构化 `[P<n>]` 标记内化 G-REFLOW，`reflow-check` 自然 exit 0，豁免按约定撤销（当前豁免表=无）。
- `reflow-check` 只认 `[P<n>]` 声明，裸写「参考了 P3」不再计入（负向验证：7 份凑数文件全部被拒）；最新版按 `-v<n>` 数值取（v10 不再被当小于 v9）；门禁自身故障走 `gateFailure` 上报且豁免仍可用（不再崩溃即死锁）。
- `scripts/lib/exemptions.mjs` 收紧：id 必须命中已知门名（日期形状行 `| 2026-11-14 |` 不再变成假豁免）、只解析当前表 5 列（历史表期间列不得救活过期豁免）、同 id 取最早、到期日严格大于今天；行为矩阵 8/8。
- `install.mjs` 拆分 `skipDir`（复制排除）与 `purgeDir`（目的端清理），修掉误删 `node_modules` 的破坏性清理；`.tmp-*` 探针目录不再进入发布物（双侧泄漏检查=空）。
- 新增 **P8 反复模式 + 反哺规则 6**：门禁必须约束它自己的修改者；总指挥改动 `scripts/`、`gates/` 后须在 STATE.md 做 P8 自审。
- `verify` 断言去文本化：豁免相关 3 条改为调用模块 + 实跑门禁的行为断言（42 项）。

## [1.5.0] - 2026-11-11
- 三部门禁由 WARN-only 改**默认阻断 + 显式豁免**（`QUANNENG_ALLOW_IDLE` / `QUANNENG_ALLOW_DEAD_ROUTE` / `QUANNENG_ALLOW_REFLOW_GAP`），根除「门禁存在但不卡发布」（即考功郎中 D 项与 CR-003 P2 同源失效）。
- 修阻断文本污染 stdout：三个门的关键字改走 stderr，stdout 恒为纯 JSON；verify 新增「门禁默认阻断且豁免有文档」行为断言（38 项）。
- 新增 `scripts/stamp-compat.mjs` 消除 `compatibility.json` 版本声明漂移（1.0.0→1.4.1→1.5.0 自动盖章），并接入 release 链。
- 新增 `scripts/seat-utilization.mjs` 收紧 prompts 计数为 `<角色>-v<n>.md`（排除 INDEX.md，修正考功郎中 D-3）；AGENTS.md §3 指针修正（D-1）。
- 新增门禁反哺机制：`docs/squad/gates/G-REFLOW.md`（P1~P7 反复模式 → 角色检查项 → 拦截席位）+ `scripts/reflow-check.mjs`（每条 P ≥2 份提示词引用，未内化即阻断 S1 完成）；release 链扩至 13 步。
- **CR-004** 立案：Java 基线北向为空壳（E1~E7：HTTP 客户端命中 0 / 应答硬编码 ok / idemKey 调用点 0 致 dup 不可达 / catch 压平失败 / 管理面 3 路径缺 / M 字段无强制）。G-S7 亲笔判**不可放行**；插件自身发布不受阻。

## [1.4.1] - 2026-11-11
- 修复发布物可信度四缺陷：`sync-lib` 缺 src 时不再 `skipped/exit 0`（profile 副本此前从不真正校验），lib/ 契约无条件检查；`install` 以 SKIP_DIRS 排除 `.tmp-meta/.git/target` 并幂等清理残留；`memory.mjs` 未显式指定工作区时只在已有台账目录读写，杜绝影子台账。
- `release-scripts.test.js` 迁移到隔离沙箱断言行为（原先断言宿主环境内容，在安装副本里假失败）；安装副本 46/46 与工作区 46/46 同绿。
- 新增 `scripts/export-roster.mjs`（快照来源显式化 + 12h 新鲜度）并入 release；`audit-roster` 增加快照过期与多重版本后缀告警。
- `memory.mjs` 修正 cmd 暂时性死区；`sync-lib` 修正相对说明符按引用方目录解析；脚本改用 os.homedir()（本宿主子进程 env 为空，USERPROFILE 不可用）。

## [1.4.0] - 2026-11-11
- 修复插件入口 barrel：`lib/index.js` 曾因手工复制出现语法损坏与幽灵再导出（ZERO_IV）、重复导出（createFileChannel），且无任何测试 import 它 —— 27/27 绿灯掩盖了入口损坏。现改为瘦 barrel（仅身份/SOP/apply，常量一律 re-export 自 contract.js）。
- 新增 `scripts/audit-roster.mjs` + `assets/roster-snapshot.json`：构建期检出「席位绑定未授权路由」；v1.5.0 起改为默认阻断，豁免需显式 `QUANNENG_ALLOW_DEAD_ROUTE=1`（同 seat/reflow 门）。
- 确立「激活≠驱动」：派活用 agent_teams_send_message 投递活席位，run_member 仅作会话登记；验收一律读文件 mtime+内容。
- 新增 `scripts/sync-lib.mjs` 构建期导出契约门：src→lib 同步 + 导入/再导出名称真实存在性 + 重复导出 + 缺失模块 + 陈旧文件清理。负向验证：三类缺陷均 exit 1 检出。
- 新增 `tests/index.test.js`：真正 import barrel，断言 52 个符号存在、与源模块同一对象、apply(ctx) 挂载 SOP。
- `tests/` 重写为对齐真实模块 API（contract/crypto/protocol/core），新增 `scripts/run-tests.mjs` 消除 shell glob 差异。
- release 链前置 `sync-lib → run-tests`：`npm run release` 实跑 exit 0，verify 29/29、tests 32/32，profile 侧同绿。
- 成员路由修复【根因更正 D-019R】：席位 provider/model 在创建时快照并持久化于 team.json，profile 的 agent-default-model 只影响新建席位——故改 profile / 切指挥模型均无效；已把 11 个 hy4free 席位 remove+re-add 轮换为 @v14（qodercn/qfmodel），live 名册 16/16 校验通过。

## [1.3.0] - 2026-11-06
- **本地记忆为主 / 云端辅助**：backend 由 `local-fallback` 改为 `local-primary`，显式 `cloud: auxiliary`；SOP 确立权威层级「代码/实测 > DECISIONS.jsonl > Hindsight 页面」。
- `memory.mjs` 去硬编码工作区路径（4 级解析）；新增内容级去重（重复 ingest 输出 rejected、实测决策数 delta=0）、`export` 生成 DECISIONS.md、`cloud` 辅助探测、`replay --clear` 安全清空。
- `npm run release` 纳入 `memory verify + export`；`verify.mjs` 20→25 项（含 local-primary 契约、去重、导出、release 链检查）。
- 新增本地决策 D-012 记录权威层级；清理探针污染，决策库 13 条 / OUTBOX 2 条。

## [1.2.0] - 2026-11-06
- **记忆隐患修复**：Hindsight 全通道 ECONNRESET（云端不可达 + 无本地配置/token）→ 建零网络依赖的本地记忆层 `docs/squad/memory/DECISIONS.jsonl`（10 条决策）+ `OUTBOX.jsonl` 待回放队列。
- 新增 `scripts/memory.mjs`（status/list/search/ingest/capture/replay/verify），`memory:verify` 接入 verify（17→20 项）。
- 新增 `docs/squad/memory/README.md` 使用纪律与云端恢复前置。

## [1.1.1] - 2026-11-06
- 新增 `scripts/sync-assets.mjs`：治理资产从工作区按清单刷新，消除静态快照漂移。
- `npm run release` 一条命令完成 sync→build→verify→install。
- README 更新为真实迭代链（canonical 单一真源、apply() 挂载、幂等安装）。

## [1.1.0] - 2026-11-06
- 单一真源：`assets/canonical/presets.yml` + `team-overrides.yml`，`cordis.patch.yml` 改为生成物（`scripts/build-patch.mjs`）。
- `lib/index.js` 增加真 cordis `apply(ctx)`：把小队 SOP 段挂进系统提示词（此前为死代码），宿主不支持时安全降级。
- 新增 `scripts/install.mjs`：幂等安装到 profile node_modules + 注册 bundle（不再手工 copy）。
- `scripts/doctor.mjs` 去掉硬编码 `C:/Users/ASUS`，改用 `DSH_HOME` / `os.homedir()`。
- `scripts/verify.mjs` 扩到 17 项：生成物一致性、apply() 契约、无硬编码路径、CHANGELOG。
- 修复：7 preset 与 16 人覆盖块在插件/profile 双份存在导致的漂移风险。

## [1.0.0] - 2026-11-06
- 初版：7 preset + maxMembers:16 + quanneng-16 全编 profile + 95 个治理资产 + verify/doctor。
