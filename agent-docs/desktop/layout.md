---
title: "ULayout - 栅格布局"
description: "用 cols / rows 分栏，resizable 时至少一列是固定像素才能拖拽"
---

# ULayout - 栅格布局

## 引入

```ts
import { ULayout } from '@veltra/desktop'
```

## 示例

`ULayout` 是 CSS Grid 外壳。`cols` / `rows` 可以是空格分隔字符串或数组。`resizable` 为 true 时 `gap` 固定，且需要至少一列宽度是固定像素才能拖；可用 `col-min-sizes` 按列索引限制最小宽度（未写的列可被压到 0）。

```vue
<template>
  <u-layout cols="200px 1fr" :gap="16" style="height: 100vh">
    <aside>侧栏</aside>
    <main>主区</main>
  </u-layout>
</template>
```

可拖拽三栏，并限制每列不小于 120px：

```vue
<template>
  <u-layout cols="240px 1fr 280px" resizable :col-min-sizes="[120, 120, 120]">
    <aside>左</aside>
    <main>中</main>
    <aside>右</aside>
  </u-layout>
</template>
```

行布局用 `rows`，例如页头 + 内容 + 页脚：`rows="auto 1fr auto"`。

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 布局组件属性 */
export interface LayoutProps {
  /**
   * 元素标签
   * @default "div"
   */
  tag?: string
  /** 间距 */
  gap?: number | string
  /**
   * 每个列的布局
   * @example
   * ```ts
   * // 以下都是合法的值
   * const cols = '200px 1fr'
   * const cols = ['200px', '1fr']
   * ```
   * [fr是什么?](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex_value)
   */
  cols?: string[] | string

  /**
   * 每一行的布局
   * @example
   * ```ts
   * // 以下都是合法的值
   * const rows = '200px 1fr'
   * const rows = ['200px', '1fr']
   * ```
   * [fr是什么?](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex_value)
   */
  rows?: string[] | string
  /**
   * 尺寸是否可调节
   * @default false
   * @description 注意：当为true时，gap固定且需要有一项宽度为固定像素才能够拖拽
   */
  resizable?: boolean
  /**
   * 每列的最小宽度（px），按列索引与 cols 对应，仅 resizable 拖拽时生效。
   * 未指定的列不限制（可被压至 0）。
   * @example
   * ```ts
   * // 三栏拖拽时，左栏不小于 120px，右栏不小于 200px
   * :cols="['1fr', '2fr', '300px']" :col-min-sizes="[120, undefined, 200]"
   * ```
   */
  colMinSizes?: (number | undefined)[]
}

/** 布局组件定义的事件 */
export interface LayoutEmits {
  /** 开始拖拽调节某条间隔（index 为间隔左侧列的索引） */
  (e: 'resize-start', index: number): void
  /** 拖拽调节结束 */
  (e: 'resize-end', index: number): void
}

/** 布局组件暴露的属性和方法(组件内部使用) */
export interface _LayoutExposed {}

/** 布局组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LayoutExposed = DeconstructValue<_LayoutExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
