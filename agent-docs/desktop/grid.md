---
title: UGrid / UGridItem 栅格布局
description: "@veltra/desktop 的栅格布局组件：UGrid 按 CSS Grid 排列子项，cols 支持 24 栅格数字、容器断点对象、函数三种写法，UGridItem 用 span 控制跨距（支持响应式与整行）；断点按容器宽度检测，不依赖视口。"
aliases: [Grid, GridItem, 栅格, 栅格系统, 网格布局]
keywords: [cols, gap, span, breakpoint-change, resize, BreakCols, Breakpoint, full, tag, 栅格, 断点, 响应式, 跨距, 列数, 间距, 整行]
---

# UGrid / UGridItem 栅格布局

`@veltra/desktop` 导出栅格布局组件 `UGrid` 与子项组件 `UGridItem`（与数据表格 `UTable` 无关）。`UGrid` 基于 CSS Grid：`cols` 决定列数（默认 24），`gap` 决定间距；`UGridItem` 的 `span` 决定跨距，支持按容器断点响应式变化与整行占满。断点由容器宽度（`ResizeObserver`）驱动，同一组件在侧栏窄容器和宽主区可以呈现不同列数。

## 快速上手

```vue
<script setup lang="ts">
import { UGrid, UGridItem } from '@veltra/desktop'
</script>

<template>
  <!-- 12 列栅格：左右各占 6 列 -->
  <u-grid :cols="12" :gap="16">
    <u-grid-item :span="6">左半</u-grid-item>
    <u-grid-item :span="6">右半</u-grid-item>
  </u-grid>
</template>
```

独立页面使用时必须先初始化主题（`import '@veltra/styles/normalize'` + `loadTheme()`）；栅格本身不依赖颜色 token，但示例中常用的 `--u-*` 变量依赖主题。

## API 签名

```ts
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 断点：name 为断点名，level 从 1（xs）到 5（xl） */
export interface Breakpoint {
  name: BreakpointName
  level: number
}

/** 按断点指定的列数 */
export interface BreakCols {
  /** 超小尺寸，容器宽 < 578 */
  xs?: number
  /** 小尺寸，容器宽 < 960 */
  sm?: number
  /** 中等尺寸，容器宽 < 1366 */
  md?: number
  /** 大尺寸，容器宽 < 1920 */
  lg?: number
  /** 中大尺寸，容器宽 >= 1920 */
  xl?: number
  /** 兜底列数，当前与更高断点都未指定时使用 */
  default?: number
}

/** 网格布局容器属性 */
export interface GridProps {
  /**
   * 栅格列数，默认 24
   * 数字：固定列数；对象：按容器断点取值；函数：入参 Breakpoint 返回列数
   */
  cols?: number | BreakCols | ((breakpoint: Breakpoint) => number)
  /** 容器渲染标签，默认 'div' */
  tag?: string
  /**
   * 间距
   * 数字：行间距与列间距相同（px）
   * 字符串：'行间距 列间距'，两个值都会补 px；只写一个值时列间距取行间距
   */
  gap?: number | string
}

/** 网格布局容器事件 */
export interface GridEmits {
  /** 容器尺寸变化（仅响应式模式触发） */
  (e: 'resize', rect: DOMRect): void
  /** 断点变化（仅响应式模式触发） */
  (e: 'breakpoint-change', breakpoint: Breakpoint): void
}

/** 网格布局项属性 */
export interface GridItemProps {
  /**
   * 跨距，默认 1；0 表示隐藏
   * 'full' 表示整行；对象按容器断点取值，必须带 default 键
   */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 容器渲染标签，默认 'div' */
  tag?: string
}

/** 模板 ref 上可访问的属性（DeconstructValue 解包后的形态） */
export interface GridExposed {
  el: HTMLElement | null
}
```

## 参数说明

### UGrid

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `cols` | `number \| BreakCols \| ((breakpoint: Breakpoint) => number)` | `24` | 否 | 列数经 `repeat(n, minmax(0px, 1fr))` 生成；对象按断点表取值，当前断点未指定时向更高断点查找，均未指定时取 `default`，`default` 也未指定时取 24 |
| `gap` | `number \| string` | — | 否 | 数字单位 px；字符串按 `'行间距 列间距'` 顺序拆分，纯数字字符串补 px，带单位字符串原样使用 |
| `tag` | `string` | `'div'` | 否 | 容器渲染的 HTML 标签 |

断点按容器宽度（不是视口宽度）判定：

| 容器宽度 | 断点 | `level` |
| --- | --- | :---: |
| `< 578` | `xs` | 1 |
| `< 960` | `sm` | 2 |
| `< 1366` | `md` | 3 |
| `< 1920` | `lg` | 4 |
| `>= 1920` | `xl` | 5 |

### UGridItem

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `span` | `number \| 'full' \| { xs?/sm?/md?/lg?/xl?, default }` | `1` | 否 | `0` 隐藏该子项；`'full'` 渲染为 `grid-column: 1 / -1`；对象按 `span[当前断点名] ?? span.default` 取值，`default` 键必填 |
| `tag` | `string` | `'div'` | 否 | — |

`UGridItem` 必须是 `UGrid` 的子级；`UGrid` 的默认插槽里未包 `UGridItem` 的普通元素也会流入网格，每个占 1 格。

## 方法与事件

`UGrid` 事件仅在响应式模式下触发——`cols` 为对象或函数，或任一 `UGridItem` 的 `span` 为对象；`cols` 为纯数字且无响应式 `span` 时两个事件都不触发：

- `resize`：payload 为容器 `getBoundingClientRect()` 的 `DOMRect`。容器尺寸变化时触发，内部以 0ms 防抖合并连续触发。
- `breakpoint-change`：payload 为 `Breakpoint`。容器断点的 `name` 或 `level` 变化时触发；初次挂载即处于响应式模式时也会随首次尺寸计算触发一次。

模板 ref 方法：`gridRef.value?.el` 返回容器 `HTMLElement | null`（`GridExposed` 解包形态），可挂在上面自己监听尺寸。

## 典型示例

### 响应式列数与响应式跨距

```vue
<script setup lang="ts">
import { UGrid, UGridItem } from '@veltra/desktop'

// 栅格本身只是布局，子项样式自行负责
const boxStyle = { background: 'var(--u-color-primary-light)', padding: '12px' }
</script>

<template>
  <!-- 窄容器 4 列，中等 12 列，宽容器 24 列 -->
  <u-grid :cols="{ xs: 4, sm: 8, md: 12, lg: 24 }" :gap="12">
    <!-- span 对象必须带 default：lg 占 6 列，其余断点占满 8 列 -->
    <u-grid-item :span="{ xs: 8, lg: 6, default: 8 }">
      <div :style="boxStyle">响应式跨距</div>
    </u-grid-item>
    <u-grid-item :span="{ xs: 8, lg: 6, default: 8 }">
      <div :style="boxStyle">另一列</div>
    </u-grid-item>
    <u-grid-item span="full">
      <div :style="boxStyle">整行</div>
    </u-grid-item>
  </u-grid>
</template>
```

### 函数式列数 + 监听断点

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UGrid, UGridItem } from '@veltra/desktop'
import type { Breakpoint } from '@veltra/desktop'

const bp = ref<Breakpoint>()

// level 小于 3（xs/sm/md）时 12 列，否则 24 列
const cols = (breakpoint: Breakpoint) => (breakpoint.level < 3 ? 12 : 24)
</script>

<template>
  <u-grid :cols="cols" :gap="16" @breakpoint-change="bp = $event">
    <u-grid-item span="full">当前断点：{{ bp?.name }}（level {{ bp?.level }}）</u-grid-item>
    <u-grid-item :span="8">A</u-grid-item>
    <u-grid-item :span="8">B</u-grid-item>
    <u-grid-item :span="8">C</u-grid-item>
  </u-grid>
</template>
```

### 行列间距分开指定 + 隐藏子项

```vue
<script setup lang="ts">
import { UGrid, UGridItem } from '@veltra/desktop'
</script>

<template>
  <!-- 行间距 8px，列间距 16px -->
  <u-grid :cols="8" gap="8 16">
    <u-grid-item :span="2">1</u-grid-item>
    <u-grid-item :span="2">2</u-grid-item>
    <u-grid-item :span="0">span 为 0，不渲染</u-grid-item>
    <u-grid-item :span="4">4</u-grid-item>
  </u-grid>
</template>
```

## 注意事项

> [!WARNING]
> - 断点按容器宽度判定，不是视口媒体查询：组件嵌在窄侧栏里时即使窗口很宽也是小断点。
> - `span` 的对象形式必须带 `default` 键（类型上必填）；运行时取不到当前断点值时回落到 `default`。
> - `resize` / `breakpoint-change` 仅响应式模式触发；`cols` 传纯数字且没有对象形式 `span` 时不会挂 `ResizeObserver`。
> - `gap` 字符串顺序是 `'行间距 列间距'`，与 CSS `gap` 简写一致；不带单位的值自动补 px。
> - `UGridItem` 只能在 `UGrid` 内使用，单独渲染会在控制台报错 `GridItem组件仅能在Grid组件中使用`。
> - 本组件是布局栅格 `UGrid`，不是数据表格；找表格见 `agent-docs/desktop/table.md`。

## 常见问题

### 控制台报错 `GridItem组件仅能在Grid组件中使用`

原因：`UGridItem` 渲染时没有从父级 `UGrid` 注入断点上下文。修复：把 `UGridItem` 直接或间接放在 `UGrid` 的默认插槽内。

### `span` 对象写了 `xs` 但小屏下不生效

原因：对象形式必须有 `default` 兜底键，且 `cols` 也要支持响应式（对象或函数）才会启用断点检测。修复：

```vue
<u-grid :cols="{ xs: 4, default: 24 }" :gap="12">
  <u-grid-item :span="{ xs: 4, default: 8 }">内容</u-grid-item>
</u-grid>
```

### `resize` 事件一直不触发

原因：`cols` 为纯数字且所有 `span` 都不是对象，组件不进入响应式模式。修复：把 `cols` 改为对象或函数形式（如 `:cols="{ default: 24 }"`），或在需要响应的子项上改用对象 `span`。
