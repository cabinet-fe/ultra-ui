---
title: "UCard / UCardHeader / UCardCover / UCardContent / UCardAction - 卡片"
description: "用页头、封面、正文与操作区拼一张卡片，子组件只能放在 UCard 内"
keywords:
  - UCard
  - UCardHeader
  - UCardCover
  - UCardContent
  - UCardAction
  - @veltra/desktop
  - card
  - Card
aliases:
  - card
  - UCard
  - UCardHeader
  - UCardCover
  - UCardContent
  - UCardAction
---

## 快速上手

```ts
import { UCard, UCardHeader, UCardCover, UCardContent, UCardAction } from '@veltra/desktop'
```

## 典型示例

`UCardHeader` / `UCardCover` / `UCardContent` / `UCardAction` 必须写在 `UCard` 里（脱离卡片会丢样式并告警）。`integrate` 去掉阴影，适合嵌进已有底的布局。`UCardCover` 的 `src` 必填。

### UCard / UCardHeader / UCardContent / UCardAction

```vue
<template>
  <u-card width="360">
    <u-card-header>项目概览</u-card-header>
    <u-card-content>本周完成 12 个任务，剩余 3 个阻塞项。</u-card-content>
    <u-card-action align-right>
      <u-button type="primary" text>取消</u-button>
      <u-button type="primary">确认</u-button>
    </u-card-action>
  </u-card>
</template>
```

`align-right` 把操作区按钮靠右。

### UCardCover

```vue
<template>
  <u-card width="360">
    <u-card-cover src="/cover.jpg" height="160" />
    <u-card-content>封面图下方的说明文字。</u-card-content>
  </u-card>
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 卡片组件属性 */
export interface CardProps extends ComponentProps {
  /** 宽度 */
  width?: string | number

  /** 融合样式，卡片不再有阴影 */
  integrate?: boolean
}

export interface CardActionProps {
  /** 右对齐 */
  alignRight?: boolean
}

export interface CardContentProps {
  /** 封面模式 */
  cover?: boolean
}

export interface CardCoverProps {
  /** 封面图片地址 */
  src: string
  /** 封面高度 */
  height?: string | number
}

export interface CardEmits {}

export interface _CardExposed {}

export type CardExposed = DeconstructValue<_CardExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
