# UBatchEdit 示例

## 基础用法

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

## 功能限制（白名单 / 按行动态控制）

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

## 树形 + 异步保存/删除

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
