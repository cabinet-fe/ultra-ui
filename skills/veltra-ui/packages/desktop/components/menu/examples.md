# UMenu 示例

## 基础

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { HouseFilled, SettingFilled, LockFilled } from '@veltra/icons/normal'
import type { MenuItem } from '@veltra/desktop'

const currentPath = shallowRef('/')
const menus = shallowRef<MenuItem[]>([
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
  <u-menu :menus="menus" :current-path="currentPath" @item-click="currentPath = $event.path" />
</template>
```

## 折叠 + 路由联动

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, reactive } from 'vue'
import type { MenuItem } from '@veltra/desktop'

const route = useRoute()
const router = useRouter()
const config = reactive({ collapsed: false })
const currentPath = computed(() => (route.query.menuPath as string) || '/')

function onItemClick(item: MenuItem) {
  router.replace({ path: route.path, query: { menuPath: item.path } })
}
</script>

<template>
  <u-checkbox v-model="config.collapsed">折叠菜单</u-checkbox>
  <u-menu
    :menus="menus"
    :collapsed="config.collapsed"
    :current-path="currentPath"
    :style="{ width: config.collapsed ? '64px' : '260px' }"
    @item-click="onItemClick"
  />
</template>
```

## 禁用项 + uniqueOpened + 图片图标

```vue
<script setup lang="ts">
import type { MenuItem } from '@veltra/desktop'

const menus: MenuItem[] = [
  { title: '首页', icon: '/assets/home.svg', path: '/' },
  { title: '无权限页面', path: '/forbidden', disabled: true },
  { title: '分组一', path: '/group-1', children: [{ title: '子项 A', path: '/group-1/a' }] }
]
</script>

<template>
  <u-menu :menus="menus" current-path="/" unique-opened />
</template>
```
