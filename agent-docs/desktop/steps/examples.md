---
title: USteps 示例
description: 步骤条用 items 与 current，默认按索引，也可用 current-key 对字段
---

`items` 必填。默认用数组下标当步骤值，`label` 为展示文案（可用 `label-key` 改字段名）。`v-model:current` 控制当前步；指定 `current-key` 后，`current` 去匹配该项上的该字段，而不是下标。`direction` 为 `horizontal`（默认）或 `vertical`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref(1)

const items = [
  { label: '填写资料' },
  { label: '上传附件' },
  { label: '提交审核' }
]
</script>

<template>
  <u-steps v-model:current="current" :items="items" />
</template>
```

`item-click` 的参数是 `(item, index)`。若步骤用业务 id 而不是下标：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref('upload')

const items = [
  { id: 'form', label: '填写资料' },
  { id: 'upload', label: '上传附件' },
  { id: 'review', label: '提交审核' }
]
</script>

<template>
  <u-steps v-model:current="current" current-key="id" :items="items" />
</template>
```
