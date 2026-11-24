token: TK-66-00
date: 2026-11-16T08:45:50.066Z
model: buddy/hy4flash-free (DeepSeek Harness session)
grep: E:\workspace\trade-in\docs\IMPLEMENTATION-STATUS.md:| `list_subagent_models` | `buddy — CodeBuddy (腾讯)`（Unlisted，无 Session allowlist） |
E:\workspace\trade-in\docs\squad\briefs\round-34.md:① 重启后三张令牌产物全部未落盘（子进程被 stopped，wake 不等于完成——再次印证「激活≠驱动」）；② 上次派单漏登记 dispatch 卡；③ stage-order 豁免过期未撤；④ 我（captain）本次模型切到 hy4free，而 profile 默认与 16 席均为 buddy/glm-5.3-flash——audit-roster 门绿说明「跟随 profile 默认」机制生效，队长模型与成员模型解耦。
E:\workspace\trade-in\docs\squad\briefs\round-37.md:① profile 副本目录在 GUI 重启后曾消失 → 两条安装副本测试硬编码路径误报失败；已改为候选路径探测 + 无副本时 skip（不是假绿，附明确理由）。② roster-snapshot 跨日过期 17.7h（我最初误算成 1.8h，实跑 `Date.now()` 才纠正）→ export-roster 按 12h fail-closed 卡住发布；用实时 `agent_teams_status` 落盘重建快照（16 席 buddy/glm-5.3-flash），并把报错文案改为明确「fail-closed + 重建方法」（P2 防线）。③ 我 G-S3 派单里把裁决文件路径写成 gates/（实为 docs/arch/），给事中已纠正。
E:\workspace\trade-in\docs\squad\briefs\round-46.md:1. **模型切换第三次触发 audit-roster 门**：会话模型 qfmodel→buddy/hy4free，16 席快照过期 31h 且路由落后。按既有机制 remove+re-add 轮换 **@v17**（16/16 buddy/hy4free）+ 重导实时名册快照 → 门 exit 0。旧 @v16 的两个后台会话随后被停止，在途两票（TK-46-01/02）**重投到 @v17 活席位**（delivered: wake），dispatch 卡登记重投状态行（G 类 running 宽限）。
E:\workspace\trade-in\docs\squad\briefs\round-57.md:2. audit-roster 真红：profile 默认已随 runtime 切到 qodercn/qfmodel，16 席仍是 buddy/hy4free 遗留快照；新 runtime 已卸载 agent_teams 通道、无法 remove+re-add。按 P2 不伪造：登记成对到期豁免（audit-roster + l4-maturity，2026-11-18，闭合条件=席位在 quanneng-16 profile 显式钉定或通道恢复，两行同批删除）。M11 如实报 soft-green、链内 [L4 未到达] 1 项差距但不阻断 —— fail-closed 联动正确.
