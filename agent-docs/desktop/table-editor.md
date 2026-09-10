---
title: UTableEditor 表格编辑器
description: "@veltra/desktop 的表格型编辑器组件：基于 UTable 封装，v-model 绑定行对象数组，内置序号列与「删除/新增/复制」操作列，配合 #column:{key} 插槽的 model 作用域实现单元格行内编辑。"
aliases: [EditableTable, 可编辑表格, 行内编辑表格, 表格编辑]
keywords: [modelValue, v-model, UTable, TableColumn, defineTableColumns, __operation, 操作列, 行内编辑, 行新增, 行删除, 行复制, 可编辑表格, 单元格编辑]
---

# UTableEditor 表格编辑器

`@veltra/desktop` 导出表格型编辑器组件 `UTableEditor`。它在内部渲染一个 `UTable`，用 `v-model`（`modelValue`）绑定行对象数组，自动附加序号列和带「删除 / 新增 / 复制」按钮的操作列；单元格编辑通过 `#column:{key}` 插槽把输入控件绑定到插槽作用域的 `model` 上。只读展示数据用 `UTable`（见 `agent-docs/desktop/table.md`）；需要用户增删复制行、就地编辑单元格数据时用 `UTableEditor`。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UNumberInput, UTableEditor, UTextarea, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名', minWidth: 150 },
  { key: 'age', name: '年龄', width: 120, align: 'center' }
])

const list = ref<any[]>([
  { name: '张三', age: 28 },
  { name: '李四', age: 32 }
])
</script>

<template>
  <u-table-editor v-model="list" :columns="columns" border>
    <!-- model.modelValue 写回当前行 rowData[key]，输入即生效 -->
    <template #column:name="{ model }">
      <u-textarea v-model="model.modelValue" />
    </template>
    <template #column:age="{ model }">
      <u-number-input v-model="model.modelValue" />
    </template>
  </u-table-editor>
</template>
```

独立页面使用时必须先初始化主题：入口文件 `import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用一次 `loadTheme()`。

## API 签名

```ts
import type { TableColumn, TableProps } from '@veltra/desktop'

/** 表格型编辑器组件属性：继承 UTable 的全部属性，仅把 data 换成 modelValue */
export interface TableEditorProps extends Omit<TableProps, 'data'> {
  /** 行对象数组，配合 v-model 使用 */
  modelValue?: any[]
}

/** 表格型编辑器组件事件 */
export interface TableEditorEmits {
  (e: 'update:modelValue', value: any[]): void
}

/** 组件不暴露任何属性与方法 */
export interface TableEditorExposed {}
```

`TableProps` 未在本篇展开的部分（`columns`、`rowKey`、`checkable`、`tree`、`expandable` 等）与 `TableColumn` 列定义见 `agent-docs/desktop/table.md` 的「API 签名」。

组件内部对少数 `TableProps` 有固定覆盖，传入也不生效：

- `stripe` 固定为 `false`（编辑表格不加斑马纹）。
- `showIndex` 固定为 `true`（始终渲染序号列，key 为 `__index__`，宽 60，固定左侧）。
- 列定义末尾始终追加操作列，key 固定为 `__operation`。

操作列行为（按钮为小号圆形文本按钮）：

| 按钮 | 图标 | 行为 |
| --- | --- | --- |
| 删除 | `Minus`（danger 色） | 从数组移除当前行 |
| 新增 | `Plus` | 在当前行之后插入空对象 `{}` |
| 复制 | `Copy` | `JSON.parse(JSON.stringify(rowData))` 深拷贝当前行，插入其后 |

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `any[]` | `[]` | 否 | 行对象数组；`v-model` 绑定。增删复制行时组件以新数组引用触发 `update:modelValue`，单元格编辑不触发（见下） |
| `columns` | `TableColumn[]` | — | 是 | 禁止使用 `key: '__operation'`，该 key 被内置操作列占用 |
| `rowKey` | `string` | — | 否 | 使用 `checkable` / `v-model:checked` 等受控选中时必须设置 |
| `checkable` | `boolean` | `false` | 否 | 开启多选列，勾选状态由 `v-model:checked` 同步 |
| `selectable` | `boolean` | `false` | 否 | 单选；与 `checkable` 同时设置时仅本项生效 |
| `checked` | `Record<string, any>[]` | — | 否 | 多选受控值，需要 `rowKey` |
| `selected` | `Record<string, any>` | — | 否 | 单选受控值，需要 `rowKey` |
| `tree` | `boolean \| string` | `false` | 否 | 树形编辑；传字符串时该字符串为子节点字段名，默认 `'children'` |
| `expandable` | `boolean` | `false` | 否 | 展开行，仅非树形有效；内容写入 `#row:expand` 插槽 |
| `defaultExpandAll` | `boolean` | `false` | 否 | 树形模式默认展开全部 |
| `border` | `boolean` | `false` | 否 | — |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | — |
| `stripe` | `boolean` | 固定 `false` | 否 | 内部覆盖，传入不生效 |
| `showIndex` | `boolean` | 固定 `true` | 否 | 内部覆盖，传入不生效 |
| `virtualThreshold` | `number` | `80` | 否 | 行数超过该值开启虚拟滚动；设 `0` 始终开启 |
| `mergeCell` | `(ctx) => { rowspan, colspan } \| undefined` | — | 否 | 语义同 `UTable`；操作列同样参与合并判定 |
| `slots` | `Readonly<Slots>` | — | 否 | 函数式组件包裹时传 `$slots` |
| `textEllipsis` | `boolean` | `false` | 否 | — |
| `highlightCurrent` / `current` | `boolean` / `TableRow` | `false` / — | 否 | 语义同 `UTable` |

插槽与 `UTable` 完全一致，最常用的是 `#column:{key}`：作用域为 `{ row, rowData, column, val, model }`，`model.modelValue` 的更新直接写回 `rowData[key]`。另有 `#header:{key}`、`#row:expand`、`#empty`（空态默认渲染「添加」按钮）、`#foot`、`#body`、`#append`。

## 方法与事件

- `update:modelValue`（`(value: any[]) => void`）：删除、新增、复制、空态「添加」时触发，payload 是不可变更新产生的新数组。单元格内通过 `model` 编辑只修改行对象属性，不触发本事件。
- 组件不暴露任何属性与方法（`TableEditorExposed` 为空接口）；需要 `clearChecked` 等方法时改用 `UTable` 并自行实现操作列。

## 典型示例

### 多选 + 列插槽行内编辑

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UInput, UNumberInput, UTableEditor, defineTableColumns } from '@veltra/desktop'

const list = ref<any[]>([
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
])
const checked = ref<any[]>([])

const columns = defineTableColumns([
  { key: 'name', name: '姓名', minWidth: 150 },
  { key: 'age', name: '年龄', width: 120, align: 'center' }
])

function handleSubmit() {
  // 勾选行是原始数据引用，编辑后的值可直接读取
  console.log(checked.value.map((row) => row.name)) // => ['张三']
}
</script>

<template>
  <u-table-editor
    v-model="list"
    v-model:checked="checked"
    :columns="columns"
    row-key="id"
    checkable
    border
  >
    <template #column:name="{ model }">
      <u-input v-model="model.modelValue" />
    </template>
    <template #column:age="{ model }">
      <u-number-input v-model="model.modelValue" />
    </template>
  </u-table-editor>
  <button @click="handleSubmit">提交选中行</button>
</template>
```

### 从空数组开始增行

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTableEditor, defineTableColumns } from '@veltra/desktop'

// 初始为空：空态区域自动渲染「添加」按钮，点击在末尾追加一行空对象
const list = ref<any[]>([])

const columns = defineTableColumns([
  { key: 'name', name: '商品', minWidth: 200 },
  { key: 'price', name: '单价', width: 120, align: 'right' }
])
</script>

<template>
  <u-table-editor v-model="list" :columns="columns" border />
</template>
```

### 行展开 + 表尾合计

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTableEditor, defineTableColumns } from '@veltra/desktop'

const list = ref<any[]>([
  { id: 1, name: '商品 A', price: 99, desc: '优质商品' },
  { id: 2, name: '商品 B', price: 49, desc: '促销中' }
])

// summary: true 自动对可见行 price 求和，表尾显示合计行
const columns = defineTableColumns([
  { key: 'name', name: '商品', minWidth: 200 },
  { key: 'price', name: '单价', width: 120, align: 'right', summary: true }
])
</script>

<template>
  <!-- expandable 只在非树形模式有效；tree 与 expandable 不要同时设置 -->
  <u-table-editor v-model="list" :columns="columns" row-key="id" expandable border>
    <template #row:expand="{ rowData }">
      <div style="padding: 12px 24px">描述：{{ rowData.desc }}</div>
    </template>
  </u-table-editor>
</template>
```

## 注意事项

> [!WARNING]
> - `UTableEditor` 内部就是 `UTable`：`data` 属性不存在，行数组用 `v-model`（`modelValue`）绑定；`stripe` / `showIndex` 被内部覆盖，传入不生效。
> - 禁止在 `columns` 里定义 `key: '__operation'` 的列，操作列 key 固定为 `__operation`，重复会导致渲染冲突。
> - 单元格编辑通过 `model` 直接修改行对象属性，不触发 `update:modelValue`；只有数组结构变化（增删复制）才触发。需要监听单元格变化时对 `list` 用深度 `watch`，或改用 `UTable` 自定义交互。
> - 「复制」用 `JSON` 深拷贝，行数据中的函数、`undefined` 字段、`Date` 对象会丢失；需要保真复制时不要用内置复制按钮，改用 `UTable` 自定义操作列。
> - 新增行插入的是空对象 `{}`，不含 `rowKey` 字段；依赖 `rowKey` 的受控选中要求新增后自行回填唯一键。
> - `tree` 与 `expandable` 互斥：树形模式下展开行（`#row:expand`）不渲染，需要行展开就不要设 `tree`。
> - 空态「添加」按钮只在 `modelValue.length === 0` 时渲染；列表非空后只能用操作列的「新增」按钮增行。

## 常见问题

### 编辑了单元格但 `v-model` 没有触发更新

这是设计行为：单元格编辑直接写回行对象（`rowData[key] = val`），只有增删复制行才产生新数组。监听单元格变化：

```ts
import { ref, watch } from 'vue'

const list = ref<any[]>([])

watch(
  list,
  (rows) => {
    console.log('任一行字段变化或行数变化', rows)
  },
  { deep: true }
)
```

### 新增的行勾选后 `checked` 里匹配不到

原因：新增行是空对象 `{}`，没有 `rowKey` 对应字段的值，受控选中按 `rowData[rowKey]` 匹配。修复：在 `#column:{key}` 插槽里自行生成唯一键写回，或新增后用代码给新行回填 `id`。

### 想要空白表格但不显示内置「添加」按钮

`#empty` 插槽会被内置空态占据（含「添加」按钮）。需要自定义空态时改用 `UTable`（其 `#empty` 插槽默认渲染 `UEmpty`，可完全覆盖），或接受内置按钮行为。
