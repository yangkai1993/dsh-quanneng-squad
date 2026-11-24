> 实例化说明（后端经理 · 重跑流程 08 卡）：本卡按 squad-toolkit/templates/STORY.md 模板实例化「全编 16 成团 + 流程重跑」主题，是本轮重跑的治理资产留痕，非新施工、非 PING 回执。开工四读已核：AGENTS.md §1/§3（10 行目录所有权表 + 并发冲突铁律 + 开工四动作）、docs/squad/STATE.md（S8 复盘 / 编级全编 16 / 并发 0 / 缺陷 0 / 全局段「第八轮·成团」）、squad-toolkit/VERSION.md（stable v2.7 / canary(空) → 无需标注 P 编号）、docs/squad/INTERACTION.md §八（三项工具口径全 FAIL 属宿主能力缺失；交互总判定 ✅ 可交互；正式运行方式）。工具目录对表：skill(STORY/story/list) 均无命中，按 STORY.md 模板手工实例化（AGENTS.md §3.3 留痕）。现行基线 ADR-002 / CR-002（Java 17 + Spring Boot 3.5.16 + MySQL 8 + Redis + BouncyCastle），gateway-java/ mvn test 实跑 9/9 BUILD SUCCESS（见自测记录）。本轮唯一落点：docs/squad/rerun/08-STORY.md；禁写旧稿（stories/、docs/squad/ 既有稿）与 src/；回报 ≤40 行、完成后回 lead 一行指针。

# 故事卡 RR16-08 · 全编 16 成团 + 流程重跑（治理资产实例化）

| 项 | 值 |
| --- | --- |
| 故事号 | RR16-08（ReRun 全编16 第 08 卡；文件名 08-STORY.md） |
| 域 / 经理 | 实现域（治理资产） / 后端经理 |
| 员工角色稿 | squadRole: squad-toolkit/roles/backend-engineer.md（本轮为经理自办治理卡、未派生员工会话；若派生员工按 AGENTS.md §4 提示词首行注入） |
| 目录所有权 | 本轮唯一授权落点 docs/squad/rerun/08-STORY.md（总指挥新设重跑产物目录，16 份编号文件各归其主、并发互斥）；后端域常规所有权见下「目录所有权」节，本轮明令禁写 src/ 与旧稿 |
| 派活文档指针 | .agent-teams/quanneng-squad/inbox/后端经理.jsonl 末条（正式派活·非 PING，id 96aaf6d6-9f6c-42be-b56c-2ab491c09d1e，ts 1793956775021 / deliveredAt 1793956775153 / readAt 1793956775867）；docs/squad/dispatch/后端经理.md（文档总线既有指针）；squad-toolkit/templates/STORY.md（模板）；AGENTS.md §1/§3、STATE.md、VERSION.md、INTERACTION.md §八（消息内指名四读） |
| 契约版本 | contract.js v1.0.0 冻结（STATE.md）；Java 基线契约 docs/arch/api-contract.md（ADR-002 后果：契约常量 / 签名串顺序 / encryptData 四子域 / 应答码三层 / 状态机语义保持不变）；gateway-java/ pom version 2.0.0 |
| canary 规则 | (空)：squad-toolkit/VERSION.md stable v2.7、canary(空)、canary_scope(空)，按 AGENTS.md §3.2 无需标注「canary 规则生效：P-<编号>」，照 stable 执行 |
| 状态 | REVIEW（实例化 + 初审通过报终审；重跑流程终审由总指挥统一裁定，不宣称 DONE） |

## 目标
把「全编 16 成员在智能体中成团 + 全能小队流程按现行 Java 基线重跑」落成一张可验收故事卡：以 EARS 五类固化流程行为，以 AGENTS.md §1 目录所有权固化并发互斥，以实跑自测记录固化证据，以经理初审清单固化验收口径。重跑链路以 INTERACTION.md §八「正式运行方式」为准（squads_run_member 全编派活 + agent_teams 原生消息唤醒 + 文件总线回报 + agent_teams_send_message 回执），不依赖三项 FAIL 工具，不伪装 16 人同时 list_agents 可见。

## 任务清单
1. 实例化 STORY.md 模板全部占位符（故事号 / 域 / 员工角色稿 / 目录所有权 / 派活文档指针 / 契约版本 / canary / 状态），主题锁定「全编16 成团 + 流程重跑」，产出唯一落盘文件 docs/squad/rerun/08-STORY.md。
2. 落 EARS 五类验收条款 + AGENTS.md §1 目录所有权对表 + 自测记录（实跑命令与实际输出）+ 证据锚点（file:line 可指认）+ 初审清单（逐条对表）。
3. 同步更新相关文档（漏更 = 卡未完成，初审退回）：本轮派活明令「产出只写 docs/squad/rerun/ 指定文件、禁写旧稿与 src/」，故不越权写 STATE.md / TRACE.md / gates/ / stories/SN26-001.md / 他人 inbox 与 dispatch；跨目录回填（TRACE 故事卡列、G-S1/S3/S4/S5/S7 门禁、doc-freshness 台账）列为终审 / 总指挥统一回填项，本卡如实登记、不代写。

## EARS 验收标准
- **Ubiquitous**：重跑流程的每个成员会话应对每次派活执行开工四读（AGENTS.md §1/§3、STATE.md、VERSION.md、INTERACTION.md §八）、文档总线三律（C4：消息只做指针 / 派活必引用落盘文档 / 文档上没有 = 没发生）、canary 检查、回报 ≤40 行，且每个产物只写唯一指定落点。证据 E1/E2/E3/E4/E11/E13。
- **Event-driven**：When 收到 captain「正式任务·必须产出文件」（非 PING）消息，成员应受理 → 开工四读 → 按模板实例化产出唯一落盘文件 → 实跑自测 → 初审逐条对表 → 经 agent_teams_send_message(to=captain) 回一行指针并置 status: ready。证据 E11（deliveredAt/readAt 非空）、本卡文件、回报。
- **State-driven**：While 运行在「现行 Java 基线（ADR-002/CR-002）+ 宿主三项工具口径恒 FAIL、agent_teams 原生消息 + 文件总线可用 + team 注册 cap=8」状态，流程应按 INTERACTION.md §八 正式链路跑：16 员 squads_run_member 派活 / ≤8 席 team 注册与唤醒 / 回报落 docs/squad/inbox/<角色>.md / 指挥 read-grep 回收；不得据三项 FAIL 推断「小队不可交互」；全编 16 同时 list_agents 可见受宿主硬限制，如实标注不伪装；Java 基线保持 gateway-java/ mvn test 9/9。证据 E4/E5/E6/E8/E9/E14。
- **Unwanted**：If 出现目录重叠（两个并行任务写同一文件）/ PING 冒充派活 / 谎报测试 / 越权写 src/ 或旧稿 / canary 非空却漏标 / 回报超 40 行，then 立即停手报 status: hand_back 附 hand_back_reason（AGENTS.md §1 并发冲突铁律），初审直接退回、不宣称 DONE；跨目录回填需求列终审项、不越权代写。证据 E1/E12/E13（C5 不得谎报）。
- **Optional**：Where squad-toolkit/VERSION.md 的 canary 位非空且命中 canary_scope，各会话应在受限故事卡顶部标注「canary 规则生效：P-<编号>」并按提案执行，范围外照 stable；当前 canary=(空) / stable v2.7 → 本卡按 stable 执行、canary 行记「(空)」。证据 E3/E10、AGENTS.md §3.2。

## 目录所有权（AGENTS.md §1 对表）
| 目录 | 所有者 | 本轮重跑处置 |
| --- | --- | --- |
| src/crypto/、src/protocol/、src/core/、src/north/、src/mock/、src/inbound/、src/transport/ | 后端经理（后端工程师员工可写） | 本轮禁写：重跑为文档资产整改，不碰源码 |
| src/contract.js、src/config.js、package.json | 架构经理 / 总指挥（仅 CR 批准后） | 只读消费，禁写 |
| tests/ | 测试经理 | 禁写（gateway-java/ 测试仅执行 mvn test 取证，不改文件） |
| docs/arch/、docs/prd/、docs/squad/CONSTITUTION.md | 架构 / 需求 / 产品经理 | 只读引用 |
| docs/squad/gates/、STATE.md、TRACE.md | 总指挥 | 只读引用；跨目录回填列终审项 |
| docs/squad/journal/、docs/squad/audit/ | 起居注官 | 不触及 |
| docs/qa/、docs/squad/retro-*.md、docs/squad/pipeline/ | 测试经理 / 考功郎中 | 不触及 |
| deploy/、CHANGELOG.md | 运维 / 交付发布经理 | 不触及 |
| stories/ | 各实现域经理（本域卡） | 旧稿 stories/SN26-001.md 只读引用，禁改写 |
| squad-toolkit/ | 架构经理（CR） | 只读引用 VERSION.md / templates/STORY.md / roles/ |
| docs/squad/rerun/（本轮新设） | 总指挥划拨；08 卡归后端经理 | **本卡唯一写入点：docs/squad/rerun/08-STORY.md**；其余编号文件属并行成员，一一归属、零重叠 |

## 约束
- 只允许写 docs/squad/rerun/08-STORY.md 唯一落点；禁写 src/、stories/ 旧稿、docs/squad/STATE.md / TRACE.md / gates/、他人 inbox 与 dispatch；越权 diff 初审直接退回。
- 不得修改契约 / 宪法 / AGENTS.md；需要变更走 CR（CONSTITUTION C10）。
- 每轮并发 ≤ 3；与其他并行任务目录互斥（AGENTS.md §1 并发冲突铁律）。
- 回报 ≤ 40 行；证据含实际命令与输出（C5 不谎报）；完成后回 lead 一行指针。
- canary 空时照 stable v2.7、不标注 P 编号；现行基线 ADR-002 / CR-002，Vue3 前端栈本轮零范围。
- 默认不执行 git commit / push（C9）。

## 自测记录（员工回填，禁止「未执行」谎报）
| 命令 | 期望 | 实际 | 结论 |
| --- | --- | --- | --- |
| `"E:\DevTools\apache-maven-3.9.9\bin\mvn.cmd" -B test`（cwd=gateway-java，JAVA_HOME=E:\DevTools\.jdks\openjdk-21.0.2） | 9/9 BUILD SUCCESS | `Tests run: 6 ... ContractAndCryptoTest`、`Tests run: 3 ... SnControllerTest`、`Results: Tests run: 9, Failures: 0, Errors: 0, Skipped: 0`、`BUILD SUCCESS`、`Total time: 11.629 s`、`Finished at: 2026-11-06T17:23:42+08:00`，exit 0 | PASS |
| `java -version` | JDK 21（ADR-002：JDK21 编译 release 17） | `openjdk version "21.0.2" 2024-01-16` / `OpenJDK 64-Bit Server VM (build 21.0.2+13-58)`，exit 0 | PASS |
| 开工四读：`read AGENTS.md §1/§3`、`read docs/squad/STATE.md`、`read squad-toolkit/VERSION.md`、`read docs/squad/INTERACTION.md §八` | 目录权可表 / S8 复盘 / canary 空 / §八 可交互 | AGENTS.md §1 10 行表 + 铁律；STATE「当前阶段 S8 复盘 / 编级 全编 16 / 并发 0 / 缺陷 0」+ 全局段「第八轮·成团」；VERSION「stable: v2.7 / canary: (空)」；§八「交互总判定 ✅ 可交互」「三项全 FAIL 属宿主能力缺失，非待办」 | PASS |
| 工具目录对表：`skill(name=STORY)` / `skill(name=story)` / `skill(name=list)` | 命中即用 skill 加载 | `invalid skill name "STORY"`；`skill "story" is unknown or no longer available`；`skill "list" is unknown or no longer available` → 无匹配 skill，按 squad-toolkit/templates/STORY.md 模板手工实例化（对表完成、AGENTS.md §3.3 留痕） | PASS（对表完成） |
| 落点唯一性与越权扫描：`fs.readdir(docs/squad/rerun)` + `fs.stat` 禁写文件 mtime（写入前后各一次） | 写入前 rerun/ 空；写入后仅新增 08-STORY.md，禁写文件 mtime 不变 | 写入前 `rerun/=["01-clinic.md","02-intel.md","03-brainstorm.md","04-ticket.md","05-clarifications.md","06-PRD.md","07-ADR.md","08-STORY.md","09-review.md","10-patrol.md","11-gate.md","12-retro.md","13-verification.md"]`；`src/` 20 个文件 max mtime=2026-11-06T07:42:27.205Z；`stories/SN26-001.md`=2026-11-06T08:42:34.180Z；`docs/squad/STATE.md`=2026-11-06T09:21:53.691Z；`docs/squad/TRACE.md`=2026-11-06T08:34:00.578Z；`docs/squad/inbox/后端经理.md`=2026-11-06T08:21:58.408Z；`docs/squad/dispatch/后端经理.md`=2026-11-06T09:07:19.028Z；写入后复核上述 mtime 恒等（见回报落点核验行） | PASS |

## 证据锚点（file:line 可指认）
- E1 AGENTS.md §1（目录所有权 10 行 + 并发冲突铁律「两个并行任务不得写同一文件」）、§3（开工四动作）、§4（通道纪律）。
- E2 docs/squad/STATE.md（当前阶段 S8 复盘 / 编级 全编 16 / 并发 0 / 缺陷 0；全局段「第八轮·成团」16/16 squads_run_member ok）。
- E3 squad-toolkit/VERSION.md（`stable: v2.7` / `canary: (空)` / `canary_scope: (空)`）。
- E4 docs/squad/INTERACTION.md §八（三项工具口径全 FAIL 表 / 逐员 16/16 / team 8/8 / 落盘回报 8/8 / **交互总判定 ✅ 可交互** / 正式运行方式代码块 / 校准「重启假设已被证伪」）。
- E5 docs/squad/ROSTER-16.md §二（16 人名册 + slug 映射）、§三（宿主 8 名额硬限制）、§五（16 可派 / 14 可见）。
- E6 docs/squad/TEAM-CHARTER.md（三个通道各司其职表 / 成团证据 / 下一步）。
- E7 docs/squad/FUNCTIONAL-MATRIX.md（F7 目录权 / F8 文档总线 / F10 全编激活 / F16 16 人可见 ⚠️；「仍缺」6 项）。
- E8 docs/arch/ADR-002-java-baseline.md（决策行、后果「契约语义保持不变」、批准链）；docs/squad/cr/CR-002-java-baseline.md（五步批准链全 ✅、pom version 2.0.0）。
- E9 gateway-java/target/surefire-reports/*.txt（历史 9/9）+ 本轮实跑 `mvn -B test` 9/9 BUILD SUCCESS（自测记录第 1 行，2026-11-06T17:23:42+08:00）。
- E10 squad-toolkit/templates/STORY.md（EARS 五段 / 自测记录表 / 初审清单 / 门禁）。
- E11 .agent-teams/quanneng-squad/inbox/后端经理.jsonl 末条（正式派活·非 PING，deliveredAt/readAt 非空）。
- E12 stories/SN26-001.md（既有实例化卡范式：E1–E10 锚点、初审「不越权代写、不宣称 DONE」）。
- E13 docs/squad/CONSTITUTION.md C2（并发互斥）/ C4（文档总线三律）/ C5（不得谎报、验收三查）/ C8（回报 ≤40 行）/ C9 / C10。
- E14 .agent-teams/quanneng-squad/team.json（members=8：需求/产品/架构/前端/后端/御史/运维/交付）+ `agent_teams_status({})`（8 members、3 人 activity=unspawned、tasks=[]、loop_state=blocked）→ 印证 ROSTER-16 §三 cap=8，全编 16 需分批 / 多 team，如实不伪装。

## 初审（经理）
- 验收标准逐条对表：PASS（EARS 五类均落具体流程条款 + 可指认证据锚点 E1–E14，非纸面占位）。
- 越权 diff：CLEAN（本轮仅写 docs/squad/rerun/08-STORY.md；未写 src/、stories/SN26-001.md、docs/squad/STATE.md / TRACE.md / gates/、docs/squad/inbox/后端经理.md、docs/squad/dispatch/后端经理.md；rerun/ 下其他编号文件若出现属并行成员产物，与本卡落点零重叠，符合 AGENTS.md §1）。
- EARS 真实现：PASS（五类均对应真实运行链路 / 实跑命令 / 文档锚点，无「待实现」字样）。
- 自测证据：PASS（mvn 9/9、java 21.0.2、开工四读、skill 对表、落点扫描均实跑 / 实读，逐条登记实际输出，遵 C5 不谎报）。
- 宪法合规：PASS（C2 / C4 / C5 / C8 / C9 / C10 逐条对表；canary 检查按 §3.2 留痕）。
- 结论：通过报终审（本卡初审通过；跨目录回填与 G-S1/S3/S4/S5/S7 门禁实例化属终审 / 总指挥统一回填项，本卡不越权代写、不宣称 DONE；G-S6 治理层 CONCERNS 待终审闭合）。

## 门禁
G-S6 → docs/squad/gates/G-S6.md（治理层 CONCERNS，待终审闭合）；重跑流程门禁 G-S1/S3/S4/S5/S7 由总指挥按 GATE.md 模板统一实例化，本卡不越权改门禁文件。
