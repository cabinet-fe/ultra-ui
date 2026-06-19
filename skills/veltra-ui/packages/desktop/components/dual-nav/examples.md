# UDualNav 示例

## 应用切换与子菜单

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { HouseFilled, SettingFilled, UserGroup } from '@veltra/icons/normal'
import type { NavItem } from '@veltra/desktop'

const currentPath = shallowRef('/apps/home')
const menus = shallowRef<NavItem[]>([
  { title: '工作台', icon: HouseFilled, path: '/apps/home' },
  {
    title: '业务中心',
    icon: UserGroup,
    path: '/apps/business',
    children: [
      { title: '模块管理', path: '/apps/business/modules' },
      { title: '数据字典', path: '/apps/business/dict' }
    ]
  },
  {
    title: '系统设置',
    icon: SettingFilled,
    path: '/apps/settings',
    children: [{ title: '基础设置', path: '/apps/settings/basic' }]
  }
])
</script>

<template>
  <u-dual-nav
    :menus="menus"
    :current-path="currentPath"
    @item-click="currentPath = $event.path"
  />
</template>
```

## 无子菜单应用直接跳转

```vue
<script setup lang="ts">
import type { NavItem } from '@veltra/desktop'

const menus: NavItem[] = [
  {
    title: '文档中心',
    path: '/docs',
    children: [{ title: '快速开始', path: '/docs/start' }]
  },
  { title: '帮助', path: '/help' }
]
</script>

<template>
  <u-dual-nav :menus="menus" current-path="/docs/start" @item-click="console.log($event.path)" />
</template>
```
