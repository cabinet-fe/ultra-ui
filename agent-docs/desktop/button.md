---
title: "UButton / UButtonGroup - 按钮"
description: "按钮类型、图标与按钮组统一透传 props"
keywords:
  - UButton
  - UButtonGroup
  - @veltra/desktop
  - button
  - Button
  - ButtonGroup
  - 按钮
aliases:
  - button
  - UButton
  - UButtonGroup
  - Button
  - ButtonGroup
  - 按钮
---
## 快速上手

```ts
import { UButton, UButtonGroup } from '@veltra/desktop'
```

## 典型示例

`UButton` 的 `type` 取主题色（`primary` / `success` / `warning` / `danger` / `info`）。`plain` 为描边，`text` 为文本按钮，`circle` 为圆形（通常配合 `icon`）。`icon` 传 `@veltra/icons/normal` 的组件。默认点击会冒泡，需要拦住时设 `:propagate="false"`。

### UButton

```vue
<script setup lang="ts">
import { Edit, Search } from '@veltra/icons/normal'
</script>

<template>
  <u-button type="primary" :icon="Search">搜索</u-button>
  <u-button type="primary" plain>朴素</u-button>
  <u-button type="danger" text>文本</u-button>
  <u-button type="primary" circle :icon="Edit" />
  <u-button loading type="primary">保存中</u-button>
</template>
```

### UButtonGroup

组通过默认插槽参数 `props` 把组上的 `size` / `disabled` 等 `ButtonProps` 透传给每个子按钮，子项 `v-bind="props"` 后再写自己的 `type`。

```vue
<template>
  <u-button-group v-slot="{ props }" size="small">
    <u-button v-bind="props" type="primary">剪切</u-button>
    <u-button v-bind="props" type="primary">复制</u-button>
    <u-button v-bind="props" type="primary">粘贴</u-button>
  </u-button-group>
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { Component, ShallowRef } from 'vue'

/** 按钮类型 */
export type ButtonType = ColorType

/** 按钮属性类型 */
export interface ButtonProps extends ComponentProps {
  /** 按钮类型 */
  type?: ButtonType
  /** 是否以文本形式展示 */
  text?: boolean
  /** 朴素模式 */
  plain?: boolean
  /** 加载中 */
  loading?: boolean
  /** 加载图标 */
  loadingIcon?: Component
  /** 圆形 */
  circle?: boolean
  /** 禁用 */
  disabled?: boolean
  /** 图标 */
  icon?: Component
  /** 图标大小, 单位px */
  iconSize?: number
  /** 图标位置 */
  iconPosition?: 'left' | 'right'
  /** 事件是否传播（冒泡或者捕获） */
  propagate?: boolean
}

export interface ButtonEmits {
  /** 点击事件 */
  (name: 'click', e: MouseEvent): void
}

/** 在组件内部引用 */
export interface _ButtonExposed {
  el: ShallowRef<HTMLButtonElement | undefined>
}

/** 按钮暴露的属性和方法 */
export type ButtonExposed = DeconstructValue<_ButtonExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
