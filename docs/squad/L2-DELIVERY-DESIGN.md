# L2 交付运维层 · 组件设计（v1.0 · 待审）

> 2026-11-23 · 依据 docs/squad/REFACTOR-PLAN-v1.md 的分层原则，本设计只定义 L2 层组件。
> 层级约束：L2 只依赖 L0 契约底座（config-adapter / squad-const / patch-sync / gate-kit）与 Node 标准库；
> 不反向依赖 L1 业务门的实现（doctor 如需门状态，走子进程 + JSON 契约的松耦合调用）。
> 本轮只出设计，不实现代码。

## 0. L2 层定位

| 项 | 内容 |
| --- | --- |
| 层使命 | 把 L1 能力可靠地送到用户机器上：可装、可升、可退、可诊 |
| 上线阻断现状 | L2 只有 install 一个组件；pack/upgrade/rollback/doctor(能力探测) 全缺 |
| 组件清单 | pack · install(接口化) · upgrade · rollback · doctor(升级) · cold-start-smoke |
| 不做什么 | 不改 L0 底座、不改 L1 业务门、不改 L4 治理；不重写 install 已有能力，只补接口与编排 |
| 组件准入四条 | ①边界单一 ②接口稳定（对外只暴露契约） ③自带行为断言+负向验证 ④可独立交付 |

## 1. pack · 发布物构建组件

### 职责与边界
从源目录生成纯净发布物。发布策略从「列哪些同步」反转成「白名单允许哪些发布」——解决 3.7MB/298 文件混入搜狗输入法 bin、内部记忆分片、93KB STATE.md 的上线阻断。
边界文件：scripts/delivery/pack.mjs + assets/PACKAGE-ALLOWLIST.json + assets/PACKAGE-DENY.json。

### 接口契约
- 纯函数：buildDist({ source, target, allowlist, denylist }) → { files[], bytes, manifest }
- CLI：node scripts/pack.mjs [--out dist] [--check]
- --check 只校验现有 dist 洁净度与哈希，不改盘（供 verify/release 调用）
- 发布物清单固定：package.json / cordis.patch.yml / compatibility.json / README.md / CHANGELOG.md / lib/**（不含内部记忆） / scripts/**（不含夹具与探针） / assets/canonical/** / assets/PACKAGE-ALLOWLIST.json / dist/MANIFEST.sha256

### 输入/输出契约
- 输入：allowlist（显式白名单，缺失即 fail-closed）；denylist（默认含 %SystemDrive%、.dsh-project-memory、assets/workspace/docs/squad/STATE.md、*.bak-*、.tmp-*）
- 输出：dist/ 目录 + MANIFEST.sha256（逐文件 sha256 前缀）；stdout 为 JSON report
- 退出码：0=洁净；1=白名单缺失/污染检出；2=目标不可写

### 验收标准（组件自带断言）
- 包体 < 500KB 且文件数 < 80；
- 从 dist/ 安装后 doctor 返回 ok（冷启动烟测的前置）；
- 负向验证：故意注入 deny 模式文件 → pack --check 必须红并列出污染路径；
- 幂等：连续两次 buildDist 的 MANIFEST.sha256 完全一致；
- 独立交付：改 allowlist 不需要动任何 L0/L1 文件。

### 失败路径
白名单文件缺失 → fail-closed 不出包；污染文件命中 denylist → 列出路径并阻断；目标目录非空且非 --force → 拒绝覆盖。

## 2. install · 安装组件（现有能力接口化）

### 职责与边界
把源目录或 dist 安装到 profile node_modules、注册 bundle、保留用户模型块、修复 lock。现有 scripts/install.mjs 保留全部行为，只抽出可调用接口。

### 接口契约
- 纯函数化入口：installToProfile({ profileDir, source, backup }) → { installedTo, backupId, patchSynced, seatModelSync, bundlesUpdated, lockHealed }
- CLI 保持：node scripts/install.mjs（输出键不变，兼容现有 verify 断言）
- backup=true 时先写 .dsh-quanneng-squad-backups/<ts>-<version>/ 快照（供 rollback 用）

### 验收标准
- 幂等（二次执行 patchSynced=false 且文件字节不变）；
- 用户当前 agent-default-model 块完整保留（已有断言）；
- lib/README.md 等非 JS 资产不被 sync-lib 误删（L2 收尾已修，纳入本组件回归）；
- 安装后 doctor 至少 degraded 以上，不得 incompatible。

### 失败路径
profile 不可写 → 报错并保留原文件；patch 合并冲突 → 备份后 fail-closed，不写半截。

## 3. upgrade · 升级编排组件（新）

### 职责与边界
组合 pack/install/doctor 完成原子升级：预检 → 备份 → 安装 → 诊断 → 成功提交或失败回滚。升级失败不能把用户留在半安装状态。
边界文件：scripts/delivery/upgrade.mjs + scripts/delivery/upgrade-ledger.jsonl。

### 接口契约
- 纯函数：upgrade({ source, profileDir, dryRun, force }) → { ok, fromVersion, toVersion, backupId, rolledBack, doctorLevel }
- CLI：squadctl upgrade <source> [--dry-run] [--force]
- 流程固定：precheck(doctor 当前) → backup → installToProfile(backup=true) → doctor(新) → ok?commit:rollback
- ledger 每条记录：{ts, from, to, backupId, phase, result}；phase=pending 表示中断可恢复

### 验收标准
- 成功路径：版本从 from 升到 to，doctor=ok，ledger=committed；
- 失败路径：注入坏 patch → doctor=incompatible → 自动 rollback 到 from 且 doctor 恢复 ok，ledger=rolled_back；
- dry-run 不写任何盘（逐字节对比验证）；
- 中断恢复：ledger 有 pending 记录时再次执行 upgrade 能识别并清理/续跑；
- 独立交付：upgrade 只通过 install/doctor 的公开接口工作，不读它们的内部文件。

### 失败路径
precheck 不通过 → 不升级（除非 --force）；backup 失败 → 不安装；rollback 失败 → 保留 backupId 并给人工恢复指令，ledger=manual_required。

## 4. rollback · 回滚组件（新）

### 职责与边界
从备份快照恢复到指定/上一个可用版本，恢复后必须 doctor 验证。
边界文件：scripts/delivery/rollback.mjs。

### 接口契约
- 纯函数：rollback({ profileDir, backupId?, toVersion? }) → { ok, restoredVersion, backupId, doctorLevel }
- CLI：squadctl rollback [--to <version>] [--backup <id>]
- 备份结构：<profile>/.dsh-quanneng-squad-backups/<ts>-<version>/{package/, cordis.patch.yml, bundle-registration.json}

### 验收标准
- 回滚后 doctor ≥ degraded；回滚目标是实际存在且自检通过的备份；
- 幂等：对已回滚版本再 rollback 不改变文件字节；
- 可链式回滚（A→B→A），每次都留新备份；
- 无备份 → fail-closed 并列出可用备份，不猜测。

### 失败路径
备份损坏（sha256 不符）→ 拒绝使用并标记 corrupt；回滚后 doctor 仍红 → 保留回滚前状态供人工介入。

## 5. doctor · 兼容诊断组件（升级）

### 职责与边界
从「静态文本检查」升级为「宿主能力探测 + 三态结论」。与 verify 分工：verify 查代码结构（96 断言），doctor 查宿主环境（运行时）。
边界文件：scripts/doctor.mjs（升级）+ scripts/delivery/doctor-fixtures/（三态夹具）。

### 接口契约
- 纯函数：checkDoctor({ profileDir, workspace, strict }) → { level, checks[], version, fixes[] }
- level：ok=兼容 / degraded=可降级运行 / incompatible=不兼容
- CLI：squadctl doctor [--json] [--strict]；退出码 0/1/2 对应三态
- 输出每条 check：{ name, level, detail, fix }——fix 是可执行的修复建议，不是泛泛提示

### 探测项（固定 7 类）
1) Node 版本 ≥ engines.node；2) DSH 版本 ≥ engines.dsh；3) 依赖插件存在且版本满足 compatibility.requires（agent-preset / agent-teams / PTC runtime）；4) profile patch 结构（preset 数/maxMembers/model 块形态）；5) patch 真源一致性（buildPatchText(root) === 落盘）；6) EXEMPTIONS 无过期行；7) 发布物洁净度（pack --check，仅当从 dist 安装）。

### 三态判定规则
- incompatible：任一必需能力缺失（preset 注册机制 / patch 机制 / Node 版本）→ 插件无法工作；
- degraded：高级能力缺失（PTC runtime / agent-teams 版本偏低 / 模型块为空）→ 核心 SOP 可用，高级能力禁用并给 fix；
- ok：全部探测通过。

### 验收标准
- 正常环境 = ok/exit0；
- 移除 PTC runtime 仿真夹具 = degraded/exit1 且 fixes 含具体安装/启用建议；
- 破坏 patch 结构夹具 = incompatible/exit2 且给修复指令；
- 与 verify 输出互不混淆（doctor 不输出 PASS 行，verify 不做宿主探测）；
- 独立交付：新增探测项不改 verify、不改 upgrade。

### 失败路径
profile 不可读 → incompatible（不是静默降级）；某依赖探测抛异常 → 该 check=degraded 而非整个 doctor 崩。

## 6. cold-start-smoke · 冷启动烟测组件（新）

### 职责与边界
在临时干净 profile 里完成 install → doctor → 卸载，杜绝「只在我机器上能跑」。
边界文件：scripts/delivery/cold-start-smoke.mjs。

### 接口契约
- smoke({ dist, tmpProfile }) → { ok, steps[], doctorLevel }；临时目录用 mkdtempSync 并在 finally 清理
- release 链末端新增一步 node scripts/delivery/cold-start-smoke.mjs

### 验收标准
- 用 dist 安装后 doctor=ok；卸载后临时 profile 零残留；
- 负向：用被污染的 dist → 烟测红；
- 不接触真实 profile（用 env QUANNENG_PROFILE_DIR 隔离）。

## 7. 组件依赖图

L0（config-adapter / squad-const / patch-sync / gate-kit）
  ↑ 只依赖契约
L2 pack → install → upgrade → rollback
         ↓        ↘ doctor ↔ cold-start-smoke
L3（后续 quickstart / templates / status，本设计不含）

横切 L4：verify 新增两类断言——发布物洁净度（pack --check）、doctor 三态行为（fixtures）；release 末端接冷启动烟测。

## 8. 分阶段落地与出口标准（每阶段独立交付）

| 阶段 | 组件 | 出口标准 |
| --- | --- | --- |
| S1 | pack + 发布白名单 + verify 洁净度断言 | 包 <500KB、pack --check 绿、负向污染检出 |
| S2 | doctor 升级三态 + 夹具 | 三态 exit 0/1/2 全测、fix 可执行 |
| S3 | upgrade + rollback + ledger | 成功/失败/dry-run/中断恢复四路径全测 |
| S4 | cold-start-smoke 接 release + README 重写 | release 全绿、冷启动绿、README 数字与真实门数对齐 |

每阶段红线沿用：release exit0 · tests 47/47 · verify 断言不减 · 安装副本字节一致 · 无新增硬编码路径。

## 9. 待确认的设计取舍（不在本设计内擅自决定）

1. 备份保留策略：保留最近 N 份还是全保留？建议 N=5，超出按时间淘汰。
2. doctor 三态退出码：0/1/2 还是沿用 0/1 两态 + JSON level？建议三态，便于 CI 区分降级与不兼容。
3. 发布物是否包含 CHANGELOG 与历史治理文档：建议只含当前版 README + CHANGELOG 最近 3 版，其余留源码仓库。
4. upgrade 失败自动回滚是否默认开启：建议默认开启，--force 才允许「升级失败后保留现场」用于排障。

