---
title: UDualNav 示例
description: 双栏导航用 current-path 与 item-click 受控，没有 v-model:current-path
---

`UDualNav` 左轨是根级应用，右栏是当前根项的子导航。`menus` 项类型为 `DualNavRootItem`（`title` / `path` 必填，`icon` 建议用 `@veltra/icons/normal` 组件）。选中态用 `current-path`，点击用 `@item-click`；没有 `v-model:current-path`。左轨默认只显示图标，需要名称时设 `rail-variant="labeled"`（名称最多 4 个字）。外观由主题 `nav` 配置，不在 props 上。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DualNavRootItem, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting, User } from '@veltra/icons/normal'

const currentPath = ref('/home')

const menus: DualNavRootItem[] = [
  { title: '工作台', icon: HouseFilled, path: '/home', description: '常用入口' },
  {
    title: '系统',
    icon: Setting,
    path: '/system',
    children: [
      { title: '用户', icon: User, path: '/system/users' },
      { title: '设置', icon: Setting, path: '/system/settings' }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path
}
</script>

<template>
  <u-dual-nav
    :menus="menus"
    :current-path="currentPath"
    rail-variant="labeled"
    @item-click="onItemClick"
  />
</template>
```
