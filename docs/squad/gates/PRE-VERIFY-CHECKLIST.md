# 预验清单（Pre-Verify Checklist）· captain 验收前置

> 来源：第 60 轮 TK-60-01 实战误判——captain 预验只跑了 Node 门（result-verify 27/0 缺口 + verify 62/62）就判"实现已落盘且健康"，
> 但实际 mvn 全量 BUILD FAILURE（构造器签名变更未同步旧测试 → 编译错误 → 92 用例中 2 失败）。
> **教训：门全绿 ≠ 交付健康。跨语言变更必须跑对应语言的构建。**

## 按变更类型必跑

| 变更类型 | 必跑命令 | 漏跑后果（实测） |
| --- | --- | --- |
| Java 源码 | `cd gateway-java && mvn -o test` | 构造器签名变更未同步旧测试 → 编译失败 → 全量红 |
| Node 源码 | `node scripts/run-tests.mjs` | — |
| 治理/门禁脚本 | `node scripts/verify.mjs` + `npm run release` | 门禁自身损坏 |
| 契约/文档 | `node scripts/result-verify.mjs` + `node scripts/drift-check.mjs` | 章节断号/死指针 |

## 预验五问（逐条答，不许跳）

1. **编译过了吗？** 跨语言改动必看 mvn/编译输出，不只看单测计数。
2. **旧测试适配了吗？** 改了公开签名（构造器/方法签名）→ 找出所有调用点（`grep -rn "new X("`）。
3. **行为变更合理吗？** 新增安全拦截（如入站验签）会让旧的无签名直调测试从 5xx 变 4xx——这是**预期行为变更**，但旧测试必须显式适配并在断言里说明理由，不能默默改期望值。
4. **新测试自证吗？** 新增测试是否真的触达被测路径（例如"未知 signId → 403"必须让**请求真的发出**，而不是在签名前置辅助里就抛异常）。
5. **负向成立吗？** fail-closed 断言必须有"该拒的真的拒"+"该过的真的过"两条。

## 副产物：Maven 失败诊断法

- 编译错误优先看 `target/surefire-reports/*.txt` 与 `mvn` 的 `[ERROR]` 首个文件+行号。
- 编码乱码（中文路径/错误信息）时用 `chcp 65001` 前缀跑 mvn。
- 失败用例的栈顶三行即根因位置；`expected: <502> but was: <403>` 是行为变更信号，不是数值错误。

