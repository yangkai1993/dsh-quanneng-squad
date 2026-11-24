# 上线潜力评估 · 1.20.0（2026-11-24）

> 〔评估口径〕实采数据（npm pack/doctor/冷启动/verify/tests）＋上线四维判据（分发就绪度/上手路径/运行自愈/生态位）。
> 结论先行：**门禁与工程化已达头部开源水准（122 断言+53 测试+9 门+hard-green），上线主要短板不在质量而在「渠道」**——分发/文档/宿主生态三件事。

## 一、实采数据（1.20.0）

| 维度 | 实测值 | 判读 |
| --- | --- | --- |
| 包体 | 208.5 kB packed / 626.5 kB unpacked / 143 files | ✅ 轻量（竞品 MetaGPT/autogen 数十 MB） |
| 零依赖 | 无 npm 运行时依赖 | ✅ 安装无链式风险 |
| 安装 | install.mjs 幂等+二次执行 patchSynced=false | ✅ |
| 冷启动 | cold-start smoke 0.6s ok（隔离 profile degraded=宿主版本探测缺位，真实 profile ok 已实测） | ✅ |
| 质量门 | verify 122/0、tests 53/53、9 门、release 链 hard-green | ✅ 头部水准 |
| 升级安全 | upgrade 四路径+自动回滚+备份滚动 N=5 | ✅ |
| 可观测 | hub 六源/看板四面板/rank/pulse:board/diagnostics | ✅ |
| 兼容 | engines node>=22 dsh>=0.1.2-alpha.2 | ✅ 明示 |

## 二、还差劲的地方（上线阻塞度排序）

| # | 短板 | 证据 | 阻塞度 | 打法 |
| --- | --- | --- | --- | --- |
| B1 | **分发渠道未接**：npm 未 publish（package.json 无 repository/bugs/homepage） | registry 不存在 | 🔴 第一阻塞 | 补三字段→npm publish |
| B2 | **宿主绑定单一**：dist-adapters 21 件已生成但 Claude Code marketplace 未实际发布，其余宿主只做了形态 | dist-adapters 生成态 | 🔴 生态位=0 | 先 Claude Code marketplace 实测一条安装路径 |
| B3 | **上手是节点命令流**：Quick Start 5 步全 node 命令，无 /squad:quickstart slash（commands 已导出宿主未接） | README | 🟡 中 | B2 通后 slash 即可用 |
| B4 | **看板是 CLI 长驻服务**：需手动 ux:board，宿主 GUI 无内嵌入口 | board.mjs | 🟡 中 | 宿主 webview 扩展点时挂载 |
| B5 | **真实多用户用例为零**：全部轮次/令牌/事件为本机自演 | inbox/dispatch 全内部令牌 | 🟡 中（上线后自然解） | 发布后建 feedback 路径 |
| B6 | **FUNCTION-LEDGER 含退役写域**（gateway-java/ 仍为后端经理第一写域） | dispatch-plan domains 实测含 gateway-java/ | 🟢 低但丢精度 | 派测试经理修 LEDGER |
| B7 | **CI 徽章不渲染**（仓库未推远端） | R4 CI 在但无 remote | 🟢 低 | git remote 推送即活 |
| B8 | **S9 反哺断流风险**：六期直营改码未走完整派活循环；提示词未同步新机制触发语（状态机门/看板） | INDEX 无新版次 | 🟢 低 | 下轮 S1 集贤学士补 P16 |

## 三、上线潜力打分（10 分制）

| 维 | 分 | 依据 |
| --- | --- | --- |
| 工程质量 | **9** | 122 断言/53 测试/9 门/hard-green/回滚链——对标 wshobson garden 三门同级 |
| 功能完备 | **8** | 编排闭环/技能/看板/计量齐；缺 hooks 自动触发（G2） |
| 分发就绪 | **5** | 包体合格但渠道未接（B1/B2）——**上线主短板** |
| 上手体验 | **6** | doctor/upgrade/smoke 齐，但 slash 未通、无站 |
| 生态信号 | **3** | 零真实用户、零第三方宿主实测 |

**综合 6.2/10——质量过硬、渠道未通。**

## 四、上线最小路径（三条腿，估 1~2 天）

1. **B1（半天）**：package.json 补 repository/bugs/homepage → git remote 推 GitHub → npm publish --access public。
2. **B2（半天）**：dist-adapters/claude-code 真机实测：装 Claude Code → /plugin marketplace add <repo> → /plugin install → /squad:status——一条真实安装路径通了生态位从 0 变 1。
3. **B6（半小时）**：FUNCTION-LEDGER 退役域修正（派测试经理）→ release 复跑。

发布后第一周：S-1 采风官收集真实安装反馈 → S9 太傅归纳（反复模式进 G-REFLOW）。

## 五、明确不建议现在做

- hooks 自动触发（宿主 API 未定）；技能市场生态（依赖第三方贡献）；文档站（等自然流量）。