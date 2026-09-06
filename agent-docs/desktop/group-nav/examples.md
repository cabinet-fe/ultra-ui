---
title: UGroupNav 示例
description: 分组导航按 groups 渲染一层叶子，用 current-path 与 item-click 受控
---

`UGroupNav` 的 `groups` 每组有 `title` 和 `children`。只渲染一层叶子：`children` 再嵌套会被丢掉，该项仍当叶子展示。选中用 `current-path`，点击用 `@item-click`，没有 `v-model:current-path`。外观走主题 `nav`，不在 props 上。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { GroupNavGroup, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting } from '@veltra/icons/normal'

const currentPath = ref('/home')

const groups: GroupNavGroup[] = [
  { title: '概览', children: [{ title: '首页', icon: HouseFilled, path: '/home' }] },
  {
    title: '系统',
    children: [
      { title: '基础设置', icon: Setting, path: '/settings/basic' },
      { title: '安全设置', path: '/settings/security', disabled: true }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path
}
</script>

<template>
  <u-group-nav :groups="groups" :current-path="currentPath" @item-click="onItemClick" />
</template>
```
