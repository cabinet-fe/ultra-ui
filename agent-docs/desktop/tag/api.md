---
title: "UTag - 标签"
description: "UTag 组件 API"
---

# UTag - 标签

## 类型

```ts
import type { ColorType, ComponentSize } from '@veltra/utils'

/** 标签组件属性 */
export interface TagProps {
  type?: ColorType
  /** 是否可移除 */
  closable?: boolean
  /** 尺寸大小 */
  size?: ComponentSize
  /** 是否为圆角 */
  round?: boolean
  /** 深色 */
  dark?: boolean
}

export interface TagEmits {
  (e: 'close'): void
}
export interface TagExposed {}
```

## 示例

见 `./examples.md`
