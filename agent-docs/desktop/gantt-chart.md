---
title: UGanttChart 甘特图
description: "@veltra/desktop 导出的甘特图组件。当前版本是渲染壳：公开 API 仅 v-model（string），组件模板渲染空容器 div，任务行、时间轴等能力尚未开放，业务需等待后续版本。"
aliases: [UGanttChart, GanttChart, gantt-chart, 甘特图, 进度计划图]
keywords: [UGanttChart, GanttChartProps, modelValue, update:modelValue, GanttChartExposed, gantt-chart, 甘特图, 任务选中, 选中任务, 时间轴, 进度计划, 任务排期]
---

# UGanttChart 甘特图

`@veltra/desktop` 导出组件 `UGanttChart`，对应源码目录 `packages/desktop/src/components/gantt-chart/`。当前版本是渲染壳：模板只渲染一个空容器 `<div class="u-gantt-chart">`，公开属性仅 `modelValue`（`string`），事件声明仅 `update:modelValue`。任务行、时间轴、条形图等能力在当前版本未开放，接入前先按本篇确认可用面。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UGanttChart } from '@veltra/desktop'

const taskId = ref<string>()
</script>

<template>
  <u-gantt-chart v-model="taskId" />
</template>
```

`v-model` 绑定一个 `string | undefined` 的选中任务 id。视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空。

## API 签名

```ts
/** 甘特图组件属性 */
export interface GanttChartProps {
  /** 选中任务 id */
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

导出语句：`import { UGanttChart } from '@veltra/desktop'`。类型从 `@veltra/desktop` 的类型入口同步导出（源文件 `packages/desktop/src/types/gantt-chart.ts`）。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `string` | — | 否 | 选中任务 id；当前版本组件内部不读写该值，仅作为受控值由业务持有 |

未声明的属性（如 `data`、`tasks`）不会被子组件消费，会作为 attrs 透传到根 `div.u-gantt-chart` 上；传了也不会产生甘特图渲染结果。

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: string` | 类型已声明，但当前版本源码未声明 emits、也没有任何交互会触发它；监听它当前不会收到回调 |

无暴露方法：`GanttChartExposed` 为空接口，模板 ref 上取不到任何方法或属性。

## 典型示例

### 受控绑定选中任务

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UGanttChart } from '@veltra/desktop'

const taskId = ref<string>('task-001')
</script>

<template>
  <u-gantt-chart v-model="taskId" />
</template>
```

### 监听选中变化并同步到业务状态

事件契约按 `GanttChartEmits` 声明使用 `update:modelValue`；当前版本不会收到回调，接入后续版本后此写法直接生效：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UGanttChart } from '@veltra/desktop'

const taskId = ref<string>()

function onSelect(value: string) {
  console.log('选中任务:', value) // => 'task-002'
}
</script>

<template>
  <u-gantt-chart v-model="taskId" @update:model-value="onSelect" />
</template>
```

### 与页面其它状态联动

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UGanttChart } from '@veltra/desktop'

const taskId = ref<string>()
const summary = computed(() => (taskId.value ? `当前任务：${taskId.value}` : '未选中任务'))
</script>

<template>
  <p>{{ summary }}</p>
  <u-gantt-chart v-model="taskId" />
</template>
```

## 注意事项

> [!WARNING]
> - 当前版本是占位壳：模板仅渲染空 `<div class="u-gantt-chart">`，不渲染任务行、时间轴、条形图；页面出现空白属于预期行为，不是接入错误。
> - 本库 `v-model` 的类型是 `string`，不是对象或数字 id；传 `number` 时类型检查不通过。
> - 组件当前没有 `tasks`、`startDate`、`endDate`、`columns` 等属性；禁止参考其它甘特图库（如 dhtmlxGantt、gantt-task-react）的 props 往本组件上写，这些属性只会落到根 div 的 attrs 上。
> - `update:modelValue` 只有类型声明，当前版本不会触发；不要把通知类逻辑挂在这个事件上。
> - 无暴露方法：拿 `ref` 读 `GanttChartExposed` 得到空对象。

## 常见问题

### 组件渲染后页面一片空白

原因：当前版本 `UGanttChart` 的模板就是空容器 div，没有任何视觉内容；另外入口未调用 `loadTheme()` 时 token 也为空。前者等待版本更新，后者修复：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

### `v-model` 绑定的值变化了但组件无反应

原因：当前版本组件内部不消费 `modelValue`，也不会回写 `update:modelValue`。绑定值只由业务侧持有，等待组件后续版本实现选中回写。
