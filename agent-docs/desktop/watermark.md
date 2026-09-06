---
title: "UWatermark - 水印"
description: "用 UWatermark 在内容区或整页叠加文字水印"
---

# UWatermark - 水印

## 引入

```ts
import { UWatermark } from '@veltra/desktop'
```

## 示例

`UWatermark` 用 `text` 绘制重复文字水印。默认旋转 `-30`、字号 60。不传 `append-to-body` 时水印包住默认插槽；`append-to-body` 为真时 Teleport 到 `body` 覆盖整页。

```vue
<template>
  <u-watermark text="内部资料" :font-size="48" :route="-24">
    <div style="min-height: 240px; padding: 24px">
      <p>这份内容带局部水印。</p>
    </div>
  </u-watermark>
</template>
```

整页水印：

```vue
<template>
  <u-watermark text="仅供内部传阅" append-to-body />
</template>
```

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** watermark组件属性 */
export interface WatermarkProps {
  /** 文字 */
  text?: string
  /** 图片 */
  image?: string
  /** 是否传送到body下 */
  appendToBody?: boolean
  /** 旋转弧度 */
  route?: number
  /** 字体大小 */
  fontSize?: number
}

/** watermark组件定义的事件 */
export interface WatermarkEmits {}

/** watermark组件暴露的属性和方法(组件内部使用) */
export interface _WatermarkExposed {}

/** watermark组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type WatermarkExposed = DeconstructValue<_WatermarkExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
