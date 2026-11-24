# 裁决记录：t2/t13/t25/t27 归属与真实性（TK-68-02 封驳处置）

日期：2026-11-16 · 总指挥

## 裁决

| 项 | 裁决 | 依据（captain 独立复测） |
| --- | --- | --- |
| t2「skipInboundVerify 探针接缝」报称 | **文本不实，作废该句**；#10 功能判定改「已实现」 | 代码 grep 0 命中；真实证据=SnController:130 verifyInbound 调用+:181 定义+InboundVerifyTest/InboundSignSupport（t2 changedPaths 在册）|
| t13（reviewedTaskId=t2, verdict=pass）| **判据对象不存在 → 判无效**，不作为 #10 闭合凭据 | #10 改以现码 verifyInbound + t2 changedPaths 测试文件为凭；review 记录保留不改写历史 |
| t25/t27 收口早于 crypto mtime | **归属拆分**：成员交付 checkUpperBound 守卫本体（.bak-5year-fix 11-16T09:36 前旧态已含），指挥交付三道旁路封死（put 闸口/forTest forEach/Spring IAE 重抛）| 备份与现码 diff=三处封死；03:08 mtime=指挥纠错时刻，时序门报红属实况非造假 |
| t27 changedPaths=[]（kind=repair）| **卡登记纪律违规**，记名不改门：门无法从空列表反证 Java 改动 | 面板票规范改进：repair 卡必须登记 changedPaths 或显式声明 non-code 交付 |
| intel 11-11 老清单 4 处过期声明 | 移交 W1 采风官重扫消费（t9 未覆盖 #10 行）；drift 粒度不扩 | KeepAlive 实测 2 文件含头（intel 判 0）、四 O 字段 17 命中（判 0）、row10 锚漂移 112/116/123→130/134/141 |

## 面板票规范改进（W1 排票时执行）

- 首行 token 违例 5/18（t13/t16/t19/t24/t26）：面板任务书模板加「回报首行 token」硬提醒。
- 代理收口 15/18（83%）：assignee 不可作执行者证据的纪律维持；收口人署名进 update_task evidence_note。

