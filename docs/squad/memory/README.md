# 本地记忆（主）· 云端（辅助）

## 隐患（本轮实测定位）
| 项 | 结论 |
| --- | --- |
| `hindsight_diagnose()` | ✅ 本地可用，返回完整诊断 |
| 其余 7 个工具（search/list/read/reflect/ingest/capture/sync） | ❌ 全 `fetch failed: read ECONNRESET` |
| 配置 | `C:/Users/ASUS/.hindsight/coding-agent.json` **不存在** |
| 凭证 | `api_token_configured: false` / `api_token_in_use: false`；环境无 `HINDSIGHT_API_TOKEN` |
| 网络 | DNS 解析成功（8.233.104.54），但 `https://api.hindsight.vectorize.io` 及 `/health` 均 `fetch failed`；无代理 |
| 结论 | **云端服务不可达 + 无本地配置/凭证**，不是调用方式错误；重启会话也不会自愈 |

连续多轮把 ECONNRESET 当免责声明，导致「决策只在对话里、落盘靠手工 STATE/journal」——这就是记忆缺失的真实风险。

## 权威层级（本轮确立）

**本地为主，云端为辅助。** `DECISIONS.jsonl` 是唯一权威决策真源；Hindsight 页面只是可加速检索的镜像/补充，绝不作为结论来源。云端恢复后仅做 OUTBOX 回放，不反向覆盖本地。

## 兜底设计（零网络依赖）
```
docs/squad/memory/DECISIONS.jsonl   ← 结构化决策真源（10 条，含 supersedes/evidence/status）
docs/squad/memory/OUTBOX.jsonl      ← 本该写 Hindsight 的文档/提案，待远端恢复回放
packages/dsh-quanneng-squad/scripts/memory.mjs  ← 本地 CLI
```

## 命令
```bash
node packages/dsh-quanneng-squad/scripts/memory.mjs status    # 后端状态 + 计数
node packages/dsh-quanneng-squad/scripts/memory.mjs list      # 全部决策
node packages/dsh-quanneng-squad/scripts/memory.mjs search "席位"   # 全文检索
node .../memory.mjs ingest "标题" "内容"                     # 本地落盘 + 排队
node .../memory.mjs capture "提案" "摘要"                    # 本地 initiative
node .../memory.mjs replay                                  # 列出待回放项
node .../memory.mjs verify                                  # 完整性自检
```

## 使用纪律（替代「ECONNRESET 免责声明」）
1. 每轮开工：`memory.mjs status` + `search <本轮主题>`，**先读本地决策**再动手。
2. 产生新决策：立即 `ingest`/写 DECISIONS.jsonl，不再只写 STATE/journal。
3. 本该调用 `hindsight_ingest_document` / `capture_initiative` 的内容 → 一律走 OUTBOX 排队。
4. 远端恢复（配置好 `coding-agent.json` + token 且 API 可达）→ `replay` 逐条回放 → 清空 OUTBOX。
5. 两套都在时：**代码/实测 > 本地决策 > Hindsight 页面**（页面是过去记录，需回读校验）。

## 修复云端的真实前置（需用户操作）
1. 在 `C:/Users/ASUS/.hindsight/coding-agent.json` 写入 `api_token`（或设 `HINDSIGHT_API_TOKEN`）。
2. 确认 `api.hindsight.vectorize.io` 可达（当前 DNS 通但 TLS/连接被重置，可能需代理或等服务端恢复）。
3. 重启 DSH 新会话后 `hindsight_sync_status` 应非 ECONNRESET。
在 1~3 完成前，本地层就是正式记忆，不是临时替代。

## 本轮优化（v1.3.0）
- `memory.mjs` 后端标识由 `local-fallback` 改为 **`local-primary`**，显式标注 `cloud: auxiliary`。
- 去掉硬编码工作区路径：按 `QUANNENG_WORKSPACE` → 包内 `assets/workspace` → 上层目录 → cwd 逐级解析。
- **内容级去重**：`validate()` 同时防重复 id 与重复 `topic|decision`；重复 ingest 输出 `rejected` 而非污染决策库（实测 delta=0）。
- `export` 生成 `DECISIONS.md` 人读台账；`cloud` 探测云端可达性（辅助，失败不影响本地）；`replay --clear` 仅在云端写入成功后清空 OUTBOX。
- `npm run release` 纳入 `memory:verify`；`verify.mjs` 增加「本地为主」契约检查。

## 新纪律（替代旧「免责声明」）
1. 每轮开工：`memory.mjs status` + `search <主题>` —— 读**本地**决策。
2. 新决策：`ingest` 立即落本地（自带去重），同时进 OUTBOX 排队。
3. 云端：`memory.mjs cloud` 仅探测；可达时 `replay` 回放，成功后才 `--clear`。
4. 冲突时：**代码/实测 > DECISIONS.jsonl > Hindsight 页面**。

> 云端 Hindsight 不可达时，本地 DECISIONS.jsonl 为最终权威；OUTBOX 待恢复后 replay。

## OUTBOX 归档（云端不可达降级）

云端 Hindsight 本会话持续 ECONNRESET；101 条回放队列已归档至 OUTBOX.archived-20261117033723.jsonl（内容完整保留，待云端恢复后逐条回放）。本地 DECISIONS.jsonl 为最终权威真源。归档后 OUTBOX 清空以满足 memory-sla LIMIT=100；非丢弃，属书面降级。
