# 全员在线 · 突破 8 席限制的完整方案（2026-11-06 实测定位）

## 一、这不是「限制」，是插件默认值

| 项 | 实测 |
| --- | --- |
| 提供 team 能力的插件 | `@nanmicoder/dsh-agent-teams@0.1.29`（enabled / installed / profile 层） |
| cap 定义位置 | `lib/index.js`：`maxMembers: z.natural().min(1).default(8)` |
| 报错读取 | `lib/tools.js`：`... >= config.maxMembers) { throw new Error(`team "..." is at its member cap (${config.maxMembers})`) }` |
| 是否有硬上限 | **没有**。zod 只要求 `min(1)`，文档明确写 `maxMembers: 8` 是可覆盖的配置项 |
| 官方文档 | 插件 README / README_ZH「配置」段给出完整 `config:` 覆盖范例，含 `maxMembers` |
| profile 名册上限 | `resolveTeamProfile(profiles, name, maxMembers)` 校验 `members.length > maxMembers`；16 ≤ 16 通过（已用插件自身函数实测 `RESOLVED_members=16`） |

**所以「全员在线」的正确做法 = 把 `maxMembers` 从 8 改成 16，并预置 16 人 profile。** 之前的换班/专家包组合是绕行方案，现可作为节流机制保留，不再是唯一解。

## 二、已实际改了什么（不是只给建议）

文件：`C:/Users/ASUS/.dsh/profiles/desktop/cordis.patch.yml`（用户配置层，已备份 `.bak-*`）

```yaml
- id: agent-teams
  name: '@nanmicoder/dsh-agent-teams'
  config:
    stateDir: .agent-teams
    memberProvider: spawn
    maxMembers: 16          # ← 8 → 16
    memberMaxDepth: 0
    profiles:
      quanneng-16:
        description: 全能编程小队 · 全编 16 人全员在线
        members:            # 16 个角色，各带 role
          - name: 需求经理
            role: 规划域·需求基线
          ...（共 16）
```

校验证据：
- 插件 schema：`z.natural().min(1).default(8)` → 16 合法。
- 插件自身 `resolveTeamProfile(profiles,'quanneng-16',16)` → `RESOLVED_members=16`（用真实 node.exe 跑 `lib/profiles.js` 纯函数通过）。
- 结构检查：id/name/config/maxMembers:16/profileKey/16 members/16 role/无未声明 tool_policy 全部 PASS。
- 已避开坑：初版写了 `tool_policy: default`，但插件要求策略 id 必须已声明（未声明会挂载失败），已全部改成合法 `role` 字段。

## 三、为什么本会话还看不到 16 人

`plugin_manager({action:'set_plugin'})` 明确返回 `application: "restart-required"` / `nextStep: "Tell the user to restart DSH to apply this change"`。
**配置变更只在重启宿主后的新会话生效**——这是唯一剩余步骤，且需要你操作（我无法在当前会话热更新已挂载的插件配置）。

## 四、重启后新会话的激活脚本（可直接执行）

```js
// 1) 先确认配置生效：再 add 第 9 人应成功
const rd = await tools.squads_read({ squadId: 'baa0a893-bda5-409b-840b-07a45cdcf290' });
for (let i = 0; i < rd.squad.members.length; i += 3) {
  await Promise.all(rd.squad.members.slice(i, i+3).map(m =>
    tools.agent_teams_add_member({ name: m.name, preset: m.preset })));
}
const st = await tools.agent_teams_status({});
console.log('members =', st.members.length);   // 期望 16
console.log(await tools.list_agents({}));       // 期望 lead + 16 teammates

// 2) 或用预置 profile 一次性拉起（若宿主支持 profile 激活）
//    /agent-teams use quanneng-16
```

验收口径：`agent_teams_status().members.length === 16`、`list_agents` 出现 17 个节点（lead + 16）、给第 17 人 add 才报 cap(16)。

## 五、与你最初设想的完整对齐

| 最初设想 | 之前状态 | 现在 |
| --- | --- | --- |
| 16 人全编 | 编制 16 常驻、同屏 8 | **配置改为 16 席，重启即 16 人同时在线** |
| 三省六部 / 谋断四署 | 换班 W1~W4 | 全员在线后可单轮全链跑，换班降级为可选节流 |
| 科抄/抽巡/记注/考功 | 轮流上场 | 全部同时在场，不再互相挤席位 |
| 文档总线 / 门禁 / 反馈闭环 | 已实现 | 保留 |
| 专家团组合 | 知识层落盘 | 保留（专家包仍可注入，不受席位影响） |

## 六、风险与回滚
- 备份：`cordis.patch.yml.bak-1794362838487`，删除本段 block 即回到默认 8。
- 若插件未来版本把 `maxMembers` 改为硬上限，需重新核对 `lib/index.js` 的 zod 定义。
- 16 个 teammate 同时活跃会增加模型并发开销；宪法 C2「并发任务 ≤3」仍适用于**任务级**，不等于席位数。
- `memberMaxDepth: 0` 保持，成员不派生子代理，避免扇出失控。

## 七、一句话
**限制来自 `@nanmicoder/dsh-agent-teams` 的 `maxMembers` 默认 8，我已把它改成 16 并用插件自身 schema 校验通过；只剩「重启 DSH 并开新会话」这一步由你完成，之后 16 人就能真正全员在线。**
