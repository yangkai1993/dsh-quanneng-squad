# 接口可用性评审 · SN26 北向（usability-sn26-api-v1）

席位：前端经理@v14 · 阶段 S4（P-004 T13）· 日期 2026-11-11
评审对象（只读）：`docs/arch/api-contract.md`、`gateway-java/src/main/java/com/unionpay/tradein/north/SnController.java` 及其北向关联类
评审性质：接口对调用方的**可用性**（可理解、可安全调用、可解释失败）；不含实现改写方案，代码改动归后端经理经 CR。

---

## R1 北向路径表与实现漂移，调用方照文档写必 404

- **问题**：契约把北向写成三条独立路径与五个管理面路径；实现只有一条模板路由 `POST /api/sn/{method}`，管理面只有 `/health` 与 `/admin/state`。调用方按契约表请求 `/admin/audit`、`/admin/metrics`、`/admin/alerts` 得到 404，且 404 无任何结构化错误体。
- **证据**：`docs/arch/api-contract.md:8,9,10,11`（四行路径表）↔ `SnController.java:46`（`@PostMapping("/api/sn/{method}")`）、`SnController.java:32`（/health）、`SnController.java:39`（/admin/state）；全模块路由枚举仅 3 条映射（`SnController.java:32,39,46`，grep mapping 结果 3 命中）。
- **建议**：契约 v1.0 路径表按实际映射改写为「一条模板路由 + 合法 method 取值域（query/occupancy/release，见 `Sn26Contract.java:10-15`）」；`/admin/audit|metrics|alerts` 要么在契约中标「未交付（占位仅 /admin/state）」，要么由后端经理补路由后再冻结。文档必须显式声明「method 取错值 → 400 `kind=PARAM_INVALID`」这一路径。
- **影响面**：所有调用方的 URL 常量表与联调冒烟；契约冻结文档的可信度（`api-contract.md:3` 自称「不一致时以实现为准并立即记漂移」，本轮即为该漂移记录点）。

## R2 字段命名大小写敏感且未知字段静默丢弃，北向无别名归一

- **问题**：北向 DTO 只认精确 key，任何大小写偏差或同义名都被无声吞掉——调用方以为传了商户号，实际服务端从未看到。旧 Node 实现有一层别名归一，Java 端口没有，而契约文档从未写明「北向 key 精确、大小写敏感、未知即忽略」。
- **证据**：`SnRequest.java:8`（`@JsonIgnoreProperties(ignoreUnknown = true)`）；`RequestAdapter.java:16-39`（逐字段精确取 `r.mchntCd` 等，无别名表）；对照 legacy 别名表 `src/protocol/adapter.js:10-25`（`mchntCd/merchantId/merchantNo/mchntNo`、`barcode/barCode/goodsBarcode`、`cateCode/cateCd/categoryCode`）；`api-contract.md:17` 的「Key 大小写敏感」只针对**南向签名串**，未覆盖北向请求体。
- **建议**：契约增设「北向字段权威名表（17 项，逐字大小写）」并声明「未知字段忽略不报错」为已知风险，推荐调用方在联调阶段用 `/admin/state` + 审计回显（`audit.body_sanitized`，`SnController.java:63`）逐字段核对是否收到；若需别名兼容，属后端经理经 CR 决策。
- **影响面**：`mchntCd`、`barcode`、`cateCode`、`txnTime` 四个高频字段（同义名最多）；错名不报错 → 占用单缺商户号仍能「成功」，问题延后到对账。

## R3 必填/可选对调用方不友好：除 regionCd/snCode 外无人强制，且缺字段被静默剔除

- **问题**：契约要求 occupancy 必带 `txnTime/orderId/regionCd/mchntCd/barcode/snCode`、release 必带 `txnTime`；实现层只有 `regionCd`、`snCode` 加了 `@NotBlank`，其余仅长度/正则约束（不填即通过）。字段为 null 时在投影阶段被直接丢弃，请求照样 200。没有任何**按 method 分层的必填校验**。
- **证据**：`api-contract.md:9,10`（必填清单）与 legacy 权威 `src/protocol/adapter.js:54`（occupancy M 六项）、`adapter.js:58`（release M 含 txnTime）↔ `SnRequest.java:10-11`（唯二 `@NotBlank`）、`SnRequest.java:13,14,15,17`（`txnTime/orderId/mchntCd/barcode` 无 `@NotBlank`）；`RequestAdapter.java:43-45`（`if (v != null && !v.isEmpty()) o.put(...)`）；`SnController.java:56-57,75`（投影后直接返回 ok，无缺字段判定）。
- **建议**：契约把 M/O/C 三档逐 method 列成表（沿用 legacy `adapter.js:52-59` 的分档语义），并在实现上落「per-method 必填校验」（校验分组或控制器显式判定，均归后端经理）；在此之前，调用方必须自带前置校验，不得依赖服务端兜底。另需明确 `saleTm` 长度口径冲突：`SnRequest.java:25` 限 14，legacy `adapter.js:44` 允许 max 32，同一字段两档校验。
- **影响面**：占用/释放两接口全部调用方；缺字段仍返回成功 = 脏数据入库 + 事后无法解释的银联侧失败。

## R4 北向 `bizMethod` 字段被接收但完全忽略，method 真值只来自路径

- **问题**：请求体里有公开的 `bizMethod` 字段，调用方很容易用它选业务；实际服务端只按路径变量查表，body 里的 `bizMethod` 既不校验也不使用，两处不一致时静默以路径为准。
- **证据**：`SnRequest.java:26`（`public String bizMethod;` 无校验、无引用）；`SnController.java:47,49`（`@PathVariable String method` → `Sn26Contract.BIZ.getOrDefault(method, "")`）；`RequestAdapter.java:16`（投影只按传入 `method`，从不读 `r.bizMethod`）。
- **建议**：契约明写「业务方法唯一来源为路径段，请求体不接受 `bizMethod`」；若保留该字段，应定义为「可选且必须与路径一致，否则 400」并由后端经理实现。
- **影响面**：任何以 body 驱动业务的调用方（REST 客户端最常见写法）会打出与预期不同的 bizMethod，且拿到 200 而无从察觉。

## R5 应答是硬编码「探针」而非银联真应答，`ok=true` 不具备业务含义

- **问题**：北向响应里的业务结论字段全部来自写死的成功码，且当前**不存在任何南向 HTTP 出口**（grep 无 `RestTemplate/WebClient/HttpClient/openConnection`）。调用方把 `normalizedProbe.ok=true` 当成银联放行，等于读常量。
- **证据**：`SnController.java:71-72`（`normalizer.normalize(200, biz, Map.of("code","0000000000","subCode","000000"))`）；`SnController.java:66`（顶层 `ok=true`）、`SnController.java:69`（`signLen`）、`SnController.java:73-74`（`encryptDataProbe` 固定 `"888888"`）；`SnController.java:65` 注释与 `SnController.java:59` 说明本响应为审计探针；南向出口检索 0 命中；`application.yml:39`（`channel: mock`）与 `application.yml:42`（CENTER_A_URL 占位）。
- **建议**：契约必须声明北向当前只提供「签名/投影/加密自检」，不提供业务终态；响应字段应改名或加注（例如 `diagnosticOnly: true`，或把 `normalizedProbe` 置于 `diagnostics` 子对象下）以免调用方误读 `ok`。真业务应答落地前，任何 E2E 不得以 `ok=true` 作断言。
- **影响面**：最高。所有把本接口当业务通道的调用方、以及以 `$.ok` 为断言的测试（`SnControllerTest.java:29` 即此形态）都会得到恒真结论。

## R6 失败面不可解释：异常被压成同一个 `kind`，400 有两种体形，429 无体

- **问题**：调用方拿不到「为什么失败」。控制器 catch-all 把任何异常统一报 `PARAM_INVALID` 并固定 `msg="request rejected"`；而 Bean Validation 失败走 Spring 默认错误体，与自定义体完全不同形；限流 429 直接空体。契约定义的三层码（生成方+8 位原因+subCode）在北向从未出现。
- **证据**：`SnController.java:76-81`（catch Exception → `kind=PARAM_INVALID`、`msg=request rejected`）；`SnController.java:52`（未知 method 也复用同一个 `PARAM_INVALID`，两种成因不可区分）；`SnController.java:53,80`（同 `kind`、同 400）；`GatewaySecurityConfig.java:28`（`res.setStatus(429); return false;` 无响应体、无 `Retry-After`）；北向 `src/main` 内 `@ControllerAdvice/@ExceptionHandler/ProblemDetail` 检索 0 命中；`api-contract.md:28`（三层应答码定义）。
- **建议**：契约冻结一张「北向错误体唯一形状」表（`ok/kind/msg/code/subCode` 五字段恒定），并要求每个 `kind` 有唯一 HTTP 状态；限流需带 `Retry-After` 与结构化体；catch-all 至少要区分 `PARAM_INVALID / METHOD_UNKNOWN / INTERNAL` 三档（实现归后端经理）。同时 `ResponseNormalizer.java:28-33` 的生成方判定区分不了「真未知码」与「大小写不符」（`GENERATORS` 全大写，`Sn26Contract.java:26`），文档应写明「code 大小写敏感，勿转小写」。
- **影响面**：前端/上游的状态机分支与客服话术；无法区分「可重试」与「不可重试」的失败。

## R7 幂等与重试语义不可被调用方安全使用：idemKey 无人调用，reqId 每次重置

- **问题**：调用方没有任何可复用的幂等把手。幂等键函数存在但无调用点；每次请求现生成新 reqId；北向不接收也不回显 `Idempotency-Key`；`orderId` 是复合幂等键的组成部分却是可选字段。同时 `DUP_REQ`/`dup` 已定义却在北向永不可达。
- **证据**：`Sn26Contract.java:38-41`（`idemKey` 定义）与全库检索仅 1 处命中（定义本身，无调用方）；`SignatureService.java:26`（`UUID.randomUUID()` 每请求新建 reqId）；`SnRequest.java:14`（`orderId` 仅 `@Size(max=64)`，可空）与 `Sn26Contract.java:40`（`orderId == null ? ""` 直接进键）；幂等复合键的拍板记录 `docs/gateway-design-v0-draft.md:74`（A9：orderId+snCode+regionCd 复合）；`Sn26Contract.java:19`（`dup=000002`）、`Sn26Contract.java:24`（`DUP_REQ`）在 `R5` 的常量应答下不可达；重发禁令 `SnStateMachine.java:31-34`（UNKNOWN 占用绝不自动重发）；`api-contract.md:5-13` 北向章节通篇未提幂等/重试；`application.yml:47`（`idemTtlMs=86400000`）与 `Sn26Contract.java:29`（`TIMEOUT_TOTAL_MS=10000`）两处时限只存在于代码/配置。
- **建议**：契约补一节「北向幂等与重试」：① 调用方必须上送的幂等字段及其必填性（`orderId` 对 occupancy 应升为 M）；② 逐 method 标注可否重试（query 可、occupancy 否、release 视状态）、重试窗口（86400000ms）、超时上限（10000ms）与 UNKNOWN→PENDING_RECON 的人工/对账路径；③ 若需 `Idempotency-Key` 请求头，明确其归属与回显字段。
- **影响面**：成交占用链路的重复扣单/漏单风险；调用方超时后无法自证「这次和上次是同一笔」。

## R8 `isAiProd` 等 0/1 枚举语义反向且只写在代码注释里；`cateCode` 白名单不生效

- **问题**：`isAiProd` 的取值语义与直觉相反（0=是、1=否），而契约文档只列字段名、不列语义，说明仅存于一行代码注释——调用方几乎必然按「1=是」传值。品类码 `cateCode` 有白名单却不在北向校验，越界值直接放行。
- **证据**：`RequestAdapter.java:33`（`// 0=是 1=否, never inverted`，唯一语义出处）；`SnRequest.java:23`（`@Pattern(regexp = "[01]")` 只校验形状，不校验语义）；`api-contract.md:9`（仅出现 `isAiProd` 字段名，无取值定义）；`Sn26Contract.java:27`（`CATE_CODES` 九项白名单）与北向无引用（`SnRequest.java:22` 仅 `@Size(max=32)`，检索 `CATE_CODES` 仅定义处 1 命中）；legacy 对照 `src/protocol/adapter.js:42`（`cateCode: { whitelist: true }`）、`adapter.js:43`（`isAiProd: { enum: ['0','1'] }`）、`adapter.js:142`（`normalizeAi` 归一层）、`adapter.js:48`（`salesModel` 同为 0/1）；`Sn26Contract.java:28`（`STORE_FORWARD_INTERVALS_MIN` 无调用点）。
- **建议**：契约字段表逐枚举加「取值 → 业务含义」两列（`isAiProd` 0/1、`salesModel` 0/1、`cateCode` 九项），并注明该语义源自规范原文不可本地改写；`cateCode` 白名单是否北向拦截需给出明确结论（拦截 / 透传由银联判定），不能留给调用方猜；另需澄清 `transTm/txnAmt/discountAmt/salesModel` 四个 legacy 字段（`adapter.js:45-48`）在 Java 端口已不存在（`SnRequest.java` 全 27 行无此四项，`api-contract.md:9` 也未列）属「契约收窄」还是「端口漏项」。
- **影响面**：AI 产品标识错误 → 补贴/资格判定错档；品类越界码到银联侧才失败，错误信息不可解释；四个字段调用方按旧实现上送会被 `R2` 静默丢弃。

---

## 调用方踩坑 Top3

1. **把 `ok=true` 当业务放行**（R5）：`SnController.java:66,71-72` 顶层 `ok` 与 `normalizedProbe` 全为硬编码成功码，且无南向出口（`application.yml:39` channel=mock）。以此断言联调通过 = 从未验证过任何银联结论。安全做法：只把本响应当自检，业务终态待真应答交付后重新验收。
2. **字段名/必填性自由发挥**（R2+R3+R4）：`SnRequest.java:8` 未知 key 静默忽略，`SnRequest.java:10-11` 仅两字段真必填，`SnRequest.java:26` 的 `bizMethod` 完全无效。写 `merchantId`、漏 `barcode`、用 body 选业务三种情况都返回 200，故障延后到对账且不可归因。安全做法：以 `audit.body_sanitized`（`SnController.java:63`）逐字段核对上送是否落地。
3. **超时即重试占用**（R7）：北向无幂等把手（`Sn26Contract.java:38-41` 未被调用、`SignatureService.java:26` reqId 每次重置、`SnRequest.java:14` orderId 可空），而 `SnStateMachine.java:31-34` 明确 UNKNOWN 占用禁止自动重发。调用方一重试就可能造出第二笔占用，且 `dup`/`DUP_REQ`（`Sn26Contract.java:19,24`）当前根本回不来。安全做法：占用超时后停止重试、转人工对账（`application.yml:47` idemTtlMs=86400000 为窗口上限），待幂等口径入契约后再放开重试。

---

## 附：核查方法与边界

- 只读检索：`api-contract.md` 全文 31 行；`north/SnController.java` 83 行；北向关联 `protocol/SnRequest.java`(27) / `protocol/RequestAdapter.java`(46) / `protocol/ResponseNormalizer.java`(51) / `contract/Sn26Contract.java`(42) / `core/SnStateMachine.java`(35) / `crypto/SignatureService.java`(38) / `config/GatewaySecurityConfig.java`(42) / `crypto/Sanitizer.java`(59) / `resources/application.yml`(52)；对照 legacy `src/protocol/adapter.js` 与 `docs/gateway-design-v0-draft.md:56-58,74`。
- 路由枚举、南向出口、`@ControllerAdvice`、常量引用点均以 grep 全库检索取空/取满验证，非推测。
- 边界：本文件为本席唯一写域；未改动 `src/`、`gateway-java/`、`docs/arch/`、他人 inbox。所有代码侧改动建议均标注归属后端经理/CR，本评审不提新增前端技术栈。
