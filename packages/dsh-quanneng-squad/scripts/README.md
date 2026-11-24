# scripts/ 目录导航（第4期重构 · 逻辑分组，零物理移动）

> 37 个根脚本按职责逻辑分组。物理路径保持不变——避免打断 40 处相对 import、release 链 33 个命令路径与 96 条断言里的脚本路径引用。
> 分组即文档：认知按域定位，工具按原名调用。

## 门禁（阻断型，统一 gate-kit runGate 协议）（15）

- `audit-roster.mjs`
- `dispatch-guard.mjs`
- `drift-check.mjs`
- `env-guard.mjs`
- `gate-rotation.mjs`
- `lead-scope-check.mjs`
- `memory-sla.mjs`
- `memory.mjs`
- `pnpm-health.mjs`
- `proxy-gate.mjs`
- `reflow-check.mjs`
- `route-gate.mjs`
- `route-health.mjs`
- `seat-utilization.mjs`
- `stage-order.mjs`

## 编排与观测（6）

- `panel-sync.mjs`
- `pulse.mjs`
- `squad-autopilot.mjs`
- `squadctl.mjs`
- `supervise.mjs`
- `update-file-index.mjs`

## 配置/安装/同步工具（8）

- `build-patch.mjs`
- `doctor.mjs`
- `export-roster.mjs`
- `install.mjs`
- `stamp-compat.mjs`
- `sync-assets.mjs`
- `sync-lib.mjs`
- `sync-seat-model.mjs`

## 验证器（薄壳 index + 4 域断言模块）（3）

- `pre-verify.mjs`
- `result-verify.mjs`
- `verify.mjs`

## 回归夹具（负向验证）（4）

- `env-guard-fixture.mjs`
- `evolution-fixture.mjs`
- `proxy-gate-fixture.mjs`
- `source-of-truth-fixture.mjs`

## 入口/预检（1）

- `run-tests.mjs`

## 子目录

- `lib/` — 共享底座（gate-kit / config-adapter / squad-const / patch-sync / rotation / round-events / exemptions / workspace）
- `l4/` — L4 成熟度推进（7 文件）
- `verify/assertions/` — verify 的 4 域断言模块（第2期拆分产物）
