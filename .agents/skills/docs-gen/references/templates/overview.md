# 骨架：总览（index.md）

每库一篇，路径固定 `agent-docs/index.md`。`## 模块速查` 的「文档路径」列是 AI 的路由表，必须与实际文件路径一致。`<>` 为占位符；章节名不得改动，章节要求见 [../doc-standards.md](../doc-standards.md)。

````markdown
---
title: <库名> 总览
description: <库名>是什么、包含哪些模块、每个模块对应的文档路径。
aliases: [<npm 包名或 Go module 路径>, <库别名>]
keywords: [<全部模块导出名>, 安装, 模块列表]
---

# <库名> 总览

<一段：库定位、包名、当前版本、运行时要求。>

## 安装

```bash
<包管理器安装命令>
```

## 模块速查

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| `<导出名>` | <一句话> | `components/<name>.md` |
| `<导出名>` | <一句话> | `apis/<name>.md` |
````
