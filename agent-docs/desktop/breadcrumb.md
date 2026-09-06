---
title: "UBreadcrumb - 面包屑"
description: "用 items 渲染面包屑路径，无 href 的项走 click 事件做 SPA 跳转"
---

# UBreadcrumb - 面包屑

## 引入

```ts
import { UBreadcrumb } from '@veltra/desktop'
```

## 示例

`UBreadcrumb` 只吃 `items`：每项必有 `title`。带 `href` 的项渲染为 `<a>`，由浏览器导航，不触发 `@click`；无 `href` 的链式项点击才发出 `@click`。末级默认是当前页（`aria-current="page"`），需要末级也可点时加 `last-linked`。

```vue
<script setup lang="ts">
import type { BreadcrumbItem } from '@veltra/desktop'
import { shallowRef } from 'vue'

const items: BreadcrumbItem[] = [
  { title: '首页', href: '#/' },
  { title: '设置' },
  { title: '个人资料' }
]

const last = shallowRef('')

function onClick(item: BreadcrumbItem, index: number) {
  last.value = `${index}:${item.title}`
}
</script>

<template>
  <u-breadcrumb :items="items" @click="onClick" />
</template>
```

自定义分隔符用 `#separator` 插槽。禁用某一级设 `disabled: true`，该项既不跳转也不触发 `click`。

## API / 类型

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 面包屑单项 */
export interface BreadcrumbItem {
  /** 展示文案 */
  title: string
  /** 存在时渲染为 `<a>`，由浏览器处理导航 */
  href?: string
  /** 为 true 时不跳转、不触发 click */
  disabled?: boolean
}

/** 面包屑组件属性 */
export interface BreadcrumbProps {
  /** 路径项，顺序为从一级到末级 */
  items: BreadcrumbItem[]
  /** 尺寸 */
  size?: ComponentSize
  /**
   * 末级是否作为链接渲染
   * @default false — 末级为当前页，使用 `aria-current="page"`
   */
  lastLinked?: boolean
}

/** `item` 插槽作用域 */
export interface BreadcrumbSlotScope {
  item: BreadcrumbItem
  index: number
  isLast: boolean
}

/** 面包屑组件事件 */
export interface BreadcrumbEmits {
  /**
   * 可交互项（无 `href` 的链式项）被点击时触发；有 `href` 时不触发（走原生导航）
   */
  (e: 'click', item: BreadcrumbItem, index: number, ev: Event): void
}

/** @internal */
export interface _BreadcrumbExposed {}

export type BreadcrumbExposed = DeconstructValue<_BreadcrumbExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
