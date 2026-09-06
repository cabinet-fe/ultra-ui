---
title: "useReactiveSize - 元素响应式宽高与容器尺寸监听"
description: "基于 ResizeObserver 的响应式元素宽高组合式函数，返回包含 width 和 height 的响应式 reactive 对象，模板直接绑定，适用于自适应图表 resize、容器视口自适应布局、动态卡片宽高计算与响应式组件开发"
keywords: ["useReactiveSize", "@veltra/compositions", "use-reactive-size", "元素响应式宽高与容器尺寸监听"]
aliases: ["use-reactive-size", "useReactiveSize", "元素响应式宽高与容器尺寸监听"]
---
## 快速上手

`useReactiveSize` 观察一个或一组元素 ref，返回 `{ width, height }` 的 reactive 对象（不是 `Ref`），模板里直接读 `size.width`。尺寸来自 `borderBoxSize` 的 `inlineSize` / `blockSize`。内部调用同包的 `useResizeObserver`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { useReactiveSize } from '@veltra/compositions'

const el = shallowRef<HTMLElement>()
const size = useReactiveSize(el)

const a = shallowRef<HTMLElement>()
const b = shallowRef<HTMLElement>()
const sizes = useReactiveSize([a, b])
</script>

<template>
  <div ref="el">{{ size.width }} × {{ size.height }}</div>
  <div ref="a" />
  <div ref="b" />
  <p>{{ sizes[0].width }}, {{ sizes[1].width }}</p>
</template>
```

单参数返回单个 `ElementSize`，数组参数返回同长度的 `ElementSize[]`。元素尚未挂载时宽高为 `0`。

