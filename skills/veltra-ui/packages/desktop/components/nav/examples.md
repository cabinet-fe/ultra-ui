# UNav 示例

## 基础

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { HouseFilled, SettingFilled, LockFilled } from '@veltra/icons/normal'
import type { NavItem } from '@veltra/desktop'

const currentPath = shallowRef('/')
const menus = shallowRef<NavItem[]>([
  { title: '首页', icon: HouseFilled, path: '/' },
  { title: '功能管理', icon: SettingFilled, path: '/modules' },
  {
    title: '系统设置',
    icon: LockFilled,
    path: '/settings',
    children: [
      { title: '角色管理', path: '/settings/role' },
      { title: '用户管理', path: '/settings/user' }
    ]
  }
])
</script>

<template>
  <u-nav :menus="menus" :current-path="currentPath" @item-click="currentPath = $event.path" />
</template>
```

## 折叠 + 路由联动

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, reactive } from 'vue'
import type { NavItem } from '@veltra/desktop'

const route = useRoute()
const router = useRouter()
const config = reactive({ collapsed: false })
const currentPath = computed(() => (route.query.navPath as string) || '/')

function onItemClick(item: NavItem) {
  router.replace({ path: route.path, query: { navPath: item.path } })
}
</script>

<template>
  <u-checkbox v-model="config.collapsed">折叠导航</u-checkbox>
  <u-nav
    :menus="menus"
    :collapsed="config.collapsed"
    :current-path="currentPath"
    :style="{ width: config.collapsed ? '64px' : '260px' }"
    @item-click="onItemClick"
  />
</template>
```
