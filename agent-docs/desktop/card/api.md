---
title: "UCard / UCardHeader / UCardCover / UCardContent / UCardAction - 卡片"
description: "UCard / UCardHeader / UCardCover / UCardContent / UCardAction 组件 API"
---

# UCard / UCardHeader / UCardCover / UCardContent / UCardAction - 卡片

## 类型

```ts
import type { ComponentProps, DeconstructValue } from '@veltra/utils'

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

## 示例

见 `./examples.md`
