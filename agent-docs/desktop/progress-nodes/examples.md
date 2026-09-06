---
title: UProgressNodes 进度节点示例
description: 用 UProgressNodes 展示可点击的水平进度节点
---

`UProgressNodes` 的 `nodes` 必填。默认用 `label` / `value`。`check` 决定节点是否标记为已完成；不传则只靠 `v-model` 高亮当前项。`color-type` 默认 `primary`。节点过多时用 `max-width` 出现横向滚动。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const current = ref('review')
const nodes = [
  { value: 'draft', label: '起草' },
  { value: 'review', label: '审核' },
  { value: 'done', label: '完成' }
]
const done = new Set(['draft', 'review'])

function isChecked(node: Record<string, any>) {
  return done.has(node.value)
}
</script>

<template>
  <u-progress-nodes
    v-model="current"
    :nodes="nodes"
    :check="isChecked"
    color-type="primary"
    max-width="520px"
  />
</template>
```
