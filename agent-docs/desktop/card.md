---
title: "UCard / UCardHeader / UCardCover / UCardContent / UCardAction 卡片"
description: "@veltra/desktop 导出的卡片组件组。UCard 提供带阴影的容器，可设置宽度与融合样式；UCardHeader、UCardCover、UCardContent、UCardAction 分别渲染标题区、封面图、正文与操作区，子组件必须写在 UCard 内。"
aliases: [UCard, UCardHeader, UCardCover, UCardContent, UCardAction, Card, 卡片]
keywords: [CardProps, CardCoverProps, CardActionProps, CardContentProps, width, integrate, src, cover, alignRight, 封面图, 操作区, 融合样式, 无阴影, 右对齐, 内容排版]
---

# UCard / UCardHeader / UCardCover / UCardContent / UCardAction 卡片

`@veltra/desktop` 导出卡片组件组：`UCard` 是带阴影的容器，`width` 控制宽度、`integrate` 切换无阴影的融合样式；`UCardHeader`（标题区）、`UCardCover`（封面图）、`UCardContent`（正文区）、`UCardAction`（操作区）四个子组件按序组合出完整卡片。

## 快速上手

```vue
<script setup lang="ts">
import {
  UButton,
  UCard,
  UCardHeader,
  UCardContent,
  UCardAction
} from '@veltra/desktop'
</script>

<template>
  <u-card width="360">
    <u-card-header>项目概览</u-card-header>
    <u-card-content>本周完成 12 个任务，剩余 3 个阻塞项。</u-card-content>
    <u-card-action align-right>
      <u-button type="primary" text>取消</u-button>
      <u-button type="primary">确认</u-button>
    </u-card-action>
  </u-card>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、卡片无颜色与阴影。

## API 签名

```ts
/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

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

export interface CardActionProps {
  /** 右对齐（text-align: right） */
  alignRight?: boolean
}

export interface CardContentProps {
  /** 封面模式：padding 归零、font-size 归零，用于无缝贴合图片 */
  cover?: boolean
}

export interface CardCoverProps {
  /** 封面图片地址，必填 */
  src: string
  /** 封面高度；经 withUnit 处理，数字追加 px */
  height?: string | number
}

export interface CardEmits {}

export type CardExposed = {}
```

## 参数说明

### UCard

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `width` | `string \| number` | — | 否 | `320` / `'320'` 均渲染为 `320px`；`'50%'` 等非纯数字字符串原样生效。未传时宽度由父容器决定 |
| `integrate` | `boolean` | `false` | 否 | 去掉阴影，适合嵌入已有底色的容器 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 回退链：自身 `size` > 全局配置 > `'default'` |

### UCardCover

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `src` | `string` | — | 是 | 图片地址；为空时不渲染 `<img>` |
| `height` | `string \| number` | — | 否 | 作用于封面容器；数字追加 `px`。传入后图片加 `is-height-fixed` 类 |

### UCardContent / UCardAction

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `cover`（CardContent） | `boolean` | `false` | 否 | 内容区 `padding: 0; font-size: 0`，用于放通栏图片 |
| `alignRight`（CardAction） | `boolean` | `false` | 否 | 操作区 `text-align: right` |

插槽：五个组件均为默认插槽。事件：无。暴露：`CardExposed` 为空对象。

## 方法与事件

无事件、无暴露方法。四个子组件脱离 `UCard` 单独使用时类名不生效，并在控制台输出警告（原文照抄）：

- `CardHeader组件仅能在Card组件中使用`
- `CardContent组件仅能在Card组件中使用`
- `CardAction组件仅能在Card组件中使用`
- `CardCover组件仅能在Card组件中使用`

## 典型示例

### 带封面的完整卡片

```vue
<script setup lang="ts">
import {
  UButton,
  UCard,
  UCardCover,
  UCardHeader,
  UCardContent,
  UCardAction
} from '@veltra/desktop'
</script>

<template>
  <u-card width="360">
    <u-card-cover src="/images/cover.jpg" height="160" />
    <u-card-header>卡片标题</u-card-header>
    <u-card-content>
      <p>卡片正文内容，描述这张卡片的相关信息。</p>
    </u-card-content>
    <u-card-action align-right>
      <u-button type="primary" text>操作一</u-button>
      <u-button type="primary">操作二</u-button>
    </u-card-action>
  </u-card>
</template>
```

### 融合样式与封面模式内容

```vue
<script setup lang="ts">
import { UCard, UCardHeader, UCardContent } from '@veltra/desktop'
</script>

<template>
  <!-- integrate：无阴影，嵌进页面已有底色时使用 -->
  <u-card integrate width="400">
    <u-card-header>无阴影卡片</u-card-header>
    <u-card-content>
      <p>当 integrate 为 true 时，卡片没有阴影。</p>
    </u-card-content>
  </u-card>

  <!-- cover 内容模式：图片通栏贴边 -->
  <u-card width="400">
    <u-card-content cover>
      <img src="/images/banner.jpg" alt="封面" style="width: 100%; border-radius: inherit" />
    </u-card-content>
    <u-card-header>自定义封面布局</u-card-header>
    <u-card-content>
      <p>cover 模式让内容区无缝贴合图片。</p>
    </u-card-content>
  </u-card>
</template>
```

## 注意事项

> [!WARNING]
> - 子组件导出名是 `UCardHeader` / `UCardCover` / `UCardContent` / `UCardAction`；没有 `UCardBody`，正文区是 `UCardContent`。
> - 子组件必须写在 `UCard` 直接内容里；脱离后仅得到无样式 `div` 并触发控制台警告。
> - `UCardCover.src` 必填；它内部渲染 `<img draggable="false" alt="封面">`，图片不可拖拽是组件行为。
> - 图片通栏要用 `UCardContent` 的 `cover` 属性，而不是自己写负 margin 覆盖内边距。
> - 本库是 `integrate` 表达融合（无阴影）形态，不是 Element Plus 的 `shadow="never"` 属性。
