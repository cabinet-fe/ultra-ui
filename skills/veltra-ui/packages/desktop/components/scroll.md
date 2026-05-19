# UScroll — 滚动容器

> `import type { ScrollProps, ScrollEmits, ScrollExposed, ScrollPosition } from '@veltra/desktop'`

基于原生滚动的容器组件，自动渲染横向/纵向滚动条，支持拖拽滚动条、程序化滚动和尺寸变化监听。

## Import

```ts
// UScroll 由 Vite 自动导入，无需手动 import
```

## Props

| prop             | type                      | default  | 说明                                       |
| ---------------- | ------------------------- | -------- | ------------------------------------------ |
| `tag`            | `string`                  | `'div'`  | 内容区域元素标签名                         |
| `height`         | `string \| number`        | `'100%'` | 容器高度                                   |
| `always`         | `boolean`                 | `false`  | 是否始终显示滚动条                         |
| `contentStyle`   | `string \| CSSProperties` | —        | 内容区域行内样式                           |
| `containerStyle` | `string \| CSSProperties` | —        | 滚动容器行内样式                           |
| `contentClass`   | `unknown`                 | —        | 内容区域额外 class                         |
| `containerClass` | `string \| string[]`      | —        | 滚动容器额外 class                         |
| `dragDebounce`   | `number`                  | —        | 拖拽滚动条时的防抖延迟（毫秒），默认不防抖 |

## Emits

| event    | 参数                                   | 说明                                                  |
| -------- | -------------------------------------- | ----------------------------------------------------- |
| `scroll` | `(position: Required<ScrollPosition>)` | 滚动时触发                                            |
| `resize` | `(targets: HTMLElement[])`             | 容器或内容尺寸变化时触发，`targets` 为变化的 DOM 元素 |

### ScrollPosition

```ts
interface ScrollPosition {
  /** 横向滚动位置 */
  x?: number
  /** 纵向滚动位置 */
  y?: number
  /** 横向滚动总宽度 */
  sw?: number
  /** 纵向滚动总高度 */
  sh?: number
  /** 横向可视宽度 */
  cw?: number
  /** 纵向可视高度 */
  ch?: number
}
```

`scroll` 事件回调中的 `position` 参数为 `Required<ScrollPosition>`，即所有字段均存在。

## Slots

| slot      | 作用域 | 说明         |
| --------- | ------ | ------------ |
| `default` | —      | 滚动内容区域 |
| `content` | —      | 内容插槽     |

## Exposed

```ts
interface ScrollExposed {
  /** 滚动到指定位置 */
  scrollTo: (position: ScrollPosition) => void
  /** 手动更新滚动条状态 */
  update: () => void
  /** 内容区域 DOM 引用 */
  contentRef: HTMLElement | undefined
  /** 滚动容器 DOM 引用 */
  containerRef: HTMLElement | undefined
  /** 根元素 DOM 引用 */
  el: HTMLElement | undefined
}
```

## Examples

### 基础滚动

```vue
<template>
  <u-scroll height="300px">
    <p v-for="i in 100" :key="i">第 {{ i }} 行</p>
  </u-scroll>
</template>
```

### 始终显示滚动条

```vue
<template>
  <u-scroll height="200px" always>
    <div v-for="i in 50" :key="i" style="padding: 8px">条目 {{ i }}</div>
  </u-scroll>
</template>
```

### 控制滚动位置与监听事件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ScrollExposed, ScrollPosition } from '@veltra/desktop'

const scrollRef = ref<ScrollExposed>()

function scrollToBottom() {
  scrollRef.value?.scrollTo({ y: 9999 })
}

function scrollToTop() {
  scrollRef.value?.scrollTo({ y: 0 })
}

function handleScroll(pos: Required<ScrollPosition>) {
  console.log(`x: ${pos.x}, y: ${pos.y}`)
}

function handleResize(targets: HTMLElement[]) {
  console.log('尺寸变化', targets.length)
}
</script>

<template>
  <div style="display: flex; gap: 8px; margin-bottom: 8px">
    <u-button size="small" @click="scrollToTop">滚到顶部</u-button>
    <u-button size="small" @click="scrollToBottom">滚到底部</u-button>
  </div>

  <u-scroll ref="scrollRef" height="300px" @scroll="handleScroll" @resize="handleResize">
    <p v-for="i in 100" :key="i">第 {{ i }} 行</p>
  </u-scroll>
</template>
```

### 自定义样式与标签

```vue
<template>
  <u-scroll
    height="250px"
    tag="ul"
    container-class="custom-container"
    content-class="custom-content"
    :content-style="{ padding: '12px' }"
    :container-style="{ border: '1px solid #e0e0e0', borderRadius: '6px' }"
  >
    <li v-for="i in 20" :key="i" style="padding: 8px; border-bottom: 1px solid #eee">
      列表项 {{ i }}
    </li>
  </u-scroll>
</template>
```
