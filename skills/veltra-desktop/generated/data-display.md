# 数据展示

## table (UTable, defineTableColumns)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/table.ts
import type { Forest, TreeNode } from '@cat-kit/core'
import type { ComponentSize, DeconstructValue, RenderReturn } from '@veltra/utils'
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
  /** 是否开启虚拟列表 */
  virtual?: boolean
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

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/table/base.vue -->
<template>
  <CustomCard title="基础用法">
    <u-table :data="students" :columns="columns" v-model:checked="checked" show-index checkable>
      <template #column:action>
        <u-action-group :max="4">
          <u-action need-confirm type="danger">删除</u-action>
        </u-action-group>
      </template>
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const students = [
  { id: 1, name: '张三', age: 15, grade: '高一', class: '1班', score: 95 },
  { id: 2, name: '李四', age: 16, grade: '高二', class: '2班', score: 88 },
  { id: 3, name: '王五', age: 17, grade: '高三', class: '3班', score: 92 }
]

const checked = shallowRef([])

const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'center' },
  { key: 'grade', name: '年级', align: 'center' },
  { key: 'class', name: '班级', align: 'center' },
  {
    key: 'score',
    name: '分数',
    align: 'center'
    // summary(ctx) {
    //   if (ctx.checkedRows.size) {
    //     return Array.from(ctx.checkedRows).reduce(
    //       (acc, cur) => acc + cur.data[ctx.column.key],
    //       0
    //     )
    //   }
    //   return ctx.total
    // }
  },
  { key: 'action', name: '操作', align: 'center' }
])
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/table/expand.vue -->
<template>
  <CustomCard title="展开行 (嵌套子表格)">
    <u-table :data="data" :columns="columns" row-key="id" expandable style="max-height: 750px">
      <template #row:expand="{ rowData }">
        <u-table
          :data="rowData.subOrders"
          :columns="subColumns"
          row-key="id"
          :stripe="false"
          border
        >
        </u-table>
      </template>
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const columns = defineTableColumns([
  { name: '订单编号', key: 'id', width: 100 },
  { name: '客户姓名', key: 'name', width: 150 },
  { name: '下单日期', key: 'date', width: 150 },
  { name: '订单金额', key: 'amount', width: 120 },
  { name: '状态', key: 'status' }
])

const subColumns = defineTableColumns([
  { name: '商品名称', key: 'product' },
  { name: '单价', key: 'price', width: 100 },
  { name: '数量', key: 'quantity', width: 80 },
  { name: '小计', key: 'total', width: 100 }
])

const data = shallowRef(
  Array.from({ length: 1000 }).map((_, index) => ({
    id: `ORD-${String(index + 1).padStart(3, '0')}`,
    name: ['张三', '李四', '王五', '赵六', '钱七'][index % 5],
    date: `2026-01-${String((index % 30) + 1).padStart(2, '0')}`,
    amount: `￥${(Math.random() * 1000 + 100).toFixed(2)}`,
    status: ['已发货', '处理中', '已完成', '待支付'][index % 4],
    subOrders: [
      {
        id: `${index + 1}-1`,
        product: '无线耳机',
        price: '￥299.00',
        quantity: 1,
        total: '￥299.00'
      },
      {
        id: `${index + 1}-2`,
        product: '手机壳',
        price: '￥300.00',
        quantity: 1,
        total: '￥300.00'
      }
    ]
  }))
)
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/table/full.vue -->
<template>
  <CustomCard title="使用方式">
    <div>
      <u-button @click="toggleData" type="primary">
        {{ dataLen }}
        条数据
      </u-button>
    </div>

    <div style="display: flex; gap: 20px">
      <u-checkbox v-model="state.checkable" @update:model-value="state.selectable = false">
        多选
      </u-checkbox>
      <u-checkbox v-model="state.selectable" @update:model-value="state.checkable = false">
        单选
      </u-checkbox>
      <u-checkbox v-model="state.tree">树形结构</u-checkbox>
      <u-checkbox v-model="state.textEllipsis">文本溢出省略</u-checkbox>
      <u-checkbox v-model="fixedHeight">固定高度</u-checkbox>
      <u-checkbox v-model="multiLevelHeader">多级表头</u-checkbox>
      <u-checkbox v-model="showData">显示数据</u-checkbox>
      <u-checkbox v-model="state.editing">编辑模式</u-checkbox>
      <u-checkbox v-model="state.showIndex">显示序号</u-checkbox>
      <u-checkbox v-model="state.highlightCurrent">高亮选中行</u-checkbox>
      <u-checkbox v-model="state.border">边框</u-checkbox>
    </div>

    <u-table
      v-if="true"
      :data="data"
      :columns="columns"
      :style="{ height: fixedHeight ? '700px' : '' }"
      row-key="name"
      v-bind="state"
      v-model:checked="checked"
      v-model:selected="selected"
      ref="tableRef"
    >
      <template #header:age> 年龄 </template>

      <template #column:name="{ row }">
        <u-tag type="primary">{{ row.data.name }}</u-tag>
      </template>

      <!-- <template v-if="state.editing"> -->
      <template #column:age="{ model }" v-if="state.editing">
        <u-number-input v-bind="model"></u-number-input>
      </template>

      <!-- </template> -->
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { dfs } from '@cat-kit/core'
import { defineTableColumns } from '@veltra/desktop'
import { computed, ref, shallowReactive, shallowRef, watch } from 'vue'

import CustomCard from '../card/custom-card.vue'

const state = shallowReactive({
  checkable: false,
  selectable: true,
  tree: false,
  showIndex: false,
  highlightCurrent: false,
  editing: false,
  textEllipsis: false,
  border: false
})

const fixedHeight = shallowRef(true)
const multiLevelHeader = shallowRef(true)
const showData = shallowRef(true)
const _columns = defineTableColumns(
  [
    {
      name: '排序',
      key: 'sort'
    },
    {
      name: '地址',
      key: 'address',

      children: [
        { name: '省', key: 'province' },
        { name: '市', key: 'city' },
        { name: '区', key: 'area' },
        { name: '街道', key: 'street' },
        {
          name: '小区',
          key: 'community',

          children: [
            { name: 'a', key: 'a' },
            { name: 'b', key: 'b' }
          ]
        }
      ]
    },
    // { name: '性别', key: 'sex', fixed: 'right' },
    {
      name: '姓名',
      key: 'name',
      fixed: 'left',
      align: 'center',
      minWidth: 250,
      width: 200
      // headerAlign: 'left'
    },
    {
      name: '年龄',
      key: 'age',
      fixed: 'right',
      summary: true

      // headerAlign: 'center'
    }
  ],
  { minWidth: 100 }
)

const dataLen = shallowRef(1000)
const data = computed(() => {
  return Array.from({ length: dataLen.value }).map((_, index) => {
    return {
      sex: index % 2 === 0 ? '男' : '女',
      name: 'name' + index,
      age: Math.round(Math.random() * 100),
      province: '江苏省' + index,
      city: '苏州市' + index,
      area: '姑苏区' + index,
      street: `金昌街道${index}`.repeat(Math.round(Math.random() * 4)),
      community: `彩香花园${index}`,
      b: 'aa',
      a: 'aa',
      children: [
        {
          sex: '未知',
          name: 'name' + index + '-0',
          age: Math.round(Math.random() * 100),
          province: '江苏省',
          city: '苏州市',
          area: '姑苏区',
          street: '金昌街道',
          community: '彩香花园',
          b: 'aa',
          a: 'aa',
          children: [
            {
              sex: '未知',
              name: 'name' + index + '-0-0',
              age: Math.round(Math.random() * 100),
              province: '江苏省',
              city: '苏州市',
              area: '姑苏区',
              street: '金昌街道',
              community: '彩香花园',
              b: 'aa',
              a: 'aa'
            }
          ]
        }
      ]
    }
  })
})
const checked = shallowRef([])
const selected = shallowRef(data.value[0]!)

const columns = shallowRef<any[]>([])

const toggleData = () => {
  dataLen.value = dataLen.value === 1000 ? 72 : 1000
}

watch(
  multiLevelHeader,
  (v) => {
    if (v) {
      columns.value = _columns
    } else {
      let r: any[] = []

      dfs({ children: _columns }, (item) => {
        if (item.children?.length) return
        r.push(item)
      })

      columns.value = r
    }
  },
  { immediate: true }
)
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/table/index.vue -->
<template>
  <div>
    <Base />
    <Full />
    <Expand />
    <MergeCell />
  </div>
</template>

<script lang="ts" setup>
import Base from './base.vue'
import Expand from './expand.vue'
import Full from './full.vue'
import MergeCell from './merge-cell.vue'
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/table/merge-cell.vue -->
<template>
  <CustomCard title="合并单元格">
    <u-table
      :data="data"
      :merge-cell="mergeCell"
      v-if="!reloading"
      :columns="columns"
      style="height: 300px"
      :stripe="false"
      border
    >
      <template #column:secondQuota="{ val, row }">
        <span>{{ val }}</span>
        <u-button circle type="primary" :icon="Plus" @click="handleAdd(row)"></u-button>
      </template>

      <template #column:thirdQuota="{ model }">
        <u-input v-bind="model"></u-input>
      </template>
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import type { TableRow } from '@veltra/desktop'
import { Plus } from '@veltra/icons/normal'
import { nextTick, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

let data = shallowRef<Record<string, any>[]>([
  {
    firstQuota: '决策',
    secondQuota: '项目立项',
    thirdQuota: '三级指标'
  },
  {
    firstQuota: '决策',
    secondQuota: '绩效目标',
    thirdQuota: '立项依据充分性3'
  },
  { firstQuota: '决策', secondQuota: '资金投入', thirdQuota: '' },
  {
    firstQuota: '过程',
    secondQuota: '资金管理',
    thirdQuota: ''
  },
  {
    firstQuota: '过程',
    secondQuota: '组织实施',
    thirdQuota: ''
  }
])

const columns = defineTableColumns([
  {
    name: '一级指标',
    key: 'firstQuota',
    align: 'center'
  },
  {
    name: '二级指标',
    key: 'secondQuota',
    align: 'center'
  },
  {
    name: '三级指标',
    key: 'thirdQuota',
    align: 'center'
  },
  {
    name: '年度指标值',
    key: 'quotaValue',
    align: 'center'
  },
  {
    name: '是否分解到项目',
    key: 'disassemble',
    align: 'center'
  }
])

function getValSpanDict(keys: string[]) {
  const keyDict = {}

  keys.forEach((key) => {
    keyDict[key] = data.value.reduce((acc, item, index) => {
      if (acc[item[key]]) {
        acc[item[key]].times++
      } else {
        acc[item[key]] = {
          times: 1,
          start: index
        }
      }
      return acc
    }, {})
  })

  return keyDict
}

let columnsSpanDict = getValSpanDict(['firstQuota', 'secondQuota'])
const reloading = shallowRef(false)
function handleAdd(row: TableRow) {
  data.value = [
    ...data.value.slice(0, row.index + 1),
    {
      firstQuota: row.data.firstQuota,
      secondQuota: row.data.secondQuota,
      thirdQuota: ''
    },
    ...data.value.slice(row.index + 1)
  ]

  reloading.value = true
  nextTick(() => {
    reloading.value = false
  })

  columnsSpanDict = getValSpanDict(['firstQuota', 'secondQuota'])
}

function mergeCell(ctx) {
  const { row, column, val } = ctx

  if (columnsSpanDict[column.key]) {
    const { times, start } = columnsSpanDict[column.key][val]

    if (start === row.index) {
      return {
        rowspan: times,
        colspan: 1
      }
    }
    return {
      rowspan: 0,
      colspan: 0
    }
  }
}
</script>
```

## tree (UTree)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/tree.ts
import type { Forest, ITreeNode } from '@cat-kit/core'
import type { DeconstructValue } from '@veltra/utils'
import type { ComputedRef, ShallowRef } from 'vue'

export interface TreeNode<Data extends Record<string, any> = Record<string, any>> extends ITreeNode<
  Data,
  TreeNode<Data>
> {
  parent?: TreeNode<Data>
  children?: TreeNode<Data>[]
  valueKey: string
  labelKey: string
  visible: boolean
  expanded: boolean
  loading: boolean
  loaded: boolean
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  label: string
  key: string | number
  childrenCheckCount: number

  bubbleSet: (setter: (node: TreeNode<Data>) => void) => void
}

/** 树组件属性 */
export interface TreeProps {
  /** 是否展开所有节点 */
  expandAll?: boolean
  /** 是否在点击节点的时候展开或者收缩节点 */
  expandOnClickNode?: boolean
  /** label键 */
  labelKey?: string
  /** value键 */
  valueKey?: string
  /** 子节点键 */
  childrenKey?: string
  /** 数据 */
  data?: Record<string, any>[]
  /** 禁止单选或多选的节点 */
  disabledNode?: (item: Record<string, any>, node: TreeNode) => boolean
  /** 可多选 */
  checkable?: boolean
  /** 可单选 */
  selectable?: boolean
  /**
   * 严格选择，选择的内容和父级不会产生关联
   * @default false
   */
  checkStrictly?: boolean
  /** 单选选中项 */
  selected?: any
  /** 多选选中项 */
  checked?: any[]
  /** 插槽穿透 */
  slots?: Record<string, any>
  /** 使选中项或多选项出现在滚动视图中 */
  scrollToView?: boolean
}

export interface TreeEmit {
  /** 节点展开/折叠事件 */
  (e: 'expand', node: TreeNode): void
  /** 节点点击事件 */
  (e: 'node-click', node: TreeNode): void
  /** 单选选中项 */
  (e: 'update:selected', selected?: any, selectedData?: Record<string, any>, node?: TreeNode): void
  /** 多选选中项 */
  (e: 'update:checked', checked: any[], checkedData: Record<string, any>[]): void
  /** 节点右键菜单事件 */
  (e: 'node-contextmenu', event: MouseEvent, node: TreeNode): void
  /** 选中项同步完成事件 */
  (e: 'selected-synced', selected?: Record<string, any>): void
}

export interface TreeNodeProps {
  node: TreeNode
  measureElement?: (el: any) => void
}

/** 树组件暴露的属性和方法(组件内部使用) */
export interface _TreeExposed {
  /** 滚动到目标元素 */
  scrollTo: (index: number) => void
  /**
   * 过滤树节点。注意：不要再watchEffect中调用！
   * @param filter 过滤器或一个字符串
   */
  filter(filter: string | ((node: TreeNode) => boolean)): void
  forest: ComputedRef<Forest<Record<string, unknown>, any>>
  nodes: ShallowRef<TreeNode[]>
  /** 多选选择节点 */
  checkNode: (node: TreeNode, check: boolean) => void
  /** 单选选择节点 */
  selectNode: (node: TreeNode) => void
  /** 对全部节点进行勾选/取消勾选 */
  checkAll: (check: boolean) => void
  /** 获取选择的节点值 */
  getSelected(): Record<string, any> | undefined
  /** 获取选中的节点值 */
  getChecked(): Record<string, any>[]
  /** 展开全部节点 */
  expandAll(): void
  /** 折叠全部节点 */
  collapseAll(): void
}

/** 树组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeExposed = DeconstructValue<_TreeExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/tree/index.vue -->
<template>
  <div>
    <CustomCard title="全部展开,过滤">
      <div>查询: <u-input v-model="qs" style="width: 200px"></u-input></div>
      <div style="padding: 4px 0; display: flex; gap: 12px">
        <div>
          多选:
          <u-switch v-model="config.checkable" @update:model-value="handleUpdateCheckable" />
        </div>
        <div>
          单选
          <u-switch v-model="config.selectable" @update:model-value="handleUpdateSelectable" />
        </div>
        <div>展开所有 <u-switch v-model="config.expandAll" /></div>
        <div>点击节点展开 <u-switch v-model="config.expandOnClickNode" /></div>
        <div>
          严格选择
          <u-switch
            v-model="config.checkStrictly"
            @update:model-value="handleUpdateCheckStrictly"
          />
        </div>
      </div>
      <UTree
        :data="data1"
        label-key="name"
        value-key="id"
        ref="treeRef"
        height="200px"
        v-model:checked="checked"
        @update:selected="handleNodeClick"
        @update:checked="handleCheck"
        :disabled-node="disabledNode"
        v-bind="config"
      />
      {{ checked }}
    </CustomCard>

    <CustomCard title="自定义内容">
      <UTree :data="data" expand-all label-key="name" value-key="id" height="100px" check-strictly>
        <template #default="{ data }">
          {{ data.name + '------' + data.id }}
        </template>
      </UTree>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { TreeExposed } from '@veltra/desktop'
import { shallowReactive, shallowRef, watch } from 'vue'

import CustomCard from '../card/custom-card.vue'

const treeRef = shallowRef<TreeExposed>()
const treeRef1 = shallowRef<TreeExposed>()
const data = shallowRef<any[]>([])
const data1 = shallowRef<any[]>([])

const checked = shallowRef<any[]>()

function disabledNode(node) {
  return node.id === '0-1'
}

function refreshData() {
  data1.value = Array.from({ length: 1000 }).map((_, index) => ({
    name: '手抓饼' + index,
    id: `${index}`,
    children: [
      { name: '鱼香肉丝-1'.repeat(5), id: `${index}-1` },
      { name: '鱼香肉丝-2', id: `${index}-2` }
    ]
  }))
}

setTimeout(() => {
  refreshData()
}, 500)

setTimeout(() => {
  checked.value = ['0-1']
}, 1000)

const config = shallowReactive({
  checkable: true,
  selectable: false,
  expandAll: false,
  expandOnClickNode: false,
  checkStrictly: true
})

let select = shallowRef(9)

watch([select, treeRef1, data], ([select, tree]) => {}, { immediate: true })

const handleNodeClick = (selected) => {
  console.log('点击了节点', selected)
}

const handleCheck = (...args) => {
  console.log('选中了', ...args)
}

const handleUpdateCheckable = (value: boolean) => {
  if (value) {
    config.selectable = false
  } else {
    config.checkStrictly = false
  }
}

const handleUpdateSelectable = (value: boolean) => {
  if (value) {
    config.checkable = false
  }
}

const handleUpdateCheckStrictly = (value: boolean) => {
  if (value) {
    config.checkable = true
    config.selectable = false
  }
}

const qs = shallowRef('')

watch([qs], ([qs]) => {
  treeRef.value?.filter(qs)
})
</script>
```

## list (UList, UListItem)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/list.ts
import type { ComponentSize, DeconstructValue } from '@veltra/utils'

export interface ListProps {
  size?: ComponentSize
  /** 列表数据 */
  data: Record<string, any>[]
}

export interface ListEmits {}

export interface _ListExposed {}

export type ListExposed = DeconstructValue<_ListExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/list/index.vue -->
<template>
  <div class="list-box">
    <CustomCard title="基础使用">
      <u-list :data="listData" style="height: 400px" v-slot="{ item }">
        <u-list-item> {{ item.title }}</u-list-item>
      </u-list>
    </CustomCard>

    <CustomCard title="单选">
      <u-list :data="listData" style="height: 400px" v-slot="{ item }">
        <u-list-item @click="console.log(item)"> {{ item.title }}</u-list-item>
      </u-list>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'

const listData = Array.from({ length: 50 }).map((_, i) => ({
  title: `列表项${i}`
}))
</script>

<style lang="scss" scoped></style>
```

## grid (UGrid, UGridItem)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/grid.ts
import type { BreakpointName, DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export interface Breakpoint {
  name: BreakpointName
  level: number
}

/** 断点列 */
export interface BreakCols {
  /** 超小尺寸 */
  xs?: number
  /** 小尺寸 */
  sm?: number
  /** 中等尺寸 */
  md?: number
  /** 大尺寸 */
  lg?: number
  /** 中大尺寸 */
  xl?: number
  /** 默认尺寸 */
  default?: number
}

/** 网格布局组件属性 */
export interface GridProps {
  /**
   * 栅格列数, 可传入数字，对象或者函数
   * @default 24
   * @example
   * ```ts
   * // 数字
   * const cols = 12
   * // 对象
   * const cols = {
   *   xs: 12,
   *   sm: 12,
   *   md: 12,
   *   lg: 24,
   *   xl: 24
   * }
   * // 函数
   * const cols = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl', sizeLevel: number) => {
   *   if (sizeLevel < 3) return 12
   *   return 24
   * }
   * ```
   */
  cols?: number | BreakCols | ((breakpoint: Breakpoint) => number)
  /** 渲染标签 */
  tag?: string
  /** 间隔, 为字符串时可以同时指定行间隔和列间隔 */
  gap?: number | string
}

/**
 * 网格布局项组件事件
 */
export interface GridEmits {
  /** 尺寸变更 */
  (e: 'resize', rect: DOMRect): void
  /** 断点变更 */
  (e: 'breakpoint-change', breakpoint: Breakpoint): void
}

/** 网格布局项组件属性 */
export interface GridItemProps {
  /** 跨距，当指定为0时，则代表隐藏, 默认为1 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 容器标签 */
  tag?: string
}

/** 网格组件暴露的属性和方法(组件内部使用) */
export interface _GridExposed {
  el: ShallowRef<HTMLElement | null>
}

/** 网格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridExposed = DeconstructValue<_GridExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/grid/index.vue -->
<template>
  <div>
    <div></div>

    <u-card>
      <u-card-header>
        <h3>
          <span style="vertical-align: middle">自定义栅格 列数: </span>
          <u-number-input :step="1" :min="1" v-model="cols" />
        </h3>
      </u-card-header>
      <u-card-content>
        <u-grid :cols="cols" gap="8">
          <div v-for="i of 12" class="col-item" :key="i">
            {{ i }}
          </div>
        </u-grid>
      </u-card-content>
    </u-card>

    <br />
    <br />

    <u-card>
      <u-card-header>
        <h3>基于容器自身的响应式布局。改变浏览器尺寸查看， 当前尺寸:{{ point?.name }}</h3>
      </u-card-header>

      <u-card-content>
        <u-grid :gap="8" :cols="{ xs: 2, sm: 3, md: 4, lg: 6 }" @breakpoint-change="point = $event">
          <u-grid-item :span="1" class="col-item" v-for="i of 6" :key="i">
            {{ i }}
          </u-grid-item>
        </u-grid>
      </u-card-content>
    </u-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const cols = ref(8)

const point = ref()
</script>

<style lang="scss" scoped>
.col-item {
  background-color: cadetblue;
  color: #fff;
  text-align: center;

  height: 50px;
  line-height: 50px;
}
</style>
```

## paginator (UPaginator)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/paginator.ts
import type { DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

/** 分页器组件组件属性 */
export interface PaginatorProps {
  /** 当前处于第几页 */
  pageNumber?: number
  /** 每页显示的数量 */
  pageSize?: number
  /** 大小模式 */
  size?: 'large' | 'default' | 'small'
  /** 数据总数 */
  total?: number
  /** 每页显示数量选项 */
  pageSizeOptions?: Array<number>
  /** 简洁模式 */
  simple?: boolean
}

/** 分页器组件组件定义的事件 */
export interface PaginatorEmits {
  (e: 'update:pageNumber', value: number): void
  (e: 'change:pageNumber', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change:pageSize', value: number): void
}

/** 分页器组件组件暴露的属性和方法(组件内部使用) */
export interface _PaginatorExposed {
  el: ShallowRef<HTMLElement | undefined>
}

/** 分页器组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaginatorExposed = DeconstructValue<_PaginatorExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/paginator/index.vue -->
<template>
  <div>
    <div class="config">
      <!-- <u-radio-group
        radioType="btn"
        :items="[
          { label: 'small', value: 'small' },
          { label: 'default', value: 'default' },
          { label: 'large', value: 'large' }
        ]"
        v-model="config.size"
      />
      <br /> -->
      <u-checkbox v-model="config.simple">simple</u-checkbox>
      <u-checkbox v-model="config.disabled">disabled</u-checkbox>
    </div>
    <u-paginator
      v-model:page-number="pageState.current"
      v-model:page-size="pageState.size"
      @change:page-number="console.log"
      @update:page-size="console.log('input', $event)"
      @change:page-size="console.log(pageState.size)"
      :total="120"
      :simple="config.simple"
      :disabled="config.disabled"
      @first-click="handleFirstClick"
      @last-click="handleLastClick"
    />
    {{ pageState }}
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const pageState = reactive({
  current: 3,
  size: 40
})

const config = reactive({
  size: 'default' as any,
  simple: false,
  disabled: false
})

const handleFirstClick = (val: number) => {
  console.log(val)
}
const handleLastClick = (val: number) => {
  console.log(val)
}
</script>

<style lang="scss" scoped>
.config {
  border: 1px dashed #eee;
  padding: 10px;
  margin: 10px;
}
</style>
```

## tag (UTag)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/tag.ts
import type { ColorType, ComponentSize } from '@veltra/utils'

/** 标签组件属性 */
export interface TagProps {
  type?: ColorType
  /** 是否可移除 */
  closable?: boolean
  /** 尺寸大小 */
  size?: ComponentSize
  /** 是否为圆角 */
  round?: boolean
  /** 深色 */
  dark?: boolean
}

export interface TagEmits {
  (e: 'close'): void
}
export interface TagExposed {}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/tag/index.vue -->
<template>
  <div class="tags">
    <CustomCard title="基本用法">
      <u-tag>默认</u-tag>
      <u-tag v-for="item of types" :type="item">{{ item.toUpperCase() }}</u-tag>
    </CustomCard>

    <CustomCard title="深色">
      <u-tag dark>默认</u-tag>
      <u-tag v-for="item of types" dark :type="item">{{ item.toUpperCase() }}</u-tag>
    </CustomCard>

    <CustomCard title="可移除">
      <u-tag v-for="(item, index) in tags" :type="item.type" closable @close="handleClose(index)">
        {{ item.name }}
      </u-tag>
    </CustomCard>

    <CustomCard title="动态编辑">
      <u-tag v-for="(item, index) in tags" :type="item.type" closable @close="handleClose(index)">
        {{ item.name }}
      </u-tag>
    </CustomCard>

    <CustomCard title="不同尺寸">
      <u-tag size="small"> small </u-tag>
      <u-tag size="default"> default </u-tag>
      <u-tag size="large"> large </u-tag>
    </CustomCard>

    <CustomCard title="圆形标签">
      <u-tag v-for="item of types" round :type="item">
        {{ item.toUpperCase() }}
      </u-tag>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { ColorType } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const tags = shallowRef<
  Array<{
    name: string
    type?: ColorType
  }>
>([
  { name: '默认' },
  { name: 'Tag 1', type: 'primary' },
  { name: 'Tag 2', type: 'success' },
  { name: 'Tag 3', type: 'info' },
  { name: 'Tag 4', type: 'warning' },
  { name: 'Tag 5', type: 'danger' }
])

const types: ColorType[] = ['primary', 'info', 'success', 'warning', 'danger']

/** 可移除标签 */
const handleClose = (index: number) => {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<style lang="scss" scoped>
.tags {
  :deep(.u-tag) {
    margin-right: 6px;
  }
}
</style>
```

## badge (UBadge)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/badge.ts
import type { ColorType, ComponentProps, DeconstructValue } from '@veltra/utils'

/** 徽章组件属性 */
export interface BadgeProps extends ComponentProps {
  /** 显示值 */
  value?: number
  /** 类别 */
  type?: ColorType
  /** 自定义背景色 */
  color?: string
  /** 是否隐藏 Badge */
  hidden?: boolean
  /** 最大值 {{max}}+ */
  max?: number
  /** 是否显示小圆点 */
  dot?: boolean
}

/** 徽章组件定义的事件 */
export interface BadgeEmits {
  (e: 'update:modelValue', value: string): void
}

/** 徽章组件暴露的属性和方法(组件内部使用) */
export interface _BadgeExposed {}

/** 徽章组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BadgeExposed = DeconstructValue<_BadgeExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/badge/index.vue -->
<template>
  <div>
    <div class="badge-demo">
      <u-badge :value="5">
        <u-button>more</u-button>
      </u-badge>
      <u-badge :value="10" type="primary">
        <u-button>primary</u-button>
      </u-badge>
      <u-badge :value="15" type="warning">
        <u-button>warning</u-button>
      </u-badge>
      <u-badge :value="120" color="green">
        <u-button>color</u-button>
      </u-badge>
      <u-badge dot> 未读消息 </u-badge>
      <u-badge :value="120" hidden>
        <u-button>hidden</u-button>
      </u-badge>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.badge-demo {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
```

## text (UText)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/text.ts
/** 文本组件属性 */
export interface TextProps {
  /** 使用预设文本类型, 默认content正文 */
  as?: 'main-title' | 'title' | 'sub-title' | 'content' | 'additional'
  /** 文本大小, 与as同时指定时会覆盖as */
  fontSize?: string | number
  /** 是否删除 */
  deleted?: boolean
  /** 下划线 */
  underline?: boolean
  /** 粗体, 与as同时指定时会覆盖as中的字体粗细 */
  bold?: boolean
  /** 斜体 */
  italic?: boolean
  /** 高亮 */
  highlight?: string | string[]
}

/** 文本组件定义的事件 */
export interface TextEmits {
  (e: 'update:modelValue', value: string): void
}

/** 文本组件暴露的属性和方法(组件内部使用) */
export interface _TextExposed {}

/** 文本组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TextExposed {}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/text/index.vue -->
<template>
  <div style="width: 200px">
    <u-text> 这是一个段落 </u-text>

    <u-text highlight="一个" :max-rows="2">
      这是一个长段落, 这是一个长段落, 这是一个长段落, 这是一个长段落, 这是一个长段落, 这是一个长段落
    </u-text>
  </div>
</template>

<script lang="ts" setup></script>
```

## number (UNumber)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/number.ts
/** 数字组件属性 */
export interface NumberProps {
  /** 数字数值 */
  value: number
  /**
   * 格式化。
   * currency: 货币； percent：百分比; decimal 默认十进制
   */
  format?: 'currency' | 'percent' | 'decimal'
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /**
   * 开启补间动画
   * @default false
   */
  tween?: boolean
  /** 动画持续时间 */
  duration?: number
  /** 精度 */
  precision?: number
  /** 最大精度 */
  maxPrecision?: number
  /** 最小精度 */
  minPrecision?: number
}

/** 数字组件定义的事件 */
export interface NumberEmits {}

/** 数字组件暴露的属性和方法 */
export interface NumberExposed {}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/number/index.vue -->
<template>
  <div>
    <div>
      数字动画:
      <div
        style="
          padding: 4px;
          background-color: cadetblue;
          color: #fff;
          text-align: center;
          display: inline-block;
          margin: 0 10px;
        "
      >
        <u-number :value="number" tween format="currency" :min-precision="1" />
      </div>
      <u-button type="primary" plain size="small" @click="number -= 1000"> -1000 </u-button>
      <u-button type="primary" plain size="small" @click="number += 1000"> +1000 </u-button>
    </div>

    <div>
      货币:
      <u-number :value="number" format="currency" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const number = ref(1000)
</script>
```

## calendar (UCalendar)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/calendar.ts
import type { Dater } from '@cat-kit/core'
import type { DeconstructValue } from '@veltra/utils'

/** day接口 */
export interface CalendarDay {
  date: Dater
  /** 是否今日 */
  isToday?: boolean
  /** 日期类型：上月， 本月， 下月 */
  type: 'pre' | 'current' | 'next'
  /** 是否禁止选择 */
  disabled?: boolean
}

export interface CalendarMonth {
  date: Dater
  /** 是否禁止选择 */
  disabled?: boolean
  /** 年月标识 */
  key: string
  /** 月份 */
  month: number
}

export interface CalendarYear {
  date: Dater
  /** 是否禁止选择 */
  disabled?: boolean
  /** 年份 */
  year: number
}

/** 日历组件属性 */
export interface CalendarProps {
  modelValue?: string
}

/** 日历组件定义的事件 */
export interface CalendarEmits {
  (e: 'update:modelValue', value: string): void
}

/** 日历组件暴露的属性和方法(组件内部使用) */
export interface _CalendarExposed {}

/** 日历组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CalendarExposed = DeconstructValue<_CalendarExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/calendar/index.vue -->
<template>
  <div>
    <CustomCard title="基础">
      <u-calendar />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
</script>
```

## gantt-chart (UGanttChart)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/gantt-chart.ts
/** 甘特图组件属性 */
export interface GanttChartProps {
  modelValue?: string
}

/** 甘特图组件定义的事件 */
export interface GanttChartEmits {
  (e: 'update:modelValue', value: string): void
}

/** 甘特图组件暴露的属性和方法(组件内部使用) */
export interface _GanttChartExposed {}

/** 甘特图组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface GanttChartExposed {}
```

### 使用示例

暂无示例

## progress-nodes (UProgressNodes)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/progress-nodes.ts
import type { ColorType, DeconstructValue } from '@veltra/utils'

/** 进度节点组件属性 */
export interface ProgressNodesProps {
  /** 当前选中节点的值 */
  modelValue?: string | number
  /** 节点列表 */
  nodes: Record<string, any>[]
  /** 检查节点是否选中的函数 */
  check?: (node: Record<string, any>, index: number) => boolean
  /** 高亮颜色类型 */
  colorType?: ColorType
  /** 最大宽度（用于水平方向滚动） */
  maxWidth?: number | string
  /** 标签键名 */
  labelKey?: string
  /** 值键名 */
  valueKey?: string
}

/** 进度节点组件定义的事件 */
export interface ProgressNodesEmits {
  /** 点击节点时触发 */
  (e: 'click', node: Record<string, any>, index: number): void
  /** 更新选中值时触发 */
  (e: 'update:modelValue', value: string | number): void
}

/** 进度节点组件暴露的属性和方法(组件内部使用) */
export interface _ProgressNodesExposed {}

/** 进度节点组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressNodesExposed = DeconstructValue<_ProgressNodesExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/progress-nodes/index.vue -->
<template>
  <div class="progressNodesDemo">
    <CustomCard title="配置">
      <div class="configRow">
        <span class="label">选中节点（check）：</span>
        <u-checkbox-group
          v-model="checkedIndexes"
          :items="checkboxItems"
          label-key="label"
          value-key="value"
        />
      </div>
      <div class="configRow">
        <span class="label">当前点击（v-model）：</span>
        <span>{{ activeNode ?? '无' }}</span>
      </div>
    </CustomCard>

    <CustomCard title="基础使用">
      <u-progress-nodes
        v-model="activeNode"
        :nodes="nodes"
        :check="isChecked"
        color-type="primary"
        max-width="520px"
      />
    </CustomCard>

    <CustomCard title="可滚动/拖拽">
      <u-progress-nodes
        :nodes="longNodes"
        :check="isChecked"
        color-type="success"
        max-width="520px"
      />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

/** 演示用节点结构（与 UProgressNodes 的 nodes 项字段一致） */
interface ProgressNodeItem {
  value: string
  label: string
}

const checkedIndexes = ref([0, 1])
const activeNode = ref<string>()

const nodes: ProgressNodeItem[] = Array.from({ length: 6 }, (_, index) => ({
  value: `node-${index + 1}`,
  label: `节点 ${index + 1}`
}))

const checkboxItems = nodes.map((node, index) => ({
  label: node.label,
  value: index
}))

const longNodes: ProgressNodeItem[] = Array.from({ length: 18 }, (_, index) => ({
  value: `long-node-${index + 1}`,
  label: `节点 ${index + 1}`
}))

const isChecked = (_node: ProgressNodeItem, index: number) => {
  return checkedIndexes.value.includes(index)
}
</script>

<style lang="scss" scoped>
.progressNodesDemo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.configRow {
  display: flex;
  align-items: center;
  gap: 12px;

  & + & {
    margin-top: 8px;
  }
}

.label {
  color: var(--text-color-second);
  font-size: 12px;
}
</style>
```
