# 规范↔契约↔机器断言 覆盖差异清单 · S8 需求侧复盘（2026-11-15）

> 令牌 TK-55-02 · 需求经理@v17 · 只读复核 + 本域产出；**不改契约、不碰 src/、scripts/、gates/**。
> 权威输入：`.analysis/source-doc.txt`（下称 DOC，715 行，用户最初上传的银联规范原文）、`docs/arch/api-contract.md`（下称 C，127 行，头部 v1.2 / §10 版本行 :107 标 v1.3）、`packages/dsh-quanneng-squad/scripts/result-verify.mjs`（下称 RV，67 行，只读解析）。
> 参考（只读，不作结论依据）：`docs/squad/intel/SN26-约束清单-2026-11-11.md`（下称 INTEL）、`docs/squad/STATE.md`（下称 STATE）。

## 0. 口径、方法与边界（不虚构声明）

| 项 | 结论 | 证据 |
| --- | --- | --- |
| 5 API | 取 RV:24 的 `apis` 数组为准（3 个 sn26 + 2 个 admin.cert） | `result-verify.mjs:24`；规范侧 DOC:541-543、:382、:412 |
| 9 公共头 | 取 DOC:155-163 公共参数表 9 个数据元（8×M + 1×C=signPubKeyCert） | `.analysis/source-doc.txt:155-163`；契约侧 `api-contract.md:69` |
| 58 个 M 字段 | DOC 中字面 `\| M \|` 共 **58 行**；其中 **:452 是「数据元数值符号」图例**（M 的定义行，非字段，见 `DOC:452`），故**字段定义行 57 行、去重字段标识 20 个** | 逐行实读 `.analysis/source-doc.txt`（行号见 §3）；去重集合见 §3.1 |
| 断言布尔值来源 | 按 RV:24-63 的 `includes` / 正则口径做**只读等价复算**（纯内存读取，未执行门脚本、未写治理域文件）；非门脚本实跑输出 | `result-verify.mjs:24-25,32-52,63` |
| 账本既有实跑结论 | 仅作引用标注，非本席实跑 | `STATE.md:161,182,183,187`（K1~K4 全绿、result-verify 0 缺口） |

**三类标签定义**（每条差异项同时标 `契约覆盖` / `机器断言覆盖` 两格）：
- **已覆盖**：规范条款在 C 有对应 §N 条款（逐字或语义），链条可核查。
- **未覆盖**：C 缺对应条款 / 仅省写致字面未登记 / RV 无对应断言或断言粒度不足、字面未命中。
- **不适用**：条款不属北向接口契约与机器断言判定范围（符号图例、入网分配值、规范自身矛盾待银联答复、设计文档引入字段、银联发起方向无独立路由等）。

**本席未做**：未实跑 `mvn` / `result-verify` / `verify`；未核验 Java/Node 现码逐字段实现（只按 RV 口径复算源码串命中）；未核 E1~E12 外部答复。以上均标「不适用」或注明证据性质。

---

## 1. 5 API 差异表（规范行号 ↔ 契约 §N ↔ 机器断言）

RV:24-25 对 5 个 bizMethod 计算 `spec / v1 / contract / impl` 四列；本席只读复算结果逐列如下（真实值，未修饰）。

| # | 规范行号 | bizMethod | 契约 §N（语义登记） | 机器断言（RV:24-25 复算值） | 契约覆盖 | 机器断言覆盖 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `DOC:541,556,572` | `soluGsp.gsp.sn26.query` | §1:9 `/api/sn/{method}` 白名单含 query；§6:73 逐字登记 | `API …query`：spec=T v1=T **contract=T** impl=T | 已覆盖 | 已覆盖 |
| 2 | `DOC:542,587` | `soluGsp.gsp.sn26.occupancy` | §1:9 method=occupancy；§6:73 省写为 `query\|occupancy\|release` | `API …occupancy`：spec=T v1=T **contract=F** impl=T | **未覆盖**（字面） | 已覆盖（impl=T） |
| 3 | `DOC:543,631` | `soluGsp.gsp.sn26.release` | §1:9 method=release；§6:73 省写 | `API …release`：spec=T v1=T **contract=F** impl=T | **未覆盖**（字面） | 已覆盖（impl=T） |
| 4 | `DOC:382,412` | `admin.cert.upget` | §6:73 逐字登记；C 未登记独立路由 | `API …upget`：spec=T v1=T **contract=T** impl=T | 已覆盖（仅 bizMethod 枚举） | 已覆盖 |
| 5 | `DOC:382,412` | `admin.cert.userget` | §1:13 `/admin/cert/userget`（D-6）；§6:73 省写为 `upget\|userget` | `API …userget`：spec=T v1=T **contract=F** impl=T | **未覆盖**（字面；§1:13 有路径） | 已覆盖（impl=T） |

**差异 D-A1（核心）**：`api-contract.md:73` 用 `\|` 省写，语义覆盖 5 API，但 `result-verify.mjs:25` 的 `contract.includes(a)` 是**整串逐字**判定 → occupancy / release / userget 三行 `contract=false`。证据：`api-contract.md:73`、`result-verify.mjs:24-25`。
**差异 D-A2**：`result-verify.mjs:63` 的 `gaps` 判据含 `r.impl===false / r.v1===false / r.inSpec===false / r.inContract===false / r.inV1===false / r.inImpl===false`，**不含 `r.contract===false` 与 `r.spec===false`**（API 行的字段名恰为 `contract` / `spec`）→ 上述 3 个 `contract=false` 计入 report rows 但**不触发门禁缺口**。证据：`result-verify.mjs:63`、STATE.md:150（A3「字段名分叉」历史修复留痕）。本席只陈述口径事实，不判其优劣。
**差异 D-A3**：`admin.cert.upget` 在 C 仅 §6:73 枚举、无 `/admin/cert/upget` 路由（对比 §1:12-13 已登记 9 条 /admin 路由，含 userget）→ 标「不适用（银联发起方向，契约未设独立路由）」。证据：`api-contract.md:12-13,73`。

---

## 2. 9 公共头差异表

契约逐字登记：`api-contract.md:69`（`9 公共头 version/appType/appId/bizMethod/reqId/sign/signId/signMethod/signPubKeyCert(C)`）；签名串 `:71` 对应 `DOC:293-303`。本席实读确认 9 个头名在 `:69` 逐字全命中。

| # | 规范行号 | 头标识 | 条件 | 契约 §N | 机器断言 | 契约覆盖 | 机器断言覆盖 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `DOC:155` | version | M | §6:69、§6:71 签名串第 1 位 | RV:37 聚合 `/signPubKeyCert/` | 已覆盖 | **未覆盖**（无逐头断言） |
| 2 | `DOC:156` | appType | M | §6:69 | RV:37 聚合 | 已覆盖 | **未覆盖**（同上） |
| 3 | `DOC:157` | appId | M | §6:69、§6:71 签名串第 2 位、§1:19 body.appId 覆写裁决 | RV:37 聚合 | 已覆盖 | **未覆盖**（同上） |
| 4 | `DOC:158` | bizMethod | M | §6:69、§6:71 第 3 位、§1:9/§1:19 路径法唯一来源 | RV:37 聚合；RV:24-25 API 行 | 已覆盖 | 已覆盖（仅 bizMethod 维度） |
| 5 | `DOC:159,309` | sign | M | §6:69、§6:73（SM2 裸 R‖S 64B Base64） | RV:37 聚合；§10 K2 引 `:314` | 已覆盖 | **未覆盖**（sign 值无断言） |
| 6 | `DOC:160,310` | signId | M | §6:69、§10 K1 引 `:318`、`:102` | `compliance:K1`（RV:47）、§10 K1 | 已覆盖 | 已覆盖（K1 间接） |
| 7 | `DOC:161,311` | signMethod | M | §6:69、§6:73（SM3 userId 口径） | RV:37 聚合 | 已覆盖 | **未覆盖**（无断言） |
| 8 | `DOC:162` | reqId | M | §6:69、§6:71 第 4 位、§8:84-85 幂等/重试取新值 | RV:37 聚合；§8 parity 间接 | 已覆盖 | **未覆盖**（无逐头断言） |
| 9 | `DOC:163` | signPubKeyCert | **C**（非 M） | §6:69 标 `(C)` 与规范一致；§10 K1 讨论证书传递 | **RV:37 唯一聚合断言** `/signPubKeyCert/` | 已覆盖 | 已覆盖（唯一代理） |

**差异 D-H1**：9 头在契约侧 9/9 已覆盖；机器断言侧仅 `result-verify.mjs:37` 一条 `['9 公共头', /signPubKeyCert/, java, true]` 聚合代理（本席只读复算 `inV1=true / inImpl=true`），**无逐头、无 M/C 分档、无 String(N) 长度、无 urlEncode（DOC:163）断言**。证据：`result-verify.mjs:32-41`。
**差异 D-H2**：`DOC:163` 的 signPubKeyCert 为 **C**，契约 `:69` 亦标 `(C)` → 一致，属「已覆盖」正面证据；但 9 头中 8 个 M 的「M=不允许 null/空串」（`DOC:452`）在契约/断言层无对应校验条款 → 标未覆盖。

---

## 3. 58 个 M 行逐组差异清单（58/58 行全部纳入）

分组按规范原文章节/表；行号逐条列全，合计 58 行。**去重字段标识 20 个**（去掉图例行 `DOC:452` 的 "M"）：
`version, appType, appId, bizMethod, sign, signId, signMethod, reqId, regionCd, snCode, txnTime, orderId, mchntCd, barcode, data, code, msg, key, certId, encryptMethod`。

| 组 | 规范行号（逐行） | 字段 / 条件 | 契约 §N | 机器断言 | 契约覆盖 | 机器断言覆盖 |
| --- | --- | --- | --- | --- | --- | --- |
| G1 公共参数表 §4.2.2 | `:155 :156 :157 :158 :159 :160 :161 :162`（8） | 8 头 M | §6:69；§6:71 签名串；§10 K1/K2 | RV:37 聚合 + `compliance:K1`(:47)/`K2`(:48) | 已覆盖 | **未覆盖**（逐字段） |
| G2 encryptData 首次表 | `:327`（1） | data=M（同表 `:324-326` key/certId/encryptMethod 为 **C**） | §7:77「四子域全 M」 | 无字段级断言 | 已覆盖（§7:77 裁定口径） | **未覆盖** |
| G3 证书更新公共参数 | `:379 :380 :381 :382 :383 :384 :385 :386`（8） | 8 头 M（`:383/:384` 用更新前证书） | §6:69；§1:13 userget 路由；§10 K1 | RV:37 聚合 | 已覆盖 | **未覆盖**（逐字段） |
| G4 证书更新应答 | `:395 :396`（2） | code / msg M | §7:78（成功/失败码） | `冻结约束: 双成功码`(RV:33)、`compliance:K4`(RV:50) | 已覆盖 | 已覆盖（code）；**未覆盖**（msg） |
| G5 符号图例 | `:452`（1） | 「M = 必须填写，不允许 null/空串」 | §2:21 M/C/O/X 分档 | 无 | **不适用**（非字段定义，是符号约定） | 不适用 |
| G6 应答码通则 | `:466 :467`（2） | code / msg M（成功码 `0000000000`） | §7:78、§10 K4 | `compliance:K4`、`冻结约束: 双成功码` | 已覆盖 | 已覆盖 |
| G7 复合域 encryptData 全 M | `:512 :513 :514 :515`（4） | key / certId / encryptMethod / data 全 M | §7:77 逐字「四子域全 M」 | 无字段级断言 | 已覆盖 | **未覆盖** |
| G8 query 公共参数 | `:553 :554 :555 :556 :557`（5） | 5 头 M（无 sign/signId/signMethod，见 `:558` signPubKeyCert=C） | §6:69（9 头全集） | RV:37 聚合 | 已覆盖 | **未覆盖**（逐字段） |
| G9 query 请求 M | `:564 :565`（2） | regionCd / snCode M | §2:27-28（三 method 均 M） | 无字段级断言（仅 §2 文本 + D-3 漂移登记 `:116`） | 已覆盖 | **未覆盖** |
| G10 query 应答 M | `:572 :573`（2） | code（`200`）/ msg M | §7:78 双兼容 `0000000000` 或 `200` | `compliance:K4`、`双成功码` | 已覆盖 | 已覆盖 |
| G11 occupancy 公共参数 | `:584 :585 :586 :587 :588`（5） | 5 头 M | §6:69 | RV:37 聚合 | 已覆盖 | **未覆盖**（逐字段） |
| G12 occupancy 请求 M | `:595 :596 :597 :598 :600 :601`（6） | txnTime/orderId/regionCd/mchntCd/barcode/snCode M | §2:27-32 + §2:45「重点补齐均为 M」 | 无字段级断言（§11 D-3 `:116` 登记 per-method M 未落北向） | 已覆盖 | **未覆盖** |
| G13 occupancy 应答 M | `:616 :617`（2） | code / msg M | §7:78 | `compliance:K4`、`双成功码` | 已覆盖 | 已覆盖 |
| G14 release 公共参数 | `:628 :629 :630 :631 :632`（5） | 5 头 M | §6:69 | RV:37 聚合 | 已覆盖 | **未覆盖**（逐字段） |
| G15 release 请求 M | `:639 :640 :641`（3） | txnTime / regionCd / snCode M（**无 orderId**，与 `:30` 契约一致） | §2:27-29、§2:30 releaseOrderLookup | 无字段级断言 | 已覆盖 | **未覆盖** |
| G16 release 应答 M | `:648 :649`（2） | code / msg M | §7:78 | `compliance:K4`、`双成功码` | 已覆盖 | 已覆盖 |

合计：8+1+8+2+1+2+4+5+2+2+5+6+2+5+3+2 = **58 行**，与 `\| M \|` 字面计数一致。

### 3.1 规范侧正面一致（已覆盖，非差异）
- occupancy 请求 M 六字段、release 请求 M 三字段：契约 §2:27-32 / :45 逐字对应 `DOC:595-601` / `DOC:639-641`，「release 无 orderId」双向一致（`DOC:639-642` ↔ `api-contract.md:30`）。
- `DOC:608` isAiProd「0-是 1-否」↔ `api-contract.md:51`「0=是 1=否，方向不可反转」；`DOC:610` saleTm=C ↔ `api-contract.md:33` C；`DOC:678-687` 品类 A01-A06/B01-B03（B04 打码）↔ `api-contract.md:52` 白名单 9 项 + B04 默认不受理。

---

## 4. 其他实质差异（行号 ↔ §N ↔ 断言 三元组）

| # | 差异 | 规范行号 | 契约 §N | 机器断言 | 标签 |
| --- | --- | --- | --- | --- | --- |
| D-1 | **K4 的「规范原文」列未给 DOC 行号**：`api-contract.md:105` 写「:78 本契约 §7」，指契约自身而非 `.analysis/source-doc.txt`；双成功码的规范侧依据应为 `DOC:466`（`0000000000`）与 `DOC:572`（`200`） | `DOC:466,572` | §10 K4 `:105` | `compliance:K4`(RV:50) | **未覆盖**（规范行号缺） |
| D-2 | **K3 括注措辞与行号非逐字**：`api-contract.md:104` 写「:526（无占用状态查询接口）」，`DOC:526` 实为「未收到同步应答/异步通知时的异常处理方式」通则；「接口汇总仅 3 接口」的逐字依据更贴近 `DOC:540-543` | `DOC:526,540-543,672,674` | §10 K3 `:104` | `compliance:K3`(RV:49) | 已覆盖（行号命中实存行）/ **未覆盖**（括注逐字性） |
| D-3 | **encryptData 条件自相矛盾**：`DOC:324-326` key/certId/encryptMethod 标 **C**、仅 `:327` data=M；`DOC:512-515` 四子域标 **M**。契约 `§7:77` 采信「全 M」 | `DOC:324-327,512-515` | `api-contract.md:77` | 无 | **不适用**（规范自身矛盾，待银联；INTEL E6 `:27` 同类） |
| D-4 | **四 O 字段「规范通用定义 ↔ 接口逐字列示」口径差**：`transTm / txnAmt / discountAmt / salesModel` 在规范**通用业务数据元表**有定义（`DOC:478` 引言「各数据元的传递要求详见各报文接口」；`DOC:493` txnAmt / `:494` discountAmt / `:495` transTm / `:502` salesModel），但**三个接口的请求业务参数表均未逐字列示**（`DOC:564-566` query / `:595-610` occupancy / `:639-642` release）。契约 `§2:40-42` 按 Node 语义源登记为 occupancy 的 O 字段并标 D-1（Java 未端口，`§11:114`） | `DOC:478,493-495,502,564-566,595-610,639-642` | `api-contract.md:40-42,54,114` | 无（RV 无字段级断言） | **已覆盖**（规范通用定义 + 契约 §2 登记）/ **未覆盖**（机器断言：无字段级） |
| D-5 | **长度口径冲突**：mchntCd `DOC:598` String(24) ↔ `api-contract.md:31` 1..128；reqReserved `DOC:482/602` 1024/2048 ↔ `:34` 1..2048；cateCode `DOC:487` String(2) ↔ `DOC:607` String(32) ↔ `:38/:52` 白名单 | `DOC:482,487,598,602,607` | `api-contract.md:31,34,38,52` | 无 | **不适用**（INTEL E3/E9 `:24,30` 待外部确认，不虚构裁定） |
| D-6 | **§10 K1/K2 行号逐字命中，K1 现状措辞滞后**：`api-contract.md:107` 仍写「K1 当前实现为单值 signId…已登记缺口（TK-47-02 派后端）」；STATE.md:163 记该缺口已闭合。属契约版本行陈述与账本状态的时间差（本席不改契约，只登记） | `DOC:365,318` | `api-contract.md:102,107` | `compliance:K1`(RV:47) | 已覆盖（断言侧）/ **未覆盖**（:107 陈述与 STATE 不一致） |
| D-7 | **规范条款未被契约/断言覆盖的成片区域**：证书有效期 ≤5 年 `DOC:364`、通知类 5 次/1-2-4-5 分/日切 `DOC:531`、KeepAlive ≤15s `DOC:150`、数据元 camelCase `DOC:447`、未知数据元丢弃 `DOC:537`、错误原因表 `DOC:657-674`、附录 A.4 遮蔽项 `DOC:687` | 见左列 | 部分见 §7:78（UP/IS/AC/ID/PD/OT）、§8、§5:65 | `冻结约束: store-forward…`(RV:35-38)、`parity:*`(RV:54-62) | **不适用**（非「5 API / 9 头 / 58 M 行」三项验收面；INTEL 已另立 11 条约束 `:8-18`） |

---

## 5. 差异汇总（按三类）

| 标签 | 计数口径 | 主要项 |
| --- | --- | --- |
| **已覆盖** | 契约层面：5 API 语义 5/5、9 头 9/9、58 M 行中契约 §2/§6/§7 有对应条款的行 | §1:9/:73、§2:27-45、§6:69-73、§7:77-78、§10:102-105；`compliance:K1~K4`、`冻结约束: 双成功码/COMM_FAILURE/9 公共头` |
| **未覆盖** | ① 3 个 bizMethod 契约字面未逐字登记（D-A1）且不判 gaps（D-A2）；② 9 头/58 M 行无逐字段机器断言，仅 1 条聚合代理（D-H1）；③ K4 缺 DOC 行号（D-1）；④ K3 括注非逐字（D-2）；⑤ 四 O 字段无字段级断言（D-4，规范通用定义见 :493-495,502）；⑥ `:107` K1 陈述滞后（D-6）；⑦ msg/sign/signMethod 等 M 字段无断言 | `result-verify.mjs:25,37,63`；`api-contract.md:40-42,73,104,105,107` |
| **不适用** | 图例行 `:452`、encryptData 条件矛盾（D-3）、长度口径待银联（D-5）、成片非验收面条款（D-7）、upget 无独立路由（D-A3）、E1~E12 外部确认项 | `DOC:452,324-327,364,531,687`；`INTEL:20-31` |

**结论**：契约 v1.3 对「5 API / 9 公共头 / 58 个 M 行」在**条款语义层面**覆盖完整（§1、§2、§6、§7、§10 可逐条指认）；**机器断言层面**存在成片粒度缺口——`result-verify.mjs` 对 API 用「整串 includes」且 `contract` 列不进 `gaps` 判据，对 9 头/58 M 行仅一条 `/signPubKeyCert/` 聚合代理，无字段级 `spec→§N→assertion` 三元组。§10 的 K1~K4 是唯一具备完整三元组的条款组，其中 K3/K4 的行号/措辞仍有 D-1/D-2 两处可核查偏差。以上均为只读复核结论，不含实现修改建议以外的代码改动，未修改任何契约或治理文件。

---

## 6. 证据索引（全部 file:line）

- 规范：`.analysis/source-doc.txt:150,155-163,293-319,321-327,364-365,379-386,395-396,445-474,505-515,531,537,540-543,553-565,572-575,584-611,616-619,628-651,657-687`
- 契约：`docs/arch/api-contract.md:3,9,12-13,18-19,21-45,47-65,67-80,82-93,95-108,110-127`
- 机器断言：`packages/dsh-quanneng-squad/scripts/result-verify.mjs:20-25,32-43,45-52,54-63`
- 情报/账本（只读引用）：`docs/squad/intel/SN26-约束清单-2026-11-11.md:8-18,20-31`；`docs/squad/STATE.md:150,161,163,182,183,187`；`docs/squad/briefs/round-55.md:13`
