# useDnD 示例

## 基础排序

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

const list = ref([
  { id: 1, label: 'A' },
  { id: 2, label: 'B' }
])

const { parentRef, values } = useDnD({
  values: list, // 与 list 同一引用
  plugins: [animations()],
  onSort: ({ previousValues, values }) => {}
})
</script>

<template>
  <ul ref="parentRef">
    <li v-for="item in values" :key="item.id">{{ item.label }}</li>
  </ul>
</template>
```

## 拖拽手柄

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

const list = ref([
  { id: 1, label: 'A' },
  { id: 2, label: 'B' }
])

const { parentRef, values } = useDnD({
  values: list,
  plugins: [animations()],
  dragHandle: '.handle'
})
</script>

<template>
  <ul ref="parentRef">
    <li v-for="item in values" :key="item.id">
      <span class="handle">≡</span>
      {{ item.label }}
    </li>
  </ul>
</template>
```

## 多容器互拖

```ts
import { ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

const todo = ref([{ id: 1, label: '任务 1' }])
const done = ref([{ id: 2, label: '任务 2' }])

const { parentRef: todoParent, values: todoValues } = useDnD({
  values: todo,
  group: 'tasks',
  plugins: [animations()]
})

const { parentRef: doneParent, values: doneValues } = useDnD({
  values: done,
  group: 'tasks',
  plugins: [animations()]
})
```
