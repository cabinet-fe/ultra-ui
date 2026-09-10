---
title: useReactiveSize 元素响应式宽高
description: 从 @veltra/compositions 导出的基于 ResizeObserver 的响应式尺寸组合式函数：观察单个或一组元素 ref，返回 reactive 的 { width, height } 对象（border box），模板直接绑定，随元素尺寸变化自动更新。
aliases: [use-reactive-size, 元素尺寸监听, 响应式宽高, 容器尺寸]
keywords: [useReactiveSize, RefElement, ElementSize, borderBoxSize, inlineSize, blockSize, reactive, 宽高监听, 容器查询, 自适应布局, 响应式尺寸, 图表 resize, 元素宽高]
---

# useReactiveSize 元素响应式宽高

`@veltra/compositions` 导出的 `useReactiveSize(target)` 观察一个或一组元素 ref，返回 `reactive` 的 `{ width, height }`（单个）或同长度的数组（多个），尺寸在元素大小变化时自动更新。数值来自 `ResizeObserver` 的 `borderBoxSize`（内容 + 内边距 + 边框，不含外边距）。内部基于同包 `useResizeObserver` 实现，卸载时自动停止观察。

## 快速上手

从 `@veltra/compositions` 导入 `useReactiveSize`，传入 `shallowRef` 元素引用，模板直接读 `width` / `height`（返回值是 reactive 对象，不是 ref）：

```vue
<script setup lang="ts">
import { useReactiveSize } from '@veltra/compositions'
import { shallowRef } from 'vue'

const el = shallowRef<HTMLElement>()

// 传入单个 ref，返回 { width, height } reactive 对象
const size = useReactiveSize(el)
</script>

<template>
  <div ref="el">宽 {{ size.width }} × 高 {{ size.height }}</div>
</template>
```

元素挂载前 `width` / `height` 为 `0`；首次观察回调后写入实际 border box 尺寸。

## API 签名

```ts
import type { Ref, ShallowRef } from 'vue'

/** 可观察的元素引用：值可为 HTMLElement | null | undefined */
export type RefElement =
  | ShallowRef<HTMLElement | undefined | null>
  | Ref<HTMLElement | undefined | null>

interface ElementSize {
  /** border box 宽度（px），来自 borderBoxSize[0].inlineSize */
  width: number
  /** border box 高度（px），来自 borderBoxSize[0].blockSize */
  height: number
}

/** 观察单个元素，返回单个尺寸对象 */
export function useReactiveSize(target: RefElement): ElementSize

/** 观察一组元素，返回与 targets 等长的尺寸对象数组 */
export function useReactiveSize(targets: RefElement[]): ElementSize[]

/** 实现：非数组参数按单个处理，数组参数按数组处理 */
export function useReactiveSize(
  targets: RefElement | RefElement[]
): ElementSize | ElementSize[]
```

`ElementSize` 接口未从包导出，返回值按结构 `{ width: number; height: number }` 使用。注意没有泛型、没有选项参数：观察的是 border box，不可切换为 content box。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `target` / `targets` | `RefElement` 或 `RefElement[]` | — | 是 | 数组形式时返回数组与传入顺序一一对应；数组元素 ref 当前值为 `null` / `undefined` 时不参与观察，挂载后自动纳入；两种重载在运行时以 `Array.isArray` 区分，禁止传入「只有一个元素的 ref」以外的混合结构 |

## 方法与事件

无暴露方法。返回值的运行时行为：

- 单参数返回 `reactive({ width: 0, height: 0 })`；数组参数为每个元素各建一个 reactive 对象，按传入顺序排列。
- 返回的不是 `Ref`：脚本里直接读 `size.width`，没有 `.value`；对 `reactive` 对象整体重新赋值无效，只能改字段。
- 尺寸更新时机是 `ResizeObserver` 回调（元素首次被观察、尺寸变化、元素被替换时触发）。
- ref 指向的元素被替换时：内部用 `WeakMap` 把当前元素映射到尺寸对象，新元素挂载后尺寸继续写进同一个 reactive 对象。
- 清理：内部 `useResizeObserver` 在 `onBeforeUnmount` 自动 `unobserve` + `disconnect`，调用方无需手动清理。
- 必须在 `setup` 作用域内调用（内部使用 `computed` 与生命周期钩子）。

## 典型示例

### 容器宽度驱动的响应式布局

宽度小于阈值时切换为紧凑布局（容器查询的 JS 替代方案）：

```vue
<script setup lang="ts">
import { useReactiveSize } from '@veltra/compositions'
import { computed, shallowRef } from 'vue'

const panel = shallowRef<HTMLElement>()

const size = useReactiveSize(panel)

const compact = computed(() => size.width > 0 && size.width < 600)
</script>

<template>
  <div ref="panel" :class="{ 'panel--compact': compact }">
    {{ compact ? '紧凑模式' : `宽度：${size.width}px` }}
  </div>
</template>

<style scoped>
.panel--compact {
  flex-direction: column;
}
</style>
```

窗口缩放、侧边栏折叠导致 `panel` 宽度变化时 `compact` 自动重算。

### 同时观察多个元素

数组形式：传入 ref 数组，返回等长的尺寸数组，顺序一致：

```vue
<script setup lang="ts">
import { useReactiveSize } from '@veltra/compositions'
import { shallowRef } from 'vue'

const header = shallowRef<HTMLElement>()
const body = shallowRef<HTMLElement>()

// 返回 [headerSize, bodySize]，顺序与传入一致
const sizes = useReactiveSize([header, body])
</script>

<template>
  <header ref="header">头部高度 {{ sizes[0].height }}px</header>
  <main ref="body">内容高度 {{ sizes[1].height }}px</main>
  <footer>总高 {{ sizes[0].height + sizes[1].height }}px</footer>
</template>
```

某个 ref 尚未挂载时对应项保持 `0`，挂载后自动更新。

### 依据高度做溢出判断

内容高度超过容器时显示展开按钮：

```vue
<script setup lang="ts">
import { useReactiveSize } from '@veltra/compositions'
import { computed, ref, shallowRef } from 'vue'

const content = shallowRef<HTMLElement>()
const expanded = ref(false)

const size = useReactiveSize(content)

const overflow = computed(() => size.height > 200)
</script>

<template>
  <div>
    <div ref="content" :style="{ maxHeight: expanded ? 'none' : '200px' }">
      <p v-for="i in 50" :key="i">第 {{ i }} 行占位内容</p>
    </div>
    <button v-if="overflow" @click="expanded = !expanded">
      {{ expanded ? '收起' : '展开' }}
    </button>
  </div>
</template>
```

`expanded` 切换 `maxHeight` 引起高度变化，`size.height` 随之更新，`overflow` 重新求值。

## 注意事项

> [!WARNING]
> - 返回值是 `reactive` 对象，不是 `Ref`：禁止写 `size.value.width`，正确写法是 `size.width`。
> - 数值是 **border box**（含 `padding` 与 `border`，不含 `margin`），与 `clientWidth`（不含 border）和 `offsetWidth`（含 border，四舍五入）口径不同；`borderBoxSize` 给出的是浮点精确值。
> - 必须传元素 ref（`Ref` / `ShallowRef`），不能传 DOM 元素本身或 CSS 选择器。
> - 本库是 `useReactiveSize`（返回现成的 reactive 宽高），不是 VueUse 的 `useElementSize`；需要 content box 或 `window` 尺寸时本函数不提供，需自行用 `useResizeObserver` 计算。
> - 首帧渲染读取到的宽高是 `0`：依赖尺寸的首屏逻辑必须在元素挂载并触发首次回调后执行（如放在 `watch` 或 `nextTick` 之后）。

## 常见问题

### `size.width` 一直是 0

元素未挂载（ref 为 `null`）或元素本身不参与布局（`display: none`、宽高为 0 的容器）。修复：确认 ref 绑定的元素已渲染且有实际尺寸；条件渲染的元素要在 `v-if` 为真后再读取。

### `v-for` 里动态增删元素，数组尺寸不更新

`useReactiveSize` 的观察目标在调用时固定，`targets` 数组长度不会随 `v-for` 变化。修复：动态数量场景改用 `useObserverCallback`（见 `use-resize-observer.md`），对每个新元素调用 `observeEl(el, cb)`、移除时 `unobserveEl(el)`。
