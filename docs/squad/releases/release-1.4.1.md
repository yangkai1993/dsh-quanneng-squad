# 发布验证报告 · dsh-quanneng-squad v1.4.1（S7 · 独立复跑）

- 席位：交付发布经理@v14 ｜ 阶段：S7 运维与发布 ｜ 任务：P-004 T14
- 时间：2026-11-11 15:0x（本机） ｜ 判定：**有条件可发（Conditional GO）**
- 环境：node v24.16.0（D:\Programs\Dev\nodejs\node.exe）/ npm 11.13.0 / win32 / 工作区 E:\workspace\trade-in
- 独立性声明：全部命令由本席亲自实跑，逐条记录 exit 与关键输出；未引用指挥结论。

## 1. npm run release（11 步链）— exit 0 ✅

链：sync-lib → sync-assets → build-patch → memory verify → memory export → verify → run-tests → export-roster → audit-roster → seat-utilization → install

| # | 步骤 | 关键输出（实测） | exit |
| --- | --- | --- | --- |
| 1 | sync-lib.mjs | srcSynced:true, libFiles:21, refreshed:[], removedStale:[], **errors:[]** | 0 |
| 2 | sync-assets.mjs | synced:97, missing:[] | 0 |
| 3 | build-patch.mjs | generated cordis.patch.yml (40153 bytes) from canonical sources | 0 |
| 4 | memory verify | backend:"local-primary", ok:true, decisions:28, problems:[] | 0 |
| 5 | memory export | exported 28 decisions -> docs/squad/memory/DECISIONS.md | 0 |
| 6 | verify.mjs | **35 passed, 0 failed** | 0 |
| 7 | run-tests.mjs | **tests 46 / suites 12 / pass 46 / fail 0**, duration_ms 3552 | 0 |
| 8 | export-roster.mjs | {"skipped":"snapshot already fresh (<12h)","takenAt":"2026-11-11T06:23:54.950Z"} | 0 |
| 9 | audit-roster.mjs | profileDefaultModel:"qodercn/qfmodel", seats:16, **warnings:[]** | 0 |
| 10 | seat-utilization.mjs | seats:16, utilized:13, idleCount:3（见 §4） | 0 |
| 11 | install.mjs | installedTo:...\\node_modules\\dsh-quanneng-squad, bundlesUpdated:false, version:"1.4.1" | 0 |

## 2. 双侧实跑（源侧 vs 安装副本）

安装副本：C:\Users\ASUS\.dsh\profiles\desktop\node_modules\dsh-quanneng-squad（v1.4.1）

| 命令 | 源侧 packages/... | 安装副本 profile/... |
| --- | --- | --- |
| node scripts/verify.mjs | exit 0，**35 passed, 0 failed** | exit 0，**35 passed, 0 failed** |
| node scripts/run-tests.mjs | exit 0，46/46 pass，fail 0（3535ms） | exit 0，46/46 pass，fail 0（3274ms） |
| node scripts/seat-utilization.mjs | exit 0，utilized 13 / idle 3 | exit 0，同输出（读同一工作区） |
| node scripts/audit-roster.mjs | exit 0，warnings:[] | exit 0，warnings:[] |

关键通过项（双侧同）：apply(ctx) mounts SOP section；profile has exactly 16 members；export contract gate present (sync-lib)；plugin barrel has a dedicated import test；release chain runs the gate before install；seat utilization gate exists and gates release；entry barrel test asserts 52 public symbols。
入口测试实跑：tests/index.test.js 5 项全绿（barrel 可 import、52 符号真实存在、re-export 与源模块同一对象、apply 挂载、无 host API 时安全降级）。
路由审计实跑：16 席位快照（takenAt 距运行 40 分钟，<12h/24h 阈值），死路由与多重版本后缀（@v13@v14）均无告警。
语法门（本席附加）：node --check 遍历 lib/ 全部 21 个 .js/.mjs → 0 failures。
发布物一致性（sha256 前 12 位，release 第 11 步之后）：package.json d4b1e204b976 / cordis.patch.yml f2ed3f650c0d / lib/index.js 79996fe81956 / verify.mjs aacfb96e06c6 / run-tests.mjs 9fc6c512a4ae / seat-utilization.mjs e71fe95a55fc — 两侧**全部 SAME**。

## 3. 本次实跑发现的缺陷（不粉饰）

1. **[中] 安装副本 release 链缺第 10 步**：本次运行前，profile 副本 package.json 的 release 串不含 seat-utilization.mjs（源侧含），且副本 scripts/ 无该文件——即 1.4.1 上次发布到 profile 的发布物落后于源。本次 release 的 install 步骤已把它补齐（补齐后两侧哈希 SAME）。根因是 install 为链末单步、非原子：链中途失败会留下旧 profile 副本且无回滚点。
2. **[中] compatibility.json 版本漂移**：仍为 "version":"1.0.0"，而 package.json 为 1.4.1；verify.mjs 只检查该文件存在，不校验版本/要求一致性 → 兼容性声明实际失效（requires.node ">=22" 与本次 node 24 相符，属侥幸）。
3. **[低] 门禁形同虚设**：seat-utilization 与 audit-roster 默认 WARN-only，需 QUANNENG_STRICT_SEATS=1 / QUANNENG_STRICT_ROUTE=1 才 exit 1；release 链未设 STRICT 变量，故 idle 席位与死路由**不会卡住发布**（本次两者均 exit 0 且有 idle 席位）。
4. **[低] 路由审计依据快照非实时名册**：export-roster 本次 skipped（<12h），audit 结论建立在 40 分钟前的 roster-snapshot.json 上；名册若刚轮换，审计会假绿。
5. **[低] 工作区非 git 仓库**：git status → "not a git repository"，发布物与治理资产无版本控制回滚点，回滚只能依赖 profile 的 package.json.bak-1794364873638 与人工备份。
6. **[信息] 宿主子进程 execPath 为 Electron**：用 process.execPath 直接跑脚本会附带 GPU/disk cache 错误噪声（不影响脚本 exit code）；本报告全部复核统一改用真实 node v24.16.0。

## 4. 席位利用率（本席产物门）

release 链第 10 步实跑（写本文之前）：utilized 13 / idle 3 →
**前端经理 @ S4 可用性评审**、**交付发布经理 @ S7 发布验证**（本文即补齐）、**考功郎中 @ S8 度量**。
写域判定只看文件名：docs/squad/releases/^release-.*\.md$。本报告落盘后本席 artifacts ≥1（见 §6 复跑）。

## 5. 发布判定与前置

**判定：有条件可发。** 依据：11 步链 exit 0、verify 35/35、tests 46/46 双侧同绿、入口契约门无错误、路由审计无告警、两侧发布物逐文件哈希一致——发布物本身可信；阻塞项集中在门禁效力与元数据（缺陷 2/3），不改变产物行为。

发版前置（发版前必须完成，均可小改）：
- P1 修 compatibility.json 版本/要求漂移，并在 verify.mjs 增加"compatibility.version == package.version"断言（缺陷 2）。
- P2 release 链给两个审计步骤挂 STRICT：QUANNENG_STRICT_SEATS / QUANNENG_STRICT_ROUTE，或在 SOP 明示"WARN-only 为有意设计"并写进出门门判定（缺陷 3）。
- P3 补齐剩余 2 个 idle 席位必产物（前端经理 usability-*.md、考功郎中 metrics/*.md），或当场在 FUNCTION-LEDGER 重定义其工序（§4）。
- P4 install 改两段式（复制到 .staging → 原子 rename），并在 install 前保留上一版本目录副本供回滚（缺陷 1）。
- P5 发版动作本体：重启 DSH + 开新会话（install.mjs 明示 restart-required；本次 bundlesUpdated:false 表示 bundle 已注册、无需再改配置），新会话内确认 7 preset 挂载、maxMembers:16、SOP 段生效。
- P6 audit-roster 前强制 export-roster 取实时名册（或把新鲜度阈值降到发布窗口内）（缺陷 4）。

## 6. 回滚步骤（可执行）

1. **撤回 bundle（首选，两步其一）**
   - 工具法：plugin_manager({action:"set_bundle", target:"dsh-quanneng-squad", enabled:false}) → 返回 application:"restart-required" → 重启 DSH 并开新会话生效。
   - 配置法：编辑 C:\Users\ASUS\.dsh\profiles\desktop\package.json，从 dsh.profile.bundles 数组删除 "dsh-quanneng-squad" 条目；或直接恢复同目录备份 package.json.bak-1794364873638；重启生效。
2. **移除安装副本**：删除 node_modules\dsh-quanneng-squad 目录（rmSync recursive），或把上一版发布物整目录回拷。删目录前先做一份带版本号的备份，因为工作区无 git（缺陷 5）。
3. **回滚生成物**：cordis.patch.yml 是 build-patch 的生成物，改 canonical 源（assets/canonical/presets.yml、team-overrides.yml）后重跑 npm run build 即可回到目标版本；勿手改 cordis.patch.yml。
4. **回滚治理资产**：assets/workspace 由 sync-assets 按 MANIFEST 从工作区刷新，回滚须还原工作区文档；建议发布前对 docs/squad/{gates,pipeline,memory} 做时间戳备份。
5. **记忆台账**：docs/squad/memory/DECISIONS.jsonl 为 local-primary 唯一真源，回滚**不要**用 memory replay --clear（显式破坏性）；如需撤销某决策，追加更正条目（同 D-019R 做法）。
6. **回滚验证**：回滚后依次跑 node scripts/verify.mjs 与 node scripts/run-tests.mjs，确认目标版本绿；再 plugin_manager list_bundles 查 dsh-quanneng-squad 的 enabled/version。

## 7. 写域与副作用披露（本席边界自证）

- 本席**主动新建/写入**的文件仅一个：docs/squad/releases/release-1.4.1.md（含新建 docs/squad/releases/ 目录）。src/、gateway-java/、docs/squad/prompts、docs/squad/intel、roles/、AGENTS.md、STATE.md、他人 inbox 均未由本席写入。
- 实跑 npm run release 作为发布链本身产生的写入（非本席手工编辑，属被验收对象的既定行为）：
  · scripts/sync-lib.mjs → packages/dsh-quanneng-squad/lib/（本次 refreshed:[] / removedStale:[]，无实际改动）
  · scripts/sync-assets.mjs → packages/.../assets/workspace/（97 项与工作区一致）
  · scripts/build-patch.mjs → cordis.patch.yml（生成物，字节与既有副本一致）
  · scripts/memory.mjs export → docs/squad/memory/DECISIONS.md（28 条重导出）
  · scripts/install.mjs → profile node_modules/dsh-quanneng-squad（补齐第 3 节缺陷 1 的滞后发布物）；本次 bundlesUpdated:false ⇒ **未改动 profile package.json**，无新 bak 产生（现存 package.json.bak-1794364873638 为历史遗留）
- 结论：除必产物外零手工写入；链内写入全部可逆，逆序即 §6。
