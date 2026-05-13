# UBatchEdit — 批量编辑

> `import type { BatchEditProps, BatchEditEmits, BatchEditFeature, BatchEditExposed } from '@veltra/desktop'`

基于 UTable 的批量编辑组件，内置左右分栏布局：左侧表格列表支持行内操作（新增、复制、删除、新增子级），右侧动态表单用于新增/编辑。支持树形数据、异步保存/删除、功能开关、键盘快捷键。

## Import

```ts
import { UBatchEdit, FormModel, defineTableColumns } from '@veltra/desktop'
```

## Props

BatchEditProps 继承 TableProps 的所有属性，并追加以下专属属性。

### 专属属性

| prop | type | default | 说明 |
|------|------|---------|------|
| `model` | `Model` | — | 表单模型，优先级大于列的 `rules` 配置 |
| `title` | `string` | — | 表格标题 |
| `cols` | `string \| [string, string]` | `['1fr', '420px']` | 左右分栏列宽，左侧列表 + 右侧表单 |
| `readonly` | `boolean` | — | 只读模式，禁用所有编辑操作和表单修改 |
| `labelWidth` | `string \| number` | — | 表单中 label 的宽度 |
| `deleteMethod` | `(data: Record<string, any>[]) => Promise<any> \| any` | — | 删除回调，用于异步校验或远程删除 |
| `saveMethod` | `(data: Record<string, any>, actionType: 'create' \| 'update', parentData?: Record<string, any>) => Promise<any> \| any` | — | 保存回调，返回值会替代表单数据写入 `data`；用于异步校验或远程保存 |
| `features` | `BatchEditFeature[] \| { [key in BatchEditFeature]?: boolean \| ((row: TableRow) => boolean) }` | — | 可用功能控制。不传则全部可用。数组形式为白名单；对象形式中 `false` 或函数视为关闭，`true` 视为开启，其余沿用默认（全部可用） |
| `actionsProps` | `Partial<Record<BatchEditFeature, ActionProps>>` | — | 操作按钮的属性配置，可传入 `ActionProps`（支持 `needConfirm`、`circle` 等） |

**`BatchEditFeature`** = `'create'` | `'update'` | `'copy'` | `'delete'` | `'view'` | `'createChild'`

### 继承自 TableProps

| prop | type | default | 说明 |
|------|------|---------|------|
| `data` | `Record<string, any>[]` | — | 表格数据 |
| `columns` | `TableColumn[]` | — | 列定义 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 尺寸 |
| `rowKey` | `string` | — | 行唯一标识字段名，多选/单选/树形时必须 |
| `checkable` | `boolean` | — | 开启多选（需 `rowKey`） |
| `checked` | `Record<string, any>[]` | — | 多选已选项（支持 `v-model:checked`） |
| `selectable` | `boolean` | — | 开启单选（需 `rowKey`） |
| `selected` | `Record<string, any>` | — | 单选已选项（支持 `v-model:selected`） |
| `showIndex` | `boolean` | — | 显示行索引 |
| `tree` | `boolean \| string` | `false` | 树形模式。`true` 时子节点从 `children` 字段读取；传字符串表示自定义子节点字段名 |
| `expandable` | `boolean` | — | 开启行展开（非树形模式下有效） |
| `defaultExpandAll` | `boolean` | — | 默认展开全部（树形模式） |
| `current` | `TableRow` | — | 当前选中的行（支持 `v-model:current`） |
| `highlightCurrent` | `boolean` | `false` | 高亮当前点击的行 |
| `stripe` | `boolean` | `true` | 斑马纹 |
| `border` | `boolean` | `false` | 边框 |
| `textEllipsis` | `boolean` | — | 文本溢出省略 |
| `virtualThreshold` | `number` | `80` | 虚拟滚动阈值 |
| `mergeCell` | `(ctx: TableColumnRenderContext) => { rowspan: number; colspan: number } \| undefined` | — | 单元格合并函数 |
| `slots` | `Readonly<Slots>` | — | 传入外部作用域插槽 |

## Emits

BatchEditEmits 继承 TableEmits 的所有事件，并追加以下专属事件。

### 专属事件

| event | 参数 | 说明 |
|-------|------|------|
| `update:data` | `(value: Record<string, any>[])` | 数据变更（新增/删除/复制后触发） |

### 继承自 TableEmits

| event | 参数 | 说明 |
|-------|------|------|
| `update:checked` | `(value: Record<string, any>[])` | 多选项变更 |
| `update:selected` | `(value: Record<string, any> \| undefined)` | 单选项变更 |
| `update:current` | `(row?: TableRow)` | 当前行变更 |
| `update:rows` | `(rows: TableRow[])` | 行数据更新 |
| `update:forest` | `(rows?: Forest<Record<string, unknown>, any>)` | 树形数据森林结构更新 |
| `row-click` | `(row: TableRow, ev: MouseEvent)` | 行点击事件 |
| `cell-click` | `(row: TableRow, column: TableColumn, ev: MouseEvent)` | 单元格点击事件 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `form` | `{ data: Model['data']; model: Model; depth?: number; row?: TableRow; index?: number; indexes?: number[] }` | 表单内容插槽，内部放置表单控件（`u-input`、`u-select` 等），通过 `field` 属性绑定模型的字段 |
| `header` | — | 自定义表单头部内容 |
| `column:{key}` | `TableColumnSlotsScope` | 动态列插槽，`{key}` 为列定义的 `key` 字段值。作用域含 `{ row, rowData, column, val, model }` |

## Exposed

无暴露属性或方法。

## 键盘快捷键

| 快捷键 | 说明 |
|--------|------|
| `Esc` | 关闭右侧表单 |
| `⌘/Ctrl + S` | 保存当前编辑内容 |
| `⌘/Ctrl + Backspace` | 删除当前正在编辑的行（更新模式） |
| `⌘/Ctrl + N` | 新增一行（表单未打开时） |

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UBatchEdit, FormModel, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 },
  { name: '邮箱', key: 'email', width: 180 }
])

const data = shallowRef([
  { id: 1, name: '张三', age: 28, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 32, email: 'lisi@example.com' }
])

const model = new FormModel({
  name: { required: true },
  age: { min: 0, max: 120 },
  email: { required: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '请输入有效的邮箱地址'] }
})
</script>

<template>
  <u-batch-edit
    :columns="columns"
    :model="model"
    v-model:data="data"
  >
    <template #form="{ data }">
      <u-input field="name" label="姓名" placeholder="请输入姓名" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
      <u-input field="email" label="邮箱" placeholder="请输入邮箱地址" />
    </template>
  </u-batch-edit>
</template>
```

### 功能限制

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { UBatchEdit, FormModel, defineTableColumns } from '@veltra/desktop'
import type { BatchEditFeature } from '@veltra/desktop'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', minWidth: 120 },
  { name: '年龄', key: 'age', width: 80, align: 'center' }
])

const data = shallowRef([
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
])

const model = new FormModel({
  name: { required: true },
  age: { min: 0, max: 120 }
})

// 数组形式：白名单，只有指定的功能可用
const features: BatchEditFeature[] = ['create', 'update']

// 或对象形式：细粒度控制，函数可按行动态判断
const dynamicFeatures = computed(() => ({
  create: true,
  update: true,
  copy: (row) => row.depth < 2,    // 深度 < 2 时允许复制
  delete: (row) => row.data.age > 0 // age > 0 时允许删除
}))
</script>

<template>
  <u-batch-edit
    :columns="columns"
    :model="model"
    :features="dynamicFeatures"
    v-model:data="data"
  >
    <template #form="{ data }">
      <u-input field="name" label="姓名" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
    </template>
  </u-batch-edit>
</template>
```

### 树形数据

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UBatchEdit, FormModel, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '名称', minWidth: 200 },
  { key: 'count', name: '人数', width: 80, align: 'center' }
])

const data = shallowRef([
  {
    id: 1,
    name: '技术部',
    count: 30,
    children: [
      { id: 2, name: '前端组', count: 12 },
      { id: 3, name: '后端组', count: 18 }
    ]
  },
  { id: 4, name: '市场部', count: 15 }
])

const model = new FormModel({
  name: { required: true },
  count: { min: 0 }
})
</script>

<template>
  <u-batch-edit
    tree
    :columns="columns"
    :model="model"
    v-model:data="data"
  >
    <template #column:name="{ row }">
      <span :style="`padding-left: ${row.depth * 20}px`">
        {{ row.data.name }}
      </span>
    </template>
    <template #form="{ data }">
      <u-input field="name" label="名称" />
      <u-number-input field="count" label="人数" :min="0" />
    </template>
  </u-batch-edit>
</template>
```

### 异步保存与删除确认

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UBatchEdit, FormModel, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', minWidth: 120 },
  { name: '年龄', key: 'age', width: 80, align: 'center' }
])

const data = shallowRef([
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
])

const model = new FormModel({
  name: { required: true },
  age: { min: 0, max: 120 }
})

async function saveMethod(formData: Record<string, any>, actionType: 'create' | 'update') {
  // 异步保存到后端
  const res = await fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify({ ...formData, actionType })
  })
  // 如果返回了新数据（如含后端生成的 id），会替换表单值写入
  return res.json()
}

async function deleteMethod(rows: Record<string, any>[]) {
  await fetch('/api/delete', {
    method: 'POST',
    body: JSON.stringify(rows)
  })
}
</script>

<template>
  <u-batch-edit
    :columns="columns"
    :model="model"
    :save-method="saveMethod"
    :delete-method="deleteMethod"
    :actions-props="{ delete: { needConfirm: true } }"
    v-model:data="data"
  >
    <template #form="{ data }">
      <u-input field="name" label="姓名" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
    </template>
  </u-batch-edit>
</template>
```
