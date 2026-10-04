---
title: UCard 卡片（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端卡片容器组件：自带背景色、圆角、阴影与内边距，width 控制宽度、size 控制密度档位、integrate 切换无阴影融合样式。移动端只有容器本身，没有 UCardHeader 等子组件，标题与操作区直接在默认插槽组合。'
aliases: [UCard, Card, 卡片, 面板, 区块, 容器, 移动端卡片]
keywords:
  [
    UCard,
    CardProps,
    CardExposed,
    width,
    integrate,
    size,
    卡片,
    面板,
    融合样式,
    无阴影,
    内容排版,
    区块容器,
    移动端卡片,
    页面分区
  ]
---

# UCard 卡片（@veltra/mobile 移动端）

`@veltra/mobile` 导出卡片容器 `UCard`（`packages/mobile/src/index.ts` 具名导出）：自带背景色、圆角、阴影与内边距的无边框容器，`width` 控制宽度、`size` 控制密度档位、`integrate` 切换无阴影的融合样式。移动端只有容器这一个组件：没有 `UCardHeader` / `UCardCover` / `UCardContent` / `UCardAction` 子组件（它们是桌面端导出），标题、正文、操作区直接写在默认插槽里，用 `UText` / `UDivider` / `USpace` 组合。

需要「白底 + 圆角 + 阴影 + 内边距」的分区容器（页面区块、列表卡片、信息组）时用 `UCard`，禁止用裸 `div` 加 `var(--u-*)` 手写等价样式；`UCard` 的底色、圆角、阴影全部取自 `--u-card-*` 与主题 token，深浅色主题切换自动跟随。

## 快速上手

```vue
<script setup lang="ts">
import { UButton, UCard, UText, USpace } from '@veltra/mobile'
import '@veltra/mobile/components/card/style'
import '@veltra/mobile/components/text/style'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/button/style'
</script>

<template>
  <u-card>
    <u-text as="main-title">订单概览</u-text>
    <u-text>今日新增 12 笔，待处理 3 笔，已完成 128 笔。</u-text>
    <u-space>
      <u-button size="small" type="primary">查看详情</u-button>
      <u-button size="small">忽略</u-button>
    </u-space>
  </u-card>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、卡片无颜色与阴影。组件样式按需引入 `@veltra/mobile/components/card/style`，仅导入组件不带入样式。

不传 `width` 时卡片宽度由父容器决定（块级元素撑满父级），移动端整宽卡片不传 `width`。

## API 签名

```ts
/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 组件通用属性 */
export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

/** 卡片组件属性 */
export interface CardProps extends ComponentProps {
  /** 宽度；经 withUnit 处理，数字与纯数字字符串追加 px，其余字符串原样生效 */
  width?: string | number
  /** 融合样式，卡片不再有阴影 */
  integrate?: boolean
}

export interface CardEmits {}

export type CardExposed = {}
```

## 参数说明

| 参数        | 类型                              | 默认        | 必填 | 约束                                                                                    |
| ----------- | --------------------------------- | ----------- | :--: | --------------------------------------------------------------------------------------- |
| `width`     | `string \| number`                | —           |  否  | `320` / `'320'` 均渲染为 `320px`；`'100%'` 等非纯数字字符串原样生效。未传时撑满父容器   |
| `integrate` | `boolean`                         | `false`     |  否  | 去掉阴影；嵌进页面已有底色或作为列表分区容器时使用                                      |
| `size`      | `'small' \| 'default' \| 'large'` | `'default'` |  否  | 同时决定根节点字号与内边距密度，见下表                                                  |

`size` 三档实际取值（`--u-card-padding-*` 为 light 主题值，随主题变化）：

| `size`      | 内容内边距 | 根节点字号 |
| ----------- | ---------- | ---------- |
| `'small'`   | 8px        | 12px       |
| `'default'` | 12px       | 14px       |
| `'large'`   | 16px       | 16px       |

内边距 token（`--u-card-padding-*`）未定义时，回退链走主题 gap token 并抬档：`small` 档用 `--u-gap-default`、`default` 与 `large` 档用 `--u-gap-large`。

卡片外观默认值（light 主题，随 `loadTheme()` 变化）：背景 `var(--u-bg-color-top)`、无边框、圆角 `var(--u-card-radius)`（`--u-radius-large`）、阴影 `var(--u-shadow-sm)`、`overflow: hidden`、`backdrop-filter: var(--u-bg-filter)`。

插槽：默认插槽放卡片全部内容。事件：`CardEmits` 为空。暴露：`CardExposed` 为空对象。

## 典型示例

### 整宽列表卡片

移动端页面主体是纵向滚动的整宽卡片流，不传 `width`、用 `USpace` 纵向排列：

```vue
<script setup lang="ts">
import { UCard, UText, USpace } from '@veltra/mobile'
import '@veltra/mobile/components/card/style'
import '@veltra/mobile/components/text/style'
import '@veltra/mobile/components/space/style'

const orders = [
  { id: 'A1024', status: '配送中', amount: '¥39.90' },
  { id: 'A1025', status: '已完成', amount: '¥128.00' }
]
</script>

<template>
  <u-space direction="vertical" :size="12" style="width: 100%">
    <u-card v-for="order in orders" :key="order.id">
      <u-text as="title">订单 {{ order.id }}</u-text>
      <u-text>状态：{{ order.status }}，金额：{{ order.amount }}</u-text>
    </u-card>
  </u-space>
</template>
```

### 自绘标题、正文与操作区

移动端没有 `UCardHeader` / `UCardAction`，标题用 `UText as="title"`、分隔用 `UDivider`、操作区用 `USpace`：

```vue
<script setup lang="ts">
import { UButton, UCard, UDivider, USpace, UText } from '@veltra/mobile'
import '@veltra/mobile/components/card/style'
import '@veltra/mobile/components/divider/style'
import '@veltra/mobile/components/space/style'
import '@veltra/mobile/components/text/style'
import '@veltra/mobile/components/button/style'
</script>

<template>
  <u-card>
    <u-text as="title">收货地址</u-text>
    <u-text>北京市海淀区中关村大街 1 号 A 座 302</u-text>
    <u-divider />
    <u-space>
      <u-button size="small" type="primary">修改</u-button>
      <u-button size="small" type="danger" text>删除</u-button>
    </u-space>
  </u-card>
</template>
```

### 融合卡片与密度档位

```vue
<script setup lang="ts">
import { UCard, UText } from '@veltra/mobile'
import '@veltra/mobile/components/card/style'
import '@veltra/mobile/components/text/style'
</script>

<template>
  <!-- integrate：无阴影，嵌进页面已有底色时使用 -->
  <u-card integrate>
    <u-text as="title">无阴影融合卡片</u-text>
    <u-text>没有阴影，与页面背景融为一体。</u-text>
  </u-card>

  <u-card size="large">
    <u-text as="title">large 密度</u-text>
    <u-text>更大的内边距（16px）与字号（16px），适合首屏内容卡片。</u-text>
  </u-card>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端 `@veltra/mobile` 只导出 `UCard` 容器本身；桌面端的 `UCardHeader` / `UCardCover` / `UCardContent` / `UCardAction` 子组件在移动端不存在，`import { UCardHeader } from '@veltra/mobile'` 会得到 `undefined`。标题、封面、正文、操作区全部直接写在 `UCard` 默认插槽里组合。
> - 移动端没有独立的标题区 / 操作区背景与内边距：桌面端 `UCardHeader` / `UCardAction` 自带浅色底与独立内边距，移动端卡片是单一内边距的整体容器，分区靠插槽内的 `UDivider`、`UText` 表达。
> - 卡片有 `overflow: hidden`：超出圆角的内容会被裁切，下拉、气泡等浮层不要挂在卡片内部，改挂到 `UCard` 外层。
> - `width` 传数字或纯数字字符串固定像素宽；移动端整宽卡片不传 `width` 或传 `'100%'`，禁止传固定像素导致小屏横向溢出。
> - 本库是 `integrate` 布尔属性表达融合（无阴影）形态，不是 Element Plus 的 `shadow="never"` 属性。
> - 组件样式按需引入 `@veltra/mobile/components/card/style`，仅 `import { UCard } from '@veltra/mobile'` 不带入样式。

## 常见问题

### 卡片内容贴边、没有内边距

原因：未引入组件样式 `@veltra/mobile/components/card/style`，`u-card` 退化成无样式 `div`。修复：

```vue
<script setup lang="ts">
import { UCard } from '@veltra/mobile'
import '@veltra/mobile/components/card/style'
</script>

<template>
  <u-card>有了内边距、圆角与阴影。</u-card>
</template>
```

### 想给卡片加标题栏背景（类似桌面端 UCardHeader）

原因：移动端 `UCard` 没有标题区子组件。修复：在插槽内自己写带背景与内边距的元素，或改用桌面端 `@veltra/desktop` 的 `UCard` 组件组：

```vue
<script setup lang="ts">
import { UCard, UText } from '@veltra/mobile'
import '@veltra/mobile/components/card/style'
import '@veltra/mobile/components/text/style'
</script>

<template>
  <u-card style="padding: 0">
    <div style="padding: 12px; background: var(--u-card-header-bg)">
      <u-text as="title">自绘标题栏</u-text>
    </div>
    <div style="padding: 12px">正文内容。</div>
  </u-card>
</template>
```
