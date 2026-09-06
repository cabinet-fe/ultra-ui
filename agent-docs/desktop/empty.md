---
title: "UEmpty - 空状态"
description: "用 UEmpty 展示空列表占位图标与文案"
---

# UEmpty - 空状态

## 引入

```ts
import { UEmpty } from '@veltra/desktop'
```

## 示例

`UEmpty` 默认图标尺寸 48、文案「暂无数据」。没有插槽，只改 `size` 和 `text`。

```vue
<template>
  <u-empty />
  <u-empty :size="64" text="暂无符合条件的记录" />
</template>
```

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

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

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
