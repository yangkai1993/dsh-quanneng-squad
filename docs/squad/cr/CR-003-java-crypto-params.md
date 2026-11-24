# CR-003 · Java 侧国密参数绑定缺陷（阻塞级）

签发：总指挥（2026-11-11）。发现：采风官 S-1（docs/squad/intel/SN26-约束清单-2026-11-11.md）。复核：总指挥独立实跑复现，逐条附代码位置。

## 结论

**Java 基线当前无法与银联互通。** 此前「Java 18/18 全绿」的验收结论被高估：单测只做 Java 自洽往返（同参数自签自验），无法暴露参数绑定错误。跨实现互操作（与 Node 参考实现互为签验）零覆盖。

## 缺陷清单

| # | 严重度 | 位置 | 事实（实测） | 应为 |
| --- | --- | --- | --- | --- |
| D1 | blocker | crypto/GmCryptoService.java〔退役〕 | sm2SignRaw 收下 userId 参数但方法体从未使用；:41 注释自认「BC uses default userID 1234567812345678」。全文件 ParametersWithID/UECParametersID 命中数 0 | 用 BC 的 ParametersWithID(私钥, new UECParametersID(userIDBytes)) 使 ZA 按规范取证书序列号十进制 |
| D2 | blocker | crypto/SignatureService.java〔退役〕 | 第三个入参传的是 version（值 "1.0.0"），signId 虽在 :19 声明但从未进入签名路径 | 传 SM3 userID = 证书序列号十进制字符串（与 signId/规范一致） |
| D3 | blocker | crypto/EncryptData.java〔退役〕 | 用签名原语 sm2SignRaw 包裹 SM4 一次性密钥；GmCryptoService 全文无 sm2Encrypt/sm2Decrypt（10 个 public 方法中 0 个加密接口） | SM2 C1C3C2 加密包裹会话密钥，接收方以加密证书私钥解密 |
| D4 | high | resources/application.yml〔退役〕 vs 无消费代码 | 配置有 degrade: fail-closed，但 src/main/java 全量检索无 failClosed 消费点 | 降级策略必须被真实读取并在异常路径生效（规范 fail-closed） |

## 复现证据（本地，无需外部服务）

- ZA 语义差异实测（Node 参考实现，同一密钥对）：`sm2Sign(msg,k,888888)` 与 `sm2Sign(msg,k,1234567812345678)` 输出不同；且以前者签名、以后者 userID 验签 = **false**，同 userID 验签 = true。即 userID 不一致必然验签失败。
- 双栈对照：Node 侧 src/crypto/sm2.js 的 computeZA(pub, userId) 正确使用显式 userId，provider.js 5 处传 userId，并有真实 sm2Encrypt/sm2Decrypt（src/gateway.js 11/11 通过）。**缺陷是 Java 单方面偏离**，不是规范歧义。
- 影响面：北向 SnController.java、入站验签 SignatureService.java、敏感域 EncryptData.java 均在该链路上，任一条都会导致银联侧拒绝（D1/D2 为验签失败，D3 为密钥不可解）。

## 门禁补强（必须与修复同批落地）

现有测试无法再漏掉同类问题：
1. 跨实现互操作测试：Java 签名 → Node 验签、Node 签名 → Java 验签（固定密钥向量 + 固定 userID）。
2. userID 敏感断言：同一消息、不同 userID 必须产出不同签名，且跨 userID 验签必须失败。
3. 密钥包裹往返：seal 后必须能用加密证书私钥 unwrap 还原明文（当前完全无此测试）。
4. fail-closed 行为测试：上游异常/超时路径必须落到拒绝而非放行。

## 派工（写域互斥，按 C2 每轮 ≤3）

| 卡 | 席位 | 写域 | 必产物 | 出门门 |
| --- | --- | --- | --- | --- |
| D-a | 后端经理 | gateway-java/src/main/java/com/unionpay/tradein/crypto/ | D1~D3 修复 + 单测 | 互操作与 userID 断言全绿 |
| D-b | 后端经理 | gateway-java/src/main/resources/ + 消费点所在类 | D4 修复 | fail-closed 行为测试通过 |
| D-c | 测试经理 | gateway-java/src/test/java/ + docs/qa/ | 跨栈互操作用例矩阵 | 4 类门禁用例齐备且实跑 |
| D-d | 御史大夫 | docs/squad/audit/ | 独立复现复核（不信自报） | 逐条对代码行号复核 |

> 纪律：D1/D2 属「参数收下但没用」这一类静默失效，任何「入参存在即认为已生效」的验收都要判不合格。


> 退役声明（2026-11-23）：Java gateway 演练对象已从工作区剥离，本文 Java 侧指针转为退役留痕，语义裁决以 Node 权威源为准。
