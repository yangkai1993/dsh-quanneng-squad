# 全能编程小队 · 交互协议 v2.9（实测版）

> 本文件是 **2026-11-06 逐员在岗检测** 的结论，不是设计推演。所有结论附实测证据。

## 一、在岗检测（16/16 全部通过）

方法：对 `squads_read` 返回的 16 个 memberId 逐个调用
`squads_run_member({squadId, memberId, task:'【在岗检测·只读】...'})`，检查返回 `ok / run.id / run.status`。

| 角色 | 预设 | 权限 | 探针结果 |
| --- | --- | --- | --- |
| 需求经理 | squad-arch | workspace-write | ok / running |
| 产品经理 | squad-arch | workspace-write | ok / running |
| 架构经理 | squad-arch | workspace-write | ok / running |
| 前端经理 | squad-dev | workspace-write | ok / running |
| 后端经理 | squad-dev | workspace-write | ok / running |
| 御史大夫 | squad-court | **read-only** | ok / running |
| 运维经理 | squad-ops | workspace-write | ok / running |
| 交付发布经理 | squad-ops | workspace-write | ok / running |
| 测试经理 | squad-qa | workspace-write | ok / running |
| 给事中 | squad-court | workspace-write | ok / running |
| 考功郎中 | squad-court | workspace-write | ok / running |
| 起居注官 | squad-court | workspace-write | ok / running |
| 采风官 | squad-court | workspace-write | ok / running |
| 集贤学士 | squad-court | workspace-write | ok / running |
| 翰林学士 | squad-court | workspace-write | ok / running |
| 太傅 | squad-court | workspace-write | ok / running |

七个预设 `squad-lead / arch / design / dev / qa / ops / court` 均在 `cordis.patch.yml` 注册。

⚠️ **「running」只证明会话被拉起，不等于回传可用**。见下节断链。

## 二、交互通道实测

| 通道 | 实测结果 | 可用性 |
| --- | --- | --- |
| `squads_run_member({squadId, memberId, task})` | 16/16 返回 `{ok:true, run:{id,status:'running'}}` | ✅ 派活（单向） |
| `list_agents({})` | 仅 `[{target:'lead', role:'lead', status:'running'}]`，16 个经理会话**不出现** | ❌ 看不到成员 |
| `send_message({target: memberId})` | `active teammate "<id>" not found` | ❌ 旧通道够不着（见 §七 替代） |
| `send_message({target: '架构经理'})` | `active teammate "架构经理" not found` | ❌ 旧通道够不着（见 §七 替代） |
| `wait_agent({timeout_ms:10000})` | `no-active-peer: No other Team member is running or provisioning` | ❌ 等不到 |
| `squads_run_squad(...)` | `preset-unavailable: squad-lead ... tool-subagent-list-agents: never started` | ❌ 整队启动被宿主拦 |
| `team_task_create({subject, description})` | `{id:'task-1', status:'pending', ready:true}` | ✅ 板面可用 |
| `task_board_create({title})` | `{ok:true, task:{id,status:'todo'}}` | ✅ 板面可用 |
| `agent_teams_status({})` | `sn26-gateway` team，members: `[]`，`loop_state:'blocked'` | ⚠️ 空队 |
| `job_list({})` | `[]` | ❌ 无后台作业 |
| `squads_update / squad_member_update / squads_read` | 回读 v2.8 + 16/16 资产指针成功 | ✅ 定义可持久化 |
| `agent_teams_add_member({name,preset})` | 8/8 注册成功，第 9 人起 `member cap (8)` | ✅ 有限（硬上限 8） |
| `agent_teams_send_message({to,content})` | captain→成员 `delivered:"wake"`；成员→captain `delivered:"live"` | ✅ **原生消息双向可达（§七）** |
| **文件总线（共享落盘文档）** | 成员写、指挥读，实测可用（上轮 155 条清单与子会话报告即经此回收） | ✅ **唯一可靠回传** |

### 结论
当前运行时里，`send_message` / `list_agents` / `squads_run_squad` 三工具口径仍不可达（宿主缺 `list-agents` 子插件），但 **`agent_teams` 原生消息通道双向可达**（见 §七 实测）。因此：
- 派活：`squads_run_member`，任务书里必须写明「把回报**写入指定落盘路径**」。
- 回收：指挥用 `read` / `grep` 读那个路径；**禁止**依赖 `send_message` / `wait_agent` 等经理回话。
- 协调：`team_task_create` 建板面卡（写清 writeScopes 与 blockedBy），但板面只是账本，不替代派活。
- 上轮「子智能体来源不明」的根因之一，正是我用 `tools.subagent()` 裸派进程，它们能经 `send_message` 回话、却不带 preset/brief/目录所有权；经理会话正好相反。两者都不该被当作同一条通道。

## 三、唯一合法产生链路（v2.9 修订）

```
用户粗稿 → 翰林会诊 → 采风 → 集贤 → 太傅票拟 → 用户拍板
  → 需求经理落基线 → S0 拷问门
  → 总指挥 squads_run_member 激活【经理会话】(preset+brief+权限)
      任务书含：落盘回报路径 + 目录所有权 + EARS 验收 + 禁止写源码（除非实现域）
  → 经理用 subagent 派【员工】，提示词首行 squadRole: squad-toolkit/roles/<role>.md
  → 指挥直接派的 subagent 仅一次性侦察（maxDepth:1），不得承载实现
  → 回报一律落 docs/squad/inbox/<角色>.md，指挥读文件验收
```

## 四、每员交互契约（16 人）

| 角色 | 派活任务书落点 | 回报落盘路径 | 交互对象 | 只读/写 |
| --- | --- | --- | --- | --- |
| 需求经理 | docs/squad/dispatch/需求经理.md | docs/squad/inbox/需求经理.md | 指挥、产品经理、给事中 | 文档写 |
| 产品经理 | docs/squad/dispatch/产品经理.md | docs/squad/inbox/产品经理.md | 需求、架构、给事中 | 文档写 |
| 架构经理 | docs/squad/dispatch/架构经理.md | docs/squad/inbox/架构经理.md | 给事中、御史、指挥 | 文档写（契约/宪法走 CR） |
| 前端经理 | stories/<ID>.md | docs/squad/inbox/前端经理.md | 员工、后端、指挥 | 代码写（前端域） |
| 后端经理 | stories/<ID>.md | docs/squad/inbox/后端经理.md | 员工、架构、指挥 | 代码写（后端域） |
| 御史大夫 | docs/squad/dispatch/御史大夫.md | docs/qa/patrol-*.md | 直奏指挥/用户 | **只读** |
| 运维经理 | docs/squad/dispatch/运维经理.md | docs/squad/inbox/运维经理.md | 交付、指挥 | deploy 写 |
| 交付发布经理 | docs/squad/dispatch/交付发布经理.md | docs/squad/inbox/交付发布经理.md | 指挥、用户 | CHANGELOG/发布清单 |
| 测试经理 | docs/squad/dispatch/测试经理.md | docs/squad/inbox/测试经理.md | 指挥、御史 | tests 写 |
| 给事中 | docs/squad/dispatch/给事中.md | docs/squad/review-gate.md | 各经理、御史 | 只读代码/文书 |
| 考功郎中 | docs/squad/dispatch/考功郎中.md | docs/squad/inbox/考功郎中.md | 指挥 | 度量/管线目录 |
| 起居注官 | docs/squad/dispatch/起居注官.md | docs/squad/journal/YYYY-MM-DD.md | 指挥 | journal/audit 写 |
| 采风官 | docs/squad/dispatch/采风官.md | docs/intel/intel-<主题>.md | 集贤、指挥、架构 | 情报文档 |
| 集贤学士 | docs/squad/dispatch/集贤学士.md | docs/brainstorm/brainstorm-<主题>.md | 采风、太傅、指挥 | 风暴文档 |
| 翰林学士 | docs/squad/dispatch/翰林学士.md | docs/prompts/clinic-<日期>.md | 指挥 | 提示词文档 |
| 太傅 | docs/squad/dispatch/太傅.md | docs/advisor/ticket-<编号>.md | 用户、指挥 | 独立意见书 |

> 成员间禁止直接对话（实测也无消息通道）；信息经指挥中转或共享文件。

## 五、宿主阻塞与处置

`squad-lead` 预设的 `@deepseek-ai/dsh-tool-subagent-control/list-agents` 报「never started」，导致 `squads_run_squad` 不可用、经理会话不进 `list_agents`。
- 配置层已正确（`disabled: false`），属宿主未完成插件加载；**重启宿主并在新会话生效**。
- 重启前的降级路径就是本文件 §三：逐个 `squads_run_member` + 文件总线回收，不假装消息通道可用。
- 重启后复测清单：`squads_run_squad` 应返回 ok；`list_agents` 应出现 16 个 teammate；`send_message({target:成员名})` 应可达。

## 六、复测命令（v2.10 修订 · 2026-11-06 实测校准）

> 原 §六 三项口径写于「以为重启宿主即可恢复」的假设上。**实测已推翻该假设**：
> GUI 端口从 55215 变为 51646（宿主确实重启过），三项仍全 FAIL。
> 根因：`plugin_manager({action:'list_plugins'})` 全量 262 条中，
> `@deepseek-ai/dsh-tool-subagent-control` 本体 `enabled:true / fiberPhase:active`，
> 但 **`.../list-agents` 这个子路径条目根本不存在**。`cordis.patch.yml` 引用了当前宿主版本不提供的子插件，
> 因此 `squad-lead` 预设被判 unusable；重启多少次都不会出现。

### 三项验收（原口径，实测结果见 RETEST-INTERACTION-6.md）

| 项 | 期望 | 实测 | 结论 |
| --- | --- | --- | --- |
| 1 | `squads_run_squad` 返回 ok | `preset-unavailable: tool-subagent-list-agents never started` | FAIL |
| 2 | `list_agents` 出现 16 个 teammate | 仅 lead（0 个 teammate） | FAIL |
| 3 | `send_message({target:成员名})` 可达 | `active teammate "<名>" not found` | FAIL |

**总判定：三项全 FAIL，且属宿主能力缺失，非配置错误、非会话未重启。**

### 已验证的可用替代通道（本次复测新增）

| 通道 | 实测 | 说明 |
| --- | --- | --- |
| `squads_run_member({squadId, memberId, task})` | **16/16 ok/running**（3 人一批，并发 ≤3） | 唯一可靠的逐员派活 |
| `agent_teams_add_member({name, preset})` | 可注册，但 **team 硬上限 8 人**（第 9 人起 `member cap (8)`） | 只能注册 8/16，状态 `unspawned` |
| `agent_teams_send_message({to, content})` | 8/8 `delivered:"wake"` | **team 内部消息可用**，唤醒后 `list_agents` 仍只有 lead |
| `agent_teams_resume({name, reason})` | `status:"already_running"` | 无副作用 |
| `team_task_create` / `task_board_create` | ok | 板面账本 |
| 文件总线（dispatch/inbox 各 16 份 + read/grep 回收） | 实测可用 | **回报唯一可靠通道** |

### 修正后的可重复复测脚本

```js
// 在 run_code 内；并发 ≤3 分批，遵守 AGENTS.md §1
const SQ = 'baa0a893-bda5-409b-840b-07a45cdcf290';
const rd = await tools.squads_read({ squadId: SQ });
let ok = 0;
for (let i = 0; i < rd.squad.members.length; i += 3) {
  const rs = await Promise.all(rd.squad.members.slice(i, i+3).map(async m => {
    const r = await tools.squads_run_member({ squadId: rd.squad.id, memberId: m.id,
      task: '【§六复测·只读】回报写入 docs/squad/inbox/' + m.name + '.md，禁止写源码' });
    return r.ok === true;
  }));
  ok += rs.filter(Boolean).length;
}
console.log('probe', ok, '/', rd.squad.members.length);
// 三项诊断（预期仍 FAIL，除非宿主升级提供 list-agents 子插件）
console.log('run_squad', await tools.squads_run_squad({ squadId: SQ, task: 'PING' }));
console.log('list_agents', await tools.list_agents({}));
console.log('send_message', await tools.send_message({ target: '架构经理', message: 'PING' }).catch(e => e.message));
// 可用替代：team 内部消息（上限 8 人）
console.log('teams_send', await tools.agent_teams_send_message({ to: '架构经理', content: 'PING' }));
// 插件根因核验：全量分页扫描，应搜不到 list-agents 条目
let off = 0, hit = [];
while (off < 300) {
  const r = await tools.plugin_manager({ action: 'list_plugins', offset: off, limit: 100 });
  const d = typeof r === 'string' ? JSON.parse(r) : r;
  hit.push(...(JSON.stringify(d.entries||[]).match(/.{0,120}list-agents.{0,160}/gi) || []));
  if (d.nextOffset == null) break; off = d.nextOffset;
}
console.log('list-agents plugin entries:', hit.length); // 实测 0
```

### 解除阻塞的真实条件（不再是「重启」）

1. 宿主升级到提供 `@deepseek-ai/dsh-tool-subagent-control/list-agents` 子插件的版本；或
2. 从 `cordis.patch.yml` 的 `preset-squad-lead` delegation 组移除那两行 `tool-subagent-list-agents` 引用（连带接受 `list_agents` 能力降级），并在**新会话**生效；或
3. 保持当前降级路径：逐个 `squads_run_member` 派活 + `agent_teams_send_message` 唤醒（≤8 人）+ 文件总线回收。

在 1/2 达成前，§三 的降级路径就是正式运行方式，不再标记为「临时」。

## 七、v2.11 补记 · 唤醒回报实测（三项 FAIL 不等于交互不可用）

复测记录发出后，注册到 team 总线的 8 名成员经 `agent_teams_send_message({to,content})` 唤醒，出现**真实在岗回报**：

- `docs/squad/inbox/后端经理.md` 新增行：`2026-11-06 · §六复测 | PING 已收到 · 在岗`，并注明已复核 `STATE.md / VERSION.md / AGENTS.md §1`、无并行写冲突。
- 4 个成员落盘了 §六复测 回报：后端经理、御史大夫、运维经理、需求经理。
- `agent_teams_status`：后端经理 `activity:"ready"`，其余 7 人 `running`；`captain_inbox` 收到 1 条在岗确认。
- 该成员回报 captain 用的是 `agent_teams_send_message`，投递 `live`。

### 修正后的判定口径

| 层 | 结论 |
| --- | --- |
| `squads_run_squad` / `list_agents` / `send_message` 三项 | 仍 FAIL，宿主不提供 `list-agents` 子插件（见 §六） |
| **实际交互链路** | **可用**：`agent_teams_add_member`（≤8 人）→ `agent_teams_send_message` 唤醒 → 成员写 `docs/squad/inbox/<角色>.md` → 指挥 read/grep 回收，并经 `agent_teams_send_message` 回报 captain |
| 文件总线 | ✅ 仍是回报唯一可靠落点，与 team 内部 wake 消息互补而非互斥 |

### 因此 §三 的降级路径要精确表述为

```
经理派活：squads_run_member（16/16 可用）
  + agent_teams_add_member 注册（team 硬上限 8，全编 16 需分两批或按编级激活）
  + agent_teams_send_message 唤醒（delivered: wake → 成员 activity: ready）
回报：成员写 docs/squad/inbox/<角色>.md；指挥 read/grep 验收
回执：agent_teams_send_message 回报 captain（delivered: live）
```

> 结论：小队**已能交互**，只是交互面不是 §六 最初设定的那三个工具。§六 三项保持 FAIL 记录不变（诊断宿主缺件），
> 但不得再据此推断「整个小队无法交互」——那是过度结论。

## 八、复测闭合判定（2026-11-06 终版）

| 维度 | 结论 |
| --- | --- |
| §六 三项工具口径 | **全 FAIL**：`squads_run_squad` `preset-unavailable`、`list_agents` 仅 lead、`send_message` `active teammate not found` |
| 宿主根因 | 262 条插件中无 `.../list-agents` 子路径条目；重启过（55215→51646）仍 FAIL，属宿主能力缺失 |
| 逐员探针 | `squads_run_member` 16/16 ok/running（两轮，并发 ≤3） |
| team 注册 | `agent_teams_add_member` 8/8 成功，硬上限 8 人（全编 16 需分两批或按编级激活） |
| 原生消息通道 | captain→成员 `wake` 8/8；成员→captain `live`；`captain_inbox`=3；`.agent-teams/sn26-gateway/inbox/*.jsonl` 有 deliveredAt/readAt |
| 落盘回报 | 8/8 成员写 `docs/squad/inbox/<角色>.md`，全部 ≤40 行、无越权、只读成员仅写本 inbox |
| 成员状态 | 6 人 `activity:"ready"`、2 人 `running`，全部 `idle` 待命 |
| **交互总判定** | ✅ **可交互**：三项原定工具 FAIL，但 `agent_teams` 原生消息 + 文件总线已双向跑通，小队不是「不可交互」 |

### 正式运行方式（取代 §三 的「临时降级」表述）

```
16 员：squads_run_member 派活（唯一全编通道）
 8 员：agent_teams_add_member 注册 → agent_teams_send_message 唤醒
回报：成员写 docs/squad/inbox/<角色>.md（文件总线，指挥 read/grep 验收）
回执：agent_teams_send_message(to=captain) → delivered: live
协调：team_task_create / task_board_create 建板面卡（账本，不替代派活）
```

> 仍需用户操作的只剩一项：**宿主升级**提供 `list-agents` 子插件，或从 `preset-squad-lead` delegation 移除两行引用（配置改动需用户确认且只在新会话生效）。
> ⚠️ 校准：曾写「重启宿主后新会话复测」，**该假设已被证伪**——GUI 55215→51646 表明宿主重启过，262 条插件仍无该子路径条目，三项恒 FAIL。成员回报中沿用「待重启复测」的旧表述一律以本条为准。
> 在此之前，上面这条链路就是正式路径，不再标记「临时」。

## 九、成员回执校准（末轮）

架构经理闭合回执中仍写「宿主插件三项留待重启宿主后新会话复测」。该表述沿用旧假设，**以 §八 校准为准**：
宿主已重启过（端口 55215→51646），`plugin_manager` 全量 262 条中 `list-agents` 子路径条目数为 0，属宿主版本不提供该子插件，重启不会改变结果。
三项 FAIL 是**已定论的宿主能力缺失**，不是待办；可交互结论（`agent_teams` 原生消息 + 文件总线）不依赖它们。


## 十、席位模型校正（v2.13）

此前 §八/§九 写「累计 8 名额」**不准确**。四轮实测校正：
- add_member 与 spawn_teammate 共享 **并发 8 席**；remove_member 释放席位后立即 add 新名字成功（8→7→8）。
- **名字永久占额**：同名角色二次 add 报 has already been used in team；别名（如 产品经理-轮2）可绕开。
- 单会话单 team；squads_run_member 16/16 不受 cap 限制。
- 因此「16 人同时可见」的正确解法不是等宿主升级，而是 **4 轮 8 席换班全覆盖**（ARCH-REDESIGN-cap8.md / ROSTER-16.md §七）。
- 三项原定工具仍 FAIL 属宿主缺 list-agents 子插件，与席位模型无关。

