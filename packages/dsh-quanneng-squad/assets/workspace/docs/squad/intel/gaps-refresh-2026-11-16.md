# intel 缺口现状三值复评 · 差异清单增量段（#14 / #15 / #16 / D-4）

> token: TK-68-06 · 需求经理 · 2026-11-17（第 68 轮 · 全编 16 · 面板重建）
> 方法：**现场读码复评，禁引旧账本**。底稿对照 SN26-约束清单-refresh-2026-11-16.md（mtime 2026-11-16T06:15Z）与 gap14-ruling-2026-11-16.md（TK-64-02 裁决意见书），但全部判定行号本轮重取。
> 证据环境：mvn -o -B test（JAVA_HOME=openjdk-21.0.2，apache-maven-3.9.9）→ **Tests run: 96, Failures: 0, Errors: 0, BUILD SUCCESS, exit 0**（2026-11-17T11:30+08:00）。
> 三值口径：是=现码有真实消费点+测试/断言锚点；否=约束明确但现码未体现或方向相反；部分=代码有形态但覆盖/锚点/联调不全。
> 注：本卡 **D-4** 指 spec-coverage §2 的「四 O 字段 transTm/txnAmt/discountAmt/salesModel」行（= 约束清单 refresh §2 表），**不是** api-contract.md:117 §11 的 D-4（admin 路由漂移）。

## 0. 三值复评总览（vs 11-16 账本）

| 项 | 11-16 账本判定 | 本轮现场判定 | 翻转？ | 一句话依据 |
| --- | --- | --- | --- | --- |
| #14 未知数据元（DOC:537） | 否 | **否（维持）** | 否 | JacksonStrictConfig.java:22 仍 FAIL_ON_UNKNOWN_PROPERTIES=true；TK-64-02 建议的选项 C **零落码** |
| #15 KeepAlive ≤15s（DOC:150） | 是(JS)/否(Java)，Java grep 0 命中 | **部分（Java 0 命中→已实现响应头但覆盖不全）** | **是（账本过期）** | SnController.java:55-65 已落 Keep-Alive 响应头 + SnControllerTest.java:68-77 绿；但 8 个错误早退路径无头、容器侧未配置 |
| #16 证书 ≤5 年（DOC:364） | 部分（缺 >5 年拒绝守卫） | **是** | **是（守卫已落）** | SandboxSignIdCertRegistry.java:59-67/69-72/102-106 三径统一闸口 + SignIdCertRegistryTest.java:127-150 双向边界测试绿 |
| D-4 四 O 字段 | JS 达标 / Java 否（未端口） | **部分（Java 已端口，缺测试锚+契约行未撤）** | **是（账本过期）** | SnRequest.java:37-55 四字段带校验 + RequestAdapter.java:36-39 occupancy 投影；Java test 全树四字段名 0 命中 |

账本失效根因：约束清单 refresh 写于 11-16T06:15Z，而 #15（SnController.java mtime 11-16T06:24Z）、#16（SandboxSignIdCertRegistry.java mtime 11-17T03:08Z）、D-4（SnRequest/RequestAdapter mtime 11-16T05:21/05:22Z，账本 grep 时点未反映）均与账本采集时点错身——正是账本 §4-10「锚点必须重取，不得沿用」条款的又一次实证。

## 1. #14 未知数据元方向冲突 —— 否（维持）｜裁决未落码

- 现码链（本轮实读）：JacksonStrictConfig.java:22（@Primary ObjectMapper，FAIL_ON_UNKNOWN_PROPERTIES=true，文件 mtime **2026-11-12**，未变）→ SnController.java:111-117 parse 捕获异常 → 400 PARAM_INVALID "malformed request body"。与 DOC:537「无法识别的数据元可直接丢弃、不应影响该报文的正常处理」方向相反，判**否**维持。
- **增量 A（裁决状态）**：TK-64-02 意见书推荐选项 C（gateway.protocol.unknownFields=reject|drop 双模式默认 drop），本轮 grep：unknownFields|unknown-fields|UNKNOWN_FIELDS 于 gateway-java/src 全部 .java/.yml **0 命中**；GS3RecheckFixesTest.java:103-108 f5 仍是唯一未知字段断言且方向为 400（本轮 mvn test 绿佐证未翻转）。→ **选项 C 零落码；缺口状态从「待裁决」细化为「已建议 · 待采纳 · 待落码」**，采纳权仍在架构经理/总指挥。
- **增量 B（新发现，账本与意见书均未记）**：契约裁定与实现细节不符——api-contract.md:65 裁定「400 且 kind=PARAM_INVALID、**msg 回显首个未知 key（不回显值）**」，但现码 SnController.java:116 回显固定 msg="malformed request body"，**不回显 key 名**（异常泛捕获：未知 key 与 JSON 语法错误同 msg）。裁决意见书 F2 行「错误回显当前为固定 msg」与此一致，但契约正文条款超前于实现——属独立契约漂移，建议随选项 C 的 CR 一并登记（改契约措辞或补实现，二选一）。
- **增量 C（卫生项）**：SnRequest.java:6 仍 import com.fasterxml.jackson.annotation.JsonIgnoreProperties，但类上无该注解使用（仅 :9-10 注释提及弃用史）——unused import，低危，随任一落码 CR 清理。
- 影响面守恒复核：南向投影 RequestAdapter.java:16-43 逐字段 put，未知 key 永不出域——与 11-16 账本 F3 一致，三选项安全面共同前提不变。

## 2. #15 KeepAlive ≤15s —— 部分（Java 否→部分，账本过期翻转）

- **账本失效**：11-16 refresh §1 行15 与 §5 脚本口径记「Java 侧 grep keepAlive/KeepAlive 0 命中」→ 本轮实测 gateway-java/src **22 处命中**（main 12 + test 10）。TK-61-03 已把响应头侧落地（SnControllerTest.java:65-66 内嵌 CAPTAIN CORRECTION 注记：先误试不存在的 HttpClient.Builder.keepAlive(...)，后改响应头正解）。
- 已达标面：
  - 消费点：SnController.java:55 KEEP_ALIVE_TIMEOUT_SEC=15、:60-65 keepAliveHeaders() 产出 Connection: Keep-Alive + Keep-Alive: timeout=15，符合 DOC:149/150「服务端通过 http 应答消息头设置，不超过 15 秒」（DOC:150 本轮重读，行号未漂）；
  - 测试锚：SnControllerTest.java:68-77 responsesCarryKeepAliveTimeout15 断言 200 响应双头，本轮 mvn test 绿；
  - 客户端解释面：HttpUpstreamChannel.java:24-30 注释论证 keep-alive deadline 属服务端应答头而非客户端旋钮，与 JS 源（src/inbound/server.js:216、src/mock/server.js:224,299）同构，双端无冲突。
- 未达标面（判「部分」的两个扣分项，均本轮现场实测）：
  1. **错误早退路径无头**：SnController.java 共 11 个 return 点，仅 :136(403 入站验签拒) / :147(2xx 业务) / :155(502 COMM_FAILURE) 三处调 .headers(keepAliveHeaders())；:100 / :108 / :116 / :119 / :125 / :149（400 PARAM_INVALID 共 6 处）、:159（403 出域应答验签拒）、:161（500 INTERNAL）共 **8 处不带 Keep-Alive 头**，覆盖面 3/11。银联按 DOC:149「请求方为 Keep-Alive 时必填」核对应答头时，错误应答缺声明。
  2. **容器侧真实 idle 超时未配置**：application.yml:22-25 仅有 server.tomcat.connection-timeout: 3000，无 keep-alive 超时对应项（Spring Boot 3.5 键名 server.tomcat.keep-alive-timeout，本轮 yml 全读 66 行 **0 命中**）。响应头是**声明**，Tomcat 实际连接保活窗口仍走容器默认——与 JS 侧 server.keepAliveTimeout=15000（真执行）形成「声明/执行不对称」。DOC:150 严格口径应含执行侧。
- 移交判据（转「是」条件，归后端实现域）：① 8 个错误 return 点统一挂头（抽一个 ResponseEntity 构造 helper，改动面=SnController 单文件）；② application.yml 补 server.tomcat.keep-alive-timeout: 15s，并加一条全路径（至少含一例 400）应答头断言测试。

## 3. #16 证书有效期 ≤5 年 —— 是（部分→是，守卫已落且测绿）

- 守卫现场实读（文件 mtime **2026-11-17T03:08Z**，昨夜落地，晚于 11-16 账本采集）：
  - SandboxSignIdCertRegistry.java:59-67 checkUpperBound：notAfter - now > 1825 天 → IllegalArgumentException（fail-closed）；
  - 三径无旁路：Spring 构造路径 :46 / :51 走 putChecked（:69-72 内调 checkUpperBound），:52-53 对配置越界显式 rethrow（不吞、不反射包装）；defaultRegistry（:81-93）与 forTest（:96-100）两参路径经私有 put（:102-106）逐条过同一守卫——**注释自证「统一闸口，不再 putAll 旁路」（:77）**。
- 测试锚（本轮 mvn test 实测绿）：
  - SignIdCertRegistryTest.java:128-139 certNotAfterDaysExceeds5YearsThrowsOnRegistration：1825 天接受 / **1826 天拒绝**双向边界；
  - SignIdCertRegistryTest.java:142-150 springConstructorAlsoGuardedBy5YearUpperBound：Spring 构造 1825 正常启动 / 1826 抛 IllegalArgumentException。
- 语义核对：DOC:364 为「**不宜**超过 5 年」建议级；实现取硬拒，方向更严，不与规范冲突。边界判定用严格大于（:63），故 1825 天恰为可接受上界，与测试口径一致。
- 保留注记（不降判）：沙箱载体是本地生成 KeyPair + epoch 毫秒（CertEntry.java:15,29-31），无真实 X509 notAfter 字段解析路径；生产接 KMS/HSM 证书时守卫输入源需换绑证书实际 notAfter——并入外部确认清单（联调项），沙箱语义已「是」。
- 管线断言面：packages/dsh-quanneng-squad/scripts（37 个 .mjs 全树）grep 1825|five-year|5-year **0 命中**——5 年守卫无机器断言，仅单测锚。对照 #4/5b 已有 result-verify.mjs:47,49 先例，建议后端补一条机器断言（低优先，不阻断判「是」）。

## 4. D-4 四 O 字段（transTm / txnAmt / discountAmt / salesModel）—— 部分（Java 否→部分）

- **账本与契约双过期**：11-16 refresh §2 记「grep 四字段名于 gateway-java/src 全树（main+test）0 命中」「SnRequest.java 全 21 字段表内无此四项」；契约 api-contract.md:40-42 亦仍写「**Java 未端口** → 漂移 D-1」。本轮实测：**main 13 处命中**——
  - 声明+校验：SnRequest.java:37 transTm（@Size(min=17,max=17) + @Pattern(\d{17})）、:43 txnAmt（@Size(max=12) + 金额 pattern）、:49 discountAmt（同 txnAmt 口径）、:55 salesModel（@Pattern([01])）；文件现 **59 行**，非账本所引 27/21 行版本；
  - 出域投影：RequestAdapter.java:36-39 occupancy 分支四字段 put(...)，配合 :47-49 空值剔除即 O 档语义。
- 双端口径对齐核对（本轮 JS/Java 两表并读）：src/protocol/adapter.js:45-48（^\d{17}$ / 金额 pattern + max 12 / enum ['0','1']）↔ Java 四注解逐条一致；O 档归位 adapter.js:56 ↔ Java 仅 occupancy 投影。**实现域已端口**。
- 判「部分」不判「是」的三个缺项（三值口径要求「是=消费点+测试/断言锚点」）：
  1. **Java 测试锚 0 命中**：gateway-java/src/test 全 21 个测试文件 grep 四字段名 **0 处**——端口无回归保护（JS 侧 tests/gateway.test.js 有对照断言）；
  2. **契约漂移行未撤**：api-contract.md:40-42（§2 三行「Java 未端口」）与 :114（§11 D-1「Java 缺四 O 字段」，证据列仍引 SnRequest.java:10-26 旧行号）已过期于现码。契约是验收权威，陈述滞后本身即 §4-9 同款「登记滞后于现码」缺陷，需 CR 撤 D-1 / 把 §2 三行改述为「已端口（锚点 SnRequest.java:37-55; RequestAdapter.java:36-39）+ 待补测试」；
  3. **注释语义错位（轻）**：SnRequest.java:52-53 注 salesModel「0=直销 1=代销」，DOC:502 权威口径「0：线上 / 1：线下」——校验集 [01] 不受影响，但注释误导调用方，随补测试 CR 一并更正。
- 移交判据（转「是」条件）：① 后端补 occupancy 含四字段的全链测试（入站带值→出域报文含四键；缺值→不出键仍 200）；② 契约 D-1 与 §2 三行随 CR 撤销或改述；③ 注释更正。
- 范围澄清：本卡 D-4=spec-coverage-2026-11-15.md:104 §2 四 O 字段行。契约 §11 其他 D 项状态本轮顺带实测登记（不扩权裁决）：**D-2**（body bizMethod 声明未消费）现码仍 SnRequest.java:57 声明、main 全树 req.bizMethod **0 消费点**（仅 StoreForwardScheduler/SignatureService 的形参与 Task.bizMethod() 同名异物）→ 维持未闭合；**D-3** 陈旧陈述问题已并入上节 #14 增量 B。

## 5. 差异清单（增量段 · 相对 11-16 账本的变化）

1. **#15 Java 否→部分**：TK-61-03 响应头已落 + 单测绿（账本「0 命中」过期）。新记缺项=8 个错误 return 点无 Keep-Alive 头（3/11 覆盖）+ Tomcat keep-alive 实际超时未配置（声明/执行不对称）。
2. **#16 部分→是**：1825 天上界守卫三径无旁路 + 1825/1826 双向边界测试绿（11-17 昨夜落地）。新记=无管线机器断言、生产 X509 notAfter 换绑留联调注记。
3. **D-4 Java 否→部分**：四字段声明+校验+投影已端口（账本/契约「未端口」双过期）。新记=Java 测试锚缺失、api-contract.md:40-42,114 漂移行待撤、salesModel 注释语义错位。
4. **#14 维持否**，状态细化：TK-64-02 选项 C 零落码（配置键 0 命中、f5 方向未翻转）。新记两点——契约 §5:65「msg 回显首个未知 key」超前于实现（现固定 msg，SnController.java:116）；SnRequest.java:6 unused import。
5. **账本方法学再实证**：本轮 4 项中 3 项翻转皆因账本 grep 时点与代码合并时点错身（mtime 链：JacksonStrictConfig 11-12T02:41Z 未变 vs SnController 11-16T06:24Z、Registry 11-17T03:08Z 均晚于/早于账本 11-16T06:15Z 采集）。建议 §4-10「行号必须重取」升级为「行号 + 命中数 + 采集时间戳三字段」，下一轮采风官照此登记。
6. **统计修正**：账本 §3 汇总「是 16 / 否 2 / 部分 1」应按本轮修正为——#14 否、#15 部分、#16 是、D-4 部分（§2 表项不入 §3 计数），即 §1 表内 **是 17 / 部分 1（#15）/ 否 1（#14）**；外部确认项 E1–E12 本轮仍无新答复落地。
7. **未新增缺口行**：四项复评未暴露 §1 表 19 行之外的新约束行；增量 B/C（msg 回显超前、unused import）作为 #14 行内注记登记，不另起行。

## 6. 可复算脚本口径（本轮全部实跑，非引用）

- 行为门：mvn -o -B test（cwd=gateway-java，JAVA_HOME=E:\DevTools\.jdks\openjdk-21.0.2，mvn=E:\DevTools\apache-maven-3.9.9\bin）→ **exit 0**：Tests run: 96, Failures: 0, Errors: 0, Skipped: 0 / BUILD SUCCESS / Total time 30.974 s / Finished 2026-11-17T11:30:25+08:00。相关类逐条绿：SnControllerTest 4（含 keep-alive 断言）、GS3RecheckFixesTest 7（含 f5 未知字段 400）、SignIdCertRegistryTest（含 5 年边界两测）、InboundVerifyTest 7、Cr004GatesTest 8、HttpUpstreamChannelTest 8。
- #14：grep FAIL_ON_UNKNOWN_PROPERTIES gateway-java/src → SnController.java:111(注释) + JacksonStrictConfig.java:11,22 + SnRequest.java:9（4 处，方向未变）；grep unknownFields|unknown-fields（.java+.yml）→ **0 命中**（选项 C 未落码）。
- #15：grep -i keepAlive|Keep-Alive gateway-java/src → **22 命中**（账本记 0）；SnController.java 11 个 return 点中 .headers(keepAliveHeaders()) **3 处**（:136/:147/:155）；application.yml 内 server.tomcat 仅 :25 connection-timeout，keep-alive 键 **0 命中**。
- #16：SandboxSignIdCertRegistry.java :61 maxDays=1825L + :70/:104 双闸调用 + :52-53 越界 rethrow；SignIdCertRegistryTest.java :128-139,142-150；grep 1825|5-year packages/dsh-quanneng-squad/scripts/*.mjs → **0 命中**。
- D-4：grep transTm|txnAmt|discountAmt|salesModel → gateway-java/src/main **13 命中**（账本记 0）/ gateway-java/src/test **0 命中**；JS 对照 src/protocol/adapter.js:22-25,45-48,56 在位。
- 规范行号复核（.analysis/source-doc.txt，总 **715 行**不变）：DOC:150 KeepAlive 不超 15 秒、DOC:364 证书不宜超 5 年、DOC:493-495 与 502 四 O 字段定义、DOC:537 未知数据元直接丢弃——四项行号与账本一致，无漂移。
- 落盘后自检：本文件为写域唯一产物；未触碰任何 src/test/docs 其他路径。

## 7. 一句话结论

四项复评 3 项翻转（#15 否→部分、#16 部分→是、D-4 否→部分），#14 维持否且确认 TK-64-02 选项 C 零落码；残余缺口从「实现缺失」收敛为三件小活——#14 等裁决落码（≤3 文件）、#15 错误路径挂头 + 容器 keep-alive 配置（单文件 + yml）、D-4 补 Java 测试锚并撤契约漂移行（测试 + 文档 CR）。旧账本三处「0 命中」结论全部过期，§4-10 行号重取条款再次被 mtime 链实证；mvn test 96/96 exit 0 为行为门实测。
