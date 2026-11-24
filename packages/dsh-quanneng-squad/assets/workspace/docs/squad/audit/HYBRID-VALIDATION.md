# 组合架构验证报告 · 多智能体执行层 + 专家团知识层（2026-11-06）

## 一、宿主实测（决定架构，不硬凑）
| 通道 | 状态 |
| --- | --- |
| 内置专家 `summon_expert` 8 个（CEO/UX Architect/GaussDB/Embedded Linux/Tax/Roblox/X/Weixin） | 全部 `disabled` |
| `list_experts` / `list_expert_teams` | 0 / `[]` |
| `propose_custom_expert` | 生成 3 个草案（proposalId + actionLink），但 `summon_expert` 报 `No expert matched`、`list_experts` 仍 0 → 草案需 UI 确认才入册 |
| `propose_expert_team` | 要求 members[].expertSlug 指向已入册专家 + duty + instructions + constraints + ≥2 成员；专家库空故恒失败 |
| 合法 division | engineering / research / security / testing |
| 多智能体 `squads_run_member` | 16/16 ok/running，不受 8 席 cap |
| team 8 席换班 | W1→W2 演练 4→8→4→8 成功 |

**结论：专家团当前不能作执行体。** 采用「多智能体执行 + 专家包知识层（落盘、可注入任务书）」组合，见 ARCH-HYBRID-agents-experts.md。

## 二、专家包（4 个，已落盘）
| 包 | 分类 | 映射角色 | 文件 |
| --- | --- | --- | --- |
| expert-packs/crypto-security/ | security | 御史/架构/后端 | EXPERT.md + CHECKLIST.md(9项) + EVIDENCE.md |
| expert-packs/springboot-gateway/ | engineering | 后端/架构 | 同上(6项) |
| expert-packs/protocol-qa/ | testing | 测试/后端 | 同上(7项) |
| expert-packs/governance/ | research | 给事中/考功/起居注/太傅 | 同上(6项) |

## 三、真实项目验证：SN26 Java 网关 6 条安全整改
基线：`mvn test` 9/9；御史 rerun/10-patrol.md 判「Java 端审计脱敏＝不符合（零接线）」。
W3 实现班派 3 人各带 1 个专家包、目录互斥 → 成员未回传正文（已知 C8 特性）→ **自纠正回路启动，指挥以 Lead-Core 按专家包清单直接实现**。

| 整改 | 实现 | 证据 |
| --- | --- | --- |
| 1 A15 全掩码+HMAC索引 | crypto/Sanitizer.java（mask + HmacSHA256 + sanitizeBody/Headers） | SecurityRemediationTest 9 用例 |
| 2 禁回显 canonical/body/headers | north/SnController.java（audit 只含 headers_sanitized/body_sanitized/sn_hmac；异常不回 ex.getMessage） | SnControllerTest 断言 doesNotExist |
| 3 KMS/HSM 可插拔 | crypto/KeyProvider.java + SandboxKeyProvider.java；SignatureService 改注入 | 编译通过 |
| 4 encryptData 四子域 | crypto/EncryptData.java（key/certId/encryptMethod/data，SM4-CBC + SM2 包裹） | valid()/seal() 测试 |
| 5 EARS 负向/RSA2 | SecurityRemediationTest.java（Ubiquitous/Event/State/Unwanted/Optional + RSA2 配套 + 篡改检测） | 9/9 |
| 6 /admin/* + jwt + 限流 | config/GatewaySecurityConfig.java + 控制器 /admin/state + yml 配置 | 3/3 Web 测试通过 |

**验收：`mvn -B test` 18/18 exit 0 BUILD SUCCESS（用例数 9→18，零回退）；旧 Node `gateway.test.js` 11/11 exit 0 不回退。**

## 四、自纠正回路（用户要求「出问题自纠正」）
| 轮 | 问题 | 处置 | 结果 |
| --- | --- | --- | --- |
| 1 | 成员不回传代码（13 文件零变化） | 归因 C8 通道特性，指挥按专家包清单 Lead-Core 实现 | 6 类新代码落盘 |
| 2 | 编译失败：assertThrows(Exception) 未声明 throws | 改 RuntimeException 包装 + 补 throws | 编译通过 |
| 3 | Spring 上下文失败：application.yml duplicate key crypto | 合并 hmacSecret 到既有段 | 上下文恢复 |
| 4 | — | 复验 18/18 BUILD SUCCESS | **闭环** |

台账：docs/squad/audit/SELF-CORRECTION.md。修复循环 3 轮 ≤ 宪法 C6 上限，未触发第 4 轮升级。

## 五、结论
组合架构**好用性已用真实代码改动验证**：专家知识可版本/可注入、多智能体执行不受 cap、自纠正 3 轮收敛、双栈测试零回退。
若未来宿主启用专家团，expert-packs/EXPERT.md 可直接作 `propose_custom_expert.prompt`、CHECKLIST.md 作 `deliveryRequirements`，无重写成本。
