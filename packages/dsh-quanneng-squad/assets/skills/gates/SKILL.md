---
name: gates
description: Squad skill. Use when a gate blocks work and the user asks what it means or how to proceed properly.
---

# gates · 九门门禁族

> 渐进披露：本页只放「是什么 / 何时用 / 一条命令」；细节见 references 列出的真源文件。

## 是什么

九门门禁族——属于全能编程小队插件的日常技能。

## 何时用

当某门阻断工作，用户问其含义或如何合规推进时使用。

## 一条命令

```bash
node scripts/squadctl.mjs gate:<name>
```

## 细节真源

gate-kit.mjs 统一 runGate/failFast；EXEMPTIONS.md 豁免流程
