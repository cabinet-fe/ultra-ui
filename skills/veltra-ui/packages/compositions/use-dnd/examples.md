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
  values: list, // 排序结果直接写回 list
  plugins: [animations()]
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

## 可见子集排序（filter）

只对数据的可见子集排序，结果自动合并回原数组，隐藏项保持相对顺序。
DOM 中不参与拖拽的额外元素（如“新增”按钮）用 `draggable` 排除。

```vue
<script setup lang="ts">
import { animations, useDnD } from '@veltra/compositions'

const props = defineProps<{ items: { id: string; label: string; visible: boolean }[] }>()

const { parentRef } = useDnD({
  values: props.items, // 完整数据（含隐藏项），原地 splice 写回
  filter: (item) => item.visible, // 仅可见项参与拖拽
  dragHandle: '.handle',
  draggable: (el) => el.classList.contains('field-item'), // 排除“新增”按钮
  plugins: [animations()]
})
</script>

<template>
  <div ref="parentRef">
    <div v-for="item in items.filter((i) => i.visible)" :key="item.id" class="field-item">
      <span class="handle">≡</span>{{ item.label }}
    </div>
    <button class="add-btn">+ 新增</button>
  </div>
</template>
```

## 动态容器（parent）

容器元素不是静态模板引用时（如需取某子组件的父元素、容器被 `v-if` 重建），
用 `parent` 传 getter，元素出现/替换/移除时自动初始化/重建/销毁。

```ts
import { ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

const props = defineProps<{ items: { id: string; label: string; visible: boolean }[] }>()
const addBtnRef = ref<HTMLElement>()

useDnD({
  values: props.items,
  filter: (item) => item.visible,
  parent: () => addBtnRef.value?.parentElement ?? undefined,
  plugins: [animations()]
})
```

## 只读数据源（getter / computed + onReorder）

数据不可直接写时，用 getter 提供数据、`onReorder` 接收合并后的完整数组自行写回。

```ts
const store = useFieldsStore()

useDnD({
  values: () => store.fields,
  filter: (item) => item.visible,
  onReorder: (fields) => store.replaceFields(fields),
  plugins: [animations()]
})
```
