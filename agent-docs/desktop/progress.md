---
title: "UProgress - 进度条"
description: "用 UProgress 展示条形或环形进度，type 可为固定色或按百分比函数"
---

# UProgress - 进度条

## 引入

```ts
import { UProgress } from '@veltra/desktop'
```

## 示例

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

## API / 类型

```ts
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** progress组件属性 */
export interface ProgressProps {
  /** 类型 */
  type: ColorType | ((percentage: number) => ColorType)
  /** 圆形进度条尺寸 */
  size?: number | string
  /** 进度百分比 */
  percentage?: number
  /** 是否圆形进度条 */
  circle?: boolean
}

/** progress组件定义的事件 */
export interface ProgressEmits {}

/** progress组件暴露的属性和方法(组件内部使用) */
export interface _ProgressExposed {}

/** progress组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressExposed = DeconstructValue<_ProgressExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
