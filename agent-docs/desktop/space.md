---
title: USpace 间距容器
description: 从 @veltra/desktop 导入 USpace 间距容器组件，为行内子元素统一设置间距：档位（small/default/large）、固定像素或水平垂直二元组，支持垂直排列、交叉轴对齐与自动换行，无事件与暴露方法。
aliases: [USpace, Space, 间距, 间距容器, 间距组件, FlexGap]
keywords:
  [
    SpaceProps,
    size,
    direction,
    align,
    wrap,
    行内间距,
    组件间距,
    垂直排列,
    交叉轴对齐,
    自动换行,
    gap 间距,
    等距排列
  ]
---

# USpace 间距容器

`@veltra/desktop` 导出组件 `USpace`：用行内 flex 容器包裹默认插槽，为任意子元素统一设置间距（替代逐个写 `margin`）。间距支持主题档位（`small` / `default` / `large`）、固定像素值与「水平 × 垂直」二元组；另有垂直排列、交叉轴对齐与自动换行。没有事件、插槽属性与暴露方法。

## 快速上手

```vue
<script setup lang="ts">
import { UButton, USpace } from '@veltra/desktop'
</script>

<template>
  <!-- 默认：水平排列、default 档间距、垂直居中 -->
  <USpace>
    <UButton>按钮一</UButton>
    <UButton>按钮二</UButton>
    <UButton>按钮三</UButton>
  </USpace>
</template>
```

前置条件：入口已 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则档位间距的 `--u-gap-*` token 为空。

## API 签名

```ts
import type { ComponentSize } from '@veltra/utils'

/** 间距容器组件属性 */
export interface SpaceProps {
  /**
   * 间距：档位走主题 gap token（small / default / large）；
   * 数字为固定间距（px）；二元组为 [水平间距, 垂直间距]（px）。默认 'default'
   */
  size?: ComponentSize | number | [number, number]

  /** 排列方向，默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'

  /** 交叉轴对齐方式，默认 'center' */
  align?: 'start' | 'center' | 'end' | 'baseline'

  /** 是否自动换行，仅水平方向生效，默认 false */
  wrap?: boolean
}

/** 间距容器组件定义的事件 */
export interface SpaceEmits {}
```

`SpaceEmits` 为空，组件无事件。根元素为 `div.u-space`（`display: inline-flex`）。

## 参数说明

| 参数        | 类型                                        | 默认          | 必填 | 约束                                                                 |
| ----------- | ------------------------------------------- | ------------- | :--: | -------------------------------------------------------------------- |
| `size`      | `ComponentSize \| number \| [number, number]` | `'default'` |  否  | 档位值由主题 `--u-gap-*` 决定（light 预设 6 / 8 / 12px）；数字与二元组为 px |
| `direction` | `'horizontal' \| 'vertical'`                | `'horizontal'` |  否  | `vertical` 时 `flex-direction: column`                               |
| `align`     | `'start' \| 'center' \| 'end' \| 'baseline'` | `'center'`    |  否  | 对应 `align-items`；不支持 `stretch`                                 |
| `wrap`      | `boolean`                                   | `false`       |  否  | `flex-wrap: wrap`；垂直方向下无效                                    |

`size` 二元组语义是 `[水平间距, 垂直间距]`，分别落到 `column-gap` 与 `row-gap`；单数字同时作用于两个方向。

## 典型示例

### 间距档位与固定值

```vue
<script setup lang="ts">
import { UButton, USpace, UTag } from '@veltra/desktop'
</script>

<template>
  <USpace size="large">
    <UButton>大间距</UButton>
    <UButton>按钮</UButton>
  </USpace>

  <!-- 固定 24px -->
  <USpace :size="24">
    <UTag>标签一</UTag>
    <UTag>标签二</UTag>
  </USpace>

  <!-- 水平 16px、垂直 8px（配合 wrap 生效于换行间距） -->
  <USpace :size="[16, 8]" wrap>
    <UTag v-for="i in 12" :key="i">标签 {{ i }}</UTag>
  </USpace>
</template>
```

### 垂直排列与对齐

```vue
<script setup lang="ts">
import { UButton, USpace } from '@veltra/desktop'
</script>

<template>
  <!-- 垂直排列，子元素靠交叉轴起始边 -->
  <USpace direction="vertical" align="start">
    <span>标题</span>
    <UButton>按钮</UButton>
  </USpace>

  <!-- 基线对齐：大小字号文本底边对齐 -->
  <USpace align="baseline">
    <span style="font-size: 24px">大字</span>
    <span>基线对齐</span>
  </USpace>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库档位名是 `small` / `default` / `large`，不是 AntD Space 的 `small` / `middle` / `large`；写 `size="middle"` 得不到任何间距档位样式。
> - `align` 不支持 `stretch`；需要拉伸子元素时在外层自行写 `align-items: stretch`。
> - 档位间距依赖主题 token；数字与二元组间距不受主题影响，深浅色主题下数值不变。
> - 页面级栅格分栏用 `UGrid` / `ULayout`，`USpace` 只做行内元素的等距排列，不要用它搭页面骨架。
