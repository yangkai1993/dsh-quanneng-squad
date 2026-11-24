---
name: tokens
description: Squad skill. Use when the user asks about token lifecycle, stuck tokens, or the token state machine gate.
---

# tokens · 令牌状态机

> 渐进披露：本页只放「是什么 / 何时用 / 一条命令」；细节见 references 列出的真源文件。

## 是什么

令牌状态机——属于全能编程小队插件的日常技能。

## 何时用

当用户问令牌生命周期、卡死令牌或令牌状态机门时使用。

## 一条命令

```bash
node scripts/squadctl.mjs gate:tokens
```

## 细节真源

planned→dispatched→reported→accepted/rejected；lib/event-store.mjs
