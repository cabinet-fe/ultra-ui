# UGanttChart — 甘特图

> `import type { GanttChartProps, GanttChartEmits } from '@veltra/desktop'`

甘特图组件，用于展示项目时间线、任务进度与依赖关系。

## Import

```ts
import { UGanttChart } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 当前选中的条目 ID |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | 选中项变化时触发 |

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref<string>()
</script>

<template>
  <u-gantt-chart v-model="selected" />
</template>
```

### 监听选中变化

```vue
<script setup lang="ts">
import { ref } from 'vue'

const taskId = ref<string>()

const onSelect = (id: string) => {
  console.log('选中任务:', id)
}
</script>

<template>
  <u-gantt-chart
    v-model="taskId"
    @update:model-value="onSelect"
  />
</template>
```

### 传入初始值

```vue
<script setup lang="ts">
import { ref } from 'vue'

const currentId = ref('task-001')
</script>

<template>
  <u-gantt-chart v-model="currentId" />
</template>
```
