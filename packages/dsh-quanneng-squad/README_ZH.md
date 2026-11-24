# dsh-quanneng-squad · 全能编程小队

[![CI](https://github.com/yangkai1993/dsh-quanneng-squad/actions/workflows/ci.yml/badge.svg)](https://github.com/yangkai1993/dsh-quanneng-squad/actions/workflows/ci.yml) ![version](https://img.shields.io/badge/version-1.20.0-blue) ![npm](https://img.shields.io/npm/v/dsh-quanneng-squad) ![node](https://img.shields.io/badge/node-%3E%3E%3D22-green) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

把 16 人编制、7 类 preset 与治理资产做成一个可安装、可升级、可回滚的 DSH bundle 插件。零外部依赖。

## Quick Start（5 分钟）

1. 安装：在你的 profile 里执行 node <插件目录>/scripts/install.mjs（幂等）。
2. 重启 DSH（配置只在新会话加载）。
3. 体检：node scripts/doctor.mjs → level: ok 即就绪；degraded 看 fixes；incompatible 按提示修复。
4. 快速验证：node scripts/delivery/cold-start-smoke.mjs（隔离 profile 装→诊→卸）。
5. 派活：主对话直接说任务，指挥用 subagent 自动编排（v3 架构）。

## 命令速查

| 命令 | 用途 |
| --- | --- |
| node scripts/doctor.mjs | 兼容体检三态（exit 0/1/2） |
| node scripts/verify.mjs | 结构自检（断言数见运行输出） |
| node scripts/delivery/pack.mjs --check | 发布物洁净度 |
| node scripts/delivery/upgrade.mjs [--dry-run] | 升级（失败自动回滚） |
| node scripts/delivery/rollback.mjs [--to <ver>] | 回滚 |
| node scripts/delivery/cold-start-smoke.mjs | 冷启动烟测 |
| node scripts/squadctl.mjs help | 治理门命令清单（按域分组） |

## 故障排查

| 症状 | 原因 | 处置 |
| --- | --- | --- |
| level: incompatible + patch-structure | profile 缺 preset/maxMembers | 重跑 install.mjs |
| level: incompatible + patch-source | canonical 与 patch 漂移 | 跑 build-patch.mjs |
| level: degraded + 依赖缺失 | 宿主没装 agent-teams/preset | 安装对应插件 |
| 换模型后席位不跟随 | 席位残留 model pin | sync-seat-model.mjs 清 pin |
| CodeBuddy 400 unapproved channel | 上游按 agent 请求体风控 | 纯对话/老会话用 buddy；agent 会话用 trae/qfmodel |
| pack --check 红 | 发布区混入污染文件 | 按 report.dirty 路径清理 |

## 升级与回滚

- upgrade：预检 → 备份（滚动保留 5 份）→ 安装 → doctor → 成功提交 / 失败自动回滚。
- 中断恢复：upgrade-ledger.jsonl 中 phase: pending 表示未闭合，重跑 upgrade 会识别。
- 备份位置：profile 下 .dsh-quanneng-squad-backups/。

## 架构（L0~L4 分层组件化）

- L0 契约底座：config-adapter / squad-const / patch-sync / gate-kit / round-events。
- L1 领域能力：dispatch（subagent-first）/ roster / gates / memory-l4 / sop-inject。
- L2 交付运维：pack / install / upgrade / rollback / doctor / cold-start-smoke。
- L3 用户体验：规划中（quickstart / templates / light-mode / status）。
- L4 治理横切：verify（102 断言）/ release / reflow（P1~P15）/ EXEMPTIONS / SUPERVISION。

## 版本纪律

- 见 SEMVER.md；breakingChanges 见 compatibility.json。
