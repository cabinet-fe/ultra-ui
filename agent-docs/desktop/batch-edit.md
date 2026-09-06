---
title: "UBatchEdit - 批量编辑"
description: "左侧表格加右侧表单；表单控件必须写 field，不要并用 v-model"
---

# UBatchEdit - 批量编辑

## 引入

```ts
import { UBatchEdit } from '@veltra/desktop'
```

## 示例

`UBatchEdit` 用 `v-model:data` 绑定行数组，`columns` 描述左侧表。`model` 是与右侧表单同步的对象。`#form` 里的控件必须写 `field`，不要再写 `v-model`。可用 `defineBatchEditColumns` 标注列类型。`features` 限制 `create` / `update` / `delete` / `view` / `createChild`。`quick-edit` 时编辑行会实时写回 `row.data`，不调用 `saveMethod`。

```vue
<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { defineBatchEditColumns } from '@veltra/desktop'

const columns = defineBatchEditColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 }
])
const data = shallowRef([{ name: '张三', age: 28 }])
const model = reactive({ name: '', age: undefined as number | undefined })
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    :features="['create', 'update', 'delete']"
    :actions-props="{ delete: { needConfirm: true } }"
  >
    <template #form>
      <u-input field="name" label="姓名" :rules="{ required: true }" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
    </template>
  </u-batch-edit>
</template>
```

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface ActionProps extends ButtonProps {
  /** 是否需要确认 */
  needConfirm?: boolean

  /**
   * 是否始终位于下拉菜单中，无视 `max` 限制
   * @default false
   */
  inDropdown?: boolean
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

export interface TableColumnSlotsScope extends TableColumnRenderContext {
  /** 交互模型 */
  model: { modelValue: any; 'onUpdate:modelValue': (val: any) => void }
}

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

/** 批量编辑列 */
export interface BatchEditColumn extends TableColumn {}

export type BatchEditFeature = 'create' | 'update' | 'delete' | 'view' | 'createChild'

export type BatchEditFormStatus = 'hidden'

/** 批量编辑状态 */
export interface BatchEditStates {
  /** 层级 */
  depth: number
  /** 表单可见性 */
  formVisible: boolean
  /** 表单操作类型 */
  formActionType: 'create' | 'update' | 'view' | 'createChild'
  /** 加载状态 */
  loading: boolean
  /** 当前编辑行 */
  row?: TableRow
  /** 当前编辑或者新增的父级行 */
  parentRow?: TableRow
  /** 行索引路径， */
  indexPath: number[]
}

/** 批量编辑组件属性 */
export interface BatchEditProps extends TableProps {
  /**
   * 表单数据
   * @description 与右侧 UForm 绑定的 reactive 对象
   */
  model?: Record<string, any>
  /** 表格标题 */
  title?: string
  /**
   * 列的宽度定义
   */
  cols?: string | [string, string]
  /** 只读模式 */
  readonly?: boolean
  /**
   * 开启快速编辑
   * @description 开启后，编辑行时表单实时写回 `row.data`（经 `model` 中转），且不调用 `saveMethod`
   */
  quickEdit?: boolean
  /**
   * 新增前的钩子
   * @description 仅作用于 create 类操作，在保存时调用。可直接修改传入的 draft 对象
   */
  beforeCreate?: (
    data: Record<string, any>,
    parentData?: Record<string, any>
  ) => void | Promise<void>
  /** label的宽度 */
  labelWidth?: string | number
  /**
   * 删除方法
   * @description 删除时调用。如果返回 false，则不删除
   * @returns 如果返回 false，则不删除
   */
  deleteMethod?: (data: Record<string, any>[]) => any
  /**
   * 保存方法
   * @description 保存时调用。`quick` 模式下编辑行时实时写回，不调用此方法；新增时与 `normal` 模式一致
   * @returns 如果返回一个值，那么这个值会被插入，否则插入的为表单值
   */
  saveMethod?: (
    /** 表单数据 */
    data: Record<string, any>,
    /** 操作类型 */
    actionType: BatchEditStates['formActionType'],
    /** 父级数据 */
    parentData?: Record<string, any>
  ) => any

  /**
   * 可用功能，不穿则对功能没有任何限制
   *
   * ## 用法
   * ```ts
   * // 只允许新增和更新
   * const features = ['create', 'update']
   * // 不允许新增，并且只有当行深度小于2时才允许新增子级，对其他功能不做限制
   * const features = {
   *   create: false,
   *   createChild: row => row.depth < 2
   * }
   * ```
   */
  features?:
    | Array<BatchEditFeature>
    | {
        [key in BatchEditFeature]?: boolean | ((row: TableRow) => boolean)
      }

  /**
   * 操作按钮的属性配置, 可以是action组件的任意属性
   * @example
   * ```ts
   * const actionsProps = {
   *   delete: {
   *     needConfirm: true,
   *     circle: false
   *   }
   * }
   * ```
   */
  actionsProps?: Partial<Record<BatchEditFeature, ActionProps>>
}

/** 批量编辑组件定义的事件 */
export interface BatchEditEmits extends TableEmits {
  /** 更新数据 */
  (e: 'update:data', value: Record<string, any>[]): void
  /** 点击底部「新增一行」 */
  (e: 'create'): void
  /** 点击「在上方插入」 */
  (e: 'create-prev', row: TableRow): void
  /** 点击「在下方插入」 */
  (e: 'create-next', row: TableRow): void
  /** 点击「添加子级」，参数为父级行 */
  (e: 'create-child', row: TableRow): void
}

export type BatchEditSlots = {
  form?: (props: {
    /** 当前编辑的层级 */
    depth?: number
    /** 当前编辑的行 */
    row?: TableRow
    /** 新增时的父级行（createChild / 非根同级插入） */
    parentRow?: TableRow
    /** 当前表单操作类型 */
    formActionType?: BatchEditStates['formActionType']
    /** 当前编辑的行索引 */
    index?: number
    /** 操作的目标行索引路径 */
    indexes?: number[]
  }) => any

  header?: () => any
} & Partial<{ [key: `column:${string}`]: (props: TableColumnSlotsScope) => any }>

/** 批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _BatchEditExposed {}

/** 批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BatchEditExposed = DeconstructValue<_BatchEditExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### defineTableColumns

与 UTable 相同，为左侧表格列批量设置公共列属性。

使用示例:

```ts
import { defineTableColumns } from '@veltra/desktop'
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
