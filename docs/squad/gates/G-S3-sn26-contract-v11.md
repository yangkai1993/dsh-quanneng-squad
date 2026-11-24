# G-S3 · 门下封驳 · SN26 契约 v1.1 与已落实现独立审计（给事中@v15，TK-31-01）

> 审计对象：docs/arch/api-contract.md v1.1（CR-004 E-c 裁决产物）与 gateway-java 已落实现（CR-004 E-a/E-b 推进部分）。
> 方法：全部结论以本席实跑 grep/read 为准（证据=文件:行）；不引用他人计数。与他人自报冲突处以实测为准并注明。
> 对照基线：DELIVERY-PIPELINE.md S3 出门门（无未闭合封驳项）；G-REFLOW P1~P8 逐条对照（文末表）。
> 写域合规：本文件为唯一写盘；其余全部只读。

## 结论速览

| # | 审计项 | 结论 | 一句话理由 |
| --- | --- | --- | --- |
| ① | 管理面裁决「保留契约 + Java 补实现」 | 放行 | Node 语义源三路径俱在，Java 有鉴权无路由，删契约=文档迁就空壳 |
| ② | M/C/O/X 字段表 vs SnRequest 实现 | 封驳 | occupancy 四 M 字段仅拦 2/4（mchntCd/barcode 未拦），release txnTime 已拦 |
| ③ | isAiProd / cateCode / saleTm 双端一致性 | 待验 | 双端定义不矛盾（枚举表/白名单同源同值），但 Java 北向均未执行，落码后复核 |
| ④ | 后端悄悄改契约语义（新漂移） | 封驳 | 新发现 4 项漂移未登记、架构经理未裁（见 §四） |
| ⑤ | CR-003 D1/D2/D3 是否仍存在 | 封驳 | D1/D3 原样在码；D2 形修实未修（传参改了但收参方仍忽略）——后端只在 CR-004 推进 |
| ⑥ | transport/ 7 类 vs 九头/三值/COMM_FAILURE 规范 | 放行 | 出口真实、九头实达、HTTP≠200 归一正确；2 项轻微留痕（§六） |

**总判定：不可进入 G-S4。** 阻断项：⑤（CR-003 全未修，跨栈互通必被银联拒，P1 模式）；②④ 为同批闭合条件。①⑥ 已放行部分（transport/北向透传链）可保留，不因封驳回退。stage-order 豁免解除前置条件已满足一半：本文件即 EXEMPTIONS.md 闭合条件所指 G-S3*.md 工件；但⑤封驳未清，建议豁免保留至 CR-003 修复单（D-a/D-b）重派后再撤。

## 一、① 管理面裁决（自采证据）

- Node 三路径实测在码：src/north/server.js:47（/admin/audit）、:48（/admin/metrics）、:49（/admin/alerts）。
- Java 全模块路由枚举实测仅 3 条：SnController.java:30（/health）、:37（/admin/state）、:44（/api/sn/{method}）；/admin/audit|metrics|alerts 0 命中。
- Java /admin/* 鉴权拦截已就位：GatewaySecurityConfig.java:29（startsWith("/admin/") 进入鉴权分支）。
- 裁决理由复核成立：语义源在 Node 全实现、鉴权骨架在 Java 已通，缺的只是路由本体；从契约删条与 CR-004 门禁5「契约-实现一致性」方向相反。**放行**。
- 附带发现（转 §四-D6）：Node 实际管理面不止 3 条——server.js:50（/admin/centers）、:51（/admin/recon/tick）、:52（/admin/file/send）、:53（/admin/cert/userget）、:58（/admin/failover/probe）均未入契约 v1.1 §1，契约覆盖不全且未裁。

## 二、② M/C/O/X 一致性（occupancy 四字段 / release txnTime）

- 契约权威：api-contract.md §2 —— occupancy 的 txnTime/orderId/mchntCd/barcode 与 release 的 txnTime 均 **M**。
- Java 形状层：SnRequest.java:10-11 仅 regionCd/snCode @NotBlank；:13-17 四字段无必填注解。
- Java 业务层：Sn26FlowService.java:151-160 requireFields —— occupancy 拦 orderId(:156)、occupancy+release 拦 txnTime(:157-158)；**mchntCd、barcode 两字段任何层均无必填拦截**（全码 grep 无消费点）。
- 结论：契约 ② 补齐结论自述「per-method 必填校验属实现域」，实现只落了一半，空 mchntCd/barcode 仍可直通出域（RequestAdapter.java:43-45 空值剔除）。判**封驳**，修复指针=已登记漂移 D-3，归后端 E-a/E-b。
- release 侧：txnTime 必填已在 requireFields:157-158 落码，投影口径 RequestAdapter.java:21-37 与契约 §2 release 列逐字段比对一致（无 orderId/无 mchntCd，仅 regionCd/snCode/txnTime/reqReserved）——此半项**放行**。

## 三、③ 枚举三态双端比对

- isAiProd：双端取值一致 —— SnRequest.java:23 @Pattern("[01]")；adapter.js:43 enum ['0','1']；语义 0=是/1=否 Java 仅存注释 RequestAdapter.java:33，Node normalizeAi（adapter.js:135-138）boolean→'0'/'1' 同向。双端**不矛盾**；语义强制北向未做（契约 §3 已接管为权威表，合 D-3 待落码）。
- cateCode：白名单双端同值各 9 项 —— Sn26Contract.java:27 与 contract.js:29（A01..A06,B01..B03）逐项比对一致。但 Java 北向 0 引用（全主源码 grep CATE_CODES 仅定义处 1 命中），契约 §3 裁定的「北向拦截 400」未落。
- saleTm：**矛盾仍在** —— SnRequest.java:25 @Size(max=14) ↔ adapter.js:44 max:32；契约 §4 已裁 32+两态，Java 未跟改（无 @Pattern 两态正则）。
- 结论：契约口径本身放行；双端实现闭合判**待验**（D-3/D-5 落码后本席复核），不得据此单独放行 G-S4。

## 四、④ 新漂移（未登记、架构未裁 —— 判封驳并点名架构经理补裁）

| # | 漂移 | 证据（文件:行） | 影响 |
| --- | --- | --- | --- |
| N-1 | Node 管理面 9 条路由仅 3 条入契约；centers/recon/file-send/cert-userget/failover-probe 无契约地位 | server.js:50-58 ↔ api-contract.md §1 | S7 运维依赖面契约外裸奔 |
| N-2 | Java SECURITY_REJECT 释放幂等占位（removeIfOwned），Node 验签失败直接返回不清键（orchestrator.js:62-66）；双端幂等语义分叉，无裁决 | Sn26FlowService.java:92-93 | 重放窗口语义不一致，跨栈测试将暴露口径冲突 |
| N-3 | Java 出口总预算退化：request timeout=min(budget,READ_MS)=9s 封顶，规范「总预算 10000ms」未如实使用 | HttpUpstreamChannel.java:26,64 ↔ v1-refined.md:105 | 不超时违规但预算语义漂移，留痕待架构确认 |
| N-4 | HTTP≠200 时 bizStatus="COMM_FAILURE"（双端一致）vs 契约/设计「COMM_FAILURE 不入业务状态」（v1-refined.md:139）；属双端同漂，非 Java 单方 | ResponseNormalizer.java:21 ↔ response.js:75 | bizStatus 语义需架构一句话裁决，写入契约 §7 |

另查 degrade fail-closed 生效路径（CR-003 D4）：已部分接线 —— SnController.java:25-26 实读配置、:54-57 COMM_FAILURE 时生效；但 :63 与 Sn26FlowService.java:84 两处硬编码字面量 "fail-closed"，配置改值时部分路径行为不变（P2 残留 50%），随 ④ 一并登记。

## 五、⑤ CR-003 D1/D2/D3 现存状态（本席实测，非引用）

- **D1 仍在**：GmCryptoService.java:39-44 sm2SignRaw 收 userId 参数但方法体未用；:41 注释自认 BC 默认 userID；全主源码 grep ParametersWithID / SM2Engine = 0 命中。ZA 按规范取显式 userID 的路径在主代码不存在。
- **D2 形修实未修**：SignatureService.java:38 第 3 参已改传 signId（配置值），但收参方 GmCryptoService.sm2SignRaw 忽略该参 → 实际生效 userID 仍是 BC 默认 1234567812345678。签名仍必被规范验签拒。属 P2「入参存在≠入参生效」的标准命中。
- **D3 仍在**：EncryptData.java:25-26 仍用签名原语 sm2SignRaw 包裹 SM4 一次性密钥；GmCryptoService 全文无 sm2Encrypt/sm2Decrypt（grep 0 命中）；Node 对照 src/crypto/provider.js 有 sm2Encrypt 引用 3 处 —— 缺陷为 Java 单方面偏离，与 CR-003 复现结论一致。
- **判：封驳。** 后端本轮只在 CR-004（transport/north/core）推进，CR-003 三项 blocker 一项未修。测试侧已有正确原语 Sm2Interop.java（显式 ParametersWithID + FixedKSigner），但仅存在于测试门禁、主签名路径未接线 —— 「门禁写对了、产品码没改」，恰是 P1/P2 复合形态。
- 与 captain 自报冲突点：无。CR-004 事实表（E1/E2/E3）描述的是修复前状态；本席实测现码 E1 已修（HttpUpstreamChannel.java 真实 HttpClient 出口）、E2 已修（SnController.java:52,58 上游透传 + Cr004GatesTest gate1 断言 normalizedProbe 不存在）、E3 已修（Sn26FlowService.java:52-54,121 idemKey 接线 + reqId 复用，gate3 断言同 reqId dup）；E6 部分修（见②）、E5 未修（见①）。以本席实测为准。

## 六、⑥ transport/ 7 类规范符合性

- 九头：SignatureService.sign 实写 9 头（version/appType/appId/bizMethod/reqId/sign/signId/signMethod/signPubKeyCert，SignatureService.java:32-41）；HttpUpstreamChannel 原样透传（仅屏蔽 JDK 受限头，:107-110）；HttpUpstreamChannelTest 对真socket断言 9 头齐达（gate2_outletExistsAndCarriesNineHeadersOverRealSocket）。**达标**。
- timeout 三值：CONNECT_MS=3000/READ_MS=9000/TOTAL_MS=10000 常量齐（HttpUpstreamChannel.java:26）；connectTimeout 于 client builder 生效。轻微退化见 N-3。
- HTTP≠200→COMM_FAILURE：出口原样回传状态不猜（HttpUpstreamChannel.java:83-90）；归一点唯一在 ResponseNormalizer.java:21（httpStatus!=200 → COMM_FAILURE），与 Node response.js:73-76 同构；gate2_http503IsCommFailureNeverSuccess 断言 503→502+COMM_FAILURE+NOT_SALEABLE。**达标**。
- gzip 条件：≥gzipMinBytes 才压、非压缩必无 Content-Encoding（encodeBody:44-56），与 v1-refined.md:106 一致。
- mock 通道：UpstreamRouter 默认 real（application.yml:44 channel 默认 real；CR-004 E1 所记 yml:39 channel:mock 已翻转为 real），mock 仅沙箱开关 —— 符合「默认真出口」要求。
- 留痕注记（不影响放行）：a) Connection 头不透传（JDK 受限，Node 侧强制写 Keep-Alive/close，轻差异）；b) mock 应答头用小写名（appid/bizmethod/reqid，MockUpstreamChannel.java），验签侧 hv() 小写匹配兼容（SignatureService.java:70-73），属沙箱内自洽。

## 七、G-REFLOW P1~P8 对照

| P | 对照结果 |
| --- | --- |
| P1 | 命中：Java 单测可全绿但 CR-003 未修 → 跨栈互通必败；本审计以 Node 源码为外部真值对照出具 |
| P2 | 命中 2 处：D2 传参生效链断裂；degrade 两处硬编码绕过配置读取点 |
| P3 | 未命中新案：契约 v1.1 交付状态列如实标红（/admin 三路径「补前门禁5 判红」），无叙述性假交付 |
| P4 | 未命中：本轮零脚本改动 |
| P5 | 未命中：timeout 语义差异以实跑常量与测试断言留痕（N-3），未用常识推断 |
| P6 | 已执行：对 captain「CR-004 已复现」前提逐条重测，E1/E2/E3 现码已修与原票事实表存在时点差，已注明以实测为准 |
| P7 | 未命中：本席产出以本文件落盘为准 |
| P8 | 不适用（本席非 captain；改门禁者交叉审计归御史大夫 TK-31-02） |

## 八、出门判定与解除条件

**不可进入 G-S4。** 解除条件（全部满足后本席复核转放行）：
1. CR-003 D-a：GmCryptoService 接 ParametersWithID 显式 userID（D1）+ EncryptData 改 SM2 加密包裹（D3），主签名路径生效证据=互操作测试走主路径。
2. CR-003 D-b：degrade 硬编码两处（SnController.java:63、Sn26FlowService.java:84）改读配置。
3. CR-004 E-a/E-b 收尾：mchntCd/barcode 必填拦截（②）、saleTm max=32+两态 Pattern（③/D-5）、FAIL_ON_UNKNOWN 北向拒绝（D-3）。
4. 架构经理补裁 ④ 新漂移 N-1~N-4 并登记契约漂移表（或修订契约）。
5. 上述闭合后 captain 删 EXEMPTIONS.md stage-order 行（闭合条件已由本文件满足工件存在性）。

—— 给事中@v15 · S3 门下封驳 · 2026-11-11 · 全部证据文件:行 实测于本仓库现码。
