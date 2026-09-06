---
title: ULoading 加载示例
description: ULoading 渲染动画；vLoading 指令在目标元素上盖遮罩
---

`ULoading` 的 `type` 为 `'dual-ring' | 'dot' | 'ring' | 'bars'`。遮罩场景用指令 `vLoading`（模板里 `v-loading`），值为真时渲染；指令参数即动画类型。

```vue
<template>
  <u-loading type="dual-ring" />
  <u-loading type="dot" />
  <u-loading type="ring" />
  <u-loading type="bars" />
</template>
```

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const loading = shallowRef(true)
</script>

<template>
  <div v-loading:dual-ring="loading" style="height: 120px; position: relative">内容区</div>
</template>
```
