# 根因分析 · 「流程没按全能小队设计跑 / 子智能体来源不明」

## 现象
上一轮：16 名成员虽全部 `squads_run_member` 激活，但**零治理产出**；同时出现 4 个来源不明的 subagent 并发覆写 `src/` 共 6 轮；最终由总指挥（我）自己写完 20 个模块。

## 三条断链（证据）

1. **预设运行时阻塞**：`squads_run_squad` 返回 `preset-unavailable`：`squad-lead` 的 `@deepseek-ai/dsh-tool-subagent-control/list-agents` 报「never started」。`cordis.patch.yml` 中该插件确为 `disabled: false`，属宿主未加载完成；配置变更只在新会话生效。
2. **规则资产全部缺失**：`squads_read` 里 16 份 brief 引用 `squad-toolkit/roles/*.md`、`templates/STORY.md`、`METRICS.md`、`CONSTITUTION.md`、`AGENTS.md`、`STATE.md`、`gates/`、`TRACE.md`、`落地手册.md`——整改前工作区一个都不存在（`whale-roles/` 为空目录，无 squad 落盘文件）。整套 S0 拷问门 / 故事卡 / 科抄封驳 / 门禁 / 五态管线只有描述、没有可执行载体。
3. **通道用错**：我用 `tools.subagent({description,prompt})` 裸派了 4 个进程承载实现任务，并亲自编写全部业务代码。这直接违反 lead persona：
   - 「你不写业务代码：实现一律派给成员会话」
   - 「总指挥直接派的 subagent 只做一次性侦察调研，maxDepth: 1；正式成员走 squads_run_member 通道」
   - 「每轮并发 ≤ 3；并行任务目录互斥，禁止两个并行任务写同一文件」
   - 那些「来源不明的子智能体」= 这 4 个裸 subagent（ID：dc1d8f14 / 570c6779 / 0033adf2 / ac8daa65 / ff3bf479），它们不挂 team 总线（`wait_agent` 报 `no-active-peer`），无 brief、无预设、无目录所有权，因此互相覆写。

## 后果量化
- 并发覆写 6 轮，涉及 store.js / state.js / response.js / mock / inbound / adapter。
- 3 轮语义漂移（302 判成功、camelCase subCode、EVENT 导出丢失、encryptData 未进报文）。
- 修复循环远超 S5 的 3 轮硬顶。

## 整改（本轮）
1. 补齐 `全能编程小队-落地手册.md`（§0~§8，preset persona 可执行化副本）。
2. 补齐 `docs/squad/CONSTITUTION.md`、`AGENTS.md`（§1 目录所有权 + 资源分配表，已被宿主读取注入）、`squad-toolkit/VERSION.md`。
3. 补齐 `squad-toolkit/templates/` 8 份、`roles/` 12 份员工角色稿、`METRICS.md` M1~M9。
4. 建立运行时账本：`STATE.md`、`TRACE.md`、`gates/`、`journal/`、`audit/doc-freshness.md`、`pipeline/PIPELINE.md`。
5. 显式化子智能体产生链路（见下）。

## 子智能体产生链路（唯一合法）

```
用户粗稿 → 翰林会诊 → 采风 → 集贤 → 太傅票拟 → 用户拍板
  → 需求经理落基线 → S0 拷问门
  → 总指挥用 squads_run_member({squadId, memberId, task}) 激活【经理会话】(自带 preset + brief + 权限)
  → 经理用 subagent 派【员工】，提示词首行 squadRole: squad-toolkit/roles/<role>.md
  → 总指挥直接派的 subagent 仅一次性侦察（maxDepth:1），不得承载实现
```

禁止：`tools.subagent()` 冒充小队成员；两个并行任务写同一文件；指挥亲自写业务代码。
