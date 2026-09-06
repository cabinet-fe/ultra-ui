---
title: "UNav / UNavSub / UNavItem - 导航"
description: "侧栏导航用 menus 受控；带 children 的项渲染为 UNavSub，叶子渲染为 UNavItem"
---

# UNav / UNavSub / UNavItem - 导航

## 引入

```ts
import { UNav, UNavSub, UNavItem } from '@veltra/desktop'
```

## 示例

对外只用 `UNav`：传 `menus`（`title` / `path` 必填），选中用 `current-path`，点击用 `@item-click`，没有 `v-model:current-path`。`UNavSub` 与 `UNavItem` 由 `UNav` 根据数据自动渲染，依赖 `UNav` 的 provide，模板里不要手写这两个标签。折叠用 `collapsed`，折叠宽度常见为 64px。外观走主题 `nav`。

### UNav

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { NavItem } from '@veltra/desktop'
import { HouseFilled, Setting } from '@veltra/icons/normal'

const currentPath = ref('/home')
const collapsed = ref(false)

const menus: NavItem[] = [
  { title: '首页', icon: HouseFilled, path: '/home' },
  {
    title: '系统',
    icon: Setting,
    path: '/system',
    children: [
      { title: '角色', path: '/system/role' },
      { title: '用户', path: '/system/user' }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path
}
</script>

<template>
  <u-nav
    :menus="menus"
    :current-path="currentPath"
    :collapsed="collapsed"
    :style="{ width: collapsed ? '64px' : '240px', height: '100%' }"
    @item-click="onItemClick"
  />
</template>
```

### UNavSub

`menus` 里带 `children` 的节点会渲染为 `UNavSub`。点击标题只展开/收起，选中态看子项是否匹配 `current-path`。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { NavItem } from '@veltra/desktop'

const currentPath = ref('/system/user')

const menus: NavItem[] = [
  {
    title: '系统',
    path: '/system',
    children: [
      { title: '角色', path: '/system/role' },
      { title: '用户', path: '/system/user' }
    ]
  }
]
</script>

<template>
  <u-nav :menus="menus" :current-path="currentPath" @item-click="currentPath = $event.path" />
</template>
```

### UNavItem

没有 `children`（或 `children` 为空）的节点渲染为 `UNavItem`。`disabled: true` 时不可点。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { NavItem } from '@veltra/desktop'
import { HouseFilled } from '@veltra/icons/normal'

const currentPath = ref('/home')

const menus: NavItem[] = [
  { title: '首页', icon: HouseFilled, path: '/home' },
  { title: '回收站', path: '/trash', disabled: true }
]
</script>

<template>
  <u-nav :menus="menus" :current-path="currentPath" @item-click="currentPath = $event.path" />
</template>
```

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { DefineComponent } from 'vue'

/** 导航项 */
export interface NavItem {
  /** 图标 */
  icon?: string | DefineComponent
  /** 导航标题 */
  title: string
  /** 导航路径 */
  path: string
  /**
   * 应用描述；仅根级导航项有效，在 UDualNav 左轨 tooltip 与右栏顶部展示
   * @see DualNavRootItem
   */
  description?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 子导航 */
  children?: NavItem[]

  [key: string]: any
}

/** 导航组件属性 */
export interface NavProps {
  /** 当前路径 */
  currentPath?: string
  /** 是否折叠 */
  collapsed?: boolean
  /** 导航列表 */
  menus?: NavItem[]
}

/** 导航组件定义的事件 */
export interface NavEmits {
  (e: 'item-click', item: NavItem): void
}

/** 导航组件暴露的属性和方法(组件内部使用) */
export interface _NavExposed {
  /** 展开所有含子级的导航项 */
  expandAll: () => void
  /** 折叠所有导航项 */
  collapseAll: () => void
}

/** 导航组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NavExposed = DeconstructValue<_NavExposed>
```

## 避坑与使用要点

- 外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。详见主题文档「侧栏导航外观」。
