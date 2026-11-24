# CR-004 · Java 基线为北向空壳（阻塞级，范围大于 CR-003）

签发：总指挥 2026-11-11。发现：前端经理 S4（docs/squad/reviews/usability-sn26-api-v1.md R5/R7）。复核：总指挥独立检索全 Java 源码复现。

## 结论

**gateway-java 目前不会与银联通信，也不能防止重复占用。** 它只做三件真实的事（字段投影、SM2 签名、脱敏审计），随后把结果喂给一个硬编码应答。此前把「Java 18/18」当基线可用，属 CR-003 已记录的 P1 模式；本票是其更严重的延伸。

## 实测事实

| # | 严重度 | 位置 | 事实 | 影响 |
| --- | --- | --- | --- | --- |
| E1 | blocker | 全 gateway-java/src/main/java（14 个 .java） | HttpClient / RestTemplate / WebClient / HttpURLConnection / OkHttp 命中数 **0**；application.yml〔退役〕 channel: mock | 无任何南向出口 → 永不真正调用 soluGsp.gsp.sn26.* |
| E2 | blocker | north/SnController.java〔退役〕 | 应答 result 固定 ok:true，业务体来自 normalizer.normalize(200, biz, Map.of("code","0000000000", ...)) 的字面量 | 调用方拿到的成功与银联无关，任何联调结论均不可信 |
| E3 | blocker | contract/Sn26Contract.java〔退役〕 idemKey 定义后调用点 **0**；crypto/SignatureService.java〔退役〕 reqId 每请求 UUID 重生成 | 幂等键不参与请求，重复提交无法识别 | 占用超时重试 → 重复占用；dup / DUP_REQ 永不可达 |
| E4 | high | north/SnController.java〔退役〕 catch(Exception) → 统一 PARAM_INVALID | 网络/签名/业务失败不可区分；北向无 @ControllerAdvice（north/ 目录仅 SnController.java） | 契约三层码（code/subCode/subMsg）无法落地 |
| E5 | high | 契约 docs/arch/api-contract.md 声明 /admin/audit、/admin/metrics、/admin/alerts 为独立路径；实现仅有 /health、/admin/state、/api/sn/{method} | 管理面三条路径 404 且无错误体 | 运维可观测性缺口（运维经理 S7 依赖） |
| E6 | high | protocol/SnRequest.java〔退役〕 @JsonIgnoreProperties(ignoreUnknown=true) 且仅 regionCd/snCode 有 @NotBlank | occupancy/release 的 M 字段（txnTime/orderId/mchntCd/barcode）可全空仍返回成功 | 南向必填校验形同虚设 |
| E7 | medium | isAiProd 0=是/1=否 仅存于 RequestAdapter.java〔退役〕 注释；cateCode 白名单 Sn26Contract.java〔退役〕 北向不生效 | 语义靠注释传递，北向不校验 | 银联侧拒因不可诊断 |

## 对照组（说明这是 Java 单方面缺失，不是设计取舍）

- Node 参考实现 src/transport/client.js 确有 http/https 出口（require node:http + Agent + .end 调用），src/gateway.js 用 createUpstreamClient 注入，src/core/orchestrator.js 有 3 处 idemKey 调用与 2 处 upstream.* 发送 → 幂等与真实链路在 Node 侧成立。
- 因此：Java 基线要成为「可交付网关」，必须补 E1/E2/E3，而不是继续扩测试。

## 门禁补强（与修复同批落地，防再次空壳）

1. **禁止硬编码成功**：北向应答的业务码必须来自上游响应；测试须断言「上游返回 subCode=000001 时北向不得为 SALEABLE」。
2. **出口存在性检查**：主源码必须存在真实 HTTP 客户端调用点（grep 命中数 ≥1），否则判未实现。
3. **幂等有效性**：同一 (appId,orderId,regionCd,snCode,bizMethod) 两次提交必须命中同一 idemKey 且第二次返回 dup 语义。
4. **失败可解释**：网络异常 / 验签失败 / 业务失败三类必须落到不同 kind，且有对应测试。
5. **契约-实现一致性**：api-contract.md 声明的每条路径必须能在实现中找到映射（含变量路径的正确解析——我上轮就是把它误判为缺失，误报口径已修正）。

## 派工（写域互斥，C2 每轮 ≤3）

| 卡 | 席位 | 写域 | 必产物 | 出门门 |
| --- | --- | --- | --- | --- |
| E-a | 后端经理 | gateway-java/src/main/java/com/unionpay/tradein/transport/（新建）+ north/ | 真实南向客户端 + 应答透传 + 三类失败分型 | 门禁 1/2/4 通过 |
| E-b | 后端经理 | gateway-java/src/main/java/com/unionpay/tradein/core/ + crypto/ | idemKey 接入请求路径 + reqId 复用策略 | 门禁 3 通过（dup 可达） |
| E-c | 架构经理 | docs/arch/api-contract.md | 管理面路径口径裁决（实现 or 契约删条）+ 必填/枚举权威表（含 isAiProd、cateCode、saleTm 14/32 冲突） | 契约与实现 100% 可对应 |
| E-d | 测试经理 | gateway-java/src/test/java/ + docs/qa/ | 上述 5 条门禁的测试 + 跨栈互操作（CR-003 一并覆盖） | 5 类门禁各有失败用例证明能变红 |

> 纪律：本票源于一次「评审席位被重定义为接口可用性评审」的偶然收益 —— 说明必产物定义得对，闲置席位也能抓出 blocker。


> 退役声明（2026-11-23）：Java gateway 演练对象已从工作区剥离，本文 Java 侧指针转为退役留痕，语义裁决以 Node 权威源为准。
