---
title: "UBreadcrumb 面包屑"
description: "面包屑路径导航：items 按从一级到末级渲染层级路径，带 href 的项走原生 <a> 跳转，无 href 的链式项发 click 事件供 SPA 路由使用；支持禁用项、lastLinked 末级链接、size 三档与 item/separator 插槽。"
aliases: [Breadcrumb, Breadcrumbs, 面包屑导航, 页面路径, 路径导航]
keywords:
  - items
  - lastLinked
  - BreadcrumbItem
  - BreadcrumbSlotScope
  - aria-current
  - click
  - href
  - disabled
  - separator
  - 页面路径
  - 层级导航
  - 分隔符
  - 末级链接
  - 当前页
  - 键盘操作
  - SPA 路由
---

# UBreadcrumb 面包屑

`@veltra/desktop` 导出 `UBreadcrumb`（面包屑）。`items` 按从一级到末级的顺序渲染当前页面层级路径：带 `href` 的项渲染为 `<a>` 由浏览器导航，无 `href` 的链式项点击（或 Enter/Space）发出 `click` 事件供 SPA 路由使用；末级默认渲染为当前页文本（`aria-current="page"`）。面包屑只展示路径，不做菜单选中，与 `UNav` / `UDualNav` / `UGroupNav` 侧栏导航是互补关系。

## 快速上手

```vue
<script setup lang="ts">
import { UBreadcrumb } from '@veltra/desktop'
import type { BreadcrumbItem } from '@veltra/desktop'

const items: BreadcrumbItem[] = [
  { title: '首页', href: '/home' },
  { title: '系统设置', href: '/settings' },
  { title: '用户管理' } // 末级：当前页，无 href 也不可点
]
</script>

<template>
  <u-breadcrumb :items="items" />
</template>
```

## API 签名

```ts
/** 面包屑单项 */
export interface BreadcrumbItem {
  /** 展示文案。必填 */
  title: string
  /** 存在时渲染为 `<a>`，由浏览器处理导航 */
  href?: string
  /** 为 true 时不跳转、不触发 click。默认 false */
  disabled?: boolean
}

/** 面包屑组件属性 */
export interface BreadcrumbProps {
  /** 路径项，顺序为从一级到末级。必填 */
  items: BreadcrumbItem[]
  /** 尺寸。默认 'default' */
  size?: ComponentSize
  /**
   * 末级是否作为链接渲染
   * @default false — 末级为当前页，使用 `aria-current="page"`
   */
  lastLinked?: boolean
}

export type ComponentSize = 'small' | 'default' | 'large'

/** `item` 插槽作用域 */
export interface BreadcrumbSlotScope {
  item: BreadcrumbItem
  index: number
  isLast: boolean
}

/** 面包屑组件事件 */
export interface BreadcrumbEmits {
  /**
   * 可交互项（无 `href` 的链式项）被点击时触发；有 `href` 时不触发（走原生导航）
   */
  (e: 'click', item: BreadcrumbItem, index: number, ev: Event): void
}

/** 暴露方法为空：ref 上没有公开方法 */
export interface BreadcrumbExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `items` | `BreadcrumbItem[]` | — | 是 | 顺序即渲染顺序，从一级到末级；`title` 必填；单项文本最大宽度 240px，超长截断显示省略号 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 影响字号、`--u-breadcrumb-<size>` 最小高度与分隔符间距 |
| `lastLinked` | `boolean` | `false` | 否 | `true` 时末级按同级链接规则渲染（有 `href` 为 `<a>`，无 `href` 为可点 span）；`false` 时末级固定为当前页文本 |

事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `click` | `(item: BreadcrumbItem, index: number, ev: Event)` | 点击无 `href` 且非 `disabled` 的链式项（含末级且 `lastLinked: true` 且无 `href` 的项）；键盘 Enter / Space 同样触发。带 `href` 的项与 `disabled` 项不触发 |

插槽：

| 插槽 | 作用域 | 默认内容 |
| --- | --- | --- |
| `item` | `{ item: BreadcrumbItem; index: number; isLast: boolean }` | 按链接 / 当前页规则渲染的文本 |
| `separator` | 无 | `/` |

## 方法与事件

- 渲染规则逐项判定（自上而下）：
  1. `disabled: true`：不可交互。有 `href` 时仍渲染 `<a aria-disabled="true" tabindex="-1">`，点击被 `preventDefault` 阻止；无 `href` 时渲染为纯文本。
  2. 非 `disabled` 且非末级，或末级且 `lastLinked: true`：有 `href` 渲染 `<a href>` 原生跳转（不发 `click` 事件）；无 `href` 渲染 `<span role="link" tabindex="0">`，点击或 Enter / Space 发出 `click` 事件。
  3. 末级且 `lastLinked: false`（默认）：渲染纯文本并带 `aria-current="page"`，不可交互。
- 键盘：可交互 span 聚焦后按 Enter 或 Space 触发 `click`，其余按键忽略。
- 结构：根元素 `<nav aria-label="Breadcrumb">`，内部 `<ol>`；分隔符 `<li aria-hidden="true">` 默认渲染 `/`，可用 `#separator` 插槽替换（如图标）。
- 组件没有暴露方法；无 `v-model`、无选中状态。

## 典型示例

### 无 href 项 + click 事件接 SPA 路由

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { UBreadcrumb } from '@veltra/desktop'
import type { BreadcrumbItem } from '@veltra/desktop'

const router = useRouter()

const items: BreadcrumbItem[] = [
  { title: '首页', href: '/home' }, // 有 href：浏览器原生导航
  { title: '列表页' }, // 无 href：点击走 click 事件
  { title: '详情' } // 末级：当前页
]

function onItemClick(item: BreadcrumbItem, index: number) {
  if (item.title === '列表页') {
    router.push('/list')
  }
  console.log(item.title, index) // => '列表页', 1
}
</script>

<template>
  <u-breadcrumb :items="items" @click="onItemClick" />
</template>
```

### 自定义分隔符与 item 插槽

```vue
<script setup lang="ts">
import { UBreadcrumb } from '@veltra/desktop'
import { ArrowRight } from '@veltra/icons/normal'
import type { BreadcrumbItem } from '@veltra/desktop'

const crumbs: BreadcrumbItem[] = [
  { title: '首页', href: '/' },
  { title: '设置' },
  { title: '安全设置' }
]
</script>

<template>
  <u-breadcrumb :items="crumbs">
    <!-- 替换默认 "/" 分隔符 -->
    <template #separator>
      <u-icon :size="14"><ArrowRight /></u-icon>
    </template>
    <!-- 接管每项渲染；isLast 可用于加粗末级 -->
    <template #item="{ item, isLast }">
      <span :style="{ fontWeight: isLast ? 600 : 400 }">{{ item.title }}</span>
    </template>
  </u-breadcrumb>
</template>
```

### lastLinked 末级链接与禁用项

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UBreadcrumb } from '@veltra/desktop'
import type { BreadcrumbItem } from '@veltra/desktop'

const items = shallowRef<BreadcrumbItem[]>([
  { title: '文档', href: '/docs' },
  { title: '组件', disabled: true }, // 有 href 才渲染禁用 <a>；无 href 渲染纯文本
  { title: '面包屑', href: '/docs/breadcrumb' } // 末级：lastLinked 开启后可点
])
</script>

<template>
  <!-- last-linked：末级也按链接渲染，href 存在时走原生导航 -->
  <u-breadcrumb last-linked :items="items" />
</template>
```

## 注意事项

> [!WARNING]
> - 带 `href` 的项不触发 `click` 事件：导航交给浏览器原生 `<a>` 行为。要在事件里统一接管跳转，`items` 就不要写 `href`。
> - 末级默认不可点、不触发 `click`；需要末级可点必须设 `lastLinked: true`。
> - `disabled: true` 的项既不跳转也不触发 `click`；有 `href` 时渲染为禁用 `<a>`（`aria-disabled="true"`），无 `href` 时渲染为纯文本。
> - 本库单项类型是 `BreadcrumbItem`（`title` 必填），不是 Element Plus 的 `to` / `replace` 路由对象写法；SPA 跳转由宿主在 `click` 事件里自行路由。
> - 面包屑不消费主题 `nav` 侧栏配置，颜色跟随全局 `--u-*` 文本 token，深浅色随主题系列自动切换。

## 常见问题

### 点击某一级没有触发 `click`

三种原因：该级写了 `href`（走原生导航，不发事件）；该级 `disabled: true`；该级是末级且未设 `lastLinked: true`。按需去掉 `href`、去掉 `disabled` 或加 `last-linked`。

### 点击带 `href` 的项后页面整页刷新而不是 SPA 切换

`href` 是原生 `<a>` 行为。SPA 应用应把中间层级的 `href` 去掉、在 `click` 事件里 `router.push`；或 `href` 使用与路由兼容的 hash 形式（如 `#/list`）。
