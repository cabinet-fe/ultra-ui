---
title: UCheckboxGroup 示例
description: 用 items 渲染一组复选，以及在 UForm 内用 field 绑定
---

`UCheckboxGroup` 的值为数组。`items` 必填；默认按 `label` / `value` 取值，可用 `label-key` / `value-key` 改字段。`block` 为纵向排布。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref<number[]>([])
const items = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="items" label-key="name" value-key="id" />
  <u-checkbox-group v-model="checked" :items="items" label-key="name" value-key="id" block />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ hobbies: [] as string[] })
const hobbyList = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' }
]
</script>

<template>
  <u-form :model="form">
    <u-checkbox-group label="爱好" field="hobbies" :items="hobbyList" :rules="{ required: true }" />
  </u-form>
</template>
```
