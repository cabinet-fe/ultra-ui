# UPaginator — 分页器

> `import type { PaginatorProps, PaginatorEmits, PaginatorExposed } from '@veltra/desktop'`

## Import

```ts
// UPaginator 由 Vite 自动导入，无需手动 import
```

## Props

| prop              | type                              | default                            | 说明                                           |
| ----------------- | --------------------------------- | ---------------------------------- | ---------------------------------------------- |
| `pageNumber`      | `number`                          | `1`                                | 当前页码，支持 `v-model:page-number`           |
| `pageSize`        | `number`                          | `10`                               | 每页显示条数，支持 `v-model:page-size`         |
| `total`           | `number`                          | `0`                                | 数据总数                                       |
| `size`            | `'large' \| 'default' \| 'small'` | `'default'`                        | 尺寸模式（通过 `useFallbackProps` 提供默认值） |
| `pageSizeOptions` | `number[]`                        | `config.paginator.pageSizeOptions` | 每页显示条数的可选项，不传时取全局配置         |
| `simple`          | `boolean`                         | —                                  | 简洁模式，开启后隐藏页码按钮和跳页码输入       |

## Emits

| event               | 参数              | 说明                                       |
| ------------------- | ----------------- | ------------------------------------------ |
| `update:pageNumber` | `(value: number)` | `v-model:page-number` 绑定事件             |
| `update:pageSize`   | `(value: number)` | `v-model:page-size` 绑定事件               |
| `change:pageNumber` | `(value: number)` | 页码变化后触发（所有场景）                 |
| `change:pageSize`   | `(value: number)` | 每页条数变化后触发，同时自动将页码重置为 1 |

## Slots

无插槽。

## Exposed

```ts
interface PaginatorExposed {
  /** 分页器根 DOM 元素引用 */
  el: import('vue').ShallowRef<HTMLElement | undefined>
}
```

## Examples

### 基础分页

```vue
<script setup>
import { ref } from 'vue'
const pageNumber = ref(1)
const pageSize = ref(10)
</script>

<template>
  <u-paginator v-model:page-number="pageNumber" v-model:page-size="pageSize" :total="256" />
</template>
```

### 配合表格

```vue
<script setup>
import { ref, computed } from 'vue'

const allData = ref(Array.from({ length: 500 }, (_, i) => ({ id: i, name: `Item ${i}` })))
const pageNumber = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (pageNumber.value - 1) * pageSize.value
  return allData.value.slice(start, start + pageSize.value)
})
</script>

<template>
  <u-table :columns="columns" :data="pagedData" />
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="allData.length"
    :page-size-options="[10, 20, 50, 100]"
  />
</template>
```

### 监听变化事件

```vue
<script setup>
import { ref } from 'vue'

const pageNumber = ref(1)
const pageSize = ref(10)

function onPageNumberChange(val: number) {
  console.log('页码变为', val)
  // 发起请求获取对应页数据
}

function onPageSizeChange(val: number) {
  console.log('每页条数变为', val)
}
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="500"
    :page-size-options="[10, 20, 50]"
    @change:page-number="onPageNumberChange"
    @change:page-size="onPageSizeChange"
  />
</template>
```

### 简洁模式

```vue
<script setup>
import { ref } from 'vue'
const page = ref(1)
</script>

<template>
  <u-paginator v-model:page-number="page" :total="100" simple />
</template>
```
