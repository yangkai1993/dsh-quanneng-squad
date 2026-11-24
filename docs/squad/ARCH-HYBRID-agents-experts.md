# 组合架构 v2.14 · 多智能体执行层 + 专家团知识层

> 触发：用户「如果多智能不可以那就拆分成多智能体和专家团组合的形式，尽可能迭代至好用，用实际项目验证，出问题自纠正」。
> 本文基于 **2026-11-06 宿主实测**，不是叙述推演。

## 一、先说实测结论：专家团通道当前不可作执行体

| 探测 | 结果 |
| --- | --- |
| `list_experts({})` / `list_expert_teams({})` | `total:0` / `[]`，注册表空 |
| `summon_expert` 8 个内置专家（CEO / UX Architect / GaussDB / Embedded Linux / Tax / Roblox / X / Weixin…） | 全部 `expert "..." is disabled` |
| `propose_custom_expert` | 能生成草案（3 个 proposalId + actionLink），但 `summon_expert` 报 `No expert matched`，`list_experts` 仍 0 → **草案需 UI 点击确认才入册**，本会话无人点 |
| `propose_expert_team` | 要求 `members[].expertSlug` 指向**已入册**专家 + `duty` + `instructions` + `constraints` 且 ≥2 成员；因专家库空恒失败 |
| 合法 division | `engineering / research / security / testing`（中文「安全/工程/质量」报「分类不存在」） |
| `open_expert_team_editor` | 「当前没有待保存的专家团队草案」 |

**结论：不能把专家团当第二套执行通道。** 硬凑只会得到一堆永不生效的草案。

## 二、组合架构（可落地、不依赖宿主升级）

```
                    ┌─────────────────────────────────────┐
                    │  专家团知识层（落盘、可版本、可复用）  │
                    │  expert-packs/<domain>/              │
                    │   EXPERT.md（角色/prompt/检查清单）   │
                    │   CHECKLIST.md（逐条可断言）          │
                    │   EVIDENCE.md（file:line 模板）       │
                    └──────────────┬──────────────────────┘
                                   │ 派活时注入（squads_run_member task 内嵌 pack 路径）
                                   ▼
┌────────────────────────────────────────────────────────────────┐
│ 多智能体执行层（唯一执行体，已验证可用）                        │
│  编制 16 常驻 squads_run_member（不受 cap）                     │
│  team 8 席换班 W1~W4（remove 释放 / 别名绕开名字占额）          │
│  回收：docs/squad/inbox/<中文名>.md + agent_teams_send_message   │
└──────────────┬─────────────────────────────────────────────────┘
               ▼
        真实项目改动 + mvn test / node --test 验证
               ▼
        失败 → 自纠正回路（见 §四）
```

### 为什么这样反而更好用
1. 专家知识**可版本、可 diff、可复用**：不再是「召唤一次就消失」的会话。
2. 不受 `summon_expert` disabled 影响：知识以文件形式注入任意成员任务书。
3. 与小队 16 编制完全兼容：每个 pack 映射到 1~N 个角色（见下表）。
4. 换班时 pack 跟着轮次走，不会出现「专家在但席位没了」。

## 三、专家包 → 小队角色映射（首批 4 包）

| 专家包 | 领域 | 对应小队角色 | 用途 |
| --- | --- | --- | --- |
| `expert-packs/crypto-security/` | security | 御史大夫、架构经理、后端经理 | 国密/签名/encryptData/脱敏等保审查 |
| `expert-packs/springboot-gateway/` | engineering | 后端经理、架构经理 | Java 基线实现与 CR 影响面 |
| `expert-packs/protocol-qa/` | testing | 测试经理、后端经理 | EARS 负向/RSA2/审计断言 |
| `expert-packs/governance/` | research | 给事中、考功郎中、起居注官、太傅 | 科抄/度量/票拟/记注 |

每包 3 个文件：`.md` 角色 prompt、`.md` 检查清单、`.md` 证据模板。派活任务书写「第一动作读 expert-packs/xxx/EXPERT.md 并按 CHECKLIST.md 逐条对表」。

## 四、自纠正回路（用户要求「出现问题请自纠正」）

```
1. 每轮结束回收：read inbox/rerun + 跑验证命令（mvn test / node --test）
2. 断言失败或抽巡报「不符合」 → 记入 docs/squad/audit/SELF-CORRECTION.md（问题/证据/归因）
3. 归因到：① 专家包检查清单缺项 → 补 pack ② 任务书落点冲突 → 改 dispatch ③ 席位/别名 → 改 ROSTER ④ 代码缺陷 → 派回实现班
4. 重派 ≤3 轮（宪法 C6），第 4 轮升级上报用户
5. 复验通过后 journal 记注「自纠正闭环」，PIPELINE.md 记一次金丝雀样本
```

## 五、验证项目（本轮实做，不停留叙述）
**SN26 Java 网关 6 条安全整改**（御史 rerun/10-patrol.md 出具）：
1. A15 全掩码 + HMAC 索引 Java 端接线（当前零实现）
2. 禁回显 canonical/body/headers，补 headers_sanitized/body_sanitized 审计
3. KMS/HSM 替换临时 KeyPair（沙箱先做可插拔接口）
4. encryptData 四子域信封
5. EARS 负向 / RSA2 用例
6. `/admin/*` + mtls/jwt + 限流

验收口径：`gateway-java/ mvn test` 用例数 >9、exit 0；旧 Node 11/11 不回退；抽巡三值从「不符合」升到至少「部分符合」。

## 六、若未来宿主启用专家团
`expert-packs/` 的 EXPERT.md 可直接作为 `propose_custom_expert` 的 `prompt` 字段、CHECKLIST.md 作为 `deliveryRequirements`，无重写成本。当前不阻塞。
