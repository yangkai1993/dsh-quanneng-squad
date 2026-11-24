# 架构决策：主对话 + subagent（2026-11-20）

## 决策
全能小队主通道由「多 agent 会话制（squads_run_member + agent_teams 消息）」切换为「**主对话 + subagent**」。

## 动因
用户实测反馈：多 agent 会话制带来大量 bug 与限制（buddy 上游按 multi-agent system prompt 指纹拦截、team.json 状态损坏、captain 会话解绑、mailbox 丢消息、席位 pin 反复锁死模型），使用成本远超收益。

## 新通道
- **派活**：主对话内直接 `subagent({ description, prompt })`，prompt 首行注入 `squadRole: <squad-toolkit/roles/xxx.md>` + 六要素任务书。
- **回收**：subagent 的完成回报直接回到主对话（不再经 inbox 文件 / agent_teams_send_message）。
- **并发**：subagent 天然并行，无同屏 8 席 cap。
- **模型**：subagent 跟随主对话当前模型，无独立 pin，天然不锁死。

## 兼容
- agent_teams / squads_run_member 保留为兼容通道，不再作为主通道；历史 team.json / inbox / 名册快照作为证据留档。
- 全部门（verify / release / reflow / seat-utilization）继续有效，只是派活动作的主体从 agent 会话改为 subagent。

## 不变
- 16 人编制、S-1~S9 阶段、六要素任务书、P1~P15 反哺、门禁体系、必产物路径全部不变——变的只是「谁去执行」。
