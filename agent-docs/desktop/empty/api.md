---
title: "UEmpty - 空状态"
description: "UEmpty 组件 API"
---

# UEmpty - 空状态

## 类型

```ts
import type { DeconstructValue } from '@veltra/utils'

/** 空内容组件属性 */
export interface EmptyProps {
  /** 图标大小, 默认48 */
  size?: number

  /** 空文本 */
  text?: string
}

/** 空内容组件定义的事件 */
export interface EmptyEmits {}

/** 空内容组件暴露的属性和方法(组件内部使用) */
export interface _EmptyExposed {}

/** 空内容组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type EmptyExposed = DeconstructValue<_EmptyExposed>
```

## 示例

见 `./examples.md`
