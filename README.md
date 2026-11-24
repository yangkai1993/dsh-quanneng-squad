# DSH Squad Lab · 智能体与插件独立迭代工作区

> 第一性原理：插件与智能体是独立产品，完全自包含于本工作区。
> 本工作区是**唯一源码真源（SSOT）**，也是小队运转的**唯一依赖**；不再依赖任何外部业务项目。

## 目录职责
- `packages/dsh-quanneng-squad/`：DSH 插件源码（门/脚本/资产/测试）
- `agent-assets/`：智能体资产（roles / squad-toolkit / expert-packs / templates / docs-squad）
- `governance/`：本工作区自己的决策与情报账本，不混业务账
- `scripts/`：工作区级工具（发布到 DSH profile；不再向任何外部项目投影）
- `releases/`：发布产物与安装记录

## 自包含运转（无外部项目依赖）
1. 源=本工作区；小队运转（契约/门/资产/记忆/SOP）全部从本工作区读取。
2. `scripts/sync-to-projection.mjs` 已停用（默认 inert），不再向任何外部项目写副本。
3. 任何智能体/插件改动只落本工作区，经 `scripts/publish-to-profile.mjs` 发布到 DSH profile。

## 与 DSH profile 的关系
插件经 `scripts/install.mjs` 安装到 `~/.dsh/profiles/desktop/node_modules/dsh-quanneng-squad`；
profile 的 `package.json` 依赖应改为 `file:E:/workspace/dsh-squad-lab/packages/dsh-quanneng-squad`。

## 迭代纪律
- 任何智能体/插件改动只落本工作区，再发布到 profile。
- 门/夹具/真源改动必须带行为验证；原样报告 exit code（P14）。


## 工作区根实际结构（迁移完成 2026-11-17）
- `docs/`、`gateway-java/`、`src/`、`deploy/`、`config/`、`roles/`、`squad-toolkit/`、`expert-packs/`、`templates/`、`.analysis/` 均为工作区根一等资产（被契约/门/智能体引用）。
- `agent-assets/` 是上述目录的本工作区归档副本（仅供溯源，不参与运转）。
- profile 依赖已切到本工作区（`file:E:/workspace/dsh-squad-lab/packages/dsh-quanneng-squad`），小队运转零外部项目依赖。
- 独立 release 已验证：exit 0 / verify 88/0 / tests 47/47 / L4 到达。
