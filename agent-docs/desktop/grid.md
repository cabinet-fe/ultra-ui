---
title: "UGrid / UGridItem - 栅格布局"
description: "按列数与 span 排栅格，列数可按容器断点变化"
---

# UGrid / UGridItem - 栅格布局

## 引入

```ts
import { UGrid, UGridItem } from '@veltra/desktop'
```

## 示例

`UGrid` 默认 24 列。`cols` 可以是数字、断点对象或函数。`UGridItem` 的 `span` 为占用列数，`0` 隐藏，`"full"` 占满当前行。断点对象形式的 `span` 必须带 `default`。

### UGrid 固定列数

```vue
<template>
  <u-grid :cols="12" gap="8">
    <u-grid-item :span="6">左半</u-grid-item>
    <u-grid-item :span="6">右半</u-grid-item>
  </u-grid>
</template>
```

### UGridItem 跨距与响应式

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

## API / 类型

```ts
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { ShallowRef } from 'vue'

export interface Breakpoint {
  name: BreakpointName
  level: number
}

/** 断点列 */
export interface BreakCols {
  /** 超小尺寸 */
  xs?: number
  /** 小尺寸 */
  sm?: number
  /** 中等尺寸 */
  md?: number
  /** 大尺寸 */
  lg?: number
  /** 中大尺寸 */
  xl?: number
  /** 默认尺寸 */
  default?: number
}

/** 网格布局组件属性 */
export interface GridProps {
  /**
   * 栅格列数, 可传入数字，对象或者函数
   * @default 24
   * @example
   * ```ts
   * // 数字
   * const cols = 12
   * // 对象
   * const cols = {
   *   xs: 12,
   *   sm: 12,
   *   md: 12,
   *   lg: 24,
   *   xl: 24
   * }
   * // 函数
   * const cols = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl', sizeLevel: number) => {
   *   if (sizeLevel < 3) return 12
   *   return 24
   * }
   * ```
   */
  cols?: number | BreakCols | ((breakpoint: Breakpoint) => number)
  /** 渲染标签 */
  tag?: string
  /** 间隔, 为字符串时可以同时指定行间隔和列间隔 */
  gap?: number | string
}

/**
 * 网格布局项组件事件
 */
export interface GridEmits {
  /** 尺寸变更 */
  (e: 'resize', rect: DOMRect): void
  /** 断点变更 */
  (e: 'breakpoint-change', breakpoint: Breakpoint): void
}

/** 网格布局项组件属性 */
export interface GridItemProps {
  /** 跨距，当指定为0时，则代表隐藏, 默认为1 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 容器标签 */
  tag?: string
}

/** 网格组件暴露的属性和方法(组件内部使用) */
export interface _GridExposed {
  el: ShallowRef<HTMLElement | null>
}

/** 网格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridExposed = DeconstructValue<_GridExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
