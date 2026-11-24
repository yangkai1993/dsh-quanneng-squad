# TRACE.md · 追溯矩阵（SN26 网关）

| 需求项 | PRD/设计 | 故事卡 | EARS 验收 | 实现文件 | 测试 | 门禁 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 规范签名串 5 元素顺序 + 一次序列化 | v1 §2 | (补卡) | Ubiquitous | src/contract.js, src/crypto/provider.js | gateway.test.js#canonical | G-S6 | 覆盖 |
| R2 SM2 裸 R‖S / SM3 / SM4 | v1 §2,§3 | (补卡) | Ubiquitous | src/crypto/sm2.js,sm3.js,sm4.js | crypto.selftest.js | G-S6 | 覆盖 |
| R3 encryptData 四子域 + 一次一密 | v1 §3 | (补卡) | Event-driven | src/crypto/provider.js | gateway.test.js#encryptData | G-S6 | 覆盖 |
| R4 验签先行 + map<signId,cert> | v1 §2,§4 | (补卡) | Unwanted | src/crypto/provider.js, src/core/orchestrator.js | gateway.test.js#provider | G-S6 | 覆盖 |
| R5 应答码三层归一化 / UNMAPPED 留痕 | v1 §7 | (补卡) | State-driven | src/protocol/response.js | gateway.test.js#response | G-S6 | 覆盖 |
| R6 幂等 + 乐观锁 + UNKNOWN 不重发 | v1 §6 | (补卡) | Unwanted | src/core/store.js,state.js,reconcile.js | gateway.test.js#state,stores | G-S6 | 覆盖 |
| R7 多中心 / gzip / 10s 超时 | v1 §5 | (补卡) | Unwanted | src/transport/client.js | gateway.test.js#upstream | G-S6 | 覆盖 |
| R8 A13 批量文件通道真实实现 | v1 §1 A13 | (补卡) | Event-driven | src/transport/filechannel.js | gateway.test.js#FileChannel | G-S6 | 覆盖 |
| R9 北向 / Mock / 反向接入 | v1 §5,§11 | (补卡) | Ubiquitous | src/north,mock,inbound/server.js | gateway.test.js#E2E | G-S6 | 覆盖 |
| R10 审计脱敏 | v1 §10 | (补卡) | Unwanted | src/crypto/provider.js#sanitize | gateway.test.js#E2E | G-S6 | 覆盖 |
| R11 小队治理资产落地 | 本轮 | (补卡) | Ubiquitous | AGENTS.md, squad-toolkit/, docs/squad/ | 本文件 + ROOT-CAUSE.md | G-S6 | 覆盖 |
| R12 提示词优化 | 用户反馈⑥ | clinic-2026-11-06 | Ubiquitous | docs/prompts/clinic-2026-11-06.md | PIPELINE-CHECK #1 | G-S2 | 覆盖 |
| R13 需求拆分 | 用户反馈⑥ | stories/SN26-001 | Event-driven | stories/SN26-001.md | gateway.test.js 11/11 | G-S2 | 覆盖 |
| R14 反馈优化闭环 | 用户反馈⑥ | CR-001 / P-002 | State-driven | docs/squad/cr/CR-001-tech-stack.md, retro-v1.0-pipeline.md, pipeline/P-002-* | PIPELINE-CHECK 11/11 | G-S2 | 覆盖 |
| R15 技术框架选择 | 用户反馈⑥ | ADR-001 | Unwanted | docs/arch/ADR-001-tech-stack.md | review-gate.md + patrol-SN26-001.md | G-S2(CONCERNS) | 覆盖 |

> S6 第一步核对：11/11 需求项均有实现与测试证据，无空档。
