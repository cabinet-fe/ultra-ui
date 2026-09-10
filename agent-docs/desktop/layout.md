---
title: ULayout 布局
description: 基于 CSS Grid 的分栏布局容器：cols / rows 定义列与行轨道，resizable 开启列宽拖拽调节，colMinSizes 限制每列最小宽度，用于后台页面的侧栏/内容/面板分区。
aliases: [Layout, layout, 栅格布局, 分栏布局, 栅格]
keywords: [cols, rows, gap, resizable, colMinSizes, tag, resize-start, resize-end, 栅格布局, 分栏, 列宽拖拽, 行布局, 两栏布局, 三栏布局, 最小列宽, CSS Grid]
---

# ULayout 布局

`@veltra/desktop` 导出的布局容器 `ULayout`：一个 CSS Grid 外壳，`cols` / `rows` 声明列与行轨道，默认插槽按顺序填充轨道；`resizable` 开启后列与列之间出现拖拽手柄，可实时调节相邻两列宽度。

## 快速上手

```vue
<script setup lang="ts">
import { ULayout } from '@veltra/desktop'
</script>

<template>
  <!-- 两栏：左栏固定 200px，右栏自适应；gap 为列间距 16px -->
  <ULayout cols="200px 1fr" :gap="16" style="height: 480px">
    <aside>侧栏</aside>
    <main>主内容</main>
  </ULayout>
</template>
```

## API 签名

```ts
/** 布局组件属性 */
export interface LayoutProps {
  /** 元素标签。默认 'div' */
  tag?: string
  /** 列间距；number 按 px，字符串原样使用（如 '1rem'）。resizable 时间距固定为 10px */
  gap?: number | string
  /** 每列的轨道定义，空格分隔字符串或数组均可 */
  cols?: string[] | string
  /** 每行的轨道定义，写法同 cols */
  rows?: string[] | string
  /** 尺寸是否可调节。默认 false；为 true 时列间距固定 10px，且至少一列宽度为固定像素才能拖拽 */
  resizable?: boolean
  /**
   * 每列的最小宽度（px），按索引与 cols 对应，仅 resizable 拖拽时生效。
   * 未指定的列不限制（可被压至 0）。
   * @example
   * // 三栏拖拽时，左栏不小于 120px，右栏不小于 200px
   * :cols="['1fr', '2fr', '300px']" :col-min-sizes="[120, undefined, 200]"
   */
  colMinSizes?: (number | undefined)[]
}

/** 布局组件定义的事件 */
export interface LayoutEmits {
  /** 开始拖拽调节某条间隔；index 为间隔左侧列的索引（第一条间隔为 0） */
  (e: 'resize-start', index: number): void
  /** 拖拽调节结束；index 含义同 resize-start */
  (e: 'resize-end', index: number): void
}

/** 无暴露方法；模板 ref 上没有可调用的成员 */
export type LayoutExposed = Record<string, never>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `tag` | `string` | `'div'` | 否 | 根元素标签 |
| `gap` | `number \| string` | `—`（无间距） | 否 | `number` 追加 px；字符串原样写入 `column-gap`。`resizable: true` 时忽略本值，固定 `10px` |
| `cols` | `string[] \| string` | `—` | 否 | 任意合法的 `grid-template-columns` 值；字符串按空格拆分，数组按项拼接。`resizable: true` 时必填，否则不渲染手柄 |
| `rows` | `string[] \| string` | `—` | 否 | 任意合法的 `grid-template-rows` 值；不传则单行。行高不可拖拽调节 |
| `resizable` | `boolean` | `false` | 否 | 开启后子元素直接子节点按 cols 顺序分列；拖拽只作用于列间隔 |
| `colMinSizes` | `(number \| undefined)[]` | `—` | 否 | 数组长度不需等于列数，按索引取值；拖拽时相邻两列的钳制下限，未指定的列最小为 0 |

### 拖拽行为细节

- 拖拽开始时相邻两列按实际渲染宽度固定为 px，拖动中两列等量增减，容器总宽不变
- 拖拽结束后 `cols` 中被拖的两列在内部变为 px 值；容器尺寸变化（ResizeObserver）或 `cols` 程序化变化后，手柄位置自动重新测量对齐
- 被拖两列的宽度下限由 `colMinSizes` 对应项决定，且轨道尺寸不会出现负值

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `resize-start` | `index: number` | 用户按下某条列间隔手柄；`index` 为间隔左侧列的索引 |
| `resize-end` | `index: number` | 用户松开手柄；`index` 为间隔左侧列的索引 |

无暴露方法、无具名插槽，内容全部放默认插槽，按 `cols` × `rows` 的轨道顺序排布。

## 典型示例

### 三栏可拖拽 + 最小列宽

```vue
<script setup lang="ts">
import { ULayout } from '@veltra/desktop'

function onStart(index: number) {
  console.log('开始调节第', index, '条间隔') // => 开始调节第 0 条间隔
}

function onEnd(index: number) {
  console.log('调节结束:', index)
}
</script>

<template>
  <!-- 至少一列是固定像素（这里是 300px）才能拖拽；三列最小宽度均为 120px -->
  <ULayout
    cols="300px 1fr 300px"
    resizable
    :col-min-sizes="[120, 120, 120]"
    style="height: 480px"
    @resize-start="onStart"
    @resize-end="onEnd"
  >
    <aside>导航</aside>
    <main>主区</main>
    <aside>详情面板</aside>
  </ULayout>
</template>
```

### 行列组合：页头 + 内容 + 页脚

```vue
<script setup lang="ts">
import { ULayout } from '@veltra/desktop'
</script>

<template>
  <!-- rows 控制行轨道；两列 × 三行的 6 个格子按先行后列排布 -->
  <ULayout :cols="['200px', '1fr']" rows="60px 1fr auto" style="height: 100vh">
    <header>logo</header>
    <nav>菜单</nav>
    <main>内容</main>
    <div></div>
    <footer>状态栏</footer>
    <div></div>
  </ULayout>
</template>
```

### 动态列数

```vue
<script setup lang="ts">
import { UButton, ULayout } from '@veltra/desktop'
import { computed, ref } from 'vue'

const count = ref(3)
// 每列等分：count 为 3 时 cols = ['1fr', '1fr', '1fr']
const cols = computed(() => Array.from({ length: count.value }, () => '1fr'))
</script>

<template>
  <UButton @click="count = Math.max(1, count - 1)">-</UButton>
  {{ count }}
  <UButton @click="count = Math.min(6, count + 1)">+</UButton>

  <ULayout :cols="cols" :gap="8" style="height: 320px">
    <div v-for="i in count" :key="i">第 {{ i }} 列</div>
  </ULayout>
</template>
```

## 注意事项

> [!WARNING]
> - `ULayout` 是 Grid 容器，不是 24 栅格栅格系统；没有 `span` / `offset` 这类 El-Row/El-Col 概念，列宽全部写在 `cols` 里。
> - `resizable` 只支持列宽拖拽，不支持行高拖拽。
> - `resizable: true` 时必须至少有一列是固定像素（`200px` 这类），全部用 `fr` 时没有可调的固定轨道，拖拽不生效。
> - `resizable: true` 时 `gap` 失效，列间距固定 `10px`。
> - 属性名是 `colMinSizes`（camelCase），模板里写 `:col-min-sizes`；值为 `(number | undefined)[]`，不是 `Record<string, number>`。
> - 组件只提供轨道与拖拽，不渲染任何格子背景、边框；视觉样式由子元素自行处理。
