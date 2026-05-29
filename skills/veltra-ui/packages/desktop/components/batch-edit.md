# UBatchEdit — 批量编辑

> `import type { BatchEditProps, BatchEditEmits, BatchEditFeature, BatchEditExposed } from '@veltra/desktop'`

基于 UTable 的左右分栏批量编辑：左侧表格（行内新增/复制/删除/添加子级），右侧动态表单。继承 `TableProps` 全部属性。

## Import

```ts
// UBatchEdit 由 Vite 自动导入，无需手动 import
import { FormModel, defineTableColumns } from '@veltra/desktop'
```

## Props（专属）

继承 `TableProps`（详见 `table.md`），追加：

| prop           | type                                                                                                                     | default            | 说明                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------ |
| `model`        | `FormModel \| DynamicFormModel`                                                                                          | —                  | 表单模型（优先级 > 列的 `rules`）                      |
| `title`        | `string`                                                                                                                 | —                  | 表格标题                                               |
| `cols`         | `string \| [string, string]`                                                                                             | `['1fr', '420px']` | 左右分栏列宽                                           |
| `readonly`     | `boolean`                                                                                                                | —                  | 只读：禁用编辑                                         |
| `labelWidth`   | `string \| number`                                                                                                       | —                  | 表单 label 宽度                                        |
| `deleteMethod` | `(data: Record<string, any>[]) => Promise<any> \| any`                                                                   | —                  | 删除回调（异步校验/远程删除）                          |
| `saveMethod`   | `(data: Record<string, any>, actionType: 'create' \| 'update', parentData?: Record<string, any>) => Promise<any> \| any` | —                  | 保存回调，返回值替代表单数据写入 `data`                |
| `features`     | `BatchEditFeature[] \| { [key in BatchEditFeature]?: boolean \| ((row: TableRow) => boolean) }`                          | —                  | 功能控制：数组=白名单；对象 `false`/函数=按行动态关闭  |
| `actionsProps` | `Partial<Record<BatchEditFeature, ActionProps>>`                                                                         | —                  | 操作按钮属性（如 `{ delete: { needConfirm: true } }`） |

`BatchEditFeature` = `'create' | 'update' | 'copy' | 'delete' | 'view' | 'createChild'`

## Emits（专属）

继承 `TableEmits`，追加：

| event         | 参数                             | 说明                             |
| ------------- | -------------------------------- | -------------------------------- |
| `update:data` | `(value: Record<string, any>[])` | 数据变更（新增/删除/复制后触发） |

## Slots

| slot           | 作用域                                                                                                      | 说明                                |
| -------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `form`         | `{ data: Model['data']; model: Model; depth?: number; row?: TableRow; index?: number; indexes?: number[] }` | 表单内容，放置带 `field` 的输入控件 |
| `header`       | —                                                                                                           | 自定义表单头部                      |
| `column:{key}` | `TableColumnSlotsScope`                                                                                     | 动态列插槽（与 UTable 一致）        |

## Exposed

```ts
interface BatchEditExposed {}
```

## 键盘快捷键

| 快捷键               | 说明                       |
| -------------------- | -------------------------- |
| `Esc`                | 关闭右侧表单               |
| `⌘/Ctrl + S`         | 保存当前编辑               |
| `⌘/Ctrl + Backspace` | 删除当前编辑行（更新模式） |
| `⌘/Ctrl + N`         | 新增（表单未打开时）       |

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { FormModel, defineTableColumns } from '@veltra/desktop'

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
  email: { required: true, preset: 'email' }
})
</script>

<template>
  <u-batch-edit :columns="columns" :model="model" v-model:data="data">
    <template #form>
      <u-input field="name" label="姓名" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
      <u-input field="email" label="邮箱" />
    </template>
  </u-batch-edit>
</template>
```

### 功能限制（白名单 / 按行动态控制）

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { BatchEditFeature } from '@veltra/desktop'

// 数组：白名单
const features: BatchEditFeature[] = ['create', 'update']

// 对象：细粒度，函数按行判断
const dynamicFeatures = computed(() => ({
  create: true,
  update: true,
  copy: (row) => row.depth < 2,
  delete: (row) => row.data.age > 0
}))
</script>

<template>
  <u-batch-edit :columns="columns" :model="model" :features="dynamicFeatures" v-model:data="data">
    <template #form>
      <u-input field="name" label="姓名" />
    </template>
  </u-batch-edit>
</template>
```

### 树形 + 异步保存/删除

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { FormModel, defineTableColumns } from '@veltra/desktop'

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
  }
])

const model = new FormModel({ name: { required: true }, count: { min: 0 } })

async function saveMethod(formData, actionType: 'create' | 'update') {
  const res = await fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify({ ...formData, actionType })
  })
  return res.json() // 返回的新值会替换写入
}

async function deleteMethod(rows) {
  await fetch('/api/delete', { method: 'POST', body: JSON.stringify(rows) })
}
</script>

<template>
  <u-batch-edit
    tree
    :columns="columns"
    :model="model"
    :save-method="saveMethod"
    :delete-method="deleteMethod"
    :actions-props="{ delete: { needConfirm: true } }"
    v-model:data="data"
  >
    <template #column:name="{ row }">
      <span :style="`padding-left: ${row.depth * 20}px`">{{ row.data.name }}</span>
    </template>
    <template #form>
      <u-input field="name" label="名称" />
      <u-number-input field="count" label="人数" :min="0" />
    </template>
  </u-batch-edit>
</template>
```
