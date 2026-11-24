# 独立复核 · 证书 5 年上界纠错（TK-68-04 · 第 68 轮 · t7）

复核人：御史大夫 ｜ 对象：`SandboxSignIdCertRegistry` 上界守卫修复 ｜ 结论：**PASS**
复核基线：`gateway-java/src/main/java/com/unionpay/tradein/crypto/SandboxSignIdCertRegistry.java`（mtime 2026-11-17T03:08:23Z）及其 `.bak-5year-fix`（mtime 2026-11-16T09:36:31Z）；测试同对。

## 1. .bak-5year-fix 对照（改了什么、为什么是漏洞）

| # | 位置 | 修复前（.bak） | 修复后（current） | 判定 |
| --- | --- | --- | --- | --- |
| 1 | Spring 构造器 :49-54 | `putChecked(...)` 整体包在 `try { } catch (Exception ignored) { }` 内 → 1826 越界异常被吞，容器带病启动 | try 只包 `generateSm2KeyPair()`；`IllegalArgumentException failClosed → throw failClosed` 原样重抛，其余环境异常才降级 | ✅ 吞异常漏洞已封死 |
| 2 | 私有 map 构造器 :77 | `this.certBySignId.putAll(entries)` 旁路守卫 | `entries.values().forEach(this::put)` 统一闸口 | ✅ putAll 旁路已封死 |
| 3 | `put()` :102-106 | 裸 `certBySignId.put(...)` 无检查 | 先 `checkUpperBound(e.signId(), e.notAfterEpochMs(), now)` 再入表；全类唯一写入点（grep `certBySignId.put\|putAll\|remove\|clear` 仅 :105 一处） | ✅ 唯一登记闸口成立 |
| 4 | 测试⑧ :141-150 | 反射调私有 `putChecked`（setAccessible），不经过真实 Spring 构造缝 | 直接 `new SandboxSignIdCertRegistry(gm, kp, ..., 1826L)` 真构造断言抛 IAE；1825 同缝 assertDoesNotThrow | ✅ 反射旁路移除，改真实构造路径 |

## 2. 1825/1826 负向实跑（surefire 实测，非源码文本断言）

命令：`mvn -o test -Dtest=SignIdCertRegistryTest` → exit 0，`Tests run: 8, Failures: 0, Errors: 0, Skipped: 0`。
`target/surefire-reports/TEST-com.unionpay.tradein.crypto.SignIdCertRegistryTest.xml` 逐条有耗时、无 skipped 节点：
- `certNotAfterDaysExceeds5YearsThrowsOnRegistration`（⑦，0.002s）：forTest 缝 1825 接受 + 1826 抛 IAE；
- `springConstructorAlsoGuardedBy5YearUpperBound`（⑧，0.002s）：Spring 构造缝 1825 正常启动 + 1826 启动抛 IAE。

边界算术核对：`checkUpperBound` 用 `notAfter - now > 1825*DAY_MS`（:59-63）。1825 天恰不越（严格大于才拒）；1826 天恒越，微秒级时钟漂移（构造内 now 与检查内 currentTimeMillis 之差 ~1e-6 天）不可能翻转结论。旧证路径 `putChecked(oldSignId, ...)` 在 try 之外（:46），配置 `old.notAfterDays>1825` 同样启动即拒——与intel #16「上界 1825 天」一致。

## 3. forTest 旁路封死

`forTest → 私有构造器 → forEach(this::put)`（:96-99, :77, :102-106）；`defaultRegistry` 同走私有构造器（:89）→ 全部三条登记缝（Spring 构造 / forTest / defaultRegistry）汇聚到唯一守卫闸口 `put()`。仓库内其余调用点（GS3RecheckFixesTest:171 用 defaultRegistry、SignatureService:38 用 defaultRegistry）均经守卫，无直接操作 `certBySignId` 的外部路径（字段 private，全类仅 :105 一处写入）。⑦ 用例 1826 拒绝断言即此缝的活体证明。

## 4. 无 @Disabled / 无跳过

- 全部 21 个测试 .java 扫描 `@Disabled|@Ignore|setAccessible|assumeTrue|assumeThat`：零命中（唯一近似命中为 HttpTotalBudgetTest:29 的 `catch (InterruptedException ignore)`，与门禁无关）。
- 全量 `mvn -o test`：`Tests run: 96, Failures: 0, Errors: 0, Skipped: 0`，BUILD SUCCESS，exit 0。零跳过即「无 @Disabled」的运行时对账。

## 5. 残留观察（不影响 PASS，报 captain 知悉）

1. `catch (Exception noSandboxKey)`（:54-56）吞密钥生成的一切异常：若 `generateSm2KeyPair` 抛出的是 IAE 之外的逻辑缺陷异常（如配置解析错），会以「新证缺席」降级而非启动失败。当前 GmCryptoService 生成路径只可能抛环境异常，风险低；建议后续轮次收窄为具体异常类型。
2. `build.log` 显示 11-16 曾有 `gates/Sm2Interop.java` 编译失败（bcprov 1.78.1 不含 `org.bouncycastle.asn1.gm.GMNamedCurves` 旧包位引用），本轮全量 `mvn -o test` 已通过，说明该探针现不在默认 testCompile 集或已修正——非本卡范围，不展开。
3. 工作区非 git 仓库（`git status` → not a git repository），对照只能靠 .bak 文件本身，符合本轮「.bak-5year-fix 对照」的验收设计。

## 6. 复核证据索引

- 对照差异：`SandboxSignIdCertRegistry.java.bak-5year-fix` ↔ 现文件（行级差异见 §1 表）；`SignIdCertRegistryTest.java.bak-5year-fix` ↔ 现文件（§1 #4）。
- 实跑日志：`gateway-java/target/surefire-reports/TEST-com.unionpay.tradein.crypto.SignIdCertRegistryTest.xml`（8/0/0/0）。
- 全量回归：`mvn -o test` exit 0，96/96 绿（本轮实测输出，临时日志已清理）。
- 环境：JDK 21.0.2（E:\DevTools\.jdks）+ Maven 3.9.9（E:\DevTools\apache-maven-3.9.9），离线 -o 全依赖本地仓库。
