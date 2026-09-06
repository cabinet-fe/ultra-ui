---
title: "UTableEditor - 表格编辑器"
description: "用 v-model 绑定行数组，列插槽的 model 可直接绑到单元格控件"
keywords:
  - UTableEditor
  - @veltra/desktop
  - table-editor
  - TableEditor
  - 表格编辑器
aliases: ["table-editor", "UTableEditor", "TableEditor", "表格编辑器"]
---
## 快速上手

```ts
import { UTableEditor } from '@veltra/desktop'
```

## 典型示例

`UTableEditor` 内部复用 `UTable`，数据用 `v-model`（行对象数组）。列定义与表格相同，可用 `defineTableColumns`。单元格编辑用 `#column:{key}`，作用域里的 `model` 含 `modelValue` 与 `onUpdate:modelValue`，可 `v-bind` 到输入控件。组件会追加操作列（增删复制）。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄' }
])
const data = shallowRef([{ name: '张三', age: 28 }])
</script>

<template>
  <u-table-editor :columns="columns" v-model="data">
    <template #column:name="{ model }">
      <u-input v-bind="model" />
    </template>
    <template #column:age="{ model }">
      <u-number-input v-bind="model" />
    </template>
  </u-table-editor>
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface TableProps {
  size?: ComponentSize
  /** 表格数据 */
  data?: Record<string, any>[]
  /** 表格列 */
  columns?: TableColumn[]
  /** 多选时的已选项 */
  checked?: Record<string, any>[]
  /**
   * 单选时的已选项
   * @description 该属性需要指定rowKey来表示唯一性
   */
  selected?: Record<string, any>
  /**
   * 多选
   * @description 该属性需要指定rowKey来表示唯一性
   */
  checkable?: boolean
  /** 索引 */
  showIndex?: boolean
  /** 单选 */
  selectable?: boolean
  /**
   * 标记为一个树形组件
   * @default false
   * @description 如果传入了一个字符串则代表树的子节点的key值
   */
  tree?: boolean | string
  /**
   * 作用域插槽
   * @description
   * 使用此插槽可以自定义使用外部组件的插槽而无需一级一级的嵌套
   */
  slots?: Readonly<Slots>
  /** 单元格合并 */
  mergeCell?: (ctx: TableColumnRenderContext) => { rowspan: number; colspan: number } | undefined

  /** 当前点击的行 */
  current?: TableRow

  /**
   * 高亮当前点击的行，即使没有设置current属性
   * @default false
   *
   */
  highlightCurrent?: boolean
  /**
   * 行key
   * @description 用于标识行的唯一性，对于单选和多选来说是必须的
   */
  rowKey?: string

  /**
   * 是否开启斑马纹
   * @default true
   */
  stripe?: boolean
  /**
   * 是否开启边框
   * @default false
   */
  border?: boolean
  /**
   * 虚拟列表阈值
   * @default 80
   */
  virtualThreshold?: number
  /** 是否开启展开行, 只在非树形模式下有效 */
  expandable?: boolean
  /**  默认展开全部 */
  defaultExpandAll?: boolean
  /** 文本溢出省略 */
  textEllipsis?: boolean
}

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

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
