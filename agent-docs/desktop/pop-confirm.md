---
title: "UPopConfirm - 气泡确认框"
description: "用 reference 插槽作为触发器，监听 confirm 与 cancel"
---

# UPopConfirm - 气泡确认框

## 引入

```ts
import { UPopConfirm } from '@veltra/desktop'
```

## 示例

`UPopConfirm` 基于 `UTip`。触发器用 `#reference`，文案走 `title`。确认 / 取消分别触发 `confirm` / `cancel`。可改 `confirmText`、`cancelText`，以及 `direction` / `alignment` / `trigger`。

```vue
<script setup lang="ts">
function onConfirm() {
  console.log('已确认')
}
</script>

<template>
  <u-pop-confirm title="确认删除这条记录？" confirm-text="删除" cancel-text="取消" @confirm="onConfirm">
    <template #reference>
      <u-button type="danger">删除</u-button>
    </template>
  </u-pop-confirm>
</template>
```

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

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

import type { Component } from 'vue'

/** 气泡确认框组件属性 */
export interface PopConfirmProps extends Pick<
  TipProps,
  'alignment' | 'direction' | 'trigger' | 'contentTag'
> {
  /**文字 */
  title?: string
  /**icon 图标*/
  icon?: Component
  /**icon 颜色 */
  iconColor?: string
  /**
   * 确认按钮文字
   */
  confirmText?: string
  /**
   * 取消按钮文字
   */
  cancelText?: string
}

/** 气泡确认框组件定义的事件 */
export interface PopConfirmEmits {
  /** 确认事件 */
  (event: 'confirm'): void
  /** 取消事件 */
  (event: 'cancel'): void
}

/** 气泡确认框组件暴露的属性和方法(组件内部使用) */
export interface _PopConfirmExposed {}

/** 气泡确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopConfirmExposed = DeconstructValue<_PopConfirmExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
