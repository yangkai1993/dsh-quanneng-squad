# 第 47 轮简报 · 先改进机制，再解决待收

> 目标 → 拆解 → 交付与验收 → 发现的问题 → 门禁变化 → 风险 → 下一步。

## 本轮目标

用户指令：「先改进在解决代收，一定要时刻监督、时刻检验、时刻改进」。本轮只做机制落地与自检，待收（TK-46-01/02）在机制可信后再验。

## 拆解与交付

1. **时刻检验①**：`dispatch-guard.mjs` —— 派活前校验同轮在途任务写域结构化（禁止「见任务书」转述）且互不重叠，成员写域不得侵入指挥专属域。A14 根因（两票并发写 core/）的机器化防线。
2. **时刻检验②**：`lead-scope-check.mjs` —— 每轮简报必写「## 本轮 src 变更归属」，抽验指挥不得改 src（纠错须标注）+ 声明执行者在本轮 dispatch 卡有对应令牌。A12/A14 复发拦截。
3. **时刻监督③**：`supervise.mjs` → `docs/squad/SUPERVISION.json` —— 七门状态 + result-verify + 在途令牌 + Java verdict + 简报/脉搏新鲜度，从实测取数；**只认最新批次 surefire 报告**（陈旧报告 staleIgnored）、区分 expected-red（负向探针）/ regression-red（真回归）。
4. **时刻改进④**：三件套接入 release 链（19→22 步）+ `verify.mjs` 追加 5 条「时刻监督」断言（45→50，全部真跑通过）；G-REFLOW 新增 P10；L4 新增 P-010 从 proposal 起走五态；AGENTS §4 追加第 6 条硬纪律。

## 发现的问题（本轮机制自检抓到的自身缺陷，全部修复）

- 三脚本初版 `W` 路径解析错（写到 `packages/docs/...`）→ 修为显式工作区根。
- `dispatch-guard` 初版 `inFlight=[]`：重投段落只有 `| 状态 |` 没写 `| 令牌 |`/`| 写域 |` → 补齐两张卡六要素；同令牌多段落改为「只取最后一段为当前契约」，旧过程段标注「已闭合｜被重投取代」防误判。
- `verify.mjs` 初版替换锚点用错（文件是 `t(name,fn)` 逐条断言，不是 `checks` 数组）→ 断言没生效却显示语法过；改用正确结构追加，实测 45→50。
- `supervise` 初版把 11-12 陈旧 `SchedulerBootstrapTest` 报告判成「真回归红」→ 改为按最新批次 mtime（30min 窗口）取数，staleIgnored=1；`freshness` 由 null 修为真实小时数；在途误把「作废/已闭合」段判活在 → 加 TERMINAL 终止词排除。
- 修复过程中我一度把 `writeFileSync` 第二参数漏写，把 `supervise.mjs` 内容覆盖成字面量 "utf8" → 立即整文件重建并 `--check` + 实跑双验。**这条如实记录：改进机制的人自己也会踩最基础的错误，所以才需要时刻检验。**

## 门禁与账本变化

```
七门（含新增两门）全 0 · verify 50/50 · result-verify 0 缺口
supervise: java=green / reports=11 / staleIgnored=1 / freshness=13.6h(pulse),13.4h(brief)
release 链 22 步 · L4 P-001/002/004 codified + P-010 proposal
```

## 本轮 src 变更归属（时刻监督 · 每轮必写）

| 项 | 值 |
| --- | --- |
| 执行者 | 无（本轮只改 scripts/gates/docs，未碰 src） |
| 涉及 src 文件 | 无 |
| 门禁 | lead-scope-check 抽验本段 exit 0 |

## 风险 / 下一步

1. TK-46-01 回报已到（负向探针三条实跑全齐、零残留）→ 独立复跑验收后闭合；TK-46-02 仍在途。
2. P-010 从 proposal 走五态，需 round-48+ 计绿，不得手刷 codified。
3. TEAM-PULSE 13.6h 未刷新（supervise attention 已报）→ 本轮收尾刷新。
4. 云端 Hindsight 仍 ECONNRESET，本地 DECISIONS.jsonl 为权威，OUTBOX 待回放。


## 第四十七轮补记 · 机制自检修复与待收闭合（实测）

1. **lead-scope-check 三连修**：① 段落匹配从「正文提到"本轮 src 变更归属"就命中」改为「只认 `^##\s+本轮 src 变更归属` 标题行」；② 执行者=「无（本轮只改治理文档）」放行且跳过令牌抽验（此前误当席位查令牌）；③ 修后 exit 0。
2. **AGENTS.md 版本漂移修复（P3）**：§4「当前 v2，P1~P8」→「当前 v4，P1~P10」，与 INDEX.md 最高 v4、G-REFLOW 已有 P10 对齐。
3. **全链 22 步实跑**：首跑断在 audit-roster（模型轮换后名册快照 >12h 过期，P2 fail-closed 正确）→ 重导实时名册后 **exit 0、verify 50/50、tests 46/46 双侧同绿（0 skipped）、installed=true、supervise 生成 SUPERVISION.json**。
4. **supervise 新鲜度判据二次修**：局部 `-Dtest` 只刷新 1 个 surefire 报告会把其余 11 个误判陈旧（reports:1/staleIgnored:11）→ 改为「mtime 5 分钟分桶取报告数最多的批次」；全量 mvn test 66/66 后 reports=11、staleIgnored=1（仅 11-12 陈旧报告），java=green。
5. **TK-46-01 闭合**：成员回报（控制绿 8/8 / 探针① reconTick 404 红 / 探针② audit 404 红 / 还原绿 8/8、零残留）；captain 独立实跑 AdminRoutesTest 8/8 + 全量 66/66；8 映射齐全、探针文件零残留 → dispatch 卡补 `| 状态 | 已闭合｜验收通过 |`。
6. **TK-46-02 第三次投递**：席位 @v17 ready 但连续无回报（A1 机制持续报在途）→ 按六要素 + squadRole v4 完整重投（wake），验收含负向探针。
7. **本轮主线**：先改进（三件套 + P10 + P-010 提案 + 5 条 verify 断言 + AGENTS 第 6 条），再收待收；全程七门监督，任一红即停手定位，未带着红灯收口。


## TK-46-02 闭合与豁免撤销（终验）

- 成员回报 6 用例（scheduling/periodic tick/运行时注册/负向对照/2 条 assertThrows 探针），全 tests/ 禁用注解 0 命中。
- captain 独立实跑：`mvn -o test` **72/72 BUILD SUCCESS**（基线 66 + 新增 6）、`result-verify` 16 项 0 缺口且触发器行 `inImpl=true`、全 tests/ 17 文件无 @Disabled、近 20min 仅该测试文件落盘（写域合规）。
- **按闭合条件删除 EXEMPTIONS.md 的 result-verify 豁免行**（到期日 2026-11-14 恰为本日）；删除后 result-verify 仍 exit 0（0 缺口），证明豁免不再是绿的前提。
- 一次完整链曾报红，逐步复跑 22 步全绿 → 判为链内 supervise/l4 状态刷新造成的**中间态误读**，如实记录不掩盖；随后完整链复跑确认。


## 第四十七轮续 · 组件化 / 工程化 / 合规化（依据版本化）

1. **组件化**：新建 `scripts/lib/gate-kit.mjs`（W 解析 / cn2num / maxBriefRound / runGate / failFast），`dispatch-guard` 与 `lead-scope-check` 改用；改前改后 exit=0/problems=[] 等价（里氏替换）。DRY/SRP/ISP 依据落 `docs/squad/pipeline/DESIGN-PRINCIPLES.md` v1.0（含《The Pragmatic Programmer》《Clean Code》《Release It!》《Continuous Delivery》《Structured Design》《NIST SP 800-57》与可验证判据）。
2. **合规化**：`api-contract.md` 新增 §10 K1~K4，逐条带规范原文行号（:314 验签先行 / :318 signId 取证书 / :365 新旧证书并行 3 个月 / :526 无占用状态查询）↔ 实现锚点 ↔ 机器断言 ID。`result-verify` 增 4 行 compliance 断言：K2/K3/K4 通过，**K1 如实报红**（当前单值 signId，无 map<signId,cert>）。
3. **不写假绿**：K1 红登记带到期日豁免（2026-11-15，闭合条件=TK-47-02 闭合后删行），删掉上一轮残留的 11-14 过期行（曾导致新豁免被「取最早到期」规则覆盖）；`verify` 增「当前豁免表无过期行」断言（51/51）。
4. **派票**：TK-47-02 后端@v17 —— K1 证书注册表组件化（DRY：不复制 sm2SignRaw/computeZA；DIP：SignatureService 依赖注册表接口；4 用例含新旧并存/按 signId 选证/过期判定/未知 signId fail-closed + 负向探针）。squadRole 初版误取 qa-engineer-v4.md（A10 后端无现行稿），已更正为 roles/ 原件并留痕。
5. **自检抓到的自身缺陷**：gate-kit 的 W 首版少算一级目录 → 修正；组件化正则吞掉 dispatch-guard 的 byToken 声明 → 整文件重建；K2 断言正则把 `normalizer.normalize` 写错成 `normalize.normalize` → 实读现码后修正，未派假票；豁免残留过期行 → 删除 + 加断言。全部如实记录。


## TK-47-02 闭合与 K1 豁免撤销（终验）

- 成员交付 crypto/ 5 文件：CertEntry（仅选择与有效期，零签名算法）、SignIdCertRegistry（DIP 接口）、SandboxSignIdCertRegistry（`Map<String,CertEntry> certBySignId`、Spring 构造真实消费两套 signId/certId/notAfterDays、默认并行期 90 天=规范 :365 三个月）、SignatureService（3 参 @Autowired 注入接口，2 参便捷构造保留）、SignIdCertRegistryTest（6 用例含新旧并存/按 signId 选证/过期 fail-closed/未知 signId fail-closed/双密钥互验/负向探针）。
- **captain 独立实跑**：mvn -o test **78/78 BUILD SUCCESS**（基线 72+6）、result-verify 20 项 0 缺口且 K1~K4 全 inImpl=true、写域仅 crypto/ 5 文件（近 30min 落盘核验）、0 @Disabled、负向探针 6/6 红还原复绿。
- 结构核验两处 `false` 经实读判为**我的脚本误报**：CertEntry 命中「不复制 sm2SignRaw」的注释；SignatureService 的 SandboxSignIdCertRegistry 仅出现在 2 参便捷构造的 defaultRegistry，主构造只依赖接口。另我一度把两个构造的 90/1825 混读为「配置未消费」，实读 46/49 行确认 Spring 构造真实消费 oldNotAfterDays/newNotAfterDays（P2 假警报），如实记录、未派假票。
- **按闭合条件删除 EXEMPTIONS.md 的 result-verify 2026-11-15 豁免行**；删除后 result-verify 仍 exit 0（0 缺口）、全链 `exemption:false`、verify 51/51、tests 46/46、installed=true。
- 全量 mvn 复跑生成完整 surefire 批次（避免局部 -Dtest 刷新少量报告造成 supervise 误判）。

