# 范围外清单（OUT-OF-SCOPE · B1 · 2026-11-23）

> 依据 mattpocock/skills SCOPE.md 纪律：被拒绝的方向逐项留痕，防止同一提议反复回来。
> 新增条目须写明「Observed failure/提议内容/拒绝理由/裁决日期」。本文件由总指挥维护。

## 1. 修改宪法层（CONSTITUTION.md C1~C10 由自动化或成员直接改写）
- Observed failure：无（预防性条目）。
- 拒绝理由：宪法层永不自动变更（C1 自身）；修宪必须用户明示批准并全文留痕。
- 裁决：2026-11-23 总指挥，随 ROADMAP 一期落地。

## 2. 回钉模型（任何层硬编码 provider/model 字面量）
- Observed failure：v1.5.x 清 16 成员钉 glm-5.3-flash、钉 our-free-model 两次复发（G-REFLOW P15 立案）。
- 拒绝理由：P15「不限制模型」红线（用户原话规约 USER-ORIGINAL-PROMPT.md:17）；ruflo "Agent=Model+Harness" 与 wshobson Model tiers（生成期映射零字面量）业界双背书。路由建议层（四期 A5）只建议不钉死。
- 裁决：2026-11-19 P15 立案；2026-11-23 收编为 OUT-OF-SCOPE 永久条目。

## 3. 外部看板 UI（edict 式 Web 军机处/Dashboard）
- Observed failure：无（对标采风时的吸引力条目）。
- 2026-11-23 拒绝理由：插件形态=零外部依赖+本地文件真源；Web 服务改变部署形态、破坏 doctor/upgrade 链。
  观测需求由 L5（hub/rank/pulse:board 三态徽章）在 CLI 内满足。裁决：总指挥。
- **〔解封留痕 2026-11-24〕**：用户明示批准 Web 看板入插件（"需要开工，还需要 Web 看板"）。
  裁决口径修订：解封范围=**零依赖本地静态实现**（node 内置 http.server + 单页静态 HTML，数据源=实测文件读数，
  不引入 npm 依赖、不改 doctor/upgrade 链、端口仅本机回环）；重型 Web 框架/外部依赖仍属本条范围外。
