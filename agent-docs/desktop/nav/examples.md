---
title: UNav / UNavSub / UNavItem 示例
description: 侧栏导航用 menus 受控；带 children 的项渲染为 UNavSub，叶子渲染为 UNavItem
---

对外只用 `UNav`：传 `menus`（`title` / `path` 必填），选中用 `current-path`，点击用 `@item-click`，没有 `v-model:current-path`。`UNavSub` 与 `UNavItem` 由 `UNav` 根据数据自动渲染，依赖 `UNav` 的 provide，模板里不要手写这两个标签。折叠用 `collapsed`，折叠宽度常见为 64px。外观走主题 `nav`。

## UNav

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

## UNavSub

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

## UNavItem

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
