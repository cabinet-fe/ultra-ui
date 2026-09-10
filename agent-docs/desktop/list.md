---
title: "UList / UListItem 列表"
description: "@veltra/desktop 导出的列表组件。UList 用 data 数组驱动渲染，默认插槽按行暴露 item 与 index，内部由 UScroll 提供滚动；UListItem 渲染 li 行容器。适合消息流、明细行等结构化展示。"
aliases: [UList, UListItem, List, ListItem, 列表]
keywords: [ListProps, data, v-slot, item, index, UScroll, ComponentSize, 数据驱动, 作用域插槽, 限高滚动, 斑马纹, 行点击, size]
---

# UList / UListItem 列表

`@veltra/desktop` 导出列表 `UList` 与列表项 `UListItem`。`UList` 是数据驱动的：`data` 数组有几项，默认插槽就渲染几次，插槽作用域暴露 `{ item, index }`；内部用 `UScroll`（`tag="ul"`）包裹提供滚动。`UListItem` 渲染 `<li>` 行容器，本身没有任何属性。

## 快速上手

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/desktop'

const data = [
  { id: 1, title: '收件箱' },
  { id: 2, title: '已发送' },
  { id: 3, title: '草稿' }
]
</script>

<template>
  <u-list :data="data" style="height: 320px" v-slot="{ item }">
    <u-list-item>{{ item.title }}</u-list-item>
  </u-list>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、列表无颜色。

## API 签名

```ts
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

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `data` | `Record<string, any>[]` | — | 是 | 数据驱动的唯一来源；每项触发一次默认插槽渲染 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 回退链：自身 `size` > 全局配置 > `'default'` |

插槽：默认插槽，作用域 `{ item: Record<string, any>, index: number }`；插槽内容就是一行的内容。`UListItem` 无属性、无事件，仅渲染 `<li>`。

事件：无。暴露：`ListExposed` 为空对象。

## 方法与事件

无事件、无暴露方法。行级交互（点击、选中）通过插槽内容上的原生事件实现，见下文示例。

## 典型示例

### 斑马纹与序号

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/desktop'

const data = [{ label: '第一项' }, { label: '第二项' }, { label: '第三项' }]
</script>

<template>
  <u-list :data="data" v-slot="{ item, index }">
    <u-list-item :style="{ background: index % 2 === 0 ? '#f5f5f5' : '#fff' }">
      {{ index + 1 }}. {{ item.label }}
    </u-list-item>
  </u-list>
</template>
```

### 可点击行

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/desktop'

const data = [
  { id: 'a', title: '任务 A' },
  { id: 'b', title: '任务 B' }
]

function onPick(row: { id: string; title: string }) {
  console.log('选中:', row.id) // => 点击行时输出对应 id
}
</script>

<template>
  <u-list :data="data" style="height: 240px" v-slot="{ item }">
    <u-list-item @click="onPick(item)">{{ item.title }}</u-list-item>
  </u-list>
</template>
```

### 三档尺寸

```vue
<script setup lang="ts">
import { UList, UListItem } from '@veltra/desktop'

const data = [{ id: 1, name: '张三' }, { id: 2, name: '李四' }]
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
> - 本库是数据驱动 + 作用域插槽（`v-slot="{ item, index }"`），不是在 `UList` 默认插槽里手写 `<u-list-item v-for>`；不传 `data` 就一行都不渲染。
> - `data` 是必填属性；空数组渲染为空白，本库不渲染空态提示——需要空态时在列表外自行用 `UEmpty` 处理。
> - 行内容必须用 `UListItem`（`<li>`）包裹，否则内容直接挂在 `<ul>` 下，结构与样式都不符合预期。
> - 列表高度通过 `style="height: …"` 限制；不限高时 `UScroll` 容器按默认 `100%` 撑满父级，父级没有高度就没有滚动条。
> - 没有选中、分页等内建交互；需要这些能力时用 `UTable` 或在行插槽上自行实现。
