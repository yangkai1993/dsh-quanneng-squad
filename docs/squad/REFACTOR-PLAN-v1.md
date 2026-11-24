# dsh-quanneng-squad 插件重构方案 v1.0（软件工程思维）

> 2026-11-23 · 基于全仓事实盘点（71 个 JS 文件 / 6121 行 / 37 个根脚本 / 96 条 verify 断言 / 26 个 squadctl 子命令）。
> 原则：**渐进重构，每期可独立交付、全链绿、行为不回归**（Strangler Fig 模式，Refactoring/Feathers）。

## 一、现状盘点（事实）

| 维度 | 数据 |
| --- | --- |
| 总量 | 71 个 .mjs/.js，6121 行 |
| scripts/ | 根 37 个（门 18 / 编排 5 / 配置 7 / 工具 1 / 夹具 2 / 入口 4），lib 6，l4 7 |
| lib/ | 业务层（crypto 国密 / protocol 协议 / core 状态机 / transport / mock / inbound），27 文件，被 27 个测试用例覆盖 |
| verify.mjs | 546 行单文件，96 条断言，20 处硬编码工作区路径 |
| 门 | 15 个用 gate-kit runGate（组件化），17 处仍裸 process.exit |
| 硬编码 | SQUAD_ID 2 处、desktop 路径 5 处、verify 内 E:/workspace 20 处 |
| 已就绪 | config-adapter（1.10.0 新建，7 消费方接入）、gate-kit（DRY 底座）、reflow/L4/事件溯源 |

## 二、识别的问题（按危害排序）

1. **P-A verify.mjs 单体**：96 条断言挤一个文件，每加一条门就要改它；20 处硬编码绝对路径，换机器/CI 即碎。
2. **P-B 门协议不齐**：17 处裸 process.exit(1)，绕过 gate-kit 的豁免追踪/JSON 纪律，行为不一致。
3. **P-C 双真源漂移**：team-overrides/presets 改后必须手跑 build-patch，忘跑即 verify 红（已发生多次）。
4. **P-D 环境假设脆弱**：profile 名写死 desktop（config-adapter 已修，doctor/pnpm-health 部分残留）；SQUAD_ID 散落 2 处。
5. **P-E scripts/ 根 37 文件平铺**：门/编排/配置/夹具混在一起，认知负担高（可读性）。
6. **P-F lib/ 业务层与治理层无关联**：crypto/protocol/core 是早期业务遗产，测试 27 例但与治理链无消费关系（定位要明确）。

## 三、目标架构

```
scripts/
  lib/            # 共享底座（继续）
    gate-kit.mjs      # 门运行协议（已有）
    config-adapter.mjs# 配置适配（已有）
    squad-const.mjs   # [新] SQUAD_ID/编制/阶段号等常量（P-D）
    patch-sync.mjs    # [新] build-patch 逻辑抽为可导入函数（P-C）
  gates/          # [新] 18 个门按域分组（P-A/P-E）
    delivery/ result-verify stage-order seat-utilization
    routing/  route-gate route-health audit-roster dispatch-guard
    quality/  drift-check reflow-check memory-sla gate-rotation
    env/      env-guard proxy-gate
  orchestration/  # [新] autopilot pulse supervise squadctl panel-sync
  setup/          # [新] install build-patch sync-* doctor stamp-compat
  verify/         # [新] 拆 verify.mjs 为 assertions/<域>.mjs + index.mjs 汇聚（P-A）
lib/              # 业务层保持（定位：独立国密/协议内核，随包交付）（P-F 明确化）
```

## 四、分期计划（每期独立交付、release 全绿才算完成）

### 第 1 期 · 常量与真源收敛（P-D/P-C，低风险）
- 新建 `lib/squad-const.mjs`：SQUAD_ID（env 可覆盖）、MAX_MEMBERS=16、阶段号表——audit-roster/sync-seat-model 接入。
- patch-sync.mjs：build-patch 抽函数导出 `buildPatchText()`；verify 的 "generated from canonical" 断言改为调它对比（自检闭环）。
- 验收：verify 96+/0、release 全绿、无行为变化。

### 第 2 期 · verify 拆分（P-A，中风险）
- verify/ 目录：assertions/{bundle,gates,routing,orchestration,subagent-first}.mjs，每域一个文件导出 `run(ctx)`；index.mjs 聚合计数与退出码。
- 20 处硬编码路径 → config-adapter.configSnapshot()。
- 断言总数不变（96），命名不变（输出格式兼容 pulse/面板）。
- 验收：release 全绿 + run-tests 47/47 + 断言数一致。

### 第 3 期 · 门协议统一（P-B，中风险）
- 17 处裸 process.exit 迁移到 gate-kit runGate/failFast（保留各自的 items 语义）。
- 输出契约统一：stdout=JSON report、stderr=豁免/阻断留痕。
- 验收：每门"注入缺陷看是否检出"负向验证（P4 纪律）。

### 第 4 期 · 目录重组（P-E，外观性）
- scripts/ 根 37 → 分四个子目录 + 入口薄壳（squadctl/release 路径映射同步更新，MANIFEST 同步）。
- 验收：squadctl 26 子命令全通、release 链路径全通、安装副本一致。

### 第 5 期 · 业务层定位明确化（P-F，文档性）
- lib/ 声明为"独立国密/协议内核"（README 标注），治理链不依赖它；或按用户未来决策裁剪。

## 五、验收红线（每期必须满足）

1. `release` 链 exit 0；2. `run-tests` 47/47；3. verify 断言数不减；4. 安装副本与源逐字节一致；5. 无新增硬编码路径/SQUAD_ID。

## 六、明确不做

- 不改 S-1~S9 流程、六要素任务书、P1~P15 反哺、门禁语义——只动代码组织与实现质量。
- 不引入外部依赖/框架（零依赖是本插件的既有约束）。
- 不删 agent_teams/squads_run_member 兼容通道（用户已裁定保留）。
