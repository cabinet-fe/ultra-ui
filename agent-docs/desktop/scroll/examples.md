---
title: UScroll 示例
description: 自定义滚动条容器，用 ref.scrollTo 定位，always 可常显轨道
---

给需要滚动的区域包 `UScroll`，用 `height`（或外层高度 + `height` 默认 100%）限制视口。`always` 为 true 时滚动条常显。通过组件实例的 `scrollTo({ x, y })` 定位，`update()` 在内容尺寸变化后刷新轨道。

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ScrollExposed } from '@veltra/desktop'

const scrollRef = useTemplateRef<ScrollExposed>('scroll')

function toTop() {
  scrollRef.value?.scrollTo({ y: 0 })
}
</script>

<template>
  <u-scroll ref="scroll" height="240px" always>
    <p v-for="n of 40" :key="n">行 {{ n }}</p>
  </u-scroll>
  <u-button @click="toTop">回到顶部</u-button>
</template>
```
