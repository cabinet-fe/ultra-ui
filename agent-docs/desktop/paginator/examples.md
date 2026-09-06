---
title: UPaginator 示例
description: 分页器用 v-model:page-number 与 v-model:page-size，total 决定页数
---

`page-number` / `page-size` 用对应的 `v-model`。`total` 为数据总条数。`simple` 为简洁模式（不展示页码按钮）。`page-size-options` 控制每页条数下拉；不传则用组件默认档位。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const pageNumber = ref(1)
const pageSize = ref(20)

function loadPage() {
  // 按 pageNumber / pageSize 请求当前页
}
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="120"
    :page-size-options="[10, 20, 50]"
    @change:page-number="loadPage"
    @change:page-size="loadPage"
  />
</template>
```

`v-model` 写回页码和每页条数。翻页或改每页条数时听 `@change:page-number` / `@change:page-size` 去拉当前页。
