---
title: 'UList / UListItem 列表（@veltra/mobile 移动端）'
description: '@veltra/mobile 导出的列表组件。UList 用 data 数组驱动渲染，默认插槽按行暴露 item 与 index；UListItem 渲染 li 行容器，行高保底 44px 触控热区。移动端不内置滚动包装，滚动由父容器或页面提供。适合消息流、明细行等结构化展示。'
aliases: [UList, UListItem, List, ListItem, 列表, 移动端列表, 消息列表]
keywords:
  [
    ListProps,
    data,
    v-slot,
    item,
    index,
    ComponentSize,
    size,
    数据驱动,
    作用域插槽,
    行点击,
    触控热区,
    44px,
    长列表滚动,
    消息流
  ]
---

# UList / UListItem 列表（@veltra/mobile 移动端）

`@veltra/mobile` 导出列表 `UList` 与列表项 `UListItem`。`UList` 是数据驱动的：`data` 数组有几项，默认插槽就渲染几次，插槽作用域暴露 `{ item, index }`，根元素是原生 `<ul>`，不内置滚动包装。`UListItem` 渲染 `<li>` 行容器，本身没有任何属性，行高保底 44px 触控热区。

## 快速上手

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/mobile'
import '@veltra/mobile/components/list/style'

const data = [
  { id: 1, title: '收件箱' },
  { id: 2, title: '已发送' },
  { id: 3, title: '草稿' }
]
</script>

<template>
  <u-list :data="data" v-slot="{ item }">
    <u-list-item>{{ item.title }}</u-list-item>
  </u-list>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、列表无颜色。组件样式按需引入：`import '@veltra/mobile/components/list/style'`。

## API 签名

```ts
import type { ComponentSize } from '@veltra/utils'

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

export interface ListProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 列表数据，必填；数组长度决定渲染行数 */
  data: Record<string, any>[]
}

export interface ListEmits {}

export type ListExposed = {}
```

## 参数说明

| 参数   | 类型                              | 默认        | 必填 | 约束                                                                     |
| ------ | --------------------------------- | ----------- | :--: | ------------------------------------------------------------------------ |
| `data` | `Record<string, any>[]`           | —           |  是  | 数据驱动的唯一来源；每项触发一次默认插槽渲染                             |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` |  否  | 移动端未传时固定 `'default'`，不读取全局配置；影响行内边距、圆角与字号   |

插槽：默认插槽，作用域 `{ item: Record<string, any>, index: number }`；插槽内容就是一行的内容。`UListItem` 无属性、无事件，仅渲染 `<li>`。

行高触控热区：每个 `u-list-item` 的 `min-height` 为 `max(--u-form-component-height-<size>, 44px)`，三档尺寸下行可点击区域均不小于 44×44。

## 典型示例

### 长列表滚动

移动端列表不内置滚动：给 `u-list` 自身或父容器设 `overflow-y: auto`，触屏滑动滚动。

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/mobile'
import '@veltra/mobile/components/list/style'

const data = Array.from({ length: 50 }, (_, i) => ({ title: `列表项${i}` }))
</script>

<template>
  <u-list :data="data" v-slot="{ item }" style="height: 320px; overflow-y: auto">
    <u-list-item>{{ item.title }}</u-list-item>
  </u-list>
</template>
```

### 可点击选择行

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UList, UListItem } from '@veltra/mobile'
import '@veltra/mobile/components/list/style'

const data = [
  { id: 'a', title: '任务 A' },
  { id: 'b', title: '任务 B' }
]
const selected = shallowRef<string | null>(null)

function onPick(row: { id: string; title: string }) {
  selected.value = row.id // => 点击行时记录对应 id
}
</script>

<template>
  <u-list :data="data" v-slot="{ item }">
    <u-list-item :style="{ color: selected === item.id ? 'var(--u-color-primary)' : undefined }" @click="onPick(item)">
      {{ item.title }}
    </u-list-item>
  </u-list>
</template>
```

### 三档尺寸

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/mobile'
import '@veltra/mobile/components/list/style'

const data = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
]
</script>

<template>
  <u-list size="small" :data="data" v-slot="{ item }">
    <u-list-item>{{ item.name }}</u-list-item>
  </u-list>
  <u-list size="default" :data="data" v-slot="{ item }">
    <u-list-item>{{ item.name }}</u-list-item>
  </u-list>
  <u-list size="large" :data="data" v-slot="{ item }">
    <u-list-item>{{ item.name }}</u-list-item>
  </u-list>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是原生 `<ul>` 直接承载滚动，没有桌面端的内建滚动包装层（桌面端容器默认 100% 高、自带滚动条）；移动端要滚动必须自己给列表或父容器设 `overflow-y: auto`，不设则随页面滚动。
> - 移动端行高保底 44px 触控热区（`min-height: max(--u-form-component-height-<size>, 44px)`），桌面端无行高下限、仅按内边距撑高。
> - 移动端 `size` 未传时固定 `'default'`，不读取全局尺寸配置；桌面端回退链是「自身 `size` > 全局配置 > `'default'`」。
> - 本库是数据驱动 + 作用域插槽（`v-slot="{ item, index }"`），不是在 `UList` 默认插槽里手写 `<u-list-item v-for>`；不传 `data` 就一行都不渲染。
> - `data` 是必填属性；空数组渲染为空白，本库不渲染空态提示——需要空态时在列表外自行用 `UEmpty` 处理。
> - 行内容必须用 `UListItem`（`<li>`）包裹，否则内容直接挂在 `<ul>` 下，结构与样式都不符合预期。
> - 没有选中、分页等内建交互；需要这些能力时在行插槽上自行实现。
> - 移动端按需样式路径是 `@veltra/mobile/components/list/style`，不是 `@veltra/desktop/components/list/style`。

## 常见问题

### 列表没有出现滚动条、长列表把页面撑长

原因：移动端 `UList` 不内置滚动容器，不限高时整段列表参与页面滚动。修复：给列表限高并开纵向滚动：

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/mobile'
import '@veltra/mobile/components/list/style'

const data = Array.from({ length: 50 }, (_, i) => ({ title: `列表项${i}` }))
</script>

<template>
  <u-list
    :data="data"
    v-slot="{ item }"
    style="height: 320px; overflow-y: auto; -webkit-overflow-scrolling: touch"
  >
    <u-list-item>{{ item.title }}</u-list-item>
  </u-list>
</template>
```

### 设置全局 size 后移动端列表尺寸没有变化

行为如此：移动端 `UList` 不接入全局尺寸配置，`size` 只认组件自身的 prop。修复：在 `<u-list>` 上显式传 `size`。
