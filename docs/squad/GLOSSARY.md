# 术语表（GLOSSARY · B2 · 2026-11-23）

> 依据 mattpocock/skills GLOSSARY.md 纪律：每个术语一个正名 + Avoid 反例词表。
> 技能/门禁/提示词/脚本对同一概念必须用正名；drift-check 可扩术语漂移检测。

## 席位（Seat）
编制中的一个工位，16 个常驻；席位是工位不是编制内的"人"。
_Avoid_: 角色、岗位、member（指代工位时）

## 令牌（Token）
派活凭证 `TK-<轮次>-<序号>`（纯数字段）；生命周期 planned→dispatched→reported→accepted/rejected。
_Avoid_: 卡号、凭证号、TK 串

## 写域（Domain）
席位允许写入的目录集合，真源 FUNCTION-LEDGER.md；dispatch-guard 按它判互斥。
_Avoid_: 权限范围、目录权限

## 回报（Report）
成员完成任务后的回执：subagent 主对话直回 + 落盘 inbox 留痕；真源=事件日志 REPORT 事件。
_Avoid_: 产出（泛称）、汇报（口头）、reply（不指落盘）

## 门（Gate）
机器可判的阻断点，统一 gate-kit runGate/failFast 协议；豁免走 EXEMPTIONS.md 登记。
_Avoid_: 检查（泛称）、关卡、barrier

## 轮次（Round）
一次派活循环的事实，真源=事件日志 ROUND_ADVANCE；W1~W4 名册按 (round-1)%4 绑定。
_Avoid_: 迭代（指轮次时）、期号、回合

## 派活（Dispatch）
指挥把六要素任务书投递给席位：主对话 subagent({description,prompt})；计划产物=dispatch-plan JSON。
_Avoid_: 分派、下发任务、assign
