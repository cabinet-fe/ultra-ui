---
title: "UTableEditor - 表格编辑器"
description: "UTableEditor 组件 API"
---

# UTableEditor - 表格编辑器

## 类型

```ts
import type { DeconstructValue } from '@veltra/utils'

import type { TableProps } from './table'

/** 表格型编辑器组件属性 */
export interface TableEditorProps extends Omit<TableProps, 'data'> {
  /** 表格数据 */
  modelValue?: any[]
}

/** 表格型编辑器组件定义的事件 */
export interface TableEditorEmits {
  (e: 'update:modelValue', value: any[]): void
}

/** 表格型编辑器组件暴露的属性和方法(组件内部使用) */
export interface _TableEditorExposed {}

/** 表格型编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableEditorExposed = DeconstructValue<_TableEditorExposed>
```

## 示例

见 `./examples.md`
