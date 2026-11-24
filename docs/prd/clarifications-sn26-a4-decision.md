# A4 决策记录 · 技术框架基线（用户拍板）

> 〔重建留痕〕本文件原稿于 2026-11-23 工作区清理中被误删；现由总指挥依据 .dsh-project-memory 记忆索引（4 条分节摘要）与工作区现存证据（docs/arch/ADR-002-java-baseline.md、STATE.md、ledger.md）忠实重建。原始措辞以记忆快照为准，未捏造新结论。

| 项 | 值 |
| --- | --- |
| 决策 | **回到 Java 基线**（用户原话） |
| 日期 | 2026-11-06 |
| 决策人 | 用户（决策权永远在用户，太傅票拟不投票） |
| 推翻的对象 | ADR-001 的「采纳 A 纯 Node ESM」与 CR-001「追认现状」 |
| 依据 | `cordis.patch.yml` `squad-arch` persona：Java 17 + Spring Boot 3.x 为预设全栈基线；已交付 Node ESM 零依赖实现属契约级静默偏离，须显式拍板 |
| 落点 | `docs/arch/ADR-002-java-baseline.md`（新基线）；Node 实现归档 `docs/arch/LEGACY-NODE-ARCHIVE.md` |

## 约束与实测

| 项 | 实测 |
| --- | --- |
| JDK | OpenJDK 21.0.2（`E:/DevTools/.jdks/openjdk-21.0.2`），`javac --release 17` 可用 → 目标字节码 Java 17 |
| Maven | 3.9.9（`C:/Users/ASUS/apache-maven-3.9.9/bin/mvn.cmd`），JAVA_HOME 需显式注入 |
| Spring Boot | 3.5.16 已在本地仓库可用 |
| 国密 | Java 17 标准库无 SM2/SM3/SM4 → BouncyCastle |

## 影响面

- 契约 `src/contract.js` → Java `Sn26Contract`（常量 + buildCanonical）。
- 国密 `src/crypto/*.js` → BouncyCastle SM2/SM3/SM4。
- 北向 `src/north/server.js` → Spring MVC `@RestController`。
- 存储 `src/core/store.js` → JPA(MySQL) + Redis(Lettuce) 接口；沙箱可用内存实现。

> 注（2026-11-23）：gateway-java 已随工作区清理剥离（用户指令「只保留与全能小队插件相关文件」），Java 基线转为设计留痕；接口权威语义以 Node 侧 `src/*` 与 `docs/arch/api-contract.md` 为准（api-contract.md 头部退役声明）。

## 批准链状态

用户已拍板 = CR-002 第 4 步（总指挥批准）的前置条件满足；架构/产品会签、给事中科抄、御史预审、交付归档按 CR-002 逐项补齐。
