# 骨架：迁移

适用于大版本破坏性变更，一个大版本一篇，放 `agent-docs/troubleshooting/migration-v<N>.md`。`## 新旧对照` 表的两列都写源码原样的标识符，AI 会按旧名搜到本篇。`<>` 为占位符；章节名不得改动，章节要求见 [../doc-standards.md](../doc-standards.md)。

````markdown
---
title: <库名> v<N> 迁移指南
description: 从 v<N-1> 升级到 v<N> 的破坏性变更、迁移步骤与新旧 API 对照。
aliases: [升级, migration, breaking changes]
keywords: [<被移除的 API>, <新 API>, <改名前>, <改名后>]
---

# <库名> v<N> 迁移指南

<一段：影响范围、是否可自动迁移。>

## 破坏性变更

- `<旧 API>` 移除，改用 `<新 API>`：<行为差异一句话>

## 迁移步骤

1. <动作>：

   ```bash
   <完整命令>
   ```

## 新旧对照

| v<N-1> | v<N> | 说明 |
| --- | --- | --- |
| `<old>` | `<new>` | <差异> |
````
