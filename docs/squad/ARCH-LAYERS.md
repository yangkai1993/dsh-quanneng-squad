# dsh-quanneng-squad 分层架构总纲（L0~L5 全层定义 v1.0）

> 2026-11-23 · 用户要求"补齐插件 L1-L5 的设计"。本文件是六层架构的**唯一总纲**，
> 每层定义：使命/组件清单/接口契约/验收标准/当前状态。逐层独立交付、逐层验收。
> 组件准入四条不变：边界单一 / 接口稳定 / 自带行为断言+负向验证 / 可独立交付。
> 横切规则：上层只依赖下层公开契约，下层不反向依赖上层；L4 治理横切 L0~L3。

## 层级总览

| 层 | 名称 | 使命 | 状态 |
| --- | --- | --- | --- |
| L0 | 契约底座 | 全插件唯一稳定基础设施 | ✅ 成熟 |
| L1 | 领域能力 | 小队核心业务能力 | ✅ 成熟（本文件补齐设计缺口） |
| L2 | 交付运维 | 可装/可升/可退/可诊 | ✅ 成熟（1.12.3 完成） |
| L3 | 用户体验 | 降低门槛/提高频率/价值可见 | 🟡 设计在本文件补齐 |
| L4 | 治理横切 | 保证变更不破坏整体 | ✅ 成熟 |
| L5 | 可观测 | 统一运行时观测与诊断出口 | 🟡 设计在本文件补齐 |

---

## L0 · 契约底座

**使命**：全插件唯一稳定基础设施，所有层只依赖 L0 公开契约。

### 组件

| 组件 | 文件 | 接口契约 | 验收 |
| --- | --- | --- | --- |
| config-adapter | scripts/lib/config-adapter.mjs | resolveProfileDir / resolveProfilePatch / sliceBlock / readDefaultModel / configSnapshot | snapshot 解析出当前模型；7 消费方接入 |
| squad-const | scripts/lib/squad-const.mjs | SQUAD_ID / SQUAD_NAME / MAX_MEMBERS / STAGES / STAGE_ARTIFACTS | audit-roster/sync-seat-model 接入 |
| patch-sync | scripts/lib/patch-sync.mjs | buildPatchText(root) / syncPatchFile(root) → {text,bytes,changed} | buildPatchText(root)===patch() 字节级 |
| gate-kit | scripts/lib/gate-kit.mjs | runGate(o) / failFast(code) / TERMINAL_RE / PENDING_RE / cn2num / maxBriefRound / roundOf | 11 个阻断门统一协议 |
| rotation | scripts/lib/rotation.mjs | currentRotation(W) → {round,rows,current} | 轮次=事件日志派生读模型 |
| round-events | scripts/lib/round-events.mjs | 不可变事件日志（JSONL），ROUND_ADVANCE 唯一写入口 | 叙述篡改不驱动轮次（P14 夹具） |
| exemptions | scripts/lib/exemptions.mjs | traceExemption(name,var,count,W,kind) | 豁免解析 fail-closed/最早到期/typo 忽略 |
| workspace | scripts/lib/workspace.mjs | resolveWorkspace(explicit) / PKG_DIR / LAB_ROOT | 测试注入工作区 |

### 验收

- buildPatchText(root)===patch() 字节级（P-C 闭环）；
- configSnapshot 解析出当前模型；
- 轮次=事件日志派生（篡改 STATE 不生效，source-of-truth-fixture 7 场景绿）。

---

## L1 · 领域能力

**使命**：小队核心业务能力，可独立升级，不依赖 L2/L3/L5。

### 组件

| 组件 | 文件 | 接口契约 | 验收 |
| --- | --- | --- | --- |
| dispatch | scripts/delivery/* + squad-autopilot.mjs | upgrade({source,profileDir,dryRun,force,autoRollback}) / smoke({keep}) / dispatch 计划生成 | 四路径（成功/失败/dry-run/中断恢复）|
| roster | assets/roster-snapshot.json + sync-seat-model.mjs | syncSeatModels() 清 pin 跟随宿主默认 / export-roster --from-file/--seats | 16 席零 pin / 无 model 字面量 |
| gates | scripts/*-gate.mjs / *-guard.mjs / *-check.mjs（11 门）| runGate({name,varName,kind,items,W,report}) + failFast | 注入缺陷→红（P4 负向验证）|
| memory-l4 | scripts/memory.mjs + scripts/l4/*.mjs | ingest/verify/export/replay + maturity/run/sync-ledger/proposals | L4 hard-green；memory CLI 契约 |
| sop-inject | lib/index.js apply(ctx) | apply(ctx) → {mounted,members,config}；squadUsageSection() | SOP 段挂进系统提示词，宿主不支持时安全降级 |

### 验收标准（L1 独立验收，五条机器可判）

| # | 组件 | 验收标准 | 判定方式 |
| --- | --- | --- | --- |
| 1 | dispatch | 四路径全绿：成功提交 / 失败自动回滚 / dry-run 零写盘 / 中断恢复（ledger pending 识别） | delivery/upgrade.mjs 四路径行为断言 |
| 2 | roster | 16 席零 model pin；脚本无 model 字面量；syncSeatModels() 幂等 | verify sync-seat-model 断言 + roster-snapshot.json 检查 |
| 3 | gates | 11 个阻断门统一 gate-kit runGate/failFast 协议；注入缺陷→红（P4 负向验证） | verify 各门接入断言 + fixture 负向用例 |
| 4 | memory-l4 | L4 成熟度 hard-green（11 项判据全通过）；memory CLI 四命令（status/replay/verify/export）可用 | l4/maturity.mjs exit0 + memory CLI 实跑 |
| 5 | sop-inject | apply(ctx) 在宿主有/无 prompt-section API 时均不抛异常；SOP 段含【通道·subagent-first】；零硬编码路径 | lib/index.test.js apply(ctx) mounts SOP section + SOP 内容断言 |

### 缺口收编（1.15.0 已落地）

1. ✅ dispatch 计划生成已抽为 `scripts/lib/dispatch-plan.mjs` `createDispatchPlan({round,w,seats,cards}) → {jobs[],missingCards[]}`（B6 sandcastle 返回形态）；autopilot --dispatch 薄壳调用。
2. ✅ roster 读写已收编 `scripts/lib/roster.mjs` `read()/write()/clearPins()`；export-roster 已接入。
3. 配套新增：`scripts/lib/event-store.mjs`（EVENT_TYPES 六类+TOKEN_TRANSITIONS+fail-closed 读取+唯一写入口 appendEvent）、`scripts/state-machine-gate.mjs`（令牌状态机门，T1/T2/T3 三检查）、round-events 命令层扩容（cmdDispatch/cmdReport/cmdAccept/cmdReject/cmdNoteDiscrepancy）。

---

## L2 · 交付运维

**使命**：把 L1 能力可靠地送到用户机器上：可装、可升、可退、可诊。

### 组件（详细设计见 docs/squad/L2-DELIVERY-DESIGN.md）

| 组件 | 文件 | 接口契约 | 验收 |
| --- | --- | --- | --- |
| pack | scripts/delivery/pack.mjs + assets/PACKAGE-ALLOWLIST/DENY.json | buildDist({source,target,allowlist,denylist,force}) / --check | 405KB/71 文件；负向污染检出；哈希幂等 |
| install | scripts/install.mjs | installToProfile 幂等；用户模型块保留；lock 修复 | 二次执行 patchSynced=false |
| upgrade | scripts/delivery/upgrade.mjs | upgrade({source,profileDir,dryRun,force,autoRollback}) | 四路径（成功/失败/dry-run/中断恢复）|
| rollback | scripts/delivery/rollback.mjs | rollback({profileDir,backupId,toVersion}) | doctor≥degraded；链式回滚 |
| lifecycle | scripts/delivery/lifecycle.mjs | createBackup(N=5滚动) / listBackups / restoreBackup / ledgerAppend / ledgerPending | 备份完整性校验 |
| cold-start-smoke | scripts/delivery/cold-start-smoke.mjs | smoke({keep}) → {ok,steps,doctorLevel} | 隔离 profile；不碰真实配置 |

### 验收

- release 全链 exit0（含末端 smoke）；
- 包体 <500KB（pack 白名单发布）；
- 用户模型块不被覆盖。

---

## L3 · 用户体验（本文件补齐设计缺口）

**使命**：降低使用门槛、提高使用频率、让价值可见。

### 组件

| 组件 | 文件（规划） | 接口契约 | 验收 |
| --- | --- | --- | --- |
| quickstart | scripts/ux/quickstart.mjs | quickstart(intent) → {seat, prompt, token, domain}——一句话任务 → 可复制 subagent prompt（squadRole+六要素自动补全） | 新用户 5 分钟内派出第一个任务 |
| templates | assets/ux/templates.json + scripts/ux/templates.mjs | templates.list() / templates.get(name) → {prompt,seat,domain}——预置高频场景模板（改 bug/写测试/评审/文档/查问题 ≥5 个） | 每模板一条命令可用 |
| status | scripts/ux/status.mjs | status() → {version, doctor, lastDispatch, pendingTokens, model}——人话版运行状态 | 一条命令回答"现在什么情况" |
| light-mode | lib/index.js + scripts/ux/light-mode.mjs | lightMode(intent) → 自动补全令牌/六要素/写域——降低首次成功门槛 | 一句话任务零配置可跑 |
| feedback | scripts/ux/feedback.mjs | feedback({issue, seat}) → 写入 G-REFLOW 候选池 | 反馈进反哺闭环 |

### 验收

- quickstart 零配置产出可用 prompt；
- status 一条命令覆盖版本/健康/最近派单/在途令牌；
- 每次派单在对话里回一行摘要（用户无需翻工作区文件）；
- light-mode 下派单步骤 ≤1 步。

### 依赖

- 只依赖 L0（config-adapter/squad-const/gate-kit 的只读部分）与 L1 的 dispatch 契约；
- 不反向依赖 L2（交付运维）——L3 是用户侧，L2 是机器侧。

---

## L4 · 治理横切

**使命**：保证每层组件变更不破坏整体；每轮行为可审计。

### 组件

| 组件 | 文件 | 接口契约 | 验收 |
| --- | --- | --- | --- |
| verify | scripts/verify.mjs + verify/assertions/*.mjs | 110 条断言按域分组，薄壳 index 聚合 | 断言数不减 |
| release | package.json scripts.release（33 步链） | env-guard→sync→patch→memory→fixtures→gates→verify→tests→smoke→install | 全链 exit0 |
| reflow | scripts/reflow-check.mjs + docs/squad/gates/G-REFLOW.md | [P<n>] 结构化声明 + 覆盖统计 | 每条 P≥2 份提示词 |
| EXEMPTIONS | docs/squad/gates/EXEMPTIONS.md + lib/exemptions.mjs | 豁免=登记+到期日+stderr 留痕 | fail-closed/最早到期/typo 忽略 |
| SUPERVISION | scripts/supervise.mjs → SUPERVISION.json | 时刻监督三件套产出 | gates 全对象/最新批次实测 |
| G-REFLOW | docs/squad/gates/G-REFLOW.md | P1~P15 反哺模式累加点 | ≥2 份提示词内化 |

### 验收

- verify 断言数不减（当前 110，1.15.0 补 6 条事件源断言）；
- release 链 exit0（每期红线）；
- 负向验证（注入缺陷→检出）。

---

## L5 · 可观测（本文件补齐设计缺口）

**使命**：统一运行时观测与诊断出口——用户/CI/宿主三者从同一个地方拿到运行状态。

### 现状问题（补齐动机）

- pulse/supervise/doctor/route-health/pnpm-health 五个脚本各自输出 JSON，格式不统一，用户要跑 5 条命令才知道全貌；
- 无统一诊断入口，出问题时用户不知道先跑哪个。

### 组件

| 组件 | 文件（规划） | 接口契约 | 验收 |
| --- | --- | --- | --- |
| observability-hub | scripts/observability/hub.mjs | hub() → 聚合 doctor/route-health/pnpm-health/supervise/pulse 五源 JSON，输出统一 {level, sources, summary} | 一条命令出全貌 |
| telemetry | scripts/observability/telemetry.mjs | telemetry.record(event) → 本地 JSONL 追加（派单/门/升级事件）| 事件可回放 |
| diagnostics | scripts/observability/diagnostics.mjs | diagnostics(issue) → 根据症状路由到对应诊断（"模型不跟"→sync-seat-model；"pack红"→pack --check；"通讯断"→agent_teams_status）| 症状→诊断路由表 |

### 接口契约

- hub 聚合不执行重逻辑：调各源现有 CLI（子进程），只做格式归一与汇总；
- telemetry 事件仅本地 JSONL（零外部依赖），不做网络上报；
- diagnostics 路由表是数据（JSON），非硬编码 if-else。

### 验收

- hub 一条命令聚合五源输出，level 三态一致（与 doctor 对齐）；
- telemetry 事件可被回放（replay 命令）；
- diagnostics 按症状路由（"模型不跟"→给出清 pin 建议）。

### 依赖

- 只依赖 L0 与 L2 doctor 的公开契约；
- 不依赖 L3（用户体验层）。

---

## 横切规则（适用于所有层）

1. **依赖方向**：上层只依赖下层公开契约；下层不反向依赖上层；L4 横切 L0~L3。
2. **验收四条**：每个组件边界单一/接口稳定/自带断言+负向验证/可独立交付。
3. **零外部依赖**：全插件不引入 npm 外部运行时依赖（既有约束）。
4. **不锁死模型**：任何层不得硬编码 provider/model 字面量（P15）。
5. **发布卫生**：L2 pack 白名单为唯一发布真源；运行时状态不入发布物。
6. **事件溯源**：轮次/令牌等控制真源=不可变事件日志，叙述文档只读。

## 落地优先级（从当前状态出发）

| 优先级 | 层 | 动作 | 理由 |
| --- | --- | --- | --- |
| P0 | L3 | 实现 quickstart + status + templates（light-mode/feedback 随后） | 使用频率是当前最大瓶颈 |
| P1 | L5 | 实现 observability-hub + diagnostics | 一条命令出全貌，降低诊断成本 |
| P2 | L1 | dispatch/roster 内部重构（抽独立接口） | 零行为变化，不阻塞 |
| P3 | L0~L5 | 持续维护（每层组件按四条准入更新） | 常态 |

