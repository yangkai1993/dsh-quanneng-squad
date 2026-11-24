# dsh-quanneng-squad

[![CI](https://github.com/yangkai1993/dsh-quanneng-squad/actions/workflows/ci.yml/badge.svg)](https://github.com/yangkai1993/dsh-quanneng-squad/actions/workflows/ci.yml) ![version](https://img.shields.io/badge/version-1.20.0-blue) ![npm](https://img.shields.io/npm/v/dsh-quanneng-squad) ![node](https://img.shields.io/badge/node-%3E%3E%3D22-green) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

An installable, upgradable, rollback-able DSH bundle plugin: 16-member squad, 7 presets, governance assets. Zero external dependencies.

## Quick Start

1. Install: run `node <plugin-dir>/scripts/install.mjs` from your profile (idempotent).
2. Restart DSH (config loads only in new sessions).
3. Health check: `node scripts/doctor.mjs` → `level: ok` means ready.
4. Smoke test: `node scripts/delivery/cold-start-smoke.mjs` (isolated profile).
5. Dispatch: just state the task in the main conversation; the lead orchestrates via subagents (v3 architecture).

## Commands

| Command | Purpose |
| --- | --- |
| `node scripts/doctor.mjs` | Compatibility triage (exit 0/1/2) |
| `node scripts/verify.mjs` | Structural self-check |
| `node scripts/delivery/pack.mjs --check` | Release hygiene check |
| `node scripts/delivery/upgrade.mjs [--dry-run]` | Upgrade (auto-rollback on failure) |
| `node scripts/delivery/rollback.mjs [--to <ver>]` | Rollback |
| `node scripts/delivery/cold-start-smoke.mjs` | Cold-start smoke test |

## Architecture

- Layered: L0 contract / L1 domain / L2 delivery / L3 UX / L4 governance.
- Dispatch: main conversation + subagents (v3), no model pin, follows current main model.
- Models: unrestricted (P15); no allow/deny lists in routes.json.


## Troubleshooting / 故障排查

| 症状 | 原因 | 处置 |
| --- | --- | --- |
| level: incompatible + patch-structure | profile 缺 preset/maxMembers | 重跑 install.mjs |
| level: incompatible + patch-source | canonical 与 patch 漂移 | 跑 build-patch.mjs |
| level: degraded + 依赖缺失 | 宿主没装 agent-teams/preset | 安装对应插件 |
| 换模型后席位不跟随 | 席位残留 model pin | sync-seat-model.mjs 清 pin |
| CodeBuddy 400 unapproved channel | 上游按 agent 请求体风控 | 纯对话/老会话用 buddy；agent 会话用 trae/qfmodel |
| pack --check 红 | 发布区混入污染文件 | 按 report.dirty 路径清理 |

## License

MIT — see LICENSE.
