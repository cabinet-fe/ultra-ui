# UBatchEdit 示例

## 基础用法

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([
  { name: '姓名', key: 'name', width: 120 },
  { name: '年龄', key: 'age', width: 80 }
])

const data = ref([
  { name: '张三', age: 28 },
  { name: '李四', age: 32 }
])

const model = reactive({ name: '', age: undefined as number | undefined })
</script>

<template>
  <u-batch-edit v-model:data="data" :columns="columns" :model="model">
    <template #form>
      <u-input field="name" label="姓名" :rules="{ required: true }" />
      <u-number-input field="age" label="年龄" :min="0" :max="120" />
    </template>
  </u-batch-edit>
</template>
```

## 带校验规则

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const columns = defineTableColumns([
  { name: '名称', key: 'name', width: 120 },
  { name: '数量', key: 'count', width: 80 }
])

const data = ref([{ name: '项目 A', count: 1 }])

const model = reactive({ name: '', count: 0 })
</script>

<template>
  <u-batch-edit v-model:data="data" :columns="columns" :model="model">
    <template #form>
      <u-input field="name" label="名称" :rules="{ required: true }" />
      <u-number-input field="count" label="数量" :rules="{ min: 0 }" />
    </template>
  </u-batch-edit>
</template>
```
