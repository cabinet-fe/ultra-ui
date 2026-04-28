# UPaginator — 分页器

> `import type { PaginatorProps } from '@veltra/desktop'`

## Import

```ts
import { UPaginator } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `pageNumber` | `number` | `1` | 当前页码 (v-model:page-number) |
| `pageSize` | `number` | `10` | 每页条数 (v-model:page-size) |
| `total` | `number` | `0` | 数据总数 |
| `size` | `ComponentSize` | — | 尺寸 |
| `pageSizeOptions` | `number[]` | — | 每页条数选项 |
| `simple` | `boolean` | — | 简洁模式（隐藏页码） |

## Emits

| event | 参数 |
|-------|------|
| `update:pageNumber` | `(value: number)` |
| `update:pageSize` | `(value: number)` |

## Examples

### 基础分页

```vue
<script setup>
import { ref } from 'vue'
const pageNumber = ref(1)
const pageSize = ref(10)
const total = ref(256)
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="total"
  />
</template>
```

### 配合表格

```vue
<script setup>
import { ref, computed } from 'vue'

const allData = ref([...Array(500)].map((_, i) => ({ id: i, name: `Item ${i}` })))
const pageNumber = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const s = (pageNumber.value - 1) * pageSize.value
  return allData.value.slice(s, s + pageSize.value)
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

### 简洁模式

```vue
<u-paginator v-model:page-number="page" :total="100" simple />
```
