---
title: "UGanttChart - 甘特图"
description: "当前公开 API 仅 v-model 字符串，组件壳仍在迭代"
---

# UGanttChart - 甘特图

## 引入

```ts
import { UGanttChart } from '@veltra/desktop'
```

## 示例

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

## API / 类型

```ts
/** 甘特图组件属性 */
export interface GanttChartProps {
  modelValue?: string
}

/** 甘特图组件定义的事件 */
export interface GanttChartEmits {
  (e: 'update:modelValue', value: string): void
}

/** 甘特图组件暴露的属性和方法(组件内部使用) */
export interface _GanttChartExposed {}

/** 甘特图组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface GanttChartExposed {}
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
