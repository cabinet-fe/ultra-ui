# UList — 列表

> `import type { ListProps } from '@veltra/desktop'`

基于数据驱动的通用列表组件，内部使用 `UScroll` 包裹，通过 scoped slot 自定义每个列表项的渲染。

## Import

```ts
// UList 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `size` | `ComponentSize` | `'default'` | `'small'` \| `'default'` \| `'large'` |
| `data` | `Record<string, any>[]` | — | 列表数据 |

## Emits

无事件。

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ item: Record<string, any>, index: number }` | 自定义每个列表项的渲染 |

## Exposed

无暴露属性。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
])
</script>

<template>
  <u-list :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>
</template>
```

### 不同尺寸

```vue
<template>
  <u-list size="small" :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>

  <u-list size="default" :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>

  <u-list size="large" :data="items" v-slot="{ item }">
    <div>{{ item.name }}</div>
  </u-list>
</template>
```

### 使用 index 控制样式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { label: '第一项' },
  { label: '第二项' },
  { label: '第三项' },
])
</script>

<template>
  <u-list :data="items" v-slot="{ item, index }">
    <div :style="{ background: index % 2 === 0 ? '#f5f5f5' : '#fff' }">
      {{ index + 1 }}. {{ item.label }}
    </div>
  </u-list>
</template>
```
