# UGanttChart 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref<string>()
</script>

<template>
  <u-gantt-chart v-model="selected" />
</template>
```

## 监听选中变化

```vue
<script setup lang="ts">
import { ref } from 'vue'

const taskId = ref<string>()

const onSelect = (id: string) => {
  console.log('选中任务:', id)
}
</script>

<template>
  <u-gantt-chart v-model="taskId" @update:model-value="onSelect" />
</template>
```

## 传入初始值

```vue
<script setup lang="ts">
import { ref } from 'vue'

const currentId = ref('task-001')
</script>

<template>
  <u-gantt-chart v-model="currentId" />
</template>
```
