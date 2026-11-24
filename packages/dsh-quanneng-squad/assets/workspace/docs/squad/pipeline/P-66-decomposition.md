token: TK-66-03
# P-66 任务拆分 · 太傅 retro 改进项回写（captain 代理执行）

> PROXY DECLARATION（PROXY-AUTHORITY 规矩 3）：翰林学士@v21 RATE_LIMIT → 抢派产品经理@v20 RATE_LIMIT → 换班 minimax 翰林@v22 HTTP 402（R6 三次运行用尽）。本票为**纯文档类**（任务树拆分），captain 代理执行；实现代码类不代理。原始席位署名待路由恢复后补签，独立复算见面板 evidence_note。

## 来源与设计依据
- 输入：docs/squad/retro-round-66-monitoring.md（TK-66-01，68 行，4 缺陷+3 改进项，太傅@v20 自签）
- 依据：DELIVERY-PIPELINE 硬规则 4「拆分以可派工为验收」+ 硬规则 5「S9 反哺 S1」
- 写域原则：AGENTS §1 目录所有权；三子卡写域互斥（流水线文档 / 门禁脚本 / 提示词文档），可并行；门禁脚本卡依赖流水线卡裁决

## 任务树

### 子卡 C1 · S9 必产物纳入门禁（流水线回写）
| 要素 | 值 |
| --- | --- |
| 阶段号 | S9 反馈优化 |
| 目标 | 把「S9 必产物 retro-<迭代>.md 缺失判本迭代未完成」写进 DELIVERY-PIPELINE 硬规则；seat-utilization.mjs 增 S9 产物存在性检查 |
| 必产物 | docs/squad/pipeline/DELIVERY-PIPELINE.md（§硬规则追加）；packages/dsh-quanneng-squad/scripts/seat-utilization.mjs（checkS9Artifact） |
| 写域 | docs/squad/pipeline/DELIVERY-PIPELINE.md, packages/dsh-quanneng-squad/scripts/seat-utilization.mjs, scripts/verify.mjs |
| 验收 | ① 硬规则含 S9 缺失即未完成；② checkS9Artifact 在 retro 缺失时 problems 非空、存在时为空（负向探针）；③ verify exit 0；④ 本轮 src 变更归属声明 |
| 证据要求 | `node scripts/seat-utilization.mjs` 两态 exit/problems；`npm run verify` N/0 |
| 失败路径 | 写域与并行卡冲突 → hand_back 报 captain；门禁制定者自查（P8）缺失判部分符合 |
| 依赖 | 无（可先启） |

### 子卡 C2 · 应上未上门禁（裁决后再落，暂缓）
| 要素 | 值 |
| --- | --- |
| 阶段号 | S9 → 门禁 |
| 目标 | 新建 gate-rotation.mjs 把「ROSTER §七当轮应上但未签发令牌」作为阻断项 |
| 必产物 | packages/dsh-quanneng-squad/scripts/gate-rotation.mjs（待裁决后建） |
| 写域 | packages/dsh-quanneng-squad/scripts/gate-rotation.mjs, package.json |
| 验收 | **前置裁决**：太傅原案「全量应上即阻断」与 ROSTER §六 cap=8 换班制冲突（每轮仅上 8 席，全量阻断必每轮红）。须 captain 裁决：A) 按 W 轮次 8 席名单阻断（推荐，与换班一致）或 B) 仅软提示维持现状。裁决前本卡=blocked，不得实现 |
| 证据要求 | 裁决记录落 DECISIONS.jsonl + 任务书标注裁决编号后解锁 |
| 失败路径 | 未裁决即实现 → hand_back（越权）；裁决为 B 则本卡作废，轮转建议留在 pulse.mjs |
| 依赖 | C1（共享门禁链语义）；裁决前置 |

### 子卡 C3 · 提示词内化 S9 触发条件（提示词回写）
| 要素 | 值 |
| --- | --- |
| 阶段号 | S1 提示词优化 |
| 目标 | 太傅角色提示词内化 S9 触发条件与交付标准（机制缺陷≥3带 file:line / 改进项≥2带回写落点 / 验收口径表 / src 变更归属段） |
| 必产物 | docs/squad/prompts/<太傅角色>-v<n+1>.md（现行版+1）+ INDEX 主表指针更新 |
| 写域 | docs/squad/prompts/ （与 TK-66-02 已闭合卡同写域，串行即可） |
| 验收 | ① 四节齐全；② [S9] 节含交付标准；③ INDEX 更新且旧版保留；④ 首行 token |
| 证据要求 | wc -l / grep [S9] / INDEX diff |
| 失败路径 | 现行版指针不明 → 按 INDEX.md 主表裁决，不自造版本 |
| 依赖 | 无（C1/C2 写域不相交，可并行） |

## 依赖图与写域互斥
```
C1 (pipeline+seat-utilization) ──┬── C2 (gate-rotation, 需裁决)
                                └── C3 (prompts, 独立)
```
- C1 写 scripts/seat-utilization.mjs + verify.mjs；C2 写 scripts/gate-rotation.mjs + package.json；C3 写 prompts/。写域不相交，C1∥C3 可并行，C2 待裁决。
- 同一文件不并发：C1 改 verify.mjs 与任何后续断言改动须串行（AGENTS §1 并发冲突铁律）。

## 本轮 src 变更归属（时刻监督）
| 项 | 值 |
| --- | --- |
| 执行者 | captain 代理执行（翰林三跑全灭，纯文档类可代理）；本拆分仅产出 docs/squad/pipeline/ 文档，零业务 src 变更 |
| 涉及 src 文件 | 无（C1/C2 实现写域仅为后续子卡规划，本卡未触及） |
| 门禁 | lead-scope-check 本段抽验；captain 代理声明见文首 PROXY DECLARATION |

