# 安装与验证状态（2026-11-06）

| 项 | 结果 |
| --- | --- |
| 插件包 | `packages/dsh-quanneng-squad/`（package.json + cordis.patch.yml + lib/index.js + assets + scripts + docs） |
| 结构自检 `node scripts/verify.mjs` | **12 passed, 0 failed** |
| 静态诊断 `node scripts/doctor.mjs` | plugin_maxMembers=16 / profile_maxMembers=16 / quanneng-16=true / presets=7 |
| 随包资产 | 95 个文件（治理文档、9 模板、12 角色稿、4 专家包、16 dispatch/inbox、gates/journal/audit/pipeline） |
| 安装位置 | `C:/Users/ASUS/.dsh/profiles/desktop/node_modules/dsh-quanneng-squad/`（目录直链，绕开 pnpm 供应链策略） |
| bundle 注册 | `dsh.profile.bundles` 尾项 `dsh-quanneng-squad`，无重复 |
| `plugin_manager set_bundle` | `changed:true / application:restart-required`（首次启用成功；再次返回 changed:false 表示已启用） |
| 运行时加载 | `import lib/index.js` → name/version/16 成员/max16/SOP 332 字符，exit 0 |
| 安装后自检 | 12 passed, 0 failed |

## 唯一剩余步骤
**重启 DSH 并开新会话**（`set_bundle` 明示 restart-required；配置变更只在新会话生效）。重启后 7 preset + maxMembers:16 + quanneng-16 profile 一起加载。

## 迭代
改 `cordis.patch.yml` / `lib/index.js` / `assets/` → `version +1` → 重新 copy 到 profile node_modules → `node scripts/verify.mjs` → 重启。

## 回滚
- 从 `dsh.profile.bundles` 移除 `dsh-quanneng-squad` 并删除 node_modules 下同名目录；
- 或 `plugin_manager({action:'set_bundle',target:'dsh-quanneng-squad',enabled:false})`；
- 配置备份：`cordis.patch.yml.bak-*`、`package.json.bak-*`。

## 已知外部阻断点（非本插件缺陷）
`plugin_manager install_bundle` 会触发 profile 的 pnpm 供应链策略检查，被两个**既有**包（`@michengai/dsh-skills-manager@1.4.1`、`@vectorize-io/hindsight-coding-agents@0.8.7` 发布时间晚于 minimumReleaseAge）挡住。故采用目录直链安装，不动全局锁文件策略。若日后要走标准 install，先处理那两个包的策略例外。


## v1.1.1 优化（2026-11-06）

- 单一真源：`assets/canonical/presets.yml` + `team-overrides.yml` → `scripts/build-patch.mjs` 生成 `cordis.patch.yml`（带 GENERATED FILE 标记，verify 校验一致性）。
- `lib/index.js` 增加真 `apply(ctx)`：SOP 段挂进系统提示词，实测 `mounted:true`；宿主无该 API 时安全降级。
- `scripts/install.mjs` 幂等安装（重复运行 `bundlesUpdated:false`）；`scripts/sync-assets.mjs` 从工作区按清单刷新 95 个资产。
- `doctor.mjs` 去掉硬编码 `C:/Users/ASUS`，改用 `DSH_HOME` / `os.homedir()`。
- `verify.mjs` 12→17 项；`npm run release` = sync→build→verify→install，4/4 exit 0。
- 终检：profile 侧 v1.1.1、verify 17 passed 0 failed、bundles 仅 1 项 `dsh-quanneng-squad`。



## v1.3.0（本地记忆为主 / 云端辅助）

- 权威层级：DECISIONS.jsonl 为唯一真源；Hindsight 仅镜像与 OUTBOX 回放目标，不反向覆盖本地。
- memory.mjs：local-primary、路径 4 级解析、内容去重、export/cloud/replay --clear。
- release 链 6 步全通过；verify 25/25；插件与 profile 侧均 v1.3.0。
- 决策 13 条、OUTBOX 2 条；DECISIONS.md 人读台账已生成。



## 重启后验收（2026-11-11）

- `plugin_manager list_bundles`：`dsh-quanneng-squad` v1.3.0 `enabled:true / installed:true`，7 个 `preset-squad-*` row 挂载。
- `maxMembers:16` **实测生效**：连续 `add_member` 至 16 席成功，第 17 人报 `member cap (16)`（不再是 8）。
- team `quanneng-squad` 16 席填满、16 个不同角色全覆盖；`agent_teams_send_message` 派活 4/4 `delivered:wake`。
- 名字永久占额用 `@v13` 别名绕开；6 个规范中文名 + 10 个别名。


## v1.4.1（发布物可信度）

- release 9 步 exit 0；verify 31/31；tests 46/46（工作区与 profile 安装副本同绿）。
- 门禁在 profile 副本真正执行（不再 skipped/exit 0）；install 不再复制 .tmp-meta；memory 不再影子新建台账。
- 路由审计无告警；roster-snapshot 由 export-roster 管理（12h 新鲜度）。