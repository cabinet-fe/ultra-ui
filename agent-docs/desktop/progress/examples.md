---
title: UProgress 进度条示例
description: 用 UProgress 展示条形或环形进度，type 可为固定色或按百分比函数
---

`UProgress` 的 `percentage` 会被限制在 0–100。`type` 默认 `primary`，也可传入函数按百分比返回 `ColorType`。`circle` 切到环形，`size` 控制环形宽高。默认插槽参数是 `{ percentage, type }`。

```vue
<script setup lang="ts">
import type { ColorType } from '@veltra/desktop'

function statusType(percentage: number): ColorType {
  if (percentage < 70) return 'success'
  if (percentage < 90) return 'warning'
  return 'danger'
}
</script>

<template>
  <u-progress :percentage="42" type="primary" />
  <u-progress :percentage="80" circle :size="96" :type="statusType">
    <template #default="{ percentage, type }">
      <span :style="{ color: `var(--u-color-${type})` }">{{ percentage }}%</span>
    </template>
  </u-progress>
</template>
```
