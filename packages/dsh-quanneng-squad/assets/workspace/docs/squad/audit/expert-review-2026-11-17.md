# 专家团交叉审视结论与处置（2026-11-17）

> 用户指令「参考 GitHub 专家团/专家/skills 完善小队」。调研见 ORG-BENCHMARK-2026-11-17.md；审视用本会话 team-technical（架构/安全/Reality Checker）独立三维。

## 三维结论（原文要点）
- 架构师：当前 83/0 + L4 hard-green 仅证明「治理脚本与文档结构自洽」，不证明 token/context 预算与 checkpoint 续跑已机器化；真实 token 计量 INSUFFICIENT EVIDENCE（无 usage 接口）。
- 安全席（agent-47，实跑复现）：R-01 cmdIssueToken 引用未定义 EVENTS_PATH，令牌事件永不落盘；R-02 代理签署无机器门；R-03 supervise 读 team.json catch{} fail-open；R-04 SLATED 占位被计覆盖。建议默认 NEEDS WORK。
- Reality Checker（agent-48，EXECUTED 复现）：作为「机器自报当前态」PASS；作为「制定者亦在约束面内/生产就绪」NEEDS WORK。R-A1 W 注入伪绿、R-A2 源码文本判据、R-A3 pre-verify 零样本、R-A4 无 git 回滚。

## 已消除（有行为夹具 + 原样复验证据）
| ID | 修复 | 夹具 | 证据 |
| --- | --- | --- | --- |
| R-01 | cmdIssueToken 改用 eventsPath() | source-of-truth 增落盘+幂等场景 | 9/9 绿；隔离测 count 1→2 |
| R-02 | 新增 proxy-gate.mjs 行为门（真代理/代签须双留痕；独立复算不误伤） | proxy-gate-fixture 4/4 | 违规红/留痕绿/代签红 |
| R-03 | supervise team.json 读取失败进 attention + converged=false | 手工负向（移走文件） | readError 非空/converged false |
| R-A1 | env-guard.mjs 生产链注入守卫 | env-guard-fixture 3/3 | 无注入0/真实根0/伪根1 |

## 如实保留（未消除，不声称已解决）
- R-A2：M3/M6 判据含源码文本匹配成分（M2 已有行为锚点）。改造核心判据风险高，本轮未改。现状是有行为+文本混合判据，不是纯文本永真，但可更强。
- R-A3：pre-verify 零 Java 卡时输出「绿=真空绿」诚实提示；但 pre-verify 不进 L4 判绿输入，故不影响 maturity，提示已存在。
- 架构师 token/context 预算门、checkpoint 恢复协议：本会话无 token usage 接口（INSUFFICIENT EVIDENCE），未实现，不伪造。
- R-A4：仓库无 git（git rev-parse fatal），无 diff/回滚能力——工具环境限制，如实登记。
- R-04：SLATED 占位计覆盖——本轮采用「登记态即覆盖」语义（两专家共识），与「交付覆盖」是不同层；未改，语义已文档化。

## 原样复验（不过滤）
- 完整 release exit 0；四夹具运行（proxy/env/source-of-truth/evolution）；verify 85/0；tests 47/0；L4 到达。
- 输出中仍有 `[提示] pre-verify 0 张 Java 卡：绿=真空绿` —— 如实保留，不掩盖。

