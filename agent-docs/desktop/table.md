---
title: "UTable - 表格"
description: "用 defineTableColumns 定义列，data 提供行数据；列插槽名为 column:key"
keywords:
  - UTable
  - @veltra/desktop
  - table
  - Table
  - 表格
aliases: ["table", "UTable", "Table", "表格"]
---

## 快速上手

```ts
import { UTable } from '@veltra/desktop'
```

## 典型示例

`UTable` 用 `data` 与 `columns`。`defineTableColumns(columns, commonProps?)` 会按 DFS 把 `align` / `minWidth` 合并到尚未设置的列上。多选需要 `checkable` 与 `rowKey`，用 `v-model:checked`。树形把 `tree` 设为 `true` 或子节点字段名。自定义单元格用 `#column:{key}`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { defineTableColumns } from '@veltra/desktop'

const checked = shallowRef<Record<string, unknown>[]>([])
const columns = defineTableColumns(
  [
    { key: 'name', name: '姓名', width: 120, fixed: 'left' },
    { key: 'age', name: '年龄', align: 'center' },
    { key: 'action', name: '操作', align: 'center' }
  ],
  { minWidth: 80 }
)
const data = [
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
]
</script>

<template>
  <u-table row-key="id" checkable border :columns="columns" :data="data" v-model:checked="checked">
    <template #column:action="{ rowData }">
      <u-button text type="primary">编辑 {{ rowData.name }}</u-button>
    </template>
  </u-table>
</template>
```

树形表示例：

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称' },
  { key: 'role', name: '角色' }
])
const data = [
  { id: 1, name: '技术部', role: '部门', children: [{ id: 11, name: '张三', role: '工程师' }] }
]
</script>

<template>
  <u-table tree row-key="id" default-expand-all :columns="columns" :data="data" />
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export type RenderReturn =
  (undefined | VNode | string | null | number)[] | undefined | VNode | string | null | number

export type Forest<T = any> = T[]

export type TreeNode<T = any> = T

import type { ShallowRef, Slots, VNode } from 'vue'

export type TableColumnAlign = 'left' | 'center' | 'right'

/**
 * 合计上下文
 */
export interface TableSummaryContext {
  /** 总数 */
  total: number
  /** 所有行数据 */
  rows: TableRow[]
  /** 多选选中的行，这是一个集合 */
  checkedRows: Set<TableRow>
  /** 当前列 */
  column: TableColumnNode
}

export interface TableColumn {
  /** 列的唯一键 */
  key: string
  /** 列的名称 */
  name: string
  /** 表头渲染，优先级大于name属性 */
  nameRender?: (ctx: {
    column: TableColumnNode
  }) => VNode | string | null | undefined | (VNode | string | null | undefined)[]
  /** 列最大宽度 */
  width?: number
  /** 列最小宽度 */
  minWidth?: number
  /**
   * 列固定方式，为嵌套表头时此值无效
   * @default 'left'
   */
  fixed?: 'left' | 'right'
  /**
   * 表头对齐方式, 如果没有指定，则默认使用align属性
   * @default TableColumn['align']
   */
  headerAlign?: TableColumnAlign
  /**
   * 列对齐方式
   * @default 'left'
   */
  align?: TableColumnAlign
  /** 列渲染 */
  render?: (scope: TableColumnRenderContext) => RenderReturn
  /** 子列 */
  children?: TableColumn[]
  /** 表尾合计 */
  summary?: boolean | ((ctx: TableSummaryContext) => RenderReturn)
  /** 是否可调整列宽 */
  resizable?: boolean
  [key: string]: any
}

/** 表格组件属性 */
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

export interface TableRow extends TreeNode<Record<string, any>> {
  /** 是否展开 */
  expanded: boolean
  /** 操作中 */
  operating: boolean
  /** 是否选中 */
  checked: boolean
  /** 是否为当前点击的行 */
  isCurrent: boolean
  /** id */
  uid: number | string
  /** 索引路径 */
  indexes: number[]
  /** 子row */
  children?: TableRow[]
  /** 父row */
  parent?: TableRow
  /** 是否为展开行 */
  isExpandRow: boolean
}

export interface TableColumnNode extends TreeNode<TableColumn> {
  /** 子列 */
  children?: TableColumnNode[] | undefined
  /** 父列 */
  parent?: TableColumnNode
  /** 叶子节点数量 */
  leafs?: number
  key: string
  name: string
  align: TableColumnAlign
  width: number | undefined
  minWidth: number | undefined
  fixed: 'left' | 'right' | undefined
  isLastFixed: boolean
  isFirstFixed: boolean
  style: Record<string, number>
}

/**
 * 列渲染函数参数上下文
 */
export interface TableColumnRenderContext {
  /** 行 */
  row: TableRow
  /** 行数据 */
  rowData: Record<string, any>
  /** 列节点 */
  column: TableColumnNode
  /** 单元格数据 */
  val: any
}

/** 表格列插槽作用域 */
export interface TableColumnSlotsScope extends TableColumnRenderContext {
  /** 交互模型 */
  model: { modelValue: any; 'onUpdate:modelValue': (val: any) => void }
}

export interface TableRowSlotsScope {
  row: TableRow
  rowData: Record<string, any>
  columns: TableColumnNode[]
  index: number
}

/** 表格组件定义的事件 */
export interface TableEmits<DataItem extends Record<string, any> = Record<string, any>> {
  /** 多选 */
  (e: 'update:checked', value: DataItem[]): void
  /** 单选 */
  (e: 'update:selected', value: DataItem | undefined): void
  /** 行数据更新 */
  (e: 'update:rows', rows: TableRow[]): void
  /** 树形数据森林结构更新 */
  (e: 'update:forest', rows?: Forest<Record<string, unknown>, any>): void
  /**
   * 行点击事件
   */
  (e: 'row-click', row: TableRow, ev: MouseEvent): void
  /** 单元格点击 */
  (e: 'cell-click', row: TableRow, column: TableColumn, ev: MouseEvent): void
  /** 当前行变更 */
  (e: 'update:current', row?: TableRow): void
}

/** 表格组件暴露的属性和方法(组件内部使用) */
export interface _TableExposed {
  el: ShallowRef<HTMLElement | undefined>
  /** 清除选中的项 */
  clearChecked: () => void
  /** 清除单选的选项 */
  clearSelected: () => void
  /** 通过数据获取表格行 */
  getRowByData: (data: Record<string, any>) => TableRow | undefined
  /** 获取合计行 */
  getSummaryRow: () => Record<string, any>
}

/** 表格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableExposed = DeconstructValue<_TableExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### defineTableColumns

为列树批量合并 `align`、`minWidth` 等公共属性（DFS，不覆盖列上已有值）。

使用示例:

```ts
import { defineTableColumns } from '@veltra/desktop'
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
