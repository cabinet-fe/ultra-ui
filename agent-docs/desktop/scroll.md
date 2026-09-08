---
title: "UScroll - 滚动容器"
description: "自定义滚动条容器，用 ref.scrollTo 定位，always 可常显轨道"
keywords:
  - UScroll
  - @veltra/desktop
  - scroll
  - Scroll
  - 滚动容器
aliases: ["scroll", "UScroll", "Scroll", "滚动容器"]
---

## 快速上手

```ts
import { UScroll } from '@veltra/desktop'
```

## 典型示例

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

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { CSSProperties, ShallowRef } from 'vue'

export type ScrollPosition = {
  /** 横向位置 */
  x?: number
  /** 纵向位置 */
  y?: number
  /** 横向滚动宽度 */
  sw?: number
  /** 纵向滚动高度 */
  sh?: number
  /** 横向可视宽度 */
  cw?: number
  /** 纵向可视高度 */
  ch?: number
}

/** 滚动条组件属性 */
export interface ScrollProps {
  /**
   * 容器元素标签名
   * @default div
   */
  tag?: string
  /**
   * 容器高度
   * @default 100%
   */
  height?: string | number

  /**
   * 总是显示滚动条
   * @default false
   */
  always?: boolean

  /**
   * 内容样式
   */
  contentStyle?: string | CSSProperties

  /**
   * 容器样式
   */
  containerStyle?: string | CSSProperties

  /** 内容类名 */
  contentClass?: unknown

  /** 容器类名 */
  containerClass?: string | string[]

  /** 拖拽防抖时间 */
  dragDebounce?: number
}

export interface ScrollEmits {
  /** 滚动事件 */
  (e: 'scroll', position: Required<ScrollPosition>): void
  /** 尺寸调整事件 */
  (e: 'resize', targets: HTMLElement[]): void
}

export interface _ScrollExposed {
  /**
   * 滚动至
   * @param position 位置
   */
  scrollTo(position: ScrollPosition): void

  /**
   * 更新滚动条状态
   */
  update(): void

  /** 滚动内容元素引用 */
  contentRef: ShallowRef<HTMLElement | undefined>

  /** 滚动容器元素引用 */
  containerRef: ShallowRef<HTMLElement | undefined>

  /** 滚动容器元素引用 */
  el: ShallowRef<HTMLElement | undefined>
}

export type ScrollExposed = DeconstructValue<_ScrollExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
