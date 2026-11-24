# dsh-quanneng-squad 插件重设计方案（行业标准版 v1.0）

> 2026-11-23 · 依据 npm/Node.js 生态行业标准与最佳实践，对整个插件重新设计。
> 状态：**设计文档，暂不动代码**（用户已确认）。
> 前置：五期内部重构（v1.11.0）与 L2 交付运维层（v1.12.3）已完成——本方案聚焦"行业合规与发布形态"。

## 一、对标基线（npm 官方规范 + Node.js 插件生态惯例）

| 行业标准实践 | 本插件现状 | 差距 |
| --- | --- | --- |
| files 白名单精确控制发布内容 | files 含 assets 全量（npm pack 带入 workspace 快照/L4-STATE/记忆分片） | 🔴 P0 |
| 无仓库污染 | %SystemDrive%/ProgramData/SogouInput 空目录树残留 | 🔴 P0 |
| CHANGELOG 按版本时间序 | 版本号乱序（1.9.0 在顶部，1.12.3 在中间） | 🟠 P1 |
| semver + breakingChanges 记录 | compatibility.json breakingChanges=[] 但 1.9/1.10/1.11/1.12 均有行为变更 | 🟠 P1 |
| scripts 目录 ≤15 入口（其余子目录） | 40 个 .mjs 平铺在根（有导航但物理未分组） | 🟠 P2 |
| CI（lint/test/pack 三步） | 无 .git、无 CI，验证全靠本机 release | 🟠 P2 |
| LICENSE 文件存在 | package.json 写 MIT 但仓库无 LICENSE 文件 | 🟡 P3 |
| npm pack --dry-run 校验发布物 | 自研 pack（405KB✓）与 npm files 双轨不一致 | 🟠 P1 |
| README 双语+徽章+示例 | 有双语但内容过期 | 🟡 P3 |
| 发布物只含用户所需 | 治理资产（MANIFEST 15 docs/11 dirs）与运行时混在包里 | 🟠 P1 |

## 二、目标目录结构（行业标准布局）

```
dsh-quanneng-squad/
  package.json          # files 白名单精确到文件/子目录
  LICENSE               # MIT 文本落地
  README.md / README_ZH.md  # 双语重写，徽章+Quick Start
  CHANGELOG.md          # Keep a Changelog 规范，版本时间序
  compatibility.json    # requires + configSchemaVersion + breakingChanges 补记
  cordis.patch.yml      # 生成物（build-patch 产出）
  lib/                  # 运行时（SOP 注入 + squad-const/patch-sync 引用）+ lib/README.md
  assets/canonical/     # preset 与覆盖块唯一真源
  assets/PACKAGE-*.json # 发布白/黑名单
  scripts/              # 见下方分组
    gates/              # 11 个阻断门
    delivery/           # pack/install/upgrade/rollback/cold-start-smoke（已有）
    report/             # pulse/supervise/panel-sync
    cli/                # squadctl/memory
    lib/                # gate-kit/config-adapter/squad-const/patch-sync/rotation/round-events/exemptions/workspace
    verify/             # verify.mjs + assertions/
    fixtures/           # 回归夹具
    l4/                 # L4 成熟度
  tests/                # node:test
  docs/                 # 用户文档（安装/升级/故障排查）；治理叙述留工作区不随包
```

**移出发布物的运行时状态**（保留在工作区，不随包）：assets/workspace/（157 文件）、assets/L4-STATE.json、assets/file-index.json、assets/roster-snapshot.json、.dsh-project-memory/、%SystemDrive%/（删除）。

## 三、package.json 规范化

```json
{
  "files": ["lib", "scripts", "assets/canonical", "assets/PACKAGE-ALLOWLIST.json",
            "assets/PACKAGE-DENY.json", "cordis.patch.yml", "compatibility.json",
            "README.md", "README_ZH.md", "CHANGELOG.md", "LICENSE", "docs"],
  "exports": { ".": "./lib/index.js", "./cordis.patch.yml": "./cordis.patch.yml", "./package.json": "./package.json" },
  "engines": { "node": ">=22" }
}
```

- 删除 files 中的冗余项（"assets" 全量 → 精确子路径）；
- npm pack --dry-run 与 scripts/delivery/pack.mjs 的文件清单**必须一致**（新增 verify 断言对齐双轨）；
- 保持零外部依赖约束。

## 四、版本与变更纪律

- CHANGELOG 按 Keep a Changelog 规范重排：版本降序、分类（Added/Changed/Fixed/Removed）、日期 ISO；
- compatibility.json.breakingChanges 补记：1.9.0（派活通道切 subagent-first）/1.10.0（配置适配层，config 键收敛）/1.12.0（L2 交付层，新增 delivery 组件）；
- 新增 SEMVER 纪律：MAJOR=破坏性配置/流程变更；MINOR=新组件；PATCH=修复。1.8→1.12 的跳版补记映射。

## 五、质量与 CI

- git init + .gitignore（node_modules/dist/.tmp-*.bak-*）+ 初始提交基线；
- 最小 CI（GitHub Actions 或本地 pre-commit 钩子）三步：`node scripts/verify.mjs` → `node scripts/run-tests.mjs` → `node scripts/delivery/pack.mjs --check`；
- release 链第一步加 git 状态检查（脏工作区警告，不阻断）。

## 六、文档

- LICENSE（MIT 文本）落地；
- README.md（英）+ README_ZH.md（中）重写：徽章（version/node/license）+ Quick Start + 命令速查 + 故障排查表（内容沿用 v1.12.3 已重写的版本）+ 兼容矩阵；
- 治理叙述文档（STATE/journal/audit/intel 等）留在工作区，不随插件包发布；随包只带用户需要的 docs/（安装/升级/故障排查/兼容矩阵）。

## 七、落地分期（批准后执行）

| 期 | 内容 | 出口标准 |
| --- | --- | --- |
| R1 发布卫生 | files 收口 + 删 %SystemDrive% + 运行时状态移出发布物 + npm pack 与 pack.mjs 清单对齐断言 | npm pack --dry-run = pack.mjs 清单，零污染 |
| R2 规范补齐 | CHANGELOG 重排 + breakingChanges 补记 + LICENSE + SEMVER.md | 三文件齐且格式合规 |
| R3 目录重组 | scripts 物理分组（每移动一个文件跑全链）+ MANIFEST 更新 | release 全绿、squadctl 26 命令全通 |
| R4 CI 与文档 | git init + 最小 CI + README 双语重写 + 兼容矩阵 | CI 三步绿、文档齐 |

## 八、验收红线（沿用）

release exit0 · tests 47/47 · verify 断言不减（当前 100）· 安装副本与源逐字节一致 · 零外部依赖 · 用户模型块不被覆盖。

## 九、风险与缓解

- 目录重组打断 import：每移动一个文件跑一次 verify（第4期教训：40 处相对 import）——R3 分小步执行；
- npm files 收口导致漏发文件：npm pack --dry-run 与 pack.mjs 双轨断言兜底；
- CHANGELOG 重排时丢失历史：先备份原文件再重写。

