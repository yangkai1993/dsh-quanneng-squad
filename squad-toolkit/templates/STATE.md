# STATE.md · 状态唯一权威

> 会话压缩或重启后第一动作 = 读本文件并核对产出目录，不凭记忆重建。

| 项 | 值 |
| --- | --- |
| 项目 | <PROJECT> |
| 版本 / 契约版本 | <VERSION> / <CONTRACT_VERSION> |
| 当前阶段 | <S-1 / S0 / S1 … S8> |
| 编级 | <轻5 / 中8 / 全16> |
| 并发在跑 | <TASK_IDS，≤3> |
| S5 轮次 | <0..3> |
| 缺陷计数 | <N> |
| 假设登记 | <A1…> |
| 门索引 | <GATES_PATHS> |

## 各域状态段（各经理 append 自己域，总指挥只读合并）
### 规划域
<APPENDED_BY_ARCH_MANAGER>
### 实现域
<APPENDED_BY_DEV_MANAGER>
### 质量域
<APPENDED_BY_QA_MANAGER>
### 运维域
<APPENDED_BY_OPS_MANAGER>

## 全局段（仅总指挥写）
<GLOBAL_STATE>
