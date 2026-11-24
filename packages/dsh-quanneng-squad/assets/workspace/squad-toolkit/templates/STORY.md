# 故事卡 <STORY_ID> · <标题>

| 项 | 值 |
| --- | --- |
| 故事号 | <STORY_ID> |
| 域 / 经理 | <DOMAIN> / <MANAGER> |
| 员工角色稿 | squadRole: squad-toolkit/roles/<ROLE>.md |
| 目录所有权 | <ALLOWED_DIRS>（AGENTS.md §1） |
| 派活文档指针 | <DISPATCH_DOC_PATH>（文档总线：无指针不成派活） |
| 契约版本 | <CONTRACT_VERSION> |
| canary 规则 | (空 | canary 规则生效：P-<编号>) |
| 状态 | <BACKLOG / IN_PROGRESS / REVIEW / DONE / BLOCKED> |

## 目标
<GOAL>

## 任务清单
1. <TASK_1>
2. <TASK_2>
3. 同步更新相关文档（漏更 = 卡未完成，初审退回）

## EARS 验收标准
- **Ubiquitous**: 系统应 <ALWAYS_BEHAVIOR>。
- **Event-driven**: When <EVENT>, 系统应 <RESPONSE>。
- **State-driven**: While <STATE>, 系统应 <RESPONSE>。
- **Unwanted**: If <ERROR_CONDITION>, then 系统应 <FAILURE_RESPONSE>。
- **Optional**: Where <FEATURE>, 系统应 <RESPONSE>。

## 约束
- 只允许写 <ALLOWED_DIRS> 内文件；越权 diff 初审直接退回。
- 不得修改契约/宪法/AGENTS.md；需要变更走 CR。
- 每轮并发 ≤ 3；与其他并行任务目录互斥。
- 回报 ≤ 40 行；证据含实际命令与输出。

## 自测记录（员工回填，禁止「未执行」谎报）
| 命令 | 期望 | 实际 | 结论 |
| --- | --- | --- | --- |
| <CMD> | <EXPECT> | <ACTUAL> | <PASS/FAIL> |

## 初审（经理）
- 验收标准逐条对表： <PASS/FAIL>
- 越权 diff： <CLEAN/VIOLATION>
- EARS 真实现： <PASS/FAIL>
- 自测证据： <PASS/FAIL>
- 宪法合规： <PASS/FAIL>
- 结论： <通过报终审 / 退回补正>

## 门禁
G-S<阶段> → docs/squad/gates/G-S<阶段>.md
