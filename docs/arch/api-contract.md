# 接口契约 v1.3.1（变更源：CR-004-k-anchors · §10 规范行号锚定 + CR-003-roster-binding · 轮次绑定 + 历史 CR-004/TK-34-02；变更必走 CR）

> 权威实现：Java 基线 gateway-java（ADR-002，STATE.md:30）；Node 参考 src/ 保留为对照口径（api-contract 原 v1.0:3 指向 src/contract.js，本轮起改为「Java=交付基线，Node=语义对照」并在此行记明）。与实现不一致：本文件「漂移登记」逐条列 文件:行 + 归属 + 门禁，不豁免。

## 1. 北向路径权威（CR-004 E5 / 评审 R1）

| 方法 | 路径 | 实现映射证据 | 交付状态 |
| --- | --- | --- | --- |
| POST | /api/sn/{method}，method ∈ {query, occupancy, release} | SnController.java〔退役〕 + Sn26Contract.java〔退役〕 | Java 已交付 |
| GET | /health | SnController.java〔退役〕 | 已交付 |
| GET | /admin/state | SnController.java〔退役〕 | 已交付 |
| GET | /admin/audit /admin/metrics /admin/alerts | Node：src/north/server.js:47,48,49；Java：0 命中（全模块路由枚举仅 SnController.java〔退役〕,39,46 三条） | **裁决=保留契约、Java 补实现**（后端 E-a 写域）；补前门禁5 判红 |
| GET | /admin/centers、/admin/recon/tick、/admin/file/send、/admin/cert/userget、/admin/failover/probe | Node：src/north/server.js:50,51,52,53,58；Java：0 命中（SnController.java〔退役〕,37,44 全量枚举） | **裁决=登记契约、Java 补实现**（漂移 D-6，后端 E-a 同批）；补前门禁5 判红 |

裁决理由（①）：三条路径在权威语义源 Node 已全部实现（server.js:47-49），且 /admin/* 鉴权拦截 Java 侧已就位（GatewaySecurityConfig.java〔退役〕）——缺的是路由本体而非设计；运维可观测性为 S7 必经依赖（CR-004-java-shell.md:17）。从契约删除=用文档迁就空壳，与 CR-004 门禁5「契约-实现一致性」方向相反。

裁决理由（N-1，TK-34-02）：管理面 9 条路由（state/audit/metrics/alerts/centers/recon-tick/file-send/cert-userget/failover-probe）在语义源 Node 全量在码（server.js:46-58），v1.1 仅登记 4 条；本轮按①同判例全量登记，扩展 5 条对账/证书/探活/多中心为 v1-refined §5-6 明文设计项（docs/gateway-design-v1-refined.md〔退役〕,131），删条=文档迁就空壳。
- method 取非白名单值 → 400 `kind=PARAM_INVALID`（SnController.java〔退役〕）。
- 请求体**禁止**携带 bizMethod / appId：业务方法唯一来源为路径段（SnRequest.java〔退役〕 无消费点，SnController.java〔退役〕、RequestAdapter.java〔退役〕 只读路径法；Node 侧 body.appId 被 JWT claim 覆写，server.js:43）。

## 2. 北向字段权威表（M 必填 / C 条件 / O 可选 / X 禁止；key 精确、大小写敏感，无别名归一）

分档权威源：src/protocol/adapter.js:51-59（逐 method M/C/O）；长度权威源：adapter.js:29-48 与 SnRequest.java〔退役〕 交集，冲突见 §4 与漂移登记。

| 字段 | query | occupancy | release | 约束（权威口径） |
| --- | --- | --- | --- | --- |
| regionCd | M | M | M | 恰 6 位数字（adapter.js:29; SnRequest.java〔退役〕） |
| snCode | M | M | M | 1..32（adapter.js:30; SnRequest.java〔退役〕） |
| txnTime | 不投影 | **M** | **M** | 恰 14 位 \d{14}（adapter.js:31; SnRequest.java〔退役〕） |
| orderId | 不投影 | **M** | 不投影 | 1..64（adapter.js:32; SnRequest.java〔退役〕）；release 无此字段，原单经 regionCd+snCode 反查（config.js:36 releaseOrderLookup） |
| mchntCd | 不投影 | **M** | 不投影 | 1..128（adapter.js:33; SnRequest.java〔退役〕） |
| barcode | 不投影 | **M** | 不投影 | 恰 14（adapter.js:35; SnRequest.java〔退役〕） |
| saleTm | 不投影 | C | 不投影 | 见 §4 长度裁定 |
| reqReserved | O | O | O | 1..2048（adapter.js:36; SnRequest.java〔退役〕） |
| postTmn | 不投影 | O | 不投影 | 1..256（adapter.js:34; SnRequest.java〔退役〕） |
| imei1/imei2 | 不投影 | O | 不投影 | 1..32（adapter.js:37-38; SnRequest.java〔退役〕） |
| mfrInfo/brand/specModel | 不投影 | O | 不投影 | 1..100（adapter.js:39-41; SnRequest.java〔退役〕,24） |
| cateCode | 不投影 | O | 不投影 | 白名单见 §3（adapter.js:42; SnRequest.java〔退役〕） |
| isAiProd | 不投影 | O | 不投影 | 0/1，语义见 §3（adapter.js:43; SnRequest.java〔退役〕） |
| transTm | 不投影 | O | 不投影 | 17 位 \d{17}（adapter.js:45）；**Java 未端口**（SnRequest.java 全 27 行无此四项）→ 漂移 D-1 |
| txnAmt / discountAmt | 不投影 | O | 不投影 | ^\d+(\.\d{1,2})$ ≤12（adapter.js:46-47）；Java 未端口 → 漂移 D-1 |
| salesModel | 不投影 | O | 不投影 | 0/1（adapter.js:48）；Java 未端口 → 漂移 D-1 |
| bizMethod / appId（body） | X | X | X | 禁止（§1）；当前 Java 声明并静默吞掉（SnRequest.java〔退役〕）→ 漂移 D-2 |

② 重点补齐结论：occupancy 的 txnTime/orderId/mchntCd/barcode 与 release 的 txnTime **均为 M**。Java 现仅 regionCd/snCode 有 @NotBlank（SnRequest.java〔退役〕），其余四字段可空仍 200（RequestAdapter.java〔退役〕 空值剔除 + SnController.java〔退役〕,75 直通 ok）= CR-004 E6 实锤；per-method 必填校验属实现域，归后端 E-a/E-b，本契约自本行起生效为验收口径。

## 3. 枚举权威表（③）

| 枚举 | 权威取值 → 语义 | 出处 | 北向校验裁决 |
| --- | --- | --- | --- |
| isAiProd | **0=是（AI 产品），1=否**，方向不可反转 | RequestAdapter.java〔退役〕（注释唯一出处）+ adapter.js:43 + adapter.js:135-138 normalizeAi | 形状 [01] 已校验（SnRequest.java〔退役〕）；语义写入本表即为权威，不再依赖注释 |
| cateCode | 白名单 **A01..A06、B01..B03 共 9 项** | contract.js:29; Sn26Contract.java〔退役〕 | **北向拦截 400**（当前北向 0 引用 → 漂移 D-3，归后端）；B04 仅当 spec.cateCodeExtra 开启（config.js:53，§12-3 原文打码项），默认不受理 |
| saleTm | 两态格式：yyyy-MM-dd（10）或 yyyyMMddHHmmss（14），由 crypto.saleTmFormat 切换 | config.js:17,54; adapter.js:68-74,103-107 | 长度上界 **32**（见 §4） |
| salesModel | 0/1 | adapter.js:48 | 随 D-1 补端口时一并校验 |

## 4. saleTm 14 vs 32 冲突裁定（③ 续）

- 冲突事实：SnRequest.java〔退役〕 @Size(max=14) ↔ adapter.js:44 max:32；规范原文自身矛盾（gateway-design-v0-draft.md〔退役〕 C4：标 String(14) 却用 yyyy-MM-dd）。
- **裁定：权威上界=32，格式白名单=两态（10 位日期或 14 位日期时间）**。理由：两态拼接上限 14 + 规范标注 32 兼容余量，取 32 不会放行任何合法值之外的新格式（合法集由 @Pattern 两态正则收紧）；Java 的 max=14 在切到 yyyy-MM-dd 时反而无依据放宽分隔符余量。落法：SnRequest.java〔退役〕 改 @Size(max=32) + @Pattern(两态择一)，归后端；Node 口径不动。

## 5. 未知字段策略裁定（④）

- 一致性判定：Node 南向「只投影声明字段，未声明 key 永不送银联」（adapter.js:51-59 按 METHOD_FIELDS 取集；RequestAdapter.java〔退役〕 同构）——就此点，Java @JsonIgnoreProperties(ignoreUnknown=true)（SnRequest.java〔退役〕）与南向丢弃语义**一致**。
- 不一致点：Node 北向入口先做别名归一（adapter.js:5-25：merchantId→mchntCd、barCode→barcode 等），Java 无该层 → 同义 key 被静默吞掉，调用方「以为传了、服务端从未看到」（评审 R2；CR-004 E6 同源）。
- **裁定：北向拒绝未知字段**。FAIL_ON_UNKNOWN_PROPERTIES=true 方向，400 且 kind=PARAM_INVALID、msg 回显首个未知 key（不回显值）；别名表不复活，调用方以 §2 权威名表为唯一命名口径。理由：与 reliability.degrade=fail-closed 同哲学（application.yml〔退役〕），把「成功脏数据」故障前移到调用方。生效前过渡：调用方用响应 audit.body_sanitized（SnController.java〔退役〕）逐字段核对。

## 6. 南向（不变，v1.0 原文冻结）

HTTP POST，9 公共头 version/appType/appId/bizMethod/reqId/sign/signId/signMethod/signPubKeyCert(C)；规范签名串：
```
version=<v>&appId=<id>&bizMethod=<m>&reqId=<r>&body=<rawBody>
```
SM2 裸 R‖S 64B（无 DER）Base64 入 sign；SM3 userId=十进制证书序列号；bizMethod：soluGsp.gsp.sn26.query、soluGsp.gsp.sn26.occupancy、soluGsp.gsp.sn26.release、admin.cert.upget、admin.cert.userget。（Sn26Contract.java〔退役〕 与 contract.js:40-43 双端一致，实测比对。）

## 7. 复合域 encryptData / 应答三层 / 数据分级（不变，v1.0 原文冻结）

encryptData 四子域 key/certId/encryptMethod/data 全 M，一次一密，SM4-CBC ZeroPadding 或 AES-CBC PKCS7，IV=16×00。
HTTP≠200→COMM_FAILURE；成功码 0000000000 或 200（双兼容）；失败=2 位生成方(UP/IS/AC/ID/PD/OT)+8 位原因；未知码 UNMAPPED 留痕告警（ResponseNormalizer.java〔退役〕）。code 大小写敏感，GENERATORS 全大写（Sn26Contract.java〔退役〕），勿转小写。
- **bizStatus 语义澄清（N-4 裁决，TK-34-02）**：HTTP≠200 时 kind=bizStatus="COMM_FAILURE"（双端一致：ResponseNormalizer.java〔退役〕 / response.js:73-76）**保留**；设计原文「不入业务状态」（gateway-design-v1-refined.md〔退役〕）裁定指**状态机不入业务态**（TIMEOUT→UNKNOWN→PENDING_RECON，src/core/state.js:8），bizStatus 为应答归一化标签域而非业务状态字段——文档级闭合，双端实现零改动。
分级 S/A/B/C 与审计脱敏条款沿用 v1.0:31，不改。

## 8. 幂等与验签失败语义（N-2 裁决，TK-34-02）

- **在途 claim**：业务请求入口先对 idemKey 做幂等 claim（Java Sn26FlowService.java〔退役〕 putIfAbsent 为基准）；在途窗口内同键重复提交 → dup 语义（DUP_REQ + 原 reqId 回放，Sn26FlowService.java〔退役〕）。
- **验签失败**：应答 SM2 验签失败 → kind=SECURITY_REJECT，**释放/不落缓存幂等键**（Java removeIfOwned：Sn26FlowService.java〔退役〕，保留为契约基准）；同 idemKey 重试允许、reqId 取新值（gateway-design-v1-refined.md〔退役〕）。
- **COMM_FAILURE 结果落缓存**（fail-closed 不静默重发）：orchestrator.js:52 / Sn26FlowService.java〔退役〕。
- Node 缺在途 claim（orchestrator.js:18-19 仅 get、:94 仅终态 putIfAbsent）→ 在途并发窗口无 dup 保护，且验签失败分支（:62-65）无对称释放点 → **漂移 D-7，归 Node 修正**（Java 行为不改动）。
- **TK-41-02 五点版闭合**：Node 已在途 claim + owner 守卫 release + 终态覆写；COMM_FAILURE 保持落缓存不删键；UNKNOWN 占用不自动重发（state.js assertNoResend）。
## 9. 出口总预算权威（N-3 裁决，TK-34-02）

- 权威口径：connect 3000ms / read 9000ms / **总预算 10000ms**（gateway-design-v1-refined.md〔退役〕）；出口请求总超时必须如实取 totalBudgetMs（≤10000），调用方 Sn26Contract.TIMEOUT_TOTAL_MS=10000（Sn26Contract.java〔退役〕）。
- Java 现状 `request.timeout = min(budget, READ_MS) = 9000` 封顶（HttpUpstreamChannel.java〔退役〕）→ 总预算 10s 永不可用，**判修正（漂移 D-8，归 Java）**：:70 改 `timeout(budget)`；read 9s 独立拆分允许简化为「connect≤3s + 总预算≤10s」组合，测试须断言总预算 10s 真实可达。
- Node 对照：client.js:58 budget=totalMs=10000 透传，但 :39 opts.timeout 为 socket 空闲超时语义（非总预算硬顶），登记为观察项，非本轮漂移。

## 10. 合规基线（规范原文 ↔ 契约 ↔ 实现，Compliance as Code）

> 依据：《中国银联 2026 以旧换新业务发券 API 技术指引》原文 `.analysis/source-doc.txt`；
> Humble/Farley《Continuous Delivery》「合规要求必须自动化、可重复验证」。以下每条含规范行号与机器断言 ID。

| 条款 | 规范原文 | 裁决/口径 | 实现锚点 | 机器断言 |
| --- | --- | --- | --- | --- |
| K1 新旧证书并行 3 个月 | :365「证书更新期间应支持新、旧证书共同使用，并行期建议 3 个月」；:318「从 signId 获取对应公钥证书」 | `map<signId, cert>` 按 signId 选证书；过渡期新旧并存，加密方自选；旧证到期前完成切换 | Java `crypto/SignIdCertRegistry.java` + `SandboxSignIdCertRegistry.java`（map<signId,cert>，K1 已由 TK-47-02 闭合）；Node `src/crypto/sm2.js` | `compliance:K1` |
| K2 验签先于业务 | :314「报文必须验签通过后才能进行业务处理」 | 应答 SM2 验签失败 → SECURITY_REJECT，不得进入归一化/业务状态；验签失败释放幂等键（§8 第2点） | `Sn26FlowService.java〔退役〕`（verifyResponse 在 normalize 之前）；Node `orchestrator.js:61-66` | `compliance:K2` |
| K3 占用 UNKNOWN 永不自动重发 | DOC:540-543 接口汇总仅 query/occupancy/release 3 接口（无占用状态查询）、DOC:672/674「稍后发起查询」 | occupancy 网络异常只进对账台账 `PENDING_RECON`，不进 5 次节律重发队列；query/release 才入队 | `StoreForwardScheduler.java〔退役〕,48,80-87`；`Sn26FlowService.java〔退役〕`；Node `orchestrator.js:104,115` / `state.js assertNoResend` | `compliance:K3` |
| K4 成功码双兼容 / fail-closed | DOC:466「成功应答码为0000000000」/ DOC:572「200」 | `0000000000` 或 `200`；HTTP≠200→COMM_FAILURE；COMM_FAILURE 落缓存不静默重发（§8 第3点） | `ResponseNormalizer.java` / `SnController.java` / `orchestrator.js:52` | `compliance:K4` |

> 版本：v1.3.1（TK-57-01/TK-58-01，CR-004-k-anchors）。K1 已由 TK-47-02 闭合（SignIdCertRegistry map<signId,cert>，3 个月并行期=90 天默认）；K1~K4 机器断言 compliance:K<n> 全部 inContract/inImpl=true 且无豁免。
> 机器断言在缺口闭合前如实报红/标注，不得写假绿。

## 11. 漂移登记（本轮裁决产生，验收=门禁5 路由/字段映射表转绿）

| # | 漂移 | 证据 | 归属 |
| --- | --- | --- | --- |
| D-1 | Java 缺 transTm/txnAmt/discountAmt/salesModel 四 O 字段（契约收窄 or 漏项→裁决为漏项，Node 为语义源） | adapter.js:45-48 ↔ SnRequest.java〔退役〕 全表无 | 后端 E-a/E-b |
| D-2 | body bizMethod 声明但未消费（X 档应 400 而非吞） | SnRequest.java〔退役〕; SnController.java〔退役〕 | 后端 E-a |
| D-3 | cateCode 白名单、per-method M 校验、未知字段拒绝均未落北向 | Sn26Contract.java〔退役〕 无调用点; SnRequest.java〔退役〕,13-17; SnRequest.java〔退役〕 | 后端 E-a/E-b |
| D-4 | /admin/audit|metrics|alerts Java 无路由 | SnController.java 全量枚举 :32,39,46 | 后端 E-a |
| D-5 | saleTm max=14 应改 32+两态 Pattern；isAiProd 注释语义已被本表 §3 接管 | SnRequest.java〔退役〕,23; RequestAdapter.java〔退役〕 | 后端 E-a |
| D-6 | /admin/centers、/admin/recon/tick、/admin/file/send、/admin/cert/userget、/admin/failover/probe Java 无路由（N-1） | server.js:50-58 ↔ SnController.java〔退役〕,37,44 | 后端 E-a |
| D-7 | Node 幂等在途 claim 缺失 + 验签失败无释放点（N-2） | orchestrator.js:18-19,62-65,94 ↔ Sn26FlowService.java〔退役〕,92-93 | 后端（Node 参考实现同步） |
| D-8 | 出口请求超时 min(budget,READ_MS)=9s 封顶，总预算 10s 未如实使用（N-3） | HttpUpstreamChannel.java〔退役〕,70 | 后端 E-a/E-b |

## 12. 变更记录

v1.0→v1.1：CR-004 E-c 四项裁决落表（①管理面保留补实现 §1；②M/C/O/X 逐 method 字段权威表 §2；③枚举权威表+saleTm 裁定 §3-4；④未知字段北向拒绝 §5）；新增漂移登记 D-1~D-5 与双栈权威口径声明（头部注）。

v1.1→v1.2：TK-34-02 · N-1~N-4 新漂移裁决落盘（N-1 管理面 9 路由全量登记 §1+D-6；N-2 幂等/验签失败语义条款新增 §8+D-7 归 Node；N-3 出口总预算权威 §9+D-8 归 Java；N-4 bizStatus 语义澄清 §7，双端实现保留）。详见 docs/arch/drift-N1-N4-ruling.md。

v1.3→v1.3.1：TK-57-01 · §10 K1/K3/K4 规范原文列补 DOC 行号、K1 滞后陈述更新为已闭合（CR-004-k-anchors.md）

v1.3→v1.3.1：TK-58-01 · 文件头与 §10 注版本指针统一（intel D-6 第二处清尾），K1 滞后陈述更新为已闭合
