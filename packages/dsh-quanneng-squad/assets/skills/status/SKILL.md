---
name: status
description: Squad skill. Use when the user asks how the squad is doing, its model routing, or overall health.
---

# status · 一条命令看全貌

> 渐进披露：本页只放「是什么 / 何时用 / 一条命令」；细节见 references 列出的真源文件。

## 是什么

一条命令看全貌——属于全能编程小队插件的日常技能。

## 何时用

当用户问小队状态、当前模型路由或整体健康时使用。

## 一条命令

```bash
node scripts/squadctl.mjs ux:status
```

## 细节真源

scripts/ux/status.mjs；scripts/observability/hub.mjs
