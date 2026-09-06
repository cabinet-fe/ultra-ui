---
title: UDrawer 抽屉示例
description: 用 v-model 打开抽屉，direction 控制滑出方向
---

`UDrawer` 用 `v-model` 控制显隐。`direction` 为 `'left' | 'right' | 'top' | 'bottom'`，默认从右侧滑出。关闭按钮由 `showClose` 控制。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const visible = shallowRef(false)
</script>

<template>
  <u-button type="primary" @click="visible = true">打开抽屉</u-button>

  <u-drawer v-model="visible" title="详情" direction="right" show-close @close="visible = false">
    <p>抽屉内容</p>
  </u-drawer>
</template>
```
