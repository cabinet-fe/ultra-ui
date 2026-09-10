---
title: UScroll 滚动容器
description: 从 @veltra/desktop 导出的自绘滚动条容器：隐藏原生滚动条，提供 6px 细滚动条、拖拽、scroll/resize 事件与 scrollTo 定位；不做虚拟滚动，长列表需配合虚拟化方案。
aliases:
  - Scroll
  - scroll
  - 滚动条
  - 自定义滚动条
  - 滚动区域
keywords:
  - scrollTo
  - update
  - always
  - dragDebounce
  - contentStyle
  - containerStyle
  - contentRef
  - containerRef
  - ScrollPosition
  - ScrollExposed
  - 自定义滚动条
  - 滚动条样式
  - 回到顶部
  - 触底加载
---

# UScroll 滚动容器

`@veltra/desktop` 导出滚动容器 `UScroll`：内层原生滚动、外层隐藏原生滚动条并自绘 6px 细滚动条，提供 `scroll` / `resize` 事件、`scrollTo` 定位与 `update()` 手动刷新；它是普通滚动容器，不做虚拟滚动。

## 快速上手

```vue
<script setup lang="ts">
import { UScroll } from '@veltra/desktop'
</script>

<template>
  <u-scroll height="240px">
    <p v-for="n of 40" :key="n">第 {{ n }} 行</p>
  </u-scroll>
  <!-- => 高 240px 的滚动区域，内容溢出时右侧出现细滚动条，悬停可见 -->
</template>
```

## API 签名

```ts
import type { CSSProperties, ShallowRef } from 'vue'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 滚动位置 */
export type ScrollPosition = {
  /** 横向位置 */
  x?: number
  /** 纵向位置 */
  y?: number
  /** 横向滚动宽度（scrollWidth） */
  sw?: number
  /** 纵向滚动高度（scrollHeight） */
  sh?: number
  /** 横向可视宽度（clientWidth） */
  cw?: number
  /** 纵向可视高度（clientHeight） */
  ch?: number
}

/** 滚动条组件属性 */
export interface ScrollProps {
  /** 内容元素标签名。默认 'div' */
  tag?: string
  /** 容器高度：number 追加 px，字符串原样使用；未传时不写内联高度，由父级布局决定 */
  height?: string | number
  /** 总是显示滚动条。默认 false */
  always?: boolean
  /** 内容元素样式：字符串或 CSSProperties */
  contentStyle?: string | CSSProperties
  /** 滚动容器样式：字符串或 CSSProperties */
  containerStyle?: string | CSSProperties
  /** 内容类名 */
  contentClass?: unknown
  /** 滚动容器类名 */
  containerClass?: string | string[]
  /** 拖拽滚动条防抖时间，单位 ms。默认 0 */
  dragDebounce?: number
}

/** 滚动条组件事件 */
export interface ScrollEmits {
  /** 滚动时触发，position 六个字段全量给出 */
  (e: 'scroll', position: Required<ScrollPosition>): void
  /** 内容或根元素尺寸变化时触发 */
  (e: 'resize', targets: HTMLElement[]): void
}

/** 组件暴露（经 DeconstructValue 解包：ref 上直接访问以下成员，refs 已自动解包） */
export interface _ScrollExposed {
  /** 滚动至指定位置（同步，仅应用 x / y，瞬时定位） */
  scrollTo(position: ScrollPosition): void
  /** 重算滚动条尺寸与位置（会再次触发 scroll 事件） */
  update(): void
  /** 内容元素 */
  contentRef: ShallowRef<HTMLElement | undefined>
  /** 滚动容器元素 */
  containerRef: ShallowRef<HTMLElement | undefined>
  /** 组件根元素 */
  el: ShallowRef<HTMLElement | undefined>
}
export type ScrollExposed = DeconstructValue<_ScrollExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `tag` | `string` | `'div'` | 否 | 内容元素标签，任意合法 HTML 标签（如 `'ul'`） |
| `height` | `string \| number` | — | 否 | `number` 追加 `px`；未传时根元素不写内联高度，容器高度由父级布局决定 |
| `always` | `boolean` | `false` | 否 | `false` 时悬停容器才显示滚动条，`true` 常显 |
| `contentStyle` | `string \| CSSProperties` | — | 否 | 应用到内容元素 |
| `containerStyle` | `string \| CSSProperties` | — | 否 | 应用到滚动容器元素 |
| `contentClass` | `unknown` | — | 否 | 应用到内容元素，任意类名形式 |
| `containerClass` | `string \| string[]` | — | 否 | 应用到滚动容器元素 |
| `dragDebounce` | `number` | `0` | 否 | 拖拽滚动条时的防抖毫秒数，`0` 表示不防抖 |

## 方法与事件

- `scroll(position: Required<ScrollPosition>)`：容器滚动时触发；调用暴露的 `update()` 或容器尺寸变化后重算时同样触发。`x` / `y` 是当前滚动偏移，`sw` / `sh` 是内容总宽高，`cw` / `ch` 是可视宽高。
- `resize(targets: HTMLElement[])`：内容元素或根元素尺寸变化时触发（ResizeObserver），`targets` 是发生变化的元素数组。
- `scrollTo(position: ScrollPosition)`：同步方法，无返回值；仅应用 `x` / `y`，立即定位（不平滑滚动），字段缺省时不改变对应轴向。
- `update()`：同步方法，无返回值；内容尺寸变化而滚动条位置不对时调用。
- `contentRef` / `containerRef` / `el`：暴露的元素引用（解包后可直接拿到 `HTMLElement | undefined`）。

## 典型示例

### 常显滚动条与回到顶部

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { UButton, UScroll } from '@veltra/desktop'
import type { ScrollExposed } from '@veltra/desktop'

const scrollRef = useTemplateRef<ScrollExposed>('scroll')

function toTop() {
  scrollRef.value?.scrollTo({ y: 0 })
}
</script>

<template>
  <u-button @click="toTop">回到顶部</u-button>
  <u-scroll ref="scroll" height="300px" always>
    <div v-for="i of 50" :key="i" style="padding: 8px">条目 {{ i }}</div>
  </u-scroll>
</template>
```

### 监听滚动做触底加载

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UScroll } from '@veltra/desktop'
import type { ScrollPosition } from '@veltra/desktop'

const items = ref(Array.from({ length: 30 }, (_, i) => `条目 ${i + 1}`))

function onScroll(pos: Required<ScrollPosition>) {
  // y + ch >= sh 即触底
  if (pos.y + pos.ch >= pos.sh) {
    const next = items.value.length
    items.value.push(...Array.from({ length: 10 }, (_, i) => `条目 ${next + i + 1}`))
  }
}
</script>

<template>
  <u-scroll height="240px" @scroll="onScroll">
    <div v-for="item of items" :key="item" style="padding: 8px">{{ item }}</div>
  </u-scroll>
</template>
```

### 自定义标签与样式

```vue
<script setup lang="ts">
import { UScroll } from '@veltra/desktop'
</script>

<template>
  <u-scroll
    height="250px"
    tag="ul"
    container-class="custom-container"
    content-class="custom-content"
    :content-style="{ padding: '12px' }"
    :container-style="{ border: '1px solid #e0e0e0', borderRadius: '6px' }"
  >
    <li v-for="i of 20" :key="i" style="padding: 8px; border-bottom: 1px solid #eee">
      列表项 {{ i }}
    </li>
  </u-scroll>
</template>
```

## 注意事项

> [!WARNING]
> - `UScroll` 不是虚拟滚动组件：它只是隐藏原生滚动条、自绘滚动条的普通容器，长列表全部渲染。十万级长表用 `UTable`（`virtualThreshold` 起虚拟化）或 `@veltra/compositions` 的 `useVirtualizer`，二者与 `UScroll` 无关。
> - 未传 `height` 时组件不写内联高度（类型 JSDoc 标注的默认 `100%` 指内容区相对根元素的高度），滚动区域高度必须由父级布局给出，否则内容撑开、不会滚动。
> - `scrollTo` 只接受绝对像素坐标，缺省的轴不移动；定位是瞬时的，没有平滑滚动动画。
> - 原生滚动条被强制隐藏（宽度 0），自绘滚动条固定 6px、悬停或拖拽时 10px、滑块最小 20px；内容未溢出时不渲染滑块。
> - 内容在组件外部变更尺寸后滚动条位置不对时，必须手动调用 `update()`；`update()` 会再次触发 `scroll` 事件，回调里避免再调 `update()` 造成循环。
> - `scroll` 事件在拖拽自绘滚动条时受 `dragDebounce` 防抖影响，默认 `0` 即不防抖。

## 常见问题

### 设置了内容但滚动条不出现、也滚不动

原因：未限制 `height` 且父级没有确定高度，容器被内容撑开。修复：给 `height` 或给父级固定高度。

```vue
<template>
  <u-scroll height="300px">
    <p v-for="n of 100" :key="n">第 {{ n }} 行</p>
  </u-scroll>
</template>
```

### `scrollTo({ y: 9999 })` 后位置不对

原因：调用时内容尚未渲染完成，`scrollHeight` 还是旧值。修复：等下一帧后再定位。

```vue
<script setup lang="ts">
import { nextTick, useTemplateRef } from 'vue'
import { UScroll } from '@veltra/desktop'
import type { ScrollExposed } from '@veltra/desktop'

const scrollRef = useTemplateRef<ScrollExposed>('scroll')

async function loadAndJump() {
  await nextTick()
  scrollRef.value?.scrollTo({ y: 9999 })
}
</script>

<template>
  <u-scroll ref="scroll" height="300px">
    <p v-for="n of 100" :key="n">第 {{ n }} 行</p>
  </u-scroll>
</template>
```
