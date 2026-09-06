---
title: "useVirtualizer - 虚拟滚动列表与海量大数据长列表渲染"
description: "基于 @cat-kit/fe 的 Vue 虚拟滚动（Virtual List）组合式函数，支持万级长列表、动态项高与水平/垂直海量数据高性能渲染，尺寸直接操作 DOM 避免模板整体重渲染，适用于长表格、日志瀑布流、海量选项下拉框"
keywords: ["useVirtualizer", "@veltra/compositions", "use-virtualizer", "虚拟滚动列表与海量大数据长列表渲染"]
aliases: ["use-virtualizer", "useVirtualizer"]
---
## 快速上手

`useVirtualizer` 是 `@cat-kit/fe` `Virtualizer` 的 Vue 适配。`count` 与 `scrollEl` 变化时自动 `setCount` / `connect` / `disconnect`。`contentEl` / `beforeEl` / `afterEl` 一旦传入，hook 直接写 `style.height`（`horizontal: true` 时写 `width`），不经 Vue 响应式，滚动时不会因为总高度变化而重渲染整棵模板。

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useVirtualizer } from '@veltra/compositions'

const count = ref(1000)
const rows = ref(Array.from({ length: 1000 }, (_, i) => `Item ${i}`))
const scrollEl = shallowRef<HTMLElement>()
const contentEl = shallowRef<HTMLElement>()

const { virtualizer, items } = useVirtualizer({
  count,
  scrollEl,
  contentEl,
  gap: 4,
  estimateSize: () => 40
})
</script>

<template>
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

返回值：

| 字段 | 说明 |
| --- | --- |
| `virtualizer` | 底层实例，可调用 `scrollToIndex` / `scrollToOffset` / `reset` / `measureElement` / `setOptions` |
| `snapshot` | 完整快照 `shallowRef` |
| `items` | 仅在列表项引用变化时更新，给 `v-for` 用 |
| `isScrolling` | 独立 `shallowRef`，避免滚动态切换连带重算列表 |

`count` 必须是 `Ref<number>`（`computed` 也可以）。`initialOffset` / `initialViewport` 只在构造时生效；运行时改 `estimateSize` 等请调用 `virtualizer.setOptions`。类型 `UseVirtualizerOptions`、`UseVirtualizerReturned` 从 `@veltra/compositions` 导出。

