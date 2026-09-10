---
title: "UPaginator 分页器"
description: "分页器：v-model:pageNumber 与 v-model:pageSize 双向绑定，按 total 计算总页数，页码窗口最多 5 个；内置每页条数选择器与页码跳转输入框，pageSize 与档位默认值来自 useConfig 全局配置，simple 可切简洁模式。"
aliases: [Pagination, Pager, ElPagination, 分页组件, 页码]
keywords:
  - pageNumber
  - pageSize
  - pageSizeOptions
  - total
  - simple
  - change:pageNumber
  - change:pageSize
  - update:pageNumber
  - setConfig
  - useConfig
  - 分页
  - 每页条数
  - 页码跳转
  - 总条数
  - 简洁模式
  - 服务端分页
---

# UPaginator 分页器

`@veltra/desktop` 导出 `UPaginator`。它渲染「共 N 条 + 每页条数选择器 + 页码按钮 + 页码跳转输入框」，用 `v-model:pageNumber` / `v-model:pageSize` 双向绑定分页状态，按 `total` 计算总页数，适合配合表格做服务端分页。列表数据本就全部在前端时，直接对内存数组分片即可，不需要本组件。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UPaginator } from '@veltra/desktop'

const pageNumber = ref(1)
const pageSize = ref(10)
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="256"
  />
  <!-- => 显示「共 256 条」、每页条数选择器与页码，共 26 页 -->
</template>
```

## API 签名

```ts
import type { ShallowRef } from 'vue'
import type { DeconstructValue } from '@veltra/utils'

/** 分页器组件属性 */
export interface PaginatorProps {
  /** 当前处于第几页，v-model:pageNumber 绑定。默认 1 */
  pageNumber?: number
  /** 每页显示的数量，v-model:pageSize 绑定；见约束：未绑定时页数计算退到全局配置 */
  pageSize?: number
  /** 大小模式 */
  size?: 'large' | 'default' | 'small'
  /** 数据总数（条），用于计算总页数。默认 0 */
  total?: number
  /** 每页显示数量选项（条）；不传时取全局配置 config.paginator.pageSizeOptions */
  pageSizeOptions?: number[]
  /** 简洁模式：隐藏页码按钮区，只保留条数选择器与跳转输入框 */
  simple?: boolean
}

/** 分页器组件事件 */
export interface PaginatorEmits {
  (e: 'update:pageNumber', value: number): void
  /** 页码变化后触发（翻页按钮、页码点击、跳转输入框回车） */
  (e: 'change:pageNumber', value: number): void
  (e: 'update:pageSize', value: number): void
  /** 每页条数变化后触发；同时会把页码重置为 1 且不触发 change:pageNumber */
  (e: 'change:pageSize', value: number): void
}

/** 分页器暴露的属性（经 DeconstructValue 解包后模板 ref 上直接可访问） */
export interface _PaginatorExposed {
  el: ShallowRef<HTMLElement | undefined>
}
export type PaginatorExposed = DeconstructValue<_PaginatorExposed>
```

全局默认值来自 `useConfig`（`@veltra/compositions`）：`config.paginator.pageSize` 默认 `40`，`config.paginator.pageSizeOptions` 默认 `[40, 100, 200, 500, 1000]`；用 `setConfig` 修改：

```ts
import { useConfig } from '@veltra/compositions'

const { setConfig } = useConfig()
setConfig({ paginator: { pageSize: 20, pageSizeOptions: [10, 20, 50, 100] } })
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model:page-number`（`pageNumber`） | `number` | `1` | 否 | 取值 1~总页数；页码窗口最多显示 5 个连续页码，随当前页滑动 |
| `v-model:page-size`（`pageSize`） | `number` | 见约束 | 否 | 内部选择器初值为 10；页数计算按 `props.pageSize`，未绑定时退到 `config.paginator.pageSize`（默认 40）。必须绑定本 model 保证选择器显示与页数计算一致 |
| `total` | `number` | `0` | 否 | 数据总条数；总页数 = `Math.ceil(total / pageSize)`，`total` 为 0 时总页数为 0 |
| `pageSizeOptions` | `number[]` | `[40, 100, 200, 500, 1000]` | 否 | 选项渲染为 `N条`；不传时取 `config.paginator.pageSizeOptions` |
| `simple` | `boolean` | `false` | 否 | `true` 时隐藏整个页码按钮区（含首页/上一页/下一页/末页），仅显示条数选择器与「前往 x / y 页」跳转 |
| `size` | `'large' \| 'default' \| 'small'` | `'default'` | 否 | 组件根尺寸；内部条数选择器与页码输入框固定 `small` |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:pageNumber` | `value: number` | 页码变化后写回 model；页码点击、上一页/下一页/首页/末页、跳转输入框、改每页条数重置为 1 时都会触发 |
| `change:pageNumber` | `value: number` | 用户主动翻页后（页码点击、翻页按钮、跳转输入框回车且值在 1~总页数内）；点击当前页码不触发；改每页条数导致的页码重置为 1 不触发 |
| `update:pageSize` | `value: number` | 条数选择器变化后写回 model |
| `change:pageSize` | `value: number` | 条数选择器变化后触发；同时页码被重置为 1 |

- 跳转输入框回车只在输入值满足 `1 <= 值 <= 总页数` 时生效，越界值被忽略。
- 暴露属性：模板 `ref` 上直接访问 `el`（`HTMLElement | undefined`），即组件根元素——`PaginatorExposed` 经 `DeconstructValue` 解包，无需再 `.value`。

## 典型示例

### 服务端分页

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { UPaginator } from '@veltra/desktop'

interface UserRow {
  id: number
  name: string
}

const pageNumber = ref(1)
const pageSize = ref(20)
const rows = ref<UserRow[]>([])
const total = ref(0)

async function loadPage() {
  const res = await fetch(
    `<接口地址>?page=${pageNumber.value}&pageSize=${pageSize.value}`
  )
  const data = (await res.json()) as { list: UserRow[]; total: number }
  rows.value = data.list
  total.value = data.total
}

// 用户翻页或改每页条数后重新拉数据
watch([pageNumber, pageSize], loadPage)
loadPage()
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="total"
  />
  <!-- => 改每页条数时页码自动回到第 1 页，翻页与改条数统一由 watch 拉数据 -->
</template>
```

### 自定义档位与简洁模式

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UPaginator } from '@veltra/desktop'

const pageNumber = ref(1)
const pageSize = ref(10)
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="500"
    :page-size-options="[10, 20, 50, 100]"
    simple
  />
  <!-- => 简洁模式：无页码按钮，只有条数选择器与「前往 1 / 50 页」输入框 -->
</template>
```

### 全局默认每页条数

未绑定 `v-model:page-size` 的分页器按 `useConfig` 的全局配置计算页数；用 `setConfig` 把默认档位改成业务需要的值。

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UPaginator } from '@veltra/desktop'
import { useConfig } from '@veltra/compositions'

const { setConfig } = useConfig()

onMounted(() => {
  // 全局生效：所有未显式传 pageSize / pageSizeOptions 的分页器
  setConfig({ paginator: { pageSize: 20, pageSizeOptions: [20, 50, 100] } })
})

const pageNumber = ref(1)
</script>

<template>
  <u-paginator v-model:page-number="pageNumber" :total="1000" />
  <!-- => 页数按 20 条/页计算（50 页），条数下拉为 20条/50条/100条 -->
</template>
```

## 注意事项

> [!WARNING]
> - 本库是 `v-model:pageNumber` / `v-model:page-size` 两个独立 model，不是 Element Plus 的 `current-page` / `page-size` 单向 props + `current-change` / `size-change` 事件（事件名是 `change:pageNumber` / `change:pageSize`）。
> - 必须绑定 `v-model:page-size`：否则页数计算用全局 `config.paginator.pageSize`（默认 40），而条数选择器显示内部默认值 10，两者不一致。
> - 改每页条数会把页码重置为 1，且只触发 `change:pageSize`、不触发 `change:pageNumber`；需要重新拉第一页数据时在 `change:pageSize` 里处理。
> - 页码窗口固定最多 5 个连续页码，没有全部页码的展开模式。
> - 本库 `UPaginator` 没有 `disabled` 属性，也没有 `background` / `layout` 属性；布局固定，只可用 `simple` 收敛为简洁模式。
> - `total` 单位是条数不是页数；传页数会导致总页数计算错误。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 总页数不对（选择器显示 10 条，页数却按 40 条算）

原因：未绑定 `v-model:page-size`，页数计算退到全局默认 `config.paginator.pageSize`（40）。修复：绑定 model：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UPaginator } from '@veltra/desktop'

const pageNumber = ref(1)
const pageSize = ref(10)
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="200"
  />
  <!-- => 20 页，与选择器的 10 条一致 -->
</template>
```

### 改了每页条数，列表没刷新到第一页

原因：只监听了 `change:pageNumber`，而改条数只触发 `change:pageSize`。修复：两个事件都监听，或直接 `watch` 两个 model（见「服务端分页」示例）。

### 跳转输入框输入页码无效

原因：输入值不在 `1 ~ 总页数` 范围内，回车被忽略。修复：输入范围内页码；总页数取决于 `total` 与 `pageSize` 是否正确传入。
