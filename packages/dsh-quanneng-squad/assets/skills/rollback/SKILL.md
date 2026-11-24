---
name: rollback
description: Squad skill. Use when an upgrade failed or the user wants to restore a previous backup.
---

# rollback · 回滚历史备份

> 渐进披露：本页只放「是什么 / 何时用 / 一条命令」；细节见 references 列出的真源文件。

## 是什么

回滚历史备份——属于全能编程小队插件的日常技能。

## 何时用

当升级出错或用户想恢复历史备份时使用。

## 一条命令

```bash
node scripts/squadctl.mjs rollback
```

## 细节真源

scripts/delivery/rollback.mjs；无备份 fail-closed
