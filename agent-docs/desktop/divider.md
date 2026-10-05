---
title: UDivider 分割线
description: 从 @veltra/desktop 导入 UDivider 分割线组件，区分相邻内容区块：水平 / 垂直两个方向，支持虚线与嵌套文字（左 / 中 / 右对齐），无事件与暴露方法。
aliases: [UDivider, Divider, 分割线, 分隔线, 分割, Hr]
keywords:
  [
    DividerProps,
    direction,
    dashed,
    align,
    水平分割线,
    垂直分割线,
    虚线,
    嵌套文字,
    区块分隔,
    内容分组,
    分栏间隔
  ]
---

# UDivider 分割线

`@veltra/desktop` 导出组件 `UDivider`：渲染一条区分相邻内容区块的分割线。水平方向可嵌套文字（默认插槽），文字支持左 / 中 / 右对齐；垂直方向是行内元素，用于一行内多个元素的间隔。没有事件、插槽属性与暴露方法。

## 快速上手

```vue
<script setup lang="ts">
import { UDivider } from '@veltra/desktop'
</script>

<template>
  <!-- 默认水平实线，根元素为 div.u-divider -->
  <p>第一段内容</p>
  <UDivider />
  <p>第二段内容</p>
</template>
```

前置条件：入口已 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则边框与文字 token（`--u-border-color` / `--u-text-color-main`）为空。

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

| 参数        | 类型                                   | 默认          | 必填 | 约束                                                            |
| ----------- | -------------------------------------- | ------------- | :--: | --------------------------------------------------------------- |
| `direction` | `'horizontal' \| 'vertical'`           | `'horizontal'` |  否  | `vertical` 时渲染为行内元素，高 `1em`、左右边距 `--u-gap`        |
| `dashed`    | `boolean`                              | `false`       |  否  | 实线改虚线；水平与垂直、嵌套文字形态下的两侧线全部生效          |
| `align`     | `'left' \| 'center' \| 'right'`        | `'center'`    |  否  | 仅 `direction="horizontal"` 且插槽非空时生效；收窄侧线宽为 5%   |

## 典型示例

### 嵌套文字与对齐

```vue
<script setup lang="ts">
import { UDivider } from '@veltra/desktop'
</script>

<template>
  <!-- 文字居中（默认），两侧平分线条 -->
  <UDivider>标题</UDivider>

  <!-- 文字靠左，左侧线收窄为 5% 宽 -->
  <UDivider align="left">左对齐</UDivider>

  <!-- 文字靠右，右侧线收窄为 5% 宽 -->
  <UDivider align="right">右对齐</UDivider>
</template>
```

### 垂直分割一行内元素

```vue
<script setup lang="ts">
import { UDivider } from '@veltra/desktop'
</script>

<template>
  <div style="display: flex; align-items: center">
    <span>文本</span>
    <UDivider direction="vertical" />
    <a>链接</a>
    <UDivider direction="vertical" dashed />
    <a>删除</a>
  </div>
</template>
```

### 虚线分割

```vue
<script setup lang="ts">
import { UDivider } from '@veltra/desktop'
</script>

<template>
  <UDivider dashed>虚线</UDivider>
  <UDivider dashed />
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库方向属性是 `direction`，不是 AntD 的 `type`；文字对齐属性是 `align`，不是 AntD 的 `orientation`；不支持 `orientationMargin` 与 `plain`，需要文字边距 / 弱化样式时在插槽内容或外层自行设置。
> - 垂直分割线不渲染插槽内容布局（无嵌套文字形态）；需要带文字的分割只能用水平方向。
> - 分割线颜色取 `--u-border-color`、文字取 `--u-text-color-main`；入口未调用 `loadTheme()` 时无颜色。
> - 组件根元素是块级 `div`（垂直时为行内块），上下外边距来自 `--u-gap-large` token（light 预设 12px、midnight 预设 14px，并非固定 12px），需要紧凑排布时在外层覆盖 `margin`。
