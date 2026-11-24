# 自纠正台账 · 组合架构验证（2026-11-06）

| 轮 | 问题 | 证据 | 归因 | 处置 | 复验 |
| --- | --- | --- | --- | --- | --- |
| 0 | 御史抽巡：Java 端审计脱敏零接线，6 条整改 | docs/squad/rerun/10-patrol.md 三值=部分符合/符合/不符合 | 实现班未加载 crypto-security 专家包 | 本轮派活注入 expert-packs/crypto-security/EXPERT.md | 待 mvn test |

规则：断言失败/抽巡不符合 → 记本表 → 归因到 ①专家包缺项 ②任务书落点冲突 ③席位别名 ④代码缺陷 → 重派 ≤3 轮 → 复验通过后 journal 记注 + PIPELINE 记金丝雀样本。第 4 轮未收敛升级用户。
| 1 | W3 三成员派活后 gateway-java/src 13 文件零变化（成员不回传正文） | 派活 3/3 ok/running；文件清单与基线逐字节一致 | ②任务书落点冲突 → 实为 C8 通道特性：squads_run_member 单向激活，成员不写盘 | 按 ARCH-HYBRID §四 自纠正：指挥以 Lead-Core 按 expert-packs 三包清单直接实现 6 条整改，目录互斥 | 待 mvn test 用例数 >9 且 exit 0 |
| 2 | mvn test 编译失败：SecurityRemediationTest:58 未声明 throws Exception | COMPILATION ERROR / BUILD FAILURE | ④代码缺陷（新测试断言写法） | 把 assertThrows(Exception) 改为 RuntimeException 包装，方法去掉 throws | 待重跑 |
| 3 | mvn test 18 用例：9 新测试全过，SnControllerTest 3 个 ApplicationContext 失败 | SnakeYAML「found duplicate key crypto」application.yml:48 | ④代码缺陷：追加配置产生第二个 gateway.crypto 键 | 合并 hmacSecret 到既有段、删重复键 | 待重跑 |
