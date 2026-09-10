---
title: "UCard / UCardHeader / UCardCover / UCardContent / UCardAction 卡片"
description: "@veltra/desktop 导出的卡片组件组，页面区块与统计卡片的默认容器。UCard 是带边框、圆角、阴影与内边距的容器，可设置宽度与融合样式；UCardHeader、UCardCover、UCardContent、UCardAction 分别渲染标题区、封面图、正文与操作区，子组件必须写在 UCard 内。"
aliases: [UCard, UCardHeader, UCardCover, UCardContent, UCardAction, Card, 卡片, 面板, panel, 区块, 分区, 容器, 统计卡片, stat card, KPI 卡片]
keywords: [CardProps, CardCoverProps, CardActionProps, CardContentProps, width, integrate, size, src, cover, alignRight, 卡片, 封面图, 操作区, 融合样式, 无阴影, 右对齐, 内容排版, 面板, 区块, 容器, 统计卡片, 数据卡片, 自适应宽度, 栅格卡片]
---

# UCard / UCardHeader / UCardCover / UCardContent / UCardAction 卡片

`@veltra/desktop` 导出卡片组件组：`UCard` 是页面区块的默认容器——自带背景色、边框、圆角、阴影与内边距，`width` 控制宽度、`size` 控制内边距档位、`integrate` 切换无阴影的融合样式；`UCardHeader`（标题区）、`UCardCover`（封面图）、`UCardContent`（正文区）、`UCardAction`（操作区）四个子组件按序组合出完整卡片。

需要「白底 + 描边 + 圆角 + 内边距」的分区容器（页面区块、面板、统计卡片、登录框）时用 `UCard`，禁止用裸 `div` 加 `var(--u-*)` 手写等价样式；`UCard` 的底色、描边、圆角、阴影全部取自 `--u-card-*` 与主题 token，深浅色主题切换自动跟随。

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

不传 `width` 时卡片宽度由父容器决定（块级元素撑满父级）。把卡片放进 `UGrid`、`ULayout` 或 CSS Grid 单元格时禁止传 `width`，否则卡片固定成该像素值、不再随容器变化。

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
| `width` | `string \| number` | — | 否 | `320` / `'320'` 均渲染为 `320px`；`'50%'` 等非纯数字字符串原样生效。未传时宽度由父容器决定，放进栅格或弹性容器时禁止传 |
| `integrate` | `boolean` | `false` | 否 | 去掉阴影与边框，`--u-card-header-bg` / `--u-card-action-bg` 置为 `transparent`，且标题区下内边距归零；适合嵌入已有底色的容器 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 回退链：自身 `size` > 全局配置 > `'default'`。同时决定内边距与正文字号，见下表 |

`size` 三档的实际取值：

| `size` | 标题区 / 正文区 / 操作区内边距 | 正文字号 | 标题字号与字重 |
| --- | --- | --- | --- |
| `'small'` | 8px | 12px | 14px / bold |
| `'default'` | 12px | 14px | 16px / bold |
| `'large'` | 16px | 16px | 18px / bold |

内边距与标题字号绑定在同一档位，无法只改其中一个：需要 16px 内边距配 15px 标题时用 `size="large"` 并把标题写在 `UCardContent` 内自定义字号，或覆盖组件 token `--u-card-padding-large`。

卡片外观默认值（亮色主题实测值，随 `loadTheme()` 的主题变化）：背景色 `var(--u-bg-color-top)`、边框 `var(--u-border-muted-color) var(--u-border-width) var(--u-border-style)`、圆角 `var(--u-card-radius)`（亮色主题 12px）、阴影 `var(--u-shadow-sm)`（`0 1px 2px 0 rgba(0, 0, 0, 0.05)`）、标题区与操作区背景 `var(--u-card-header-bg)` / `var(--u-card-action-bg)`（亮色主题 `rgba(0, 0, 0, 0.015)`）。

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

### 页面区块与统计卡片（UGrid 自适应）

```vue
<script setup lang="ts">
import { UCard, UCardContent, UCardHeader, UGrid, UGridItem, UText } from '@veltra/desktop'

const stats = [
  { label: '用户总数', value: '1,286', hint: '含停用账号' },
  { label: '启用账号', value: '1,203', hint: '占比 94%' },
  { label: '角色数量', value: '12', hint: '含超级管理员' }
]
</script>

<template>
  <!-- 容器 < 960px 两列、>= 960px 四列；卡片不传 width，宽度随单元格变化 -->
  <u-grid :cols="{ xs: 1, sm: 2, lg: 4 }" :gap="12">
    <u-grid-item v-for="stat in stats" :key="stat.label">
      <u-card size="large">
        <u-card-content>
          <u-text as="additional" :font-size="13">{{ stat.label }}</u-text>
          <p style="margin: 4px 0 0; font-size: 26px; font-weight: 600">{{ stat.value }}</p>
          <u-text as="additional">{{ stat.hint }}</u-text>
        </u-card-content>
      </u-card>
    </u-grid-item>

    <!-- 带标题的页面区块：标题走 UCardHeader，正文走 UCardContent -->
    <u-grid-item span="full">
      <u-card>
        <u-card-header>最近操作</u-card-header>
        <u-card-content>
          <p>表格、列表等区块内容放在这里。</p>
        </u-card-content>
      </u-card>
    </u-grid-item>
  </u-grid>
</template>
```

## 注意事项

> [!WARNING]
> - 子组件导出名是 `UCardHeader` / `UCardCover` / `UCardContent` / `UCardAction`；没有 `UCardBody`，正文区是 `UCardContent`。
> - 页面区块、面板、统计卡片、登录框这类「白底 + 描边 + 圆角 + 内边距」的容器一律用 `UCard`，禁止自己写 `div` + `background: var(--u-bg-color-top)` + `border: 1px solid var(--u-border-color)` + `border-radius` 手搓等价样式：手写版本会漏掉 `loadTheme()` 的深浅色跟随，且各页面样式重复。
> - 卡片放进 `UGrid` / `ULayout` / CSS Grid 单元格时不传 `width`，否则固定成该像素值、失去自适应。
> - 卡片有 `overflow: hidden`：超出圆角的内容会被裁切，下拉、气泡等浮层不要挂在卡片内部（会被裁掉），改挂到 `UCard` 外层或使用函数式浮层。
> - 子组件必须写在 `UCard` 直接内容里；脱离后仅得到无样式 `div` 并触发控制台警告。
> - `UCardCover.src` 必填；它内部渲染 `<img draggable="false" alt="封面">`，图片不可拖拽是组件行为。
> - 图片通栏要用 `UCardContent` 的 `cover` 属性，而不是自己写负 margin 覆盖内边距。
> - 本库是 `integrate` 表达融合（无阴影）形态，不是 Element Plus 的 `shadow="never"` 属性。
