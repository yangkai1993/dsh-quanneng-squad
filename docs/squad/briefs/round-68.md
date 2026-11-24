# 第 68 轮简报 · 面板通道修复 + 红队 bug 纠错

## 本轮目标

用户三问：① 小队与 agent teams 团队协作面板结合不佳 ② agent 预设里的小队还有什么作用、可否清除 ③ 修复红队 bug。

## 拆解与交付

1. **红队 bug 实体与修复**：面板票 t19/t25/t27（证书 5 年上界守卫 intel #16）交付后 mvn 96 有 2 红。根因三道旁路：`forTest` 私有构造 `putAll` 绕过 checkUpperBound；`put()` 本身不设闸；Spring 构造新证段 `catch(Exception ignored)` 把守卫异常一起吞掉。test2 用反射调私有 putChecked 又包出 InvocationTargetException。修复（指挥纠错，见归属段）：put() 改唯一登记闸口统一调 checkUpperBound、私有构造 entries.values().forEach(this::put)、Spring 构造区分 IllegalArgumentException 重抛与环境降级吞、test2 改真 Spring 构造直调 1825/1826。终态 **mvn 96/96 BUILD SUCCESS**，备份 .bak-5year-fix 留证。
2. **面板通道根因修复**：team.json 队长指向已死会话（session-faa2bb9f，runtime 重启后失效）→ 面板判定 id 被占、本会话无法接管（delete 也拒绝：not leading）。处置：旧队整目录归档 `.agent-teams/archive/quanneng-squad--2026-11-16-panel-fix`（28 任务+59 inbox 留证），以 quanneng-16 profile 重建 staged 团队（16 席 qodercn/qfmodel + W4 八票 t4~t11=TK-68-01..08），**Web 面板 Approve & Run 即接管**。
3. **gate-rotation 首红的真实原因（A11 修正版）**：不存在"锚分裂修复"。实证：STATE 本就全 2026 系（114/0，未改动）；EXEMPTIONS 当前表本就无 pre-verify/rotation 行（无可删）；解析从未坏（错误消息自带「第68轮」）。真实原因=① W4 八票当时确未签发（8 席全缺即 8 problems，门语义正确）→ 补发 TK-68-01..08 后绿；② 消息拼接用 current.w（rows 元素字段名实为 round）致「轮换缺口：undefined」→ 两处改 current.round。
4. **pre-verify 演练断言数据驱动化**：原断言钉死 t2（面板数据源切换后必假红）→ 改为「挑任一 completed Java 卡篡改 commandsRun → 红 → 还原 → 绿；无样本自动过」。verify 72→**73/73**。
5. **gate-rotation 消息缺陷**：current.w 不存在（rows 元素字段=round）→「轮换缺口：undefined」；两处改 current.round（第 67 轮 pulse 同型 bug 的第二个实例，已入记忆）。

## 三个用户问题的答案

- **预设作用**：preset-squad-*（7 个）是成员会话的角色人设与工具面底座，profile quanneng-16 引用席位角色名但角色差异由 member brief 承担——**不能清除**：verify 有 2 条断言（7 presets declared + preset ids present）、doctor 检查 presets_in_plugin，且面板成员 spawn 走预设人设；清除=破坏发布链与面板两条腿。
- **可否清除**：不可以，但可瘦身——预设只保留工具面+基础人设是设计决定（RETEST-INTERACTION-6 记录过解除阻塞条件），现状即最小必要集。
- **面板结合不佳**：根因即队长会话死亡+数据源分裂，本轮已重建并 staged；今后 W 轮转票一律优先走面板任务卡（agent_teams_*），subagent 仅侦察（AGENTS §5 原本就这么要求，前几轮因通道故障绕行，现已恢复）。

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 总指挥＝**纠错**（红队 bug：面板票 t25/t27 交付留 2 红测试，旁路根因在实现内部、验证成本低于再派票往返；改 2 文件+2 备份，用户原话「修复红队的 bug」即直接指令） |
| 涉及 src 文件 | gateway-java/src/main/java/com/unionpay/tradein/crypto/SandboxSignIdCertRegistry.java, gateway-java/src/test/java/com/unionpay/tradein/crypto/SignIdCertRegistryTest.java |
| 门禁 | lead-scope-check 抽验本段；御史票 TK-68-04 独立复核本纠错 |

## 风险 / 下一步

1. 面板 8 票等待用户在 Web Approve & Run；批准后席位自动认领。
2. TK-68-04 御史复核证书纠错（R6 闭环）。
3. briefs 目录停在 round-58（65~67 轮走面板未写简报）——本轮恢复 round-68，后续每轮同链恢复。


## t8（TK-68-05）验收与 F1/F2 处置

- 独立复核：产物 73 行 9 探针记录；F1 两证据实测属实（kind 过滤在 pre-verify.mjs:20-21；归档 t25 kind=work、2 个 Java changedPaths、commandsRun 无 mvn exit0、文件 mtime 晚于卡 updatedAt 11 分钟）；F2 实测 live 板 completed Java 卡=0。
- F1 修复（指挥写域）：pre-verify 去 kind 过滤（任意 completed 卡携 Java changedPaths 即核证据）；注释承诺的时序门实装（mtime>updatedAt+60s → fail-closed）；报告增 scannedJavaCards；F2 真空绿 stderr 提示不阻断。verify 演练断言同步改任意 kind 取样。
- 验证：注入归档 t25 为负样本 → exit1 命中新语义（"改动了 2 个 Java 文件但无 mvn 记录"）；还原 exit0；scanned=0 提示可见；verify 75/75。
- 面板纪律遵守：未重复 approve、未动名册；t8 按 update_task completed+attempt_id 结构化回报（新面板通道首票）= 邮箱凭据路径的 A9 补充形态。


## W4 面板票第一批闭合（t6/t7/t8/t9）与封驳修复潮

- 四票全部 update_task completed + attempt_id 结构化回报（面板通道 A9 补充形态）。t6 给事中封驳报告命中 8 项缺陷，captain 逐条独立复测后同轮修 6 项：PV-1 kind 盲区（pre-verify 任意 completed Java 卡全核，work 类逃检面关闭）、PV-2 伪造记录（surefire 批次时间交叉锚，>2min 不符必红，实测命中）、PV-4 test-compile（isMvnTest 排除 test-compile/verify/package）、PV-5 any→latest（最后一条 mvn test exitCode 定生死）、GR-2 占位令牌（gate-rotation 交付段判定+真源词表）、GR-3 cn2num 补百（123/68/100/20/9 实测）、PV-3 补全（supervise 消费 pre-verify 进 attention）。VT-2 过期条目（route-gate 文件不存在）如实登记不修。
- 过程中自纠两处：① pre-verify 历史替换遗留首行多余括号（SyntaxError 定位后修）；② 豁免行 5 字段挤 6 列表致解析 {} 不生效——发现 readExemptions={} 后逐字节排查（管道计数 6≠7），重建规范行。教训入册：写表格行必须数管道。
- gate-rotation 第 69 轮 W1 缺口 = 真实节奏冲突（STATE 被并发会话推进到 69/智能组织自动化起步，面板 8 席仍被 68 轮 W4 未闭票占用）：诚实登记到期豁免（2026-11-19，登记人=总指挥、会签人=给事中双签合规；闭合条件=W4 余票闭合即排 W1 首批），不用占位令牌骗刚被封的 GR-2。
- t7 御史 PASS = 证书纠错 R6 三角闭环（成员发现→指挥纠错→独立复核）。t9 需求三值表成为 W 排票输入池（#14 裁决/#15 挂头/D-4 测试锚 + 新发现 msg 回显/unused import）。
- 终态：release exit 0（豁免可见留痕）、verify 76/76（并发会话加 2 断言）、tests 47/47、mvn 96/96、maturity 判据全绿。面板余票 t4/t5/t10/t11 在途，回报到齐即闭 W4、按豁免闭合条件排 W1。


## t10（TK-68-07）闭合 · 假绿根因修复潮

- 独立复测后同轮修复：① gate-kit PENDING_RE 收编面板六词 + PANEL_FAILED_RE 第三态；② supervise 消费 live team.json → panelTasks{inflight,failed} 进 attention 与 tokenConverged 否决（修复后 converged=false + 「面板在途 2 卡：t4,t11」可见——修复前该信号被词表漏判为真空）；③ panel-sync 词表引真源；④ memory-sla >= 顶格边界（100 条负样本实测 exit1、还原 exit0）。verify +3 回归断言 → 80/80。
- U13 双账：面板消费=词表面闭环；LIVE-DASHBOARD.md 文件本体已不存在（11-12 版被并发会话清理或从未随插件重建迁移），如实记录不追建。
- 现场新事实（t10 证据行过期判定属实且仍在漂）：profile 默认第三次切换 buddy/hy4flash-free；快照 seats=15（缺翰林学士）但 audit-roster 门绿（15 席全匹配新默认）。W1 情报刷新票（已排票池）重钉路由基线；轮次绑定豁免成对维持（gate-rotation+l4-maturity，2026-11-19）。
- 面板票规范改进落地两项：任务书模板加「回报首行 token」硬提醒（t5 违例 5/18 的处方）；repair 卡必须登记 changedPaths 或显式 non-code 声明（t27 处方）——随 W1 排票执行。

