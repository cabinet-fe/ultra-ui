# UConditionEditor - 条件编辑器

## 简介

用于可视化编辑条件分组和条件表达式。

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## 辅助工具

本组件通常配合以下工具来使用。

### evaluateConditionExpression

对条件表达式 JSON 求值，与编辑器 UI 解耦的纯函数。

使用示例:

```ts
import { evaluateConditionExpression } from '@veltra/desktop'
```

### createEmptyGroup / createEmptyLeaf

创建空的条件分组或叶子节点。

使用示例:

```ts
import { createEmptyGroup, createEmptyLeaf } from '@veltra/desktop'
```
