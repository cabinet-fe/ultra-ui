---
title: "UTip - 提示"
description: "默认插槽为触发器，content 或 content 插槽提供提示内容"
keywords:
  - UTip
  - @veltra/desktop
  - tip
  - Tip
  - 提示
aliases: ["tip", "UTip", "Tip", "提示"]
---

## 快速上手

```ts
import { UTip } from '@veltra/desktop'
```

## 典型示例

`UTip` 默认插槽是触发元素，`content` 为提示文案；复杂内容用 `#content`。`trigger` 为 `'hover'`（默认）或 `'click'`。`direction` 为 `'top' | 'bottom' | 'left' | 'right'`，`alignment` 为 `'center' | 'start' | 'end'`。

```vue
<template>
  <u-tip content="保存后不可撤销" direction="top" alignment="center">
    <u-button>悬停查看</u-button>
  </u-tip>
</template>
```

点击触发，并用插槽自定义内容；`showDelay` 仅在 `trigger="hover"` 时生效：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const visible = shallowRef(false)
</script>

<template>
  <u-tip trigger="click" v-model:visible="visible" :show-delay="0">
    <u-button>点击</u-button>
    <template #content>
      <p>自定义提示内容</p>
    </template>
  </u-tip>
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { CSSProperties } from 'vue'

export type TipDirection = 'top' | 'bottom' | 'left' | 'right'

export type TipAlign = 'center' | 'start' | 'end'

/** tip提示组件组件属性 */
export interface TipProps {
  /** 控制显影 */
  visible?: boolean
  /**提示内容 */
  content?: string
  /** 自定义tip样式 */
  style?: CSSProperties | string
  /** 自定义tip的class */
  class?: string | string[] | Record<string, boolean>
  /** 触发方式 */
  trigger?: 'hover' | 'click'
  /**
   * 触发元素
   * - 通过指定`triggerDom`来更改弹框弹出位置
   */
  triggerDom?: HTMLElement
  /**
   * 方向
   * @default 'auto'
   */
  direction?: TipDirection

  /** 隐藏箭头 */
  hideArrow?: boolean

  /**
   * 对齐方式
   * @default 'center'
   */
  alignment?: TipAlign

  /**
   * tip内容标签
   */
  contentTag?: string

  /** 禁用tip */
  disabled?: boolean

  /**
   * 弹出延时（毫秒），仅 `trigger="hover"` 时生效
   * @default 0
   */
  showDelay?: number
}

/** tip提示组件组件定义的事件 */
export interface TipEmits {
  (e: 'update:visible', value: boolean): void
}

/** tip提示组件组件暴露的属性和方法(组件内部使用) */
export interface _TipExposed {}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipExposed = DeconstructValue<_TipExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
