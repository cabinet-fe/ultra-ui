---
title: "USheet - 电子表格"
description: "USheet 组件 API"
---

# USheet - 电子表格

## 类型文件

见 `packages/sheet/src/types/sheet.ts`

## 示例

见 `./examples.md`

## 备注

宿主需给高度。填报用 `setCellReadonly` / `setRangeReadonly` 标记只读格，并隐藏工具栏与公式栏（`showToolbar` / `showFormulaBar` 设为 `false`）。模型与命令从 `@veltra/sheet-core` 导入，本包不 re-export。

## 辅助工具

本组件通常配合以下工具来使用。

### registerTool

向工具栏注册自定义工具；与 `USheet` 共用同一注册表。

使用示例:

```ts
import { registerTool } from '@veltra/sheet'
```
