---
title: UGrid / UGridItem 示例
description: 按列数与 span 排栅格，列数可按容器断点变化
---

`UGrid` 默认 24 列。`cols` 可以是数字、断点对象或函数。`UGridItem` 的 `span` 为占用列数，`0` 隐藏，`"full"` 占满当前行。断点对象形式的 `span` 必须带 `default`。

## UGrid 固定列数

```vue
<template>
  <u-grid :cols="12" gap="8">
    <u-grid-item :span="6">左半</u-grid-item>
    <u-grid-item :span="6">右半</u-grid-item>
  </u-grid>
</template>
```

## UGridItem 跨距与响应式

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Breakpoint } from '@veltra/desktop'

const bp = ref<Breakpoint>()
</script>

<template>
  <u-grid :cols="{ xs: 4, sm: 8, md: 12, lg: 24 }" :gap="12" @breakpoint-change="bp = $event">
    <u-grid-item span="full">整行，当前断点 {{ bp?.name }}</u-grid-item>
    <u-grid-item :span="{ xs: 4, sm: 4, md: 6, lg: 8, default: 12 }">左</u-grid-item>
    <u-grid-item :span="{ xs: 4, sm: 4, md: 6, lg: 8, default: 12 }">右</u-grid-item>
  </u-grid>
</template>
```
