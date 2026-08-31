# USegment 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const tab = ref('list')
const items = [
  { label: '列表', value: 'list' },
  { label: '卡片', value: 'card' },
  { label: '看板', value: 'board' }
]
</script>

<template>
  <u-segment v-model="tab" :items="items" />
</template>
```

## 撑满宽度与禁用项

```vue
<script setup lang="ts">
import { ref } from 'vue'

const tab = ref('a')
const items = [
  { label: '选项 A', value: 'a' },
  { label: '选项 B', value: 'b' },
  { label: '选项 C', value: 'c' }
]
</script>

<template>
  <u-segment v-model="tab" :items="items" block :disabled-item="(item) => item.value === 'c'" />
</template>
```

## 在 UForm 中使用

> 表单内用 `field` 绑 `model`，勿再写 `v-model`；无 `field` 时 `label` 不生效。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const model = reactive({ view: 'list' })
const items = [
  { label: '列表', value: 'list' },
  { label: '卡片', value: 'card' }
]
</script>

<template>
  <u-form :model="model">
    <u-segment label="视图" field="view" :items="items" />
  </u-form>
</template>
```
