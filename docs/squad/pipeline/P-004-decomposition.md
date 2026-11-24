# P-004 · 任务树拆分（S1 翰林学士 · v1.4.0 流程）

| 项 | 值 |
| --- | --- |
| 编号 / 席位 / 阶段 | P-004 / 翰林学士@v14 / S1 提示词与任务拆分（DELIVERY-PIPELINE.md S1 出门门） |
| 日期 / 作者 | 2026-11-11 / 翰林学士@v14（正式派活自证，非指挥代落） |
| 本卡必产物 | docs/squad/pipeline/P-004-decomposition.md（seat-utilization.mjs:14 命中 /decomposition.*\\.md$/） |
| 拆分输入（实读） | STATE.md:13 门索引；gates/G-S6.md:24「仅因生产 KMS/HSM 未接入 + 入网参数未下发」；gateway-design-v0-draft.md:86-93（C1~C8 定义）；gateway-design-v1-refined.md:244-258（§12 的 12 项）；FUNCTION-LEDGER.md:6-21；seat-utilization.mjs:12-27（逐席匹配规则）；docs/squad/rerun/01,02,03,04,06,09 头部「成员复核待补」；docs/squad/rerun/10-patrol.md:33（G-S6 放行前须闭环四项） |
| 实测闲置（本轮 seat-utilization 输出） | 6 席 artifacts=0：采风官 S-1 / 集贤学士 S1 / 翰林学士 S1 / 前端经理 S4 / 交付发布经理 S7 / 考功郎中 S8 |
| 卡数 | 26（T01~T26）；并发位次每轮 ≤3（CONSTITUTION C2 + AGENTS §5） |

> 六要素口径（AGENTS.md §5）：每卡自带 目标 / 写域（精确到目录）/ 验收标准（可测）/ 并发位次（每轮 ≤3）/ 失败路径（hand_back 条件）/ 证据要求。缺任一要素本卡不得派工。

---

## 一、任务树（文本层级 · 依赖关系图）

```
G-S6 转 PASS（终点）
├── L1 KMS/HSM 生产接入链（关键路径主干）
│   T01 契约与密钥生命周期 ──┬─ T02 Provider 实现 ──┬─ T04 测试/负向断言 ──┐
│                            └─ T03 配置装配/轮换   └────────────────────┴─ T05 部署+回滚 ── T06 封驳复核
├── L2 C1~C8 / §12 闭环链（外部输入阻塞）
│   T07 规范取证 ── T08 处置矩阵+拍板请求 ──┬─ T09 契约口径回写 ── T10 双兼容开关实现 ── T11 负向用例矩阵
│                                           └─ U1 银联/用户书面答复（外部·非成员卡）
├── L3 闲置席位必产物补齐（硬规则 1：缺一即 S6 阻塞）
│   T07 采风官 · T12 集贤学士 · T16 翰林学士(本卡) · T13 前端经理 · T14 交付发布经理 · T15 考功郎中
├── L4 rerun/01~10 代落稿正式替换
│   T17 翰林(01) · T18 采风官(02) · T19 集贤(03) · T20 太傅(04) · T21 产品(06) · T22 给事中(09)
│   （05/07/08/10/11/12 已为成员正文或指挥职权稿，不列卡）
└── L5 席位工序再定义与门禁闭环
    T23 台账重定义(总指挥) ── T24 脚本模式核对(考功郎中+架构 CR) ── T25 御史抽巡 ── T26 太傅 retro(S9 反哺 S1)
```

**关键路径判定**：T01 → T02 → T04 → T05 → T06（KMS 链）为唯一硬阻塞主干。阻塞条件三条，任一未清则 G-S6 不得转 PASS：
1. **U1 外部答复缺失**：§12 的 11 项入网参数（appType/appId/signId/certId/中心 IP）与 12 项口径无书面答复 → T08/T09/T10 只能停留在「配置隔离 + 待裁决」，T06 维持 CONCERNS（G-S6.md:24 原口径）。
2. **L3 六席 artifacts=0**：DELIVERY-PIPELINE 硬规则 1 直接判本迭代未完成并阻塞 S6，与代码是否绿灯无关。
3. **T24 脚本口径与 T23 台账不一致**：前端经理若仍按旧 usability 模式匹配，补齐后仍显示闲置 → 假绿或假红，抽巡无法收敛。
次要路径：L4 六份代落稿未替换 → S6 抽巡按 ROOT-CAUSE 判「治理资产非成员产出」，属可返工项，不阻塞发布但阻塞本迭代「按小队设计跑」的验收。

---

## 二、卡片全集（六要素逐项，无空缺）

### T01 · KMS/HSM 密钥生命周期与接口契约
- 目标：定义生产 KeyProvider 契约（获取/轮换/销毁/审计）、密钥分层与 SandboxKeyProvider 的替换边界。
- 写域：`docs/arch/`（新文件 `kms-hsm-contract.md`；与 T09 的 api-contract.md 分文件，不重叠）。
- 验收标准：文档含 4 张表（密钥生命周期状态机 / Provider 接口签名 / 轮换窗口与双活口径 / 失败降级到 sandbox 的禁止条件），每条给出可指认的 gateway-java 类名；评审后无「待定」字样。
- 并发位次：R1-1。
- 失败路径：发现生产 KMS 类型（云端 KMS vs 本地 HSM PKCS#11）无用户书面指示 → status: hand_back，hand_back_reason 指明「密钥后端未定」，交 captain 转 U1，不得自行二选一。
- 证据要求：docs/arch/kms-hsm-contract.md 行数 ≥80；对 gateway-java/src/main/java/com/unionpay/tradein/crypto/KeyProvider.java 与 SandboxKeyProvider.java 的 file:line 引用 ≥6。

### T02 · 生产 KeyProvider 实现
- 目标：实现 `KmsKeyProvider`/`HsmKeyProvider`（占位实现走接口，不含真实厂商凭据），替换临时 KeyPair。
- 写域：`gateway-java/src/main/java/com/unionpay/tradein/crypto/`。
- 验收标准：`mvn -q -f gateway-java/pom.xml compile` exit 0；`SandboxKeyProvider` 不再是默认 profile；签名服务零改动即通过装配（`SignatureService` 仍只依赖 KeyProvider 接口）。
- 并发位次：R1-2（依赖 T01）。
- 失败路径：需要改 `application.yml` 之外的契约文件 `src/contract.js`/`package.json`（AGENTS §1 员工禁写）→ hand_back 指出冲突对（本卡 vs 契约所有权）。
- 证据要求：新增/修改文件清单 + compile 命令与 exit code；grep 证明无硬编码私钥字节串。

### T03 · 密钥装配、轮换与配置隔离
- 目标：profile 切换（sandbox/kms/hsm）、轮换窗口与入网参数占位的配置隔离。
- 写域：`gateway-java/src/main/resources/`。
- 验收标准：三 profile 可各自启动（`mvn -q spring-boot:run` 或以 ApplicationContext 测试替代）且默认不落到 sandbox；配置项与 §12 的 11 项一一对应（表格式映射）。
- 并发位次：R1-3（依赖 T01，与 T02 同轮不同目录）。
- 失败路径：与 T02 出现同文件写请求（如 provider bean 定义落到 resources）→ 立即 hand_back 报冲突对 T02/T03，不自行分配归属。
- 证据要求：application*.yml diff + 映射表；profile 装配实测输出。

### T04 · KMS 接入测试与负向断言
- 目标：补齐 10-patrol.md:33 的「负向断言/RSA2」与密钥缺失/轮换中/后端不可达三类失败路径用例。
- 写域：`gateway-java/src/test/java/com/unionpay/tradein/crypto/`。
- 验收标准：`mvn -q -f gateway-java/pom.xml test` 全绿且用例数 > 18（当前基线 18/18，STATE.md 第十九轮）；三类负向用例各有明确异常类型断言（非仅 assertThrows 泛化）。
- 并发位次：R2-1（依赖 T02+T03）。
- 失败路径：实现存在缺陷需改 main 源码 → hand_back（写域仅 test），附缺陷 file:line 交回 T02。
- 证据要求：surefire 报告路径 + Tests run/Failures/Errors 原文行；用例矩阵（用例名 ↔ 缺陷编号）。

### T05 · 部署、回滚与 HSM 连通验证
- 目标：生产接入 runbook（密钥注入、连通性探测、失败回滚到上一版本）+ 回滚预案演练记录。
- 写域：`deploy/`。
- 验收标准：runbook 每步给出可执行命令与期望输出；回滚段落含「验证回滚成功」的可测判据；FUNCTION-LEDGER:18 的「deploy/* + 回滚预案」计数 ≥1 且非空文件。
- 并发位次：R2-2（依赖 T02/T03）。
- 失败路径：需要真实 HSM 端点或厂商凭据才能出步骤 → 以占位符 [HSM_ENDPOINT]/[KMS_KEY_ID] 落稿并在文末列待 U1；若因此无法给出可测判据则 hand_back。
- 证据要求：deploy/ 新文件行数与命令条数；本地可跑步骤的实测输出（不可跑的显式标注「未实测，待入网」）。

### T06 · G-S6 封驳复核与转 PASS 判定
- 目标：对 T01~T05 出具门下省意见，给出 G-S6 三值结论与残余条件。
- 写域：`docs/squad/gates/`（`G-S6.md` 为总指挥所有，本卡落新文件 `G-S6-kms.md`；不改 G-S6.md）。
- 验收标准：意见含否决/放行 + 逐条理由 + 证据链接；若 KMS 链或 U1 未清，结论必须为 CONCERNS（不得抬为 PASS，CONSTITUTION C5）。
- 并发位次：R3-1（依赖 T04+T05）。
- 失败路径：结论与证据不自洽（写 PASS 但 U1 无答复）→ 本卡判 failed 并 hand_back 由 captain 复核；不得由被评审者改判。
- 证据要求：引用 T01~T05 的 file:line ≥8 条；三值口径出处 templates/GATE.md:18。

### T07 · 采风官 · 规范约束与 C1~C8 取证（同时补齐 S-1 必产物）
- 目标：把 v0:86-93 的 C1~C8 与 v1:244-258 的 §12 十二项整理为「约束 + 出处 + 对本项目影响 + 待答复」清单，作为 L2 输入。
- 写域：`docs/squad/intel/`。
- 验收标准：文件 ≥1 个且命名 `SN26-规范约束-<日期>.md`；每条约束有出处（source-doc:line 或 v1:line）；12 项逐条列出「已取证/待外部答复」二值状态；seat-utilization 该席 artifacts ≥1。
- 并发位次：R1-1（L2 与 L3 的共同起点，无前置）。
- 失败路径：某项在 .analysis/source-doc.txt 中检索不到原文 → 显式标「不可取证」并列入 U1，不得凭推测补口径。
- 证据要求：grep/read 命中行号列表；本会话 seat-utilization 输出中该席计数由 0 → ≥1 的前后对比。

### T08 · C1~C8 处置矩阵与拍板请求
- 目标：八项冲突 + §12 十二项 → 「当前隔离策略 / 可选口径 / 需拍板项」三列矩阵，产出可中转的裁决清单。
- 写域：`docs/prd/`（新文件 `clarifications-C1-C8.md`，不动既有 clarifications-SN26.md）。
- 验收标准：20 行矩阵全覆盖（8+12），每行有「不阻塞 M0 的隔离手段」与「答复后需改动的落点」；无 P0 级未决项被静默省略。
- 并发位次：R2-1（依赖 T07）。
- 失败路径：需要修改 STATE.md:12 假设登记（A3）→ hand_back，登记为「D4 类」交总指挥改 STATE.md（AGENTS §1 唯一写者）。
- 证据要求：矩阵行数；与 T07 的清单一一映射（缺项为 0）。

### T09 · 契约口径回写
- 目标：把已可冻结的口径（C1 双兼容判定、C5 encryptData 四子域全 M、C6 长度兼容、C3 白名单）写入 api-contract，并标注依赖 U1 的字段。
- 写域：`docs/arch/api-contract.md`（仅此文件）。
- 验收标准：每个字段行有「口径 / 冲突号 / 隔离开关 / 待答复」四列；与 v1:166-174 无矛盾；ADR 不需新增则引用 ADR-002。
- 并发位次：R2-2（依赖 T08；与 T01 同目录不同文件）。
- 失败路径：口径变更会推翻 A1~A15 任一条（v1:305「改 A1~A15 即需重新生成 v1」）→ hand_back 并指出被推翻的 A 编号，交架构经理走 CR。
- 证据要求：diff 行数 + 与 v1:244-258 的映射表。

### T10 · 双兼容开关落地
- 目标：把 C1~C8 的隔离策略从 Node 侧 `src/config.js` 口径迁移/对齐到 Java 侧，保证「答复后只改配置不改分层」（v1:307）。
- 写域：`gateway-java/src/main/java/com/unionpay/tradein/config/`。
- 验收标准：`mvn -q compile` exit 0；八项各有一个可切换开关且有默认值；开关与 T03 的配置项命名一致（grep 交叉核对表）。
- 并发位次：R3-1（依赖 T09）。
- 失败路径：为落地开关需改 `contract/Sn26Contract.java` 或状态机语义 → hand_back（跨契约责任移动，属契约级变更）。
- 证据要求：开关清单 ↔ C 编号对照表；compile 输出。

### T11 · EARS 负向用例矩阵（C 组）
- 目标：为八项冲突各写至少一条「若按错误口径则应失败」的 EARS 用例并实跑。
- 写域：`gateway-java/src/test/java/com/unionpay/tradein/contract/` + `docs/qa/`（用例矩阵文档）。
- 验收标准：矩阵文档 ≥8 行、每行「前置 / 触发 / 期望失败码 / 实跑结果」；`mvn test` 全绿；docs/qa 该席计数增加（FUNCTION-LEDGER:17）。
- 并发位次：R3-2（依赖 T10）。
- 失败路径：实跑发现用例失败且失败根因在 main 源码 → 不得改实现，hand_back 附失败原文交回 T10。
- 证据要求：surefire 原文行（Tests run/Failures）+ 矩阵表。

### T12 · 集贤学士 · 岗位提示词优化稿（S1 必产物）
- 目标：为全部下游角色产出可版本化岗位提示词（≥6 份），含上版 diff 与优化理由。
- 写域：`docs/squad/prompts/`。
- 验收标准：文件数 ≥6；每份含「本版 / 上版 diff / 优化理由 / 六要素模板」四段；覆盖后端·前端·测试·运维·交付·考功六席的派活口径；seat-utilization 该席 ≥1。
- 并发位次：R1-2。
- 失败路径：需改 squad-toolkit/roles/ 或插件资产（AGENTS §1 归架构经理 CR）→ hand_back，只交建议稿。
- 证据要求：文件清单 + 行数 + diff 段落存在性 grep 输出。

### T13 · 前端经理 · 接口可用性评审（重定义工序的产物）
- 目标：本项目零前端交付，工序重定义为「接口可用性/易用性评审」：对外三接口的入参可理解性、错误码可诊断性、文档可自足性打分。
- 写域：`docs/squad/reviews/`（`usability-SN26-<日期>.md`）。
- 验收标准：文件存在且含 打分表（≥5 维度）+ 每维度改进建议（指向 api-contract 或 SnController 的具体行）+ 复评口径；seat-utilization 该席 0 → ≥1。
- 并发位次：R2-3（依赖 T09 契约口径可读）。
- 失败路径：评审结论要求新建前端栈/改 UI（STATE.md 第十九轮「零 UI 需求」）→ hand_back 并说明与既定范围冲突，不自行扩范围。
- 证据要求：打分表 + file:line 引用 ≥6；前后闲置计数对比。

### T14 · 交付发布经理 · 发布物双侧校验
- 目标：独立签发 release 记录（安装副本 vs 源同绿），替换「文件存在但非其独立签发」。
- 写域：`docs/squad/releases/`（`release-<版本>.md`）。
- 验收标准：双侧各贴命令与 exit code（如 `mvn test` 与安装副本 `npm run verify`）；CHANGELOG 由本卡引用而非新写；该席脚本计数 0 → ≥1。
- 并发位次：R3-3（依赖 T06 放行 + T05 回滚预案）。
- 失败路径：双侧结果不一致 → 不得签发，status: failed 附差异；若需写 CHANGELOG.md/deploy/（他人写域）→ hand_back。
- 证据要求：两条实跑命令原文输出 + 版本号与 pom/package 版本一致性核对。

### T15 · 考功郎中 · 席位利用率度量
- 目标：产出本迭代 metrics（阶段耗时/返工率/席位利用率），数据取自实测文件而非记忆。
- 写域：`docs/squad/metrics/`。
- 验收标准：含 16 席逐席 artifacts 表（本轮 seat-utilization JSON 原样引用）+ M1~M9 指标 + 闲置归因；该席 0 → ≥1；每个数字有来源命令或 file:line。
- 并发位次：R3-2（依赖 L3 多数卡完成）。
- 失败路径：需改 squad-toolkit 或脚本判定逻辑 → hand_back 交 T24。
- 证据要求：seat-utilization 两次运行输出（补齐前 / 补齐后）+ 行数。

### T16 · 翰林学士 · 任务树（本卡自证）
- 目标：SN26 剩余工作 + 席位闲置治理的可派工任务树（本文件）。
- 写域：`docs/squad/pipeline/`（仅 P-004-decomposition.md）。
- 验收标准：卡数 ≥12（实 26）；每卡六要素无空缺；关键路径含明确阻塞条件三条；写域互斥表零冲突；`node packages/dsh-quanneng-squad/scripts/seat-utilization.mjs` 翰林学士 artifacts ≥1。
- 并发位次：R1-1（L1/L2/L3/L4/L5 全部前置）。
- 失败路径：任两卡写域重叠 → 立即停手 hand_back 指出冲突对，不自行裁决归属（AGENTS §1）。
- 证据要求：本文件 + §三 互斥自查表 + seat-utilization 输出行。

### T17 · 正式替换 rerun/01-clinic.md
- 目标：翰林学士出正式会诊稿（提示词会诊），替换指挥代落。
- 写域：`docs/squad/rerun/01-clinic.md`（整文件替换）。
- 验收标准：头部去掉「成员复核待补」，改为「成员正文 · 正式交付」并保留被替换稿为附录（原稿零删改）；四要素盘点 + 五维评分 ≥8 或显式「继续会诊」。
- 并发位次：R2-1。
- 失败路径：需要 `docs/prompts/` 或 squad-toolkit 写权限 → hand_back。
- 证据要求：新旧行数对比 + 附录保留的原文校验（首行/末行一致）。

### T18 · 正式替换 rerun/02-intel.md
- 目标：采风官出正式情报稿（成员与工具链实况），替换代落。
- 写域：`docs/squad/rerun/02-intel.md`。
- 验收标准：每条结论带本会话实测来源（命令或 file:line），≥5 条为**本轮新取证**（非转抄 01~15 轮 STATE 全局段）；去代落标注 + 原稿入附录。
- 并发位次：R2-2。
- 失败路径：本轮无法实测（如需重启宿主才能验证）→ 显式标「不可实测」并列阻塞，不冒称实测；涉云端能力缺失则 hand_back。
- 证据要求：实测命令输出摘录 + 与 T07 的分工说明（intel vs rerun 两文件不重叠）。

### T19 · 正式替换 rerun/03-brainstorm.md
- 目标：集贤学士出正式风暴稿（并发 8 席下的全编产出方案）。
- 写域：`docs/squad/rerun/03-brainstorm.md`。
- 验收标准：五视角各有「取舍 + 被否方案 + 推翻条件」；至少 2 个备选被明确否定；与 ARCH-REDESIGN-cap8.md 结论不矛盾。
- 并发位次：R2-3。
- 失败路径：结论需改 ROSTER-16/TEAM-CHARTER（总指挥所有）→ hand_back 转裁决。
- 证据要求：文件行数 + 被否方案清单 + 引用 ARCH-REDESIGN-cap8.md 的行号。

### T20 · 正式替换 rerun/04-ticket.md
- 目标：太傅出独立票拟意见（删除非小队成员 + 重跑全链），补「独立性声明」。
- 写域：`docs/squad/rerun/04-ticket.md`。
- 验收标准：正文以成员独立意见形态成文（非骨架）；风险清单每条给缓解措施；独立性声明改为「本席会话正文，未采纳指挥代落观点」并保留代落稿附录。
- 并发位次：R3-1。
- 失败路径：票拟与 T26 retro 结论冲突 → 交 captain 排序，不互改他人文件。
- 证据要求：行数 + 附录保留校验 + 与 12-retro/26 卡的口径引用。

### T21 · 正式替换 rerun/06-PRD.md
- 目标：产品经理出正式重跑 PRD（R1~R4 可测验收）。
- 写域：`docs/squad/rerun/06-PRD.md`。
- 验收标准：R1~R4 每条为 EARS 句式且可测；与 docs/prd/PRD-sn26-gateway.md 无编号撞名（或显式采用 PF/FR 命名空间并登记）；去代落标注。
- 并发位次：R3-2。
- 失败路径：需改 docs/prd/PRD-sn26-gateway.md 或 STATE.md → hand_back（跨文件所有权）。
- 证据要求：EARS 四条原文 + 与 PRD-sn26-gateway.md:9,20 的口径引用行号。

### T22 · 正式替换 rerun/09-review.md
- 目标：给事中出正式科抄稿（齐套/可测/合规 + 结论）。
- 写域：`docs/squad/rerun/09-review.md`。
- 验收标准：逐文书给出 PASS/CONCERNS/FAIL 三值与理由；FAIL 项各挂返工去向（本树卡号）；去代落标注并保留附录。
- 并发位次：R3-3（依赖 T17~T21 已落正式稿）。
- 失败路径：科抄结论要改 gates/ 门禁文件 → 与本卡写域不符，hand_back 交 T06。
- 证据要求：表行数 + 三值口径出处 + 挂接卡号清单。

### T23 · 席位工序再定义台账（总指挥职权）
- 目标：把「无前端交付」等情形固化为重定义工序（前端经理→可用性评审、交付发布→releases/、考功→metrics/），并写明豁免原则。
- 写域：`docs/squad/FUNCTION-LEDGER.md` + `docs/squad/STATE.md`（唯一写者：总指挥）。
- 验收标准：每席有「必产物 / 首轮目标 / 现状」三列且现状为实测值（非「本轮补」）；无必产物的席位为 0（硬规则 2）；A3 假设行同步 §12 进展。
- 并发位次：R1-3（本卡不由成员执行，交 captain 落笔）。
- 失败路径：成员试图代写该二文件 → 一律拒收并判 failed（AGENTS §1）。
- 证据要求：改后 FUNCTION-LEDGER 全文行数 + 引用 seat-utilization 输出。

### T24 · 脚本判定口径核对
- 目标：确认 seat-utilization.mjs 的 16 条 re/dirs 与 T23 台账逐行一致（尤其交付发布 releases/^release-、前端 reviews/usability、翰林 pipeline/decomposition）。
- 写域：`packages/dsh-quanneng-squad/scripts/seat-utilization.mjs`（考功郎中执行，架构经理 CR）。
- 验收标准：逐席比对表 16 行；发现不一致则以最小 diff 修正并跑两次脚本（修正前后各一次）输出留档；QUANNENG_STRICT_SEATS=1 时 idleCount 与实际缺件一致。
- 并发位次：R2-2（依赖 T23）。
- 失败路径：脚本属发布物需走 release 链（1.4.0 → 1.4.1）→ hand_back 交交付发布经理，不在本卡改版本号。
- 证据要求：两次脚本 JSON 原文 + diff。

### T25 · 御史大夫抽巡复核（S6）
- 目标：对本树交付物做独立复核（不信自报），逐项对代码/实测。
- 写域：`docs/squad/audit/`（新文件 `P-004-抽巡.md`）。
- 验收标准：抽查 ≥10 卡，每卡结论「符合/部分符合/不符合」+ 证据；每条缺陷要么挂返工卡号要么上报用户；不得出现「已闭环」无证据的判定。
- 并发位次：R4-1（依赖 L3/L4 完成）。
- 失败路径：复核需写入被复核者的写域 → hand_back；发现假绿（自报与实测不符）→ 直接判该卡 failed 并上报。
- 证据要求：逐条 file:line/命令输出 + 缺陷清单。

### T26 · 太傅 retro 与 S9 反哺 S1
- 目标：本迭代机制缺陷 → 改进项 → 回写「流水线/门禁/提示词」三处之一。
- 写域：`docs/squad/retro-P004.md`（成员正文，非代落）。
- 验收标准：≥4 条缺陷各配改进项 + 回写落点（DELIVERY-PIPELINE/GATE/prompts 三选一）+ 下迭代验收口径；改进项不得只是「加强沟通」类不可测表述。
- 并发位次：R4-2（依赖 T25）。
- 失败路径：改进项需改 DELIVERY-PIPELINE.md（pipeline/ 归测试经理/考功郎中；宪法归架构经理）→ hand_back 提建议稿。
- 证据要求：缺陷 ↔ 证据行 ↔ 改进项 ↔ 回写路径四列表；引用 T25 结论。

---

## 三、写域互斥自查（AGENTS §1 并发铁律）

| 目录 | 涉及卡 | 具体文件 | 是否重叠 |
| --- | --- | --- | --- |
| docs/arch/ | T01, T09 | kms-hsm-contract.md / api-contract.md | 否（异文件） |
| docs/prd/ | T08, T21(→rerun) | clarifications-C1-C8.md / rerun/06-PRD.md | 否 |
| docs/squad/gates/ | T06 | G-S6-kms.md（G-S6.md 归总指挥，未列入任何成员卡） | 否 |
| gateway-java/src/main/java/.../crypto/ | T02 | 仅 T02 | 否 |
| gateway-java/src/main/java/.../config/ | T10 | 仅 T10 | 否 |
| gateway-java/src/main/resources/ | T03 | 仅 T03 | 否 |
| gateway-java/src/test/java/.../crypto/ 与 /contract/ | T04, T11 | 异目录 | 否 |
| docs/squad/rerun/01~09 | T17,T18,T19,T20,T21,T22 | 一席一文件 | 否 |
| docs/squad/pipeline/ | T16 | 仅 P-004-decomposition.md | 否 |
| deploy/ docs/qa/ docs/squad/{intel,prompts,reviews,releases,metrics,audit} | T05 / T11 / T07 / T12 / T13 / T14 / T15 / T25 | 一席一目录 | 否 |
| docs/squad/FUNCTION-LEDGER.md + STATE.md | T23（总指挥亲笔） | 成员不得写 | 与成员卡零交集 |
| packages/dsh-quanneng-squad/scripts/ | T24 | 仅 T24 | 否 |

**冲突裁决记录**：拆分过程发现 T06（gates/G-S6.md）与 T23（STATE.md 门索引）若按原命名将落到总指挥专属文件 → 已改为新文件 G-S6-kms.md，本卡不自建归属，仅调整卡片命名以消歧。此为可自解的命名冲突，非同文件写请求，故不构成 hand_back；若 captain 认为应走正式 hand_back 流程，本席按裁决执行。

## 四、派工建议（每轮 ≤3，R1~R4 共 26 卡）

| 轮次 | 在跑卡 | 并发数 | 出门判据 |
| --- | --- | --- | --- |
| R1 | T01 · T07/T12/T16/T13(候补) · T23 | ≤3（T07 与 T12 二选一先行） | KMS 契约冻结 + 三席脱零 + 台账重定义落笔 |
| R2 | T02+T03 · T08 · T17~T19(取 3) | ≤3 | 实现编译绿 + 处置矩阵 + 代落替换过半 |
| R3 | T04/T05 · T09/T10 · T20~T22(取 3) | ≤3 | 测试全绿 + 开关落地 + rerun 全正式稿 |
| R4 | T06 · T11/T14 · T15/T25/T26 | ≤3 | G-S6 三值结论 + 发布双侧 + 度量与抽巡 + S9 反哺 |

> 提醒：本轮次表受 CONSTITUTION C2（并发 ≤3）与宿主 active child limit 约束；同屏 8 席为并发预算而非编制上限（AGENTS §5）。派活须用 agent_teams_send_message 投递活席位（激活≠驱动，STATE.md 第十九轮）。
