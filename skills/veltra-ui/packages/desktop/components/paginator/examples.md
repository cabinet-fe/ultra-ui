# UPaginator 示例

## 基础分页

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

## 配合表格

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

## 监听变化事件

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

## 简洁模式

```vue
<script setup>
import { ref } from 'vue'
const page = ref(1)
</script>

<template>
  <u-paginator v-model:page-number="page" :total="100" simple />
</template>
```
