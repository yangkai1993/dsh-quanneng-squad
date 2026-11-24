# 已验证可用席位路由（AVAILABLE-ROUTES）· 真源

> **注意：本表仅供人参考，不作为机器门禁。** 全能小队不限制任何模型，任何 provider/model 都可用（用户规约）；表中"失效/不可用"是某时刻实测记录，不代表拒绝派单。
> 用途：audit-roster 判定「死路由」不再用「必须等于 profile 默认」这一单值判据——
> 平台模型端点会周期性失效（buddy 限流 / qoder 112 pricing / nemotron 静默夭折），
> 单值判据会把健康的容错路由误判为死路由。改为「落在已验证可用集内即健康」。

| 路由 | effort | 状态 | 证据 |
| --- | --- | --- | --- |
| qodercn/qfmodel | medium | 人读记录① | 第 62 轮实测：采风官@v20 与需求经理@v20 派活即 112/model_error 计价失败；`add_member` 仍接受但运行必败 → 探测必须实跑任务，不可只看 accept |
| our-free-model/nvidia/nemotron-3-ultra-550b-a55b:free | medium | 人读记录② | 第 62 轮 16 席迁移、TK-59-02 成功交付；第 64 轮 TK-64-01/02 两卡连续 RATE_LIMIT（Sign up for free 提示=免费额度耗尽）。恢复窗口未知，派单前先实跑小任务探活 |
| minimax/MiniMax-M3 | 省略 | 人读记录③ | 第 66 轮翰林@v22 HTTP 402 insufficient_balance (1008)；旧「第 60 轮 accept」仅为配置通过，不代表请求成功 |
| buddy/hy4flash-free | — | 人读记录④ | 第 66 轮先探活成功（TK-66-00），随后全席 RATE_LIMIT（Sign up for free 提示）——免费额度耗尽，非路由本身失效 |
| buddy/hy4free（旧） | — | 人读记录⑤ | 上会话 trae 测：provider 禁用 + effort 全档不支持 + 限流；与当前 buddy/hy4flash-free 为不同 model id |

## 路由可用性探测的正确做法（第 62 轮教训）

- `add_member` 成功 **不等于** 路由可用——它只校验配置合法性（provider/model/effort 组合），不探测模型端计价与配额。
- 唯一可信判据 = **实跑一张任务卡**并看 outcome。
- 因此：本表状态由「上一轮实跑结果」维护，每次路由事故后立即更新；派单前先查本表，不凭记忆。

## 判定规则（P15：不限制模型）

- **本表仅供人参考，不作任何机器门禁判据**（routes.json 的 allowed/dead/deadProviders 全空，由 config-adapter 唯一解析当前模型）。
- 表中"人读记录"是某时刻实测的历史证据，不代表当前可用/不可用；实际能否调用以宿主实时返回为准。
- 本表由 captain 按实测更新，仅作情报留痕；机器门不读取本表的状态词。

