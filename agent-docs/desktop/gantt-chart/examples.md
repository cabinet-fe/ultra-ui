---
title: UGanttChart 甘特图示例
description: 当前公开 API 仅 v-model 字符串，组件壳仍在迭代
---

`UGanttChart` 公开属性目前只有 `modelValue`（字符串）及 `update:modelValue`。按类型传入即可。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const taskId = shallowRef('task-001')
</script>

<template>
  <u-gantt-chart v-model="taskId" />
</template>
```
