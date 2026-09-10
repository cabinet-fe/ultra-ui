---
title: useVirtualizer 虚拟滚动组合式函数
description: 基于 @cat-kit/fe Virtualizer 的虚拟滚动组合式函数：只渲染视口内的列表项，支持 10 万级长列表、动态项高测量、水平/垂直模式与 spacer 占位布局，尺寸直接写 DOM 不触发 Vue 重渲染，适用于长表格、日志流、海量选项下拉。
aliases: [use-virtualizer, Virtualizer, 虚拟滚动, 虚拟列表, virtual list]
keywords: [count, scrollEl, contentEl, beforeEl, afterEl, estimateSize, getItemKey, buffer, horizontal, totalSize, VirtualItem, VirtualSnapshot, virtualizer, scrollToIndex, measureElement, isScrolling, 虚拟列表, 长列表, 大数据量渲染, 动态行高]
---

# useVirtualizer 虚拟滚动组合式函数

`@veltra/compositions` 导出 `useVirtualizer`：`@cat-kit/fe` 的 `Virtualizer` 虚拟滚动实例的 Vue 适配层。它把 `count` / `scrollEl` 等选项接入 Vue 响应式（变化时自动 `setCount` / `connect` / `disconnect`），并把虚拟项列表拆成独立更新的 `items` / `isScrolling` ref；传入 `contentEl` / `beforeEl` / `afterEl` 时总尺寸直接写 DOM 内联样式，滚动过程不触发模板重渲染。

## 快速上手

```vue
<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useVirtualizer } from '@veltra/compositions'

// 数据源自定义，count 只需是响应式的项数
const rows = ref(Array.from({ length: 10000 }, (_, i) => `Item ${i}`))
const scrollEl = shallowRef<HTMLElement>()
const contentEl = shallowRef<HTMLElement>()

const { virtualizer, items } = useVirtualizer({
  count: computed(() => rows.value.length),
  scrollEl,
  contentEl,
  estimateSize: () => 40
})
</script>

<template>
  <!-- 滚动容器需要 overflow: auto 和确定高度 -->
  <div ref="scrollEl" style="overflow: auto; height: 320px">
    <ul ref="contentEl" style="position: relative; margin: 0">
      <li
        v-for="item in items"
        :key="item.index"
        :data-index="item.index"
        :style="{ position: 'absolute', transform: `translateY(${item.start}px)` }"
        :ref="(el) => virtualizer.measureElement(item.index, el as Element | null)"
      >
        {{ rows[item.index] }}
      </li>
    </ul>
  </div>
</template>
```

`contentEl` 的 `height` 由 hook 直接写成 `totalSize` 像素值，模板无需绑定总高度。

## API 签名

```ts
import type { VirtualItem, VirtualSnapshot, Virtualizer } from '@cat-kit/fe'

type MaybeEl = HTMLElement | null | undefined

export interface UseVirtualizerOptions extends Omit<VirtualizerOptions, 'count'> {
  /** 响应式虚拟项总数；变化时内部自动 virtualizer.setCount。必填 */
  count: Ref<number>
  /** 响应式滚动容器；变化时自动 connect / disconnect，初始为 null 等价于 disconnect。必填 */
  scrollEl: MaybeRefOrGetter<MaybeEl>
  /** 内容承接元素：hook 直接写 style.height = totalSize + 'px'（水平模式写 width），不经 Vue 响应式 */
  contentEl?: MaybeRefOrGetter<MaybeEl>
  /** 首项前占位元素：写入 beforeSize，用于 spacer 布局 */
  beforeEl?: MaybeRefOrGetter<MaybeEl>
  /** 末项后占位元素：写入 afterSize，用于 spacer 布局 */
  afterEl?: MaybeRefOrGetter<MaybeEl>
}

// 继承自 @cat-kit/fe VirtualizerOptions 的字段（均可选）：
//   buffer?: number            视口外额外预渲染项数，默认 4
//   horizontal?: boolean       水平滚动，默认 false
//   paddingStart?: number      首项前固定内边距 px，默认 0
//   paddingEnd?: number        末项后固定内边距 px，默认 0
//   gap?: number               相邻项间距 px，默认 0
//   initialOffset?: number     初始滚动偏移 px，默认 0，仅构造时生效
//   initialViewport?: number   未 connect 前的初始视口尺寸 px，默认 0，仅构造时生效
//   estimateSize?: (index: number) => number   未测项估值函数，默认 () => 36
//   useMeasuredAverage?: boolean  未测项用已测平均值估值，默认 true
//   getItemKey?: (index: number) => number | string  稳定 key，测量缓存按数据项身份复用

export interface UseVirtualizerReturned {
  /** 底层 Virtualizer 实例，未做包装 */
  virtualizer: Virtualizer
  /** 完整快照 shallowRef；任一结构性变化都会更新 */
  snapshot: ShallowRef<VirtualSnapshot>
  /** 仅在底层 items 引用变化时更新，供模板 v-for 使用 */
  items: ShallowRef<VirtualItem[]>
  /** 仅在布尔值变化时更新 */
  isScrolling: ShallowRef<boolean>
}

export function useVirtualizer(options: UseVirtualizerOptions): UseVirtualizerReturned
```

`VirtualItem` 字段：`index`（数据源索引）、`start`（项起点距列表容器起点的 px）、`end`（`start + size`）、`size`（项尺寸 px）。

`VirtualSnapshot` 字段：`items`、`range`（不含 buffer 的可视区范围，`count === 0` 或视口无效时为 `null`）、`totalSize`、`beforeSize`、`afterSize`、`offset`、`viewportSize`、`horizontal`、`isScrolling`。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `count` | `Ref<number>` | — | 是 | `computed(() => rows.length)` 亦可；变化自动 `setCount`，负数会被底层 clamp 到 0 |
| `scrollEl` | `MaybeRefOrGetter<MaybeEl>` | — | 是 | 必须是可滚动元素（`overflow: auto/scroll`）；getter 形式如 `() => el.value?.containerRef ?? null` |
| `contentEl` | `MaybeRefOrGetter<MaybeEl>` | — | 否 | 传入后滚动期间 Vue 不会因尺寸变化重渲染；引用切到 `null` 时清空此前写入的内联尺寸 |
| `beforeEl` / `afterEl` | `MaybeRefOrGetter<MaybeEl>` | — | 否 | spacer 占位元素，分别写 `beforeSize` / `afterSize` |
| `buffer` | `number` | `4` | 否 | 视口外额外保留的预渲染项数 |
| `horizontal` | `boolean` | `false` | 否 | `true` 时尺寸写入 `width` 而非 `height` |
| `paddingStart` / `paddingEnd` | `number` | `0` | 否 | 列表首尾固定内边距 px，计入 `totalSize` |
| `gap` | `number` | `0` | 否 | 相邻项间距 px |
| `estimateSize` | `(index: number) => number` | `() => 36` | 否 | 返回预估像素尺寸，负数 clamp 到 0；有真实测量样本后被已测平均值接管 |
| `getItemKey` | `(index: number) => number \| string` | — | 否 | 必须对同一数据项全程稳定；前插/乱序/中段删除时保留已测尺寸 |
| `useMeasuredAverage` | `boolean` | `true` | 否 | 未测项用已测项平均值估值，缓解滚动条抖动 |
| `initialOffset` / `initialViewport` | `number` | `0` | 否 | 仅构造时生效；运行时改 `setOptions` 会被忽略 |

## 方法与事件

返回值字段：

- `virtualizer: Virtualizer`：底层实例，可直接调用：
  - `scrollToIndex(index, { align?: 'auto' | 'start' | 'center' | 'end', behavior?: 'auto' | 'smooth' })`：滚动到某项，`index` clamp 到 `[0, count-1]`，`count === 0` 时 no-op，同步方法
  - `scrollToOffset(offset, { behavior? })`：滚动到指定像素，offset clamp 到 `[0, totalSize - viewportSize]`
  - `measureElement(index, el: Element | null)`：测量元素真实尺寸；模板 `:ref` 中调用，幂等
  - `measureMany([{ index, size }])`：批量上报已知真实尺寸（如后端返回行高），同步
  - `setOptions(options)`：运行时更新 `estimateSize` / `getItemKey` / `buffer` 等；`initialOffset` / `initialViewport` 被忽略
  - `reset()`：清空测量缓存并把 offset 归零，用于数据整体替换
  - `getItem(index): VirtualItem`：越界抛 `RangeError`
- `snapshot`：订阅驱动的完整快照；只有结构性变化（`items` / `range` / `totalSize` / `viewportSize` / `horizontal` / `isScrolling` / `beforeSize` / `afterSize`）会更新，纯滚动位移不更新
- `items`：渲染列表，仅在底层 `items` 引用变化时换新引用，`v-for` 不会因 `isScrolling` 切换而重算
- `isScrolling`：滚动状态，由 `scroll` / `scrollend` 事件与 120ms 兜底计时驱动

清理：`onScopeDispose` 时自动 `unsubscribe` + `virtualizer.destroy()` + 清空 `contentEl` / `beforeEl` / `afterEl` 的内联尺寸；必须且只需在组件 `setup` 中调用一次，无需手动 `onUnmounted`。

## 典型示例

### 动态行高 + spacer 布局（表格行虚拟化）

```vue
<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useVirtualizer } from '@veltra/compositions'

interface Row {
  id: number
  name: string
}

const rows = ref<Row[]>(
  Array.from({ length: 50000 }, (_, i) => ({ id: i, name: `行 ${i}` }))
)
const scrollEl = shallowRef<HTMLElement>()
const beforeSpacer = shallowRef<HTMLElement>()
const afterSpacer = shallowRef<HTMLElement>()

const { virtualizer, items } = useVirtualizer({
  count: computed(() => rows.value.length),
  scrollEl,
  beforeEl: beforeSpacer,
  afterEl: afterSpacer,
  estimateSize: () => 41,
  // key 闭包读取当前 rows，数据整体替换后仍然有效
  getItemKey: (i) => rows.value[i]?.id ?? i
})

function jumpToRow(id: number) {
  const index = rows.value.findIndex((r) => r.id === id)
  if (index >= 0) virtualizer.scrollToIndex(index, { align: 'center' })
}
defineExpose({ jumpToRow })
</script>

<template>
  <div ref="scrollEl" style="overflow: auto; height: 480px">
    <div ref="beforeSpacer" />
    <div
      v-for="item in items"
      :key="item.index"
      :ref="(el) => virtualizer.measureElement(item.index, el as Element | null)"
    >
      {{ rows[item.index]?.name }}
    </div>
    <div ref="afterSpacer" />
  </div>
</template>
```

### 运行时更新配置与批量测量

```ts
import { ref, shallowRef } from 'vue'
import { useVirtualizer } from '@veltra/compositions'

const count = ref(0)
const scrollEl = shallowRef<HTMLElement>()

const { virtualizer } = useVirtualizer({
  count,
  scrollEl,
  estimateSize: () => 32,
  horizontal: false
})

// 后端一次性返回真实行高：先改 count，再批量上报，之后远距离 scrollToIndex 不再跳变
function loadData(heights: number[]) {
  count.value = heights.length
  virtualizer.measureMany(heights.map((size, index) => ({ index, size })))
}

// 运行时调整预估行高：initialOffset 等构造期字段传了也会被忽略
virtualizer.setOptions({ estimateSize: () => 48, buffer: 8 })
```

### 依据滚动状态挂起非关键渲染

```vue
<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useVirtualizer } from '@veltra/compositions'

const rows = ref(Array.from({ length: 20000 }, (_, i) => i))
const scrollEl = shallowRef<HTMLElement>()

// items 只在列表结构变化时更新，isScrolling 独立更新：
// 滚动中切换 isScrolling 不会触发 v-for 重算
const { items, isScrolling } = useVirtualizer({
  count: computed(() => rows.value.length),
  scrollEl
})
</script>

<template>
  <div ref="scrollEl" style="overflow: auto; height: 400px">
    <div
      v-for="item in items"
      :key="item.index"
      :style="{ height: `${item.size}px` }"
    >
      {{ rows[item.index] }}
      <!-- 滚动中跳过高开销渲染（如高亮、图标），停止后恢复 -->
      <mark v-if="!isScrolling">命中</mark>
    </div>
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - `count` 必须是 `Ref<number>`，不能直接传数字；数字在构造后无法响应式更新。
> - 本库是 `count` + `scrollEl` 分离的配置，不是 `react-virtual` / `vue-virtual-scroller` 的单一 `items` 数组入参；数据源数组自持，hook 只关心项数。
> - `contentEl` / `beforeEl` / `afterEl` 的尺寸写入绕过 Vue 响应式，禁止把这些尺寸再绑定到模板插值，读取请用 `snapshot`。
> - 快照对象引用在纯滚动位移帧内保持不变（仅就地改 `offset`），禁止用 `snapshot === oldSnapshot` 判断重渲染。
> - `getItemKey` 必须稳定；基于 `Math.random()`、时间或每次新建对象引用生成 key 会让测量缓存失效。
> - `initialOffset` / `initialViewport` 仅构造时生效；运行时切换 `estimateSize` / `getItemKey` 必须调用 `virtualizer.setOptions()`。
> - 纯滚动位移不触发 `snapshot` 更新，需要实时偏移请直接读容器的 `scrollTop`。
