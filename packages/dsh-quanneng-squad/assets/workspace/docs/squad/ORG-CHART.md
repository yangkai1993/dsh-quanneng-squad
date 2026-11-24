# 全能编程小队 · 智能组织结构图（唯一归属真源）

> 状态：已生效（2026-11-17）｜ 真源：`packages/dsh-quanneng-squad/assets/canonical/presets.yml`（7 类 preset persona 的 `【组织归属】` 声明）+ `lib/index.js` 的 `SQUAD_PRESETS`。本文件是组织关系的可核查视图；编制调整须经小队指挥裁决并同步这三处。

## 一、统辖原则

1. **单一指挥源**：`squad-lead`（小队指挥）是全队唯一拆解、派活、验收与汇报节点，7 类 agent preset 与 16 名编制成员全部直接归属于它。
2. **禁止横向派活**：成员预设之间不得互相派活或互相验收；信息经指挥中转或经共享文件（AGENTS.md §5）。
3. **监察独立性保留**：`squad-court` 的封驳/弹劾按宪法 C3 独立行使，但编制与派活归属仍在指挥（宪法 C1/C3 同时满足）。
4. **编制 ≠ 并发**：16 席为常驻编制，同屏并发 ≤8、每轮派活 ≤3（AGENTS.md §6 / 宪法 C2）。

## 二、指挥—预设—席位归属表

| 预设 id | 预设名称 | 归属（直接上级） | 域 | 覆盖席位（16 席编制） |
| --- | --- | --- | --- | --- |
| `squad-lead` | 小队指挥（全能编程） | 自辖（全队唯一指挥源） | 指挥 | 全队 16 席的派活与验收 |
| `squad-arch` | 小队·需求与架构 | `squad-lead` | 规划域 | 需求经理、产品经理、架构经理 |
| `squad-design` | 小队·UI/UX 设计 | `squad-lead` | 设计域 | 常驻预设；当前 16 席无独立设计席，UI 可用性评审由前端经理代行（FUNCTION-LEDGER 已登记） |
| `squad-dev` | 小队·开发工程师 | `squad-lead` | 实现域 | 前端经理、后端经理 |
| `squad-qa` | 小队·质量与审计 | `squad-lead` | 质量域 | 测试经理 |
| `squad-ops` | 小队·运维与交付 | `squad-lead` | 运维域 | 运维经理、交付发布经理 |
| `squad-court` | 小队·朝廷治理岗 | `squad-lead` | 监察谋断 | 御史大夫、给事中、考功郎中、起居注官、采风官、集贤学士、翰林学士、太傅 |

合计：7 类预设、16 个席位，席位归属无遗漏、无重复（`squad-design` 为预设常驻、席位代理制）。

## 三、结构树

```
squad-lead（小队指挥 · 唯一指挥源）
├─ squad-arch   → 需求经理 / 产品经理 / 架构经理
├─ squad-design → （预设常驻；前端经理代行 UI 评审）
├─ squad-dev    → 前端经理 / 后端经理
├─ squad-qa     → 测试经理
├─ squad-ops    → 运维经理 / 交付发布经理
└─ squad-court  → 御史大夫 / 给事中 / 考功郎中 / 起居注官
                  采风官 / 集贤学士 / 翰林学士 / 太傅
                  （封驳/监察按宪法 C3 独立，编制归属指挥）
```

## 四、治理接口

- **派活**：指挥经 `squads_run_member` 派经理；经理对员工用 subagent；提示词首行 `squadRole:` 以 `docs/squad/prompts/INDEX.md` 现行版为准；任务书带 `TK-<轮次>-<序号>` 令牌。
- **阶段流水线**：S-1~S9 责任席位与必产物见 `docs/squad/pipeline/DELIVERY-PIPELINE.md` 与 `docs/squad/FUNCTION-LEDGER.md`，缺产物即迭代未完成。
- **验收**：指挥验收三查（落点 / 逐条对表 / 抽验命令）；成员回报 ≤40 行，只读成员报告由指挥代落 `docs/qa/`。
- **变更**：本表或 preset 归属的变更走 CR（宪法 C10）；更新后重跑 `node scripts/build-patch.mjs && node scripts/verify.mjs`。

## 五、可核查性

- `grep -c '【组织归属】' packages/dsh-quanneng-squad/assets/canonical/presets.yml` → 7（每类预设一条）。
- `lib/index.js` 的 `SQUAD_PRESETS` 数组 → 7 条，每条 `commander` 均为 `squad-lead`（指挥自辖除外）。
- `node scripts/verify.mjs` → preset 数量/ID、patch 生成一致性、名册 16 席断言全绿。
