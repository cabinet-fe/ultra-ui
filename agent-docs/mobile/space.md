---
title: USpace 间距容器（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端间距容器组件，为行内子元素统一设置间距：档位（small/default/large）、固定像素或水平垂直二元组，支持垂直排列、交叉轴对齐与自动换行，无事件与暴露方法。'
aliases: [USpace, Space, 间距, 间距容器, 间距组件, FlexGap, 移动端间距]
keywords:
  [
    USpace,
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
    等距排列,
    移动端间距
  ]
---

# USpace 间距容器（@veltra/mobile 移动端）

`@veltra/mobile` 导出间距容器组件 `USpace`（`packages/mobile/src/index.ts` 具名导出）：用行内 flex 容器包裹默认插槽，为任意子元素统一设置间距（替代逐个写 `margin`）。间距支持主题档位（`small` / `default` / `large`）、固定像素值与「水平 × 垂直」二元组；另有垂直排列、交叉轴对齐与自动换行。没有事件、插槽属性与暴露方法。

## 快速上手

```vue
<script setup lang="ts">
import { UButton, USpace } from '@veltra/mobile'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/button/style'
</script>

<template>
  <!-- 默认：水平排列、default 档间距、垂直居中 -->
  <u-space>
    <u-button>按钮一</u-button>
    <u-button>按钮二</u-button>
    <u-button>按钮三</u-button>
  </u-space>
</template>
```

前置条件：入口已 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则档位间距的 `--u-gap-*` token 为空。组件样式按需引入 `@veltra/mobile/components/space/style`，仅导入组件不带入样式。

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

`SpaceEmits` 为空，组件无事件。根元素为 `div.um-space`（`display: inline-flex`）。

## 参数说明

| 参数        | 类型                                          | 默认          | 必填 | 约束                                                                   |
| ----------- | --------------------------------------------- | ------------- | :--: | ---------------------------------------------------------------------- |
| `size`      | `ComponentSize \| number \| [number, number]` | `'default'`   |  否  | 档位值由主题 `--u-gap-*` 决定（light 预设 6 / 8 / 12px）；数字与二元组为 px |
| `direction` | `'horizontal' \| 'vertical'`                  | `'horizontal'` |  否  | `vertical` 时 `flex-direction: column`                                 |
| `align`     | `'start' \| 'center' \| 'end' \| 'baseline'`  | `'center'`    |  否  | 对应 `align-items`；不支持 `stretch`                                   |
| `wrap`      | `boolean`                                     | `false`       |  否  | `flex-wrap: wrap`；垂直方向下无效                                      |

`size` 二元组语义是 `[水平间距, 垂直间距]`，分别落到 `column-gap` 与 `row-gap`；单数字同时作用于两个方向。

插槽：默认插槽放需要等距排列的子元素。

## 典型示例

### 间距档位与固定值

```vue
<script setup lang="ts">
import { UButton, USpace, UTag } from '@veltra/mobile'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/tag/style'
</script>

<template>
  <u-space size="large">
    <u-button>大间距</u-button>
    <u-button>按钮</u-button>
  </u-space>

  <!-- 固定 24px -->
  <u-space :size="24">
    <u-tag>标签一</u-tag>
    <u-tag>标签二</u-tag>
  </u-space>

  <!-- 水平 16px、垂直 8px（配合 wrap 生效于换行间距） -->
  <u-space :size="[16, 8]" wrap>
    <u-tag v-for="i in 12" :key="i">标签 {{ i }}</u-tag>
  </u-space>
</template>
```

### 垂直排列与对齐

```vue
<script setup lang="ts">
import { UButton, USpace, UText } from '@veltra/mobile'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/text/style'
</script>

<template>
  <!-- 垂直排列，子元素靠交叉轴起始边 -->
  <u-space direction="vertical" align="start">
    <u-text as="title">标题</u-text>
    <u-text>交叉轴起始对齐（align=start）。</u-text>
    <u-button size="small">按钮</u-button>
  </u-space>

  <!-- 基线对齐：大小字号文本底边对齐 -->
  <u-space align="baseline">
    <span style="font-size: 24px">大字</span>
    <span>基线对齐</span>
  </u-space>
</template>
```

### 移动端窄屏标签流（wrap 防溢出）

375px 视口内放不下一行时必须开 `wrap`，否则 `inline-flex` 整体横向溢出：

```vue
<script setup lang="ts">
import { USpace, UTag } from '@veltra/mobile'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/tag/style'
</script>

<template>
  <u-space wrap :size="[8, 8]">
    <u-tag v-for="i in 10" :key="i">标签 {{ i }}</u-tag>
  </u-space>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库档位名是 `small` / `default` / `large`，不是 AntD Space 的 `small` / `middle` / `large`；写 `size="middle"` 得不到任何间距档位样式。
> - `align` 不支持 `stretch`；需要拉伸子元素时在外层自行写 `align-items: stretch`。
> - 根元素是 `inline-flex`：不占满父级宽度，垂直排列多行内容时给根元素设 `display: flex` 或 `width: 100%`，否则整体宽度由最宽子元素决定。
> - `wrap` 仅水平方向生效；移动端窄屏标签流必须开 `wrap`，否则横向溢出。
> - 档位间距依赖主题 token；数字与二元组间距不受主题影响，深浅色主题下数值不变。
> - 页面级栅格分栏不用 `USpace`；`USpace` 只做行内元素的等距排列。
> - 组件样式按需引入 `@veltra/mobile/components/space/style`，仅 `import { USpace } from '@veltra/mobile'` 不带入样式。

## 常见问题

### 传了 size="middle" 没有效果

原因：档位枚举是 `small` / `default` / `large`，`middle` 不在其中，落不到任何档位 class，间距退回默认档。修复：

```vue
<script setup lang="ts">
import { USpace, UButton } from '@veltra/mobile'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/button/style'
</script>

<template>
  <u-space size="default">
    <u-button>按钮一</u-button>
    <u-button>按钮二</u-button>
  </u-space>
</template>
```

### 垂直排列后子元素没有撑满宽度

原因：根元素 `inline-flex`，宽度收缩为最宽子元素。修复：给 `u-space` 设 `style="display: flex; width: 100%"`（或仅 `width: 100%`），子元素即按内容宽度排列、容器占满父级。
