---
title: UDivider 分割线（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端分割线组件，区分相邻内容区块：水平 / 垂直两个方向，支持虚线与嵌套文字（左 / 中 / 右对齐），根元素带 role=separator 无障碍语义，无事件与暴露方法。'
aliases: [UDivider, Divider, 分割线, 分隔线, 分割, Hr, 移动端分割线]
keywords:
  [
    UDivider,
    DividerProps,
    direction,
    dashed,
    align,
    separator,
    水平分割线,
    垂直分割线,
    虚线,
    嵌套文字,
    区块分隔,
    内容分组,
    分栏间隔,
    移动端分割线
  ]
---

# UDivider 分割线（@veltra/mobile 移动端）

`@veltra/mobile` 导出分割线组件 `UDivider`（`packages/mobile/src/index.ts` 具名导出）：渲染一条区分相邻内容区块的分割线，根元素带 `role="separator"` 与 `aria-orientation`。水平方向可嵌套文字（默认插槽），文字支持左 / 中 / 右对齐；垂直方向是行内元素，用于一行内多个元素的间隔。没有事件、插槽属性与暴露方法。

## 快速上手

```vue
<script setup lang="ts">
import { UDivider } from '@veltra/mobile'
import '@veltra/mobile/components/divider/style'
</script>

<template>
  <!-- 默认水平实线，根元素为 div.um-divider -->
  <p>第一段内容</p>
  <u-divider />
  <p>第二段内容</p>
</template>
```

前置条件：入口已 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则边框与文字 token（`--u-border-color` / `--u-text-color-main`）为空。组件样式按需引入 `@veltra/mobile/components/divider/style`，仅导入组件不带入样式。

## API 签名

```ts
/** 分割线组件属性 */
export interface DividerProps {
  /** 方向，水平或垂直，默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'

  /** 是否为虚线，默认 false */
  dashed?: boolean

  /** 嵌套文字的对齐位置，仅水平方向且默认插槽非空时生效，默认 'center' */
  align?: 'left' | 'center' | 'right'
}

/** 分割线组件定义的事件 */
export interface DividerEmits {}
```

默认插槽渲染嵌套文字 / 内容（仅水平方向有布局意义）；`DividerEmits` 为空，组件无事件。

## 参数说明

| 参数        | 类型                            | 默认           | 必填 | 约束                                                          |
| ----------- | ------------------------------- | -------------- | :--: | ------------------------------------------------------------- |
| `direction` | `'horizontal' \| 'vertical'`    | `'horizontal'` |  否  | `vertical` 时渲染为行内元素，高 `1em`、左右边距 `--u-gap`      |
| `dashed`    | `boolean`                       | `false`        |  否  | 实线改虚线；水平与垂直、嵌套文字形态下的两侧线全部生效        |
| `align`     | `'left' \| 'center' \| 'right'` | `'center'`     |  否  | 仅 `direction="horizontal"` 且插槽非空时生效；收窄侧线宽为 5% |

## 典型示例

### 嵌套文字与对齐

```vue
<script setup lang="ts">
import { UDivider } from '@veltra/mobile'
import '@veltra/mobile/components/divider/style'
</script>

<template>
  <!-- 文字居中（默认），两侧平分线条 -->
  <u-divider>标题</u-divider>

  <!-- 文字靠左，左侧线收窄为 5% 宽 -->
  <u-divider align="left">左对齐</u-divider>

  <!-- 文字靠右，右侧线收窄为 5% 宽 -->
  <u-divider align="right">右对齐</u-divider>
</template>
```

### 垂直分割一行内元素

```vue
<script setup lang="ts">
import { UButton, UDivider } from '@veltra/mobile'
import '@veltra/mobile/components/divider/style'
import '@veltra/mobile/components/button/style'
</script>

<template>
  <div style="display: flex; align-items: center; gap: 8px">
    <span>文本</span>
    <u-divider direction="vertical" />
    <u-button size="small">按钮</u-button>
    <u-divider direction="vertical" dashed />
    <a>链接</a>
  </div>
</template>
```

### 卡片内分区与虚线

```vue
<script setup lang="ts">
import { UCard, UDivider, UText } from '@veltra/mobile'
import '@veltra/mobile/components/card/style'
import '@veltra/mobile/components/divider/style'
import '@veltra/mobile/components/text/style'
</script>

<template>
  <u-card>
    <u-text as="title">账户信息</u-text>
    <u-text>余额 ¥128.00</u-text>
    <u-divider dashed>明细</u-divider>
    <u-text as="additional">以下为最近交易</u-text>
  </u-card>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库方向属性是 `direction`，不是 AntD 的 `type`；文字对齐属性是 `align`，不是 AntD 的 `orientation`；不支持 `orientationMargin` 与 `plain`，需要文字边距 / 弱化样式时在插槽内容或外层自行设置。
> - 垂直分割线不渲染插槽内容布局（无嵌套文字形态）；需要带文字的分割只能用水平方向。
> - 分割线颜色取 `--u-border-color`、文字取 `--u-text-color-main`；入口未调用 `loadTheme()` 时无颜色。
> - 组件根元素是块级 `div`（垂直时为行内块），上下外边距 `--u-gap-large` 由组件样式给出，需要紧凑排布时在外层覆盖 `margin`。
> - 组件样式按需引入 `@veltra/mobile/components/divider/style`，仅 `import { UDivider } from '@veltra/mobile'` 不带入样式。

## 常见问题

### 分割线上下空白过大

原因：水平分割线自带上下外边距 `--u-gap-large`（light 主题 12px）。修复：在外层覆盖 `margin`：

```vue
<script setup lang="ts">
import { UDivider } from '@veltra/mobile'
import '@veltra/mobile/components/divider/style'
</script>

<template>
  <u-divider style="margin: 4px 0">紧凑分割线</u-divider>
</template>
```

### 垂直分割线高度不对

原因：垂直形态高度固定 `1em`，随父级字号缩放，不跟随容器高度。修复：给 `u-divider` 覆盖 `height`（如 `style="height: 100%"` 配合 flex 容器 `align-items: stretch`）。
