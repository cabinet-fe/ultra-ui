---
title: UBatchEdit 批量编辑
description: "左侧 UTable 加右侧 UForm 的批量行编辑组件：点行打开表单编辑/查看，支持新增、上方/下方插入、树形新增子级、删除、快速编辑实时写回行数据，以及 features 功能白名单与保存/删除钩子。"
aliases: ["UBatchEdit", "BatchEdit", "EditableTable", "行编辑", "批量行编辑", "批量表格"]
keywords:
  - field:update
  - quickEdit
  - quick-edit
  - saveMethod
  - deleteMethod
  - beforeCreate
  - features
  - createChild
  - defineBatchEditColumns
  - defineTableColumns
  - actionsProps
  - needConfirm
  - BatchEditFeature
  - update:data
  - v-model:data
  - 快速编辑
  - 行编辑
  - 新增一行
  - 字段联动
---

# UBatchEdit 批量编辑

`@veltra/desktop` 导出批量行编辑组件 `UBatchEdit`。左侧是内置 `UTable`（继承 `TableProps`），右侧是内置 `UForm`（绑定 `model`）：点击行打开表单编辑并回写行数据，底部「新增一行」与行内操作支持插入、树形新增子级、删除；`quickEdit` 开启后编辑行实时写回 `row.data`，不调用 `saveMethod`。

## 快速上手

`v-model:data` 绑定行数组；`model` 传 `reactive` 对象（必传，右侧表单依赖它渲染）；`#form` 插槽里的控件必须写 `field`，**不要再写 `v-model`**。独立页面需先初始化主题（`import '@veltra/styles/normalize'` + `loadTheme()`）。

```vue
<script setup lang="ts">
import { UBatchEdit, UInput, UNumberInput, defineBatchEditColumns } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const columns = defineBatchEditColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 }
])

const data = shallowRef([
  { name: '张三', age: 28 },
  { name: '李四', age: 32 }
])
const model = reactive({ name: '', age: undefined as number | undefined })
</script>

<template>
  <u-batch-edit v-model:data="data" :columns="columns" :model="model" style="height: 500px">
    <template #form>
      <u-input field="name" label="姓名" :rules="{ required: true }" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
    </template>
  </u-batch-edit>
</template>
```

点行打开编辑表单，保存（按钮或 `Ctrl/Cmd + S`）校验通过后写回该行；`Esc` 关闭表单。

## API 签名

```ts
// TableColumn / TableProps / TableEmits / TableRow / TableColumnSlotsScope 与 UTable 同源，
// 完整定义见 agent-docs/desktop/table.md

/** 批量编辑列，与 TableColumn 结构一致 */
export interface BatchEditColumn extends TableColumn {}

/** 可用功能名 */
export type BatchEditFeature = 'create' | 'update' | 'delete' | 'view' | 'createChild'

/** 批量编辑组件属性（继承 TableProps，见 agent-docs/desktop/table.md） */
export interface BatchEditProps extends TableProps {
  /** 表单数据；右侧 UForm 绑定的对象。不传则右侧表单不渲染 */
  model?: Record<string, any>
  /** 表格标题（声明于本接口；当前版本组件内部未读取） */
  title?: string
  /** 左右两栏宽度定义（CSS grid-template-columns 值）。默认 ['1fr', '420px']；表单关闭时收起右栏 */
  cols?: string | [string, string]
  /** 只读模式：隐藏操作列与「新增一行」，点行进入 view 模式，保存按钮与 Ctrl+S 不可用（Esc 仍可关闭） */
  readonly?: boolean
  /** 开启快速编辑：编辑行时表单实时写回 row.data（经 model 中转），不调用 saveMethod，隐藏保存按钮与 Ctrl+S；新增仍走保存流程 */
  quickEdit?: boolean
  /** 新增前的钩子；仅 create / createChild 类操作在保存时调用，可直接修改传入的 draft 对象 */
  beforeCreate?: (data: Record<string, any>, parentData?: Record<string, any>) => void | Promise<void>
  /** 右侧表单 label 宽度，透传内部 UForm */
  labelWidth?: string | number
  /** 删除方法；返回 false（严格等于）则不删除。未传时直接移除行 */
  deleteMethod?: (data: Record<string, any>[]) => any
  /**
   * 保存方法；校验通过后调用。返回非空值时以返回值插入/写回行数据，否则用表单值。
   * quickEdit 编辑行时不调用；新增时与普通模式一致
   */
  saveMethod?: (
    data: Record<string, any>,
    actionType: 'create' | 'update' | 'view' | 'createChild',
    parentData?: Record<string, any>
  ) => any
  /**
   * 可用功能白名单。数组形式只保留列出的功能；对象形式中 false 与函数视为关闭（函数按行动态判定），
   * true 视为开启。不传时默认开放 create / update / delete / createChild（view 默认关闭）
   */
  features?:
    | Array<BatchEditFeature>
    | { [key in BatchEditFeature]?: boolean | ((row: TableRow) => boolean) }
  /** 行内操作按钮属性（ActionProps：needConfirm、inDropdown 及 Button 属性）；当前仅 delete 操作消费 */
  actionsProps?: Partial<Record<BatchEditFeature, ActionProps>>
}

/** 批量编辑事件（继承 TableEmits，见 agent-docs/desktop/table.md） */
export interface BatchEditEmits extends TableEmits {
  /** 行数组整体更新（插入/删除后触发） */
  (e: 'update:data', value: Record<string, any>[]): void
  /** 点击底部「新增一行」 */
  (e: 'create'): void
  /** 点击「在上方插入」，参数为目标行 */
  (e: 'create-prev', row: TableRow): void
  /** 点击「在下方插入」，参数为目标行 */
  (e: 'create-next', row: TableRow): void
  /** 点击「添加子级」，参数为父级行 */
  (e: 'create-child', row: TableRow): void
}

/** 批量编辑插槽 */
export type BatchEditSlots = {
  /** 右侧表单内容；控件必须写 field 绑定 model */
  form?: (props: {
    /** 当前编辑的层级 */
    depth?: number
    /** 当前编辑的行 */
    row?: TableRow
    /** 新增时的父级行（createChild / 非根同级插入） */
    parentRow?: TableRow
    /** 当前表单操作类型 */
    formActionType?: 'create' | 'update' | 'view' | 'createChild'
    /** 当前编辑的行索引 */
    index?: number
    /** 操作的目标行索引路径 */
    indexes?: number[]
  }) => any
  /** 表格头部，透传左侧 UTable */
  header?: () => any
  // column:${key}：列插槽，如 #column:name；作用域为 TableColumnSlotsScope
  // （row: TableRow、rowData、column、val、model 交互模型），见 agent-docs/desktop/table.md
} & Partial<{ [key: `column:${string}`]: (props: TableColumnSlotsScope) => any }>

/** 批量编辑无公开方法；模板 ref 上无可调用成员（源码经 DeconstructValue 解包后为空） */
export type BatchEditExposed = {}
```

辅助工具——列定义与 `UTable` 共用，两写法等价：

```ts
import {
  defineBatchEditColumns,
  defineTableColumns
} from '@veltra/desktop'

// 原样返回列数组，仅为类型标注；BatchEditColumn 兼容 TableColumn
defineBatchEditColumns([{ name: '姓名', key: 'name', width: 120 }])

// 批量为列树补齐公共列属性（DFS，不覆盖列上已有值），可选第二参数为公共属性
defineTableColumns([{ name: '姓名', key: 'name' }], { align: 'center', minWidth: 80 })
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `model` | `Record<string, any>` | — | 是 | 必须为 `reactive` 对象；`#form` 控件按 `field` 读写它，不传则右栏不渲染 |
| `v-model:data` | `Record<string, any>[]` | — | 是 | 行数组；插入/删除后组件 emit `update:data` 整体替换 |
| `columns` | `BatchEditColumn[]` | — | 是 | 结构同 UTable 的 `TableColumn`；非只读且开启任一编辑功能时自动追加固定右侧「操作」列（宽 180） |
| `cols` | `string \| [string, string]` | `['1fr', '420px']` | 否 | 左右两栏宽度；表单关闭时右栏收起 |
| `readonly` | `boolean` | `false` | 否 | 只读时点行进入 `view`，仅 `Esc` 快捷键可用 |
| `quickEdit` | `boolean` | `false` | 否 | 编辑行实时写回 `row.data`；回显/重置期间（syncing）不写回，避免默认值污染行数据 |
| `labelWidth` | `string \| number` | — | 否 | 透传内部 `UForm` 的 `labelWidth` |
| `beforeCreate` | `(data, parentData?) => void \| Promise<void>` | — | 否 | 仅 `create` / `createChild` 保存时调用；可直接修改 `data` |
| `deleteMethod` | `(data: Record<string, any>[]) => any` | — | 否 | 返回 `false` 阻止删除；抛错被捕获并 `console.error`，不中断加载态复位 |
| `saveMethod` | `(data, actionType, parentData?) => any` | — | 否 | 校验通过才调用；返回非空值作为插入/写回内容 |
| `features` | `BatchEditFeature[] \| Record<BatchEditFeature, boolean \| (row: TableRow) => boolean>` | 默认开放 `create`/`update`/`delete`/`createChild` | 否 | `view` 不在默认集合，需要时显式传入或写 `view: true`；`create` 同时控制「新增一行」与「在上方/下方插入」入口，`update` 控制点行编辑，`delete` 控制删除按钮，`createChild` 配合 `tree` 控制添加子级；判定函数按行调用，`create` 类操作调用时不传 `row` |
| `actionsProps` | `Partial<Record<BatchEditFeature, ActionProps>>` | — | 否 | 仅 `delete` 被消费；`ActionProps` 含 `needConfirm`（删除确认）、`inDropdown` 及 Button 属性 |
| 其余 | `TableProps` 继承属性 | — | 否 | `data` / `checkable` / `tree` / `rowKey` / `stripe` / `border` / `virtualThreshold` 等透传左侧 `UTable`，取值见 `agent-docs/desktop/table.md` |

## 方法与事件

组件无公开暴露方法，交互全部通过 props 与事件完成。

事件：

- `field:update` 由内部 `UForm` 消费用于 `quickEdit` 回写，**不对外 emit**；监听 model 写入只能通过 `model` 自身的 watch。
- `update:data(rows)` — 插入或删除后触发，参数为新行数组；用 `v-model:data` 接收。
- `create` / `create-prev(row)` / `create-next(row)` / `create-child(row)` — 点击对应操作后、表单打开时触发；`create-child` 参数为父级行，可据此初始化表单（如写入父级编码）。
- `update:checked(items)` / `update:selected(row)` — 左侧表格多选/单选变化时转发。
- 继承自 `TableEmits` 的 `update:current`、`row-click`、`cell-click`、`update:rows`、`update:forest` 在 `UBatchEdit` 内部未转发：`update:current` 被组件消费用于打开编辑表单，其余监听不触发。

内置键盘快捷键（组件获焦时生效）：`Esc` 关闭表单；`Ctrl/Cmd + S` 保存。`readonly` 时仅 `Esc` 生效；`quickEdit` 编辑行时不响应保存。

保存流程（`create` / `createChild`）：`validate()` 通过 → `beforeCreate(draft, parentData)` → `saveMethod(data, actionType, parentData)`（返回非空值则以返回值插入）→ 插入到目标索引 → 索引推进一行便于连续新增 → 表单重置。更新流程：`validate()` 通过 → `saveMethod(...)` → 把结果（或表单值）逐字段写回 `row.data`。

## 典型示例

### 功能限制与删除确认

```vue
<script setup lang="ts">
import type { BatchEditFeature } from '@veltra/desktop'
import { UBatchEdit, UInput, defineTableColumns } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '数量', key: 'count', width: 80 }
])

const data = shallowRef([
  { name: '项目 A', count: 1 },
  { name: '系统项', count: 2 }
])
const model = reactive({ name: '', count: 0 })

// 只允许新增和更新；删除按钮不出现
const features: BatchEditFeature[] = ['create', 'update']

async function deleteMethod(rows: Record<string, any>[]) {
  if (rows.some((row) => row.name === '系统项')) return false // 阻止删除
}
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    :features="features"
    :delete-method="deleteMethod"
    :actions-props="{ delete: { needConfirm: true } }"
    style="height: 500px"
  >
    <template #form>
      <u-input field="name" label="名称" :rules="{ required: true }" />
      <u-input field="count" label="数量" :rules="{ min: 0 }" />
    </template>
  </u-batch-edit>
</template>
```

### 快速编辑

`quick-edit` 下编辑行实时写回 `row.data`，不调用 `saveMethod`。

```vue
<script setup lang="ts">
import { UBatchEdit, UInput, USelect, defineTableColumns } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '部门', key: 'department', width: 120 },
  { name: '职位', key: 'position', width: 120 }
])

const data = shallowRef([{ name: '张三', department: 'tech', position: 'engineer' }])
const model = reactive({
  name: '',
  department: '',
  position: undefined as string | undefined
})
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    quick-edit
    style="height: 500px"
  >
    <template #form="{ row }">
      <u-input field="name" label="姓名" />
      <u-select
        field="department"
        label="部门"
        :options="[
          { label: '技术部', value: 'tech' },
          { label: '市场部', value: 'marketing' }
        ]"
      />
      <u-input field="position" label="职位" />
      <!-- 插槽作用域 row 可读当前行数据 -->
      <span>正在编辑：{{ row?.data.name }}</span>
    </template>
  </u-batch-edit>
</template>
```

### 树形新增子级与保存钩子

`tree` 开启后行内出现「添加子级」；`beforeCreate` 在保存时补默认值，`saveMethod` 返回值作为实际插入内容。

```vue
<script setup lang="ts">
import { message, UBatchEdit, UInput, defineTableColumns } from '@veltra/desktop'
import type { TableRow } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const columns = defineTableColumns([
  { name: '编码', key: 'code', width: 120 },
  { name: '名称', key: 'name', width: 160 }
])

const data = shallowRef([{ code: 'A', name: '根节点', parentCode: '' }])
const model = reactive({ code: '', name: '', parentCode: '' })

function onCreateChild(row: TableRow) {
  model.parentCode = row.data.code // 打开表单前初始化父级编码
}

function beforeCreate(draft: Record<string, any>) {
  draft.id = Math.random()
}

function saveMethod(data: Record<string, any>, actionType: string) {
  message.info(`保存（${actionType}）`)
  return { ...data, code: data.code.toUpperCase() } // 返回值作为实际插入内容
}
</script>

<template>
  <u-batch-edit
    v-model:data="data"
    :columns="columns"
    :model="model"
    tree
    :before-create="beforeCreate"
    :save-method="saveMethod"
    style="height: 500px"
    @create-child="onCreateChild"
  >
    <template #form="{ parentRow, formActionType }">
      <u-input field="code" label="编码" :rules="{ required: true }" />
      <u-input field="name" label="名称" />
      <u-input field="parentCode" label="父级编码" readonly />
      <span v-if="formActionType === 'createChild'">父级：{{ parentRow?.data.name }}</span>
    </template>
  </u-batch-edit>
</template>
```

## 注意事项

> [!WARNING]
> - `#form` 内控件用 `field` 绑定 `model`，**不是** `v-model`；并用 `v-model` 会让保存与快速编辑拿到脱离的旧值。
> - `model` 必传（`reactive` 对象）；不传时右侧表单整个不渲染。
> - 本库的动态判定功能写法是 `features` 对象形式（`false` / 函数关闭，`true` 开启），`view` **不在**默认开放集合，需要查看功能必须显式开启。
> - `quickEdit` 编辑行不调用 `saveMethod`，也不显示保存按钮与 `Ctrl + S` 提示；新增/插入仍走完整保存流程。
> - 继承自 `TableEmits` 的 `row-click` / `cell-click` / `update:rows` / `update:forest` 在本组件内未转发，监听不触发；`update:current` 由组件内部消费用于打开编辑表单。
> - 「添加子级」（`createChild`）按钮仅在 `tree` 开启时出现；树形子节点的 key 默认 `'children'`，可用 `tree="childrenKey"` 改名。
> - 列定义辅助函数本库提供 `defineBatchEditColumns` 与 `defineTableColumns` 两个，前者仅类型标注差异，可与 UTable 文档中的 `defineTableColumns` 通用。

## 常见问题

### 保存后表格行数据没更新

原因：`#form` 控件写了 `v-model` 而未写 `field`，表单值没进 `model`；或 `saveMethod` 返回了不完整对象覆盖了行数据。修复：控件统一用 `field`；`saveMethod` 返回值必须包含要写回的全部字段。

### 点行没有打开编辑表单

原因：`features` 禁用了 `update`（对象形式写了 `update: false` 或函数返回 `false`），或 `readonly` 开启（此时点行进入只读 `view`）。修复：检查 `features` 与 `readonly`；只读查看同样会打开表单，只是无保存入口。

### 删除时 `deleteMethod` 内的异步报错导致界面卡住

原因：`deleteMethod` 抛出的异常会被组件捕获并 `console.error`，行不会删除、加载态正常复位。若需要在业务层提示，请在 `deleteMethod` 内部自行 `try/catch` 并返回 `false` 或给出提示。
