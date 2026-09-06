---
title: USegment 分段选择示例
description: 用 USegment 在互斥选项间切换，表单内用 field 绑定
---

`USegment` 的 `items` 必填，默认 `label` / `value`。`block` 撑满容器宽度。`disabled-item` 禁用单个选项，`disabled` 禁用整组。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const period = ref('day')
const items = [
  { label: '按日', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' }
]
</script>

<template>
  <u-segment v-model="period" :items="items" />
  <u-segment v-model="period" :items="items" block />
  <u-segment v-model="period" :items="items" :disabled-item="(item) => item.value === 'week'" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ period: 'month' })
const items = [
  { label: '日', value: 'day' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' }
]
</script>

<template>
  <u-form :model="form">
    <u-segment label="统计周期" field="period" :items="items" />
  </u-form>
</template>
```
