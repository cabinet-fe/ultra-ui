---
title: "UBadge - 徽标"
description: "用 UBadge 给内容叠加数值、最大值截断或圆点徽标"
keywords:
  - UBadge
  - @veltra/desktop
  - badge
  - Badge
  - 徽标
aliases: ["badge", "UBadge", "Badge", "徽标"]
---
## 快速上手

```ts
import { UBadge } from '@veltra/desktop'
```

## 典型示例

`UBadge` 包裹目标内容，在右上角叠一层徽标。`value` 为数字时超过 `max`（默认 99）显示为 `max+`。`dot` 只显示小圆点，忽略文案。`hidden` 为真时不渲染徽标。`type` 取 `primary` / `info` / `success` / `warning` / `danger`；也可用 `color` 指定背景色。

```vue
<template>
  <u-badge :value="5">
    <u-button>消息</u-button>
  </u-badge>
  <u-badge :value="120" type="warning">
    <u-button>通知</u-button>
  </u-badge>
  <u-badge :value="200" :max="99">
    <u-button>超过上限</u-button>
  </u-badge>
  <u-badge dot>未读</u-badge>
  <u-badge :value="8" hidden>
    <u-button>已读</u-button>
  </u-badge>
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

/** 徽章组件属性 */
export interface BadgeProps extends ComponentProps {
  /** 显示值 */
  value?: number | string
  /** 类别 */
  type?: ColorType
  /** 自定义背景色 */
  color?: string
  /** 是否隐藏 Badge */
  hidden?: boolean
  /** 最大值 {{max}}+ */
  max?: number
  /** 是否显示小圆点 */
  dot?: boolean
}

/** 徽章组件定义的事件 */
export interface BadgeEmits {
  (e: 'update:modelValue', value: string): void
}

/** 徽章组件暴露的属性和方法(组件内部使用) */
export interface _BadgeExposed {}

/** 徽章组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BadgeExposed = DeconstructValue<_BadgeExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
