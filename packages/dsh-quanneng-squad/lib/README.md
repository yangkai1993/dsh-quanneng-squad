# lib/ — 独立国密/协议内核

> 第5期重构定位说明（2026-11-23）

本目录是全能小队插件的业务内核：国密（SM2/SM3/SM4）、协议适配、状态机、编排、存储与 mock/inbound/transport。

## 定位

- **独立内核**：lib/ 自成一个完整的业务能力层，由 27 个测试用例（contract/core/crypto/protocol）覆盖，可被任何宿主或独立程序直接 import。
- **与治理链解耦**：lint/verify/release/reflow 等治理脚本只 import lib/index.js 的 SOP 段与常量（第1期已收敛到 squad-const/patch-sync），业务符号（sm2/sm4/state/orchestrator 等）不被治理链消费。
- **不随架构切换变动**：v3 subagent-first 改的是"谁执行任务"，本目录的国密/协议实现不受影响。

## 约束

- 零外部依赖（沿用插件既有约束）。
- lib/index.js 是唯一公共出口，业务符号 re-export 自 ./contract.js 等子模块（P11 组件化门禁校验无内联重复）。
