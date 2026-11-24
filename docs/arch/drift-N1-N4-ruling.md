# N-1~N-4 新漂移裁决记录（TK-32-02 / TK-34-02 · 架构经理@v15 · 2026-11-11）

> 裁决对象：G-S3-sn26-contract-v11.md §四「④ 新漂移（未登记、架构未裁）」4 项。
> 方法：全部证据本席实跑 read/grep 取证（文件:行），双端现码为准；与审计报告冲突处以实测复核为准。
> 落盘：本文件 + docs/arch/api-contract.md v1.1→v1.2（§1/§7/§8/§9/§11 漂移表 D-6~D-8/§12 变更记录）。

## 结论速览

| # | 漂移 | 三值结论（保留/修正/废弃） | 契约落点 | 修正归属 |
| --- | --- | --- | --- | --- |
| N-1 | Node 管理面 9 条路由仅 3 条入契约 | **修正（补登记）** | v1.2 §1 新增扩展 5 路由行 + 漂移 D-6 | Java 补实现（后端 E-a） |
| N-2 | Java 验签失败释放幂等键 vs Node 不清键——语义分叉 | **修正（定 Java 为基准，补 Node）** | v1.2 新增 §8 + 漂移 D-7 | Node 参考实现同步 |
| N-3 | 出口总预算退化 min(budget,READ_MS)=9s 封顶 | **修正** | v1.2 新增 §9 + 漂移 D-8 | Java（HttpUpstreamChannel） |
| N-4 | HTTP≠200 时 bizStatus="COMM_FAILURE" 双端同漂 vs 设计「不入业务状态」 | **保留（文档澄清闭合）** | v1.2 §7 bizStatus 语义澄清 | 双端实现零改动 |

## N-1 · 管理面 9 条路由（server.js:34,46-58 ↔ api-contract v1.1 §1）

- 实测证据（Node 全量路由枚举）：/health（server.js:34）、/admin/state（:46）、/admin/audit（:47）、/admin/metrics（:48）、/admin/alerts（:49）、/admin/centers（:50，含 orchestrator.upstreamStats 守卫）、/admin/recon/tick（:51）、/admin/file/send（:52）、/admin/cert/userget（:53）、/admin/failover/probe（:58）；未匹配 404（:59）。
- Java 全模块路由枚举实测仅 3 条：SnController.java:30（/health）、:37（/admin/state）、:44（/api/sn/{method}）。
- v1.1 §1 仅登记 4 条（业务 1 + health + state + admin 三观测），漏 centers/recon-tick/file-send/cert-userget/failover-probe 5 条。
- 裁决理由：①判例已确立「语义源在 Node 全实现 → 保留契约、Java 补实现」；扩展 5 条均为 v1-refined §5/§6 明文设计项（多中心探活/切换 :104、对账补偿 :131、证书管理），运维经理 S7 依赖面。删条=文档迁就空壳，与 CR-004 门禁5 反向。
- **结论：修正** —— 5 条扩展路由全量登记入 v1.2 §1，新漂移 **D-6** 归后端 E-a；验收=门禁5 路由映射表转绿。

## N-2 · 验签失败幂等语义分叉（Sn26FlowService.java:92-93 ↔ orchestrator.js:62-66）

- Java：验签失败 → removeIfOwned(key, reqId) 释放幂等占位（Sn26FlowService.java:92-93；IdempotencyStore.java:54 computeIfPresent 仅本人 reqId 可删）+ 抛 SECURITY_REJECT；同键重试可重新 claim，reqId 取新值（注释 :91 明示设计意图）。
- Node：验签失败分支（orchestrator.js:62-65）仅 metrics.bump + audit.append，幂等键既无在途 claim（:18-19 仅 get；:94 仅终态 putIfAbsent），也无释放点——Node 的幂等键自始至终是「结果缓存」，语义为「同键重试不重发」，与 Java 的「占位-释放」模型结构性不同。
- 实测对照：Node store.js:7 putIfAbsent 为终态缓存语义（existed→回放缓存值），无 removeIfOwned 等价接口（grep 0 命中）。
- 裁决理由：验签失败意味着**上游应答不可信**（可能是重放/中间人），其结果不可作为幂等缓存源；Java「释放占位、允许重试、reqId 取新值」与 v1-refined.md:104「切换时保留 idemKey，http 头 reqId 可取新值」一致，取 Java 为契约基准。Node「失败应答也回放」语义不可接受（缓存投毒窗口）。
- **结论：修正** —— 契约基准=Java 行为（在途 claim putIfAbsent + 验签失败释放/不落缓存 + COMM_FAILURE 结果落缓存 fail-closed），落 v1.2 §8；Node 缺在途 claim 与释放点登记为 **D-7**，归 Node 参考实现同步（非 Java 改动）。
- 注：G-S3 §四原表述「Java 释放 vs Node 不清键——重放窗口不一致」方向正确，但 Java 侧行为是应保留的契约基准而非待裁偏差；分叉修复责任在 Node 侧补齐，Java 行为不改动。

## N-3 · 出口总预算 9s 封顶（HttpUpstreamChannel.java:26,66,70 ↔ v1-refined.md:105）

- 实测：Sn26FlowService.java:79 传 TIMEOUT_TOTAL_MS=10000（Sn26Contract.java:29）；HttpUpstreamChannel.java:66 `budget = min(totalBudgetMs, TOTAL_MS)=10000` 正确；但 :70 `request.timeout = min(budget, READ_MS) = min(10000, 9000) = 9000` —— 总预算常量 TOTAL_MS 定义后从未生效于请求超时（grep TOTAL_MS 使用点仅 :66,70）。
- 设计权威：connect 3000 / read 9000 / **总预算 10000ms**（v1-refined.md:105；A8 :17）。9s 封顶=总预算语义退化，长时间慢响应场景（连接 2s + 响应 9.5s）本应 10s 硬顶，现 9s 即断。
- Node 对照：client.js:58 budget=up.timeout.totalMs=10000 传入 sendOnce，:39 opts.timeout=budget —— Node 为「10s 预算」口径。注意 :39 该值在 Node http 里是 socket 空闲超时（非总耗时硬顶），慢滴流响应可超 10s，登记为观察项（非本轮漂移，留待 Node 同步批处理）。
- **结论：修正** —— v1.2 §9 定权威口径（总预算 10000ms 如实生效）；Java 修正项 **D-8**：HttpUpstreamChannel.java:70 改 timeout(budget)（read 9s 与总预算 10s 组合表达，测试断言总预算 10s 可达），归后端 E-a/E-b。

## N-4 · HTTP≠200 → bizStatus="COMM_FAILURE"（ResponseNormalizer.java:21 ↔ response.js:73-76 ↔ v1-refined.md:139）

- 实测双端一致：Java ResponseNormalizer.java:21 `httpStatus != 200 → kind=bizStatus="COMM_FAILURE"`；Node response.js:73-76 同构。双端为**同向实现**，非单方漂移。
- 设计原文「HTTP != 200 → COMM_FAILURE（通讯失败，**不入业务状态**，可切中心重试）」（v1-refined.md:139）。
- 语义辨析：设计句的「不入业务状态」指**状态机不入业务终态**——Node applyResponse 对 kind=COMM_FAILURE 走 event=TIMEOUT → OCCUPYING/RELEASING → UNKNOWN → PENDING_RECON（state.js:8,4），确未落入 OCCUPIED/RELEASED 等业务态；Java 侧 COMM_FAILURE 因网络异常路径直接抛出（Sn26FlowService.java:80-88）同样不进 applyResponse。双端状态机行为均符合设计。
- bizStatus 字段是**应答归一化标签域**（第三层 subCode 归一输出），不是状态机字段；HTTP≠200 时以 COMM_FAILURE 标注 bizStatus 让调用方拿到可判读的失败标签，属合理实现选择，与设计意图不冲突。
- **结论：保留** —— 双端实现保留零改动；设计句语义澄清写入 v1.2 §7（「不入业务状态」=状态机不入业务终态；bizStatus=COMM_FAILURE 为归一化标签域合法取值）。文档级闭合，无修正项、无漂移登记。

## 修正项清单（归属写域，供 captain 派发）

### Java 修正项（后端经理 · 写域 gateway-java/src/main/java/com/unionpay/tradein/）

| # | 修正 | 精确位置 | 验收 |
| --- | --- | --- | --- |
| J-1（=D-6） | 补 5 条管理面路由：/admin/centers、/admin/recon/tick、/admin/file/send、/admin/cert/userget、/admin/failover/probe（对齐 server.js:50-58 语义；/admin/* 已在 GatewaySecurityConfig.java:29 鉴权分支内） | north/SnController.java（现路由枚举 :30,:37,:44 处新增 @GetMapping） | 门禁5 路由映射表 9/9 转绿；各路由有失败/空数据用例 |
| J-2（=D-8） | 出口请求超时改 totalBudgetMs 如实生效：:70 `Math.min(budget, READ_MS)` → `budget`；TOTAL_MS 10s 硬顶保留于 :66 | transport/HttpUpstreamChannel.java:70 | 测试断言总预算 10000ms 真实可达（慢响应 9.5s 用例 10s 内不被提前掐断） |
| J-3 | 幂等语义契约化自证：验签失败释放（:92-93 removeIfOwned）与 COMM_FAILURE 落缓存（:86 storeResult）补行为测试，锁定为契约基准 | core/Sn26FlowService.java:86,92-93（仅补测试，不改实现） | CR-004 E-d 门禁4 补「验签失败→键释放可重试」负向用例 |

### Node 修正项（Node 参考实现同步 · 写域 src/）

| # | 修正 | 精确位置 | 验收 |
| --- | --- | --- | --- |
| N-A（=D-7） | 幂等在途 claim：handle() 入口 idem.putIfAbsent 占位（业务键），终态覆写结果；验签失败分支释放占位（对齐 Sn26FlowService.java:54,92-93 语义） | src/core/orchestrator.js:18-19（get 处改 claim）、:62-65（verify-fail 加释放）、:94（putIfAbsent 改终态覆写） | 并发同键双请求第二发得 DUP_REQ；验签失败后同键重试可重新发出；store.js 无需新接口（用 putIfAbsent+delete 组合） |
| N-B | socket 空闲超时 ≠ 总预算硬顶（观察项，随 N-A 同批或另开小票）：client.js:39 opts.timeout 仅空闲语义，如需严格 10s 硬顶需整体计时器 | src/transport/client.js:39,58 | 与 J-2 同断言口径（10s 总预算可达性） |

### 明确不改动项

- N-4 双端 ResponseNormalizer.java:21 / response.js:73-75：保留。
- Java removeIfOwned / storeResult 语义：保留为契约基准（J-3 仅补测试）。

## 对 G-S3 解除条件的影响

- G-S3 §八解除条件第 4 条「架构经理补裁 ④ 新漂移 N-1~N-4 并登记契约漂移表」——**本轮已闭合**（本文件 + api-contract.md v1.2 D-6/D-7/D-8）。
- 其余解除条件（CR-003 D-a/D-b、CR-004 E-a/E-b 收尾、EXEMPTIONS 撤行）不在本席写域，维持待办；J-1/J-2/N-A 建议并入后端下一轮派工卡。

—— 架构经理@v15 · TK-32-02/TK-34-02 · 2026-11-11 · 证据全部实测于本仓库现码。
