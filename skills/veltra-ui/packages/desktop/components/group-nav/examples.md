# UGroupNav 示例

## 基础分组

`groups` 为 `GroupNavGroup[]`：每组有标题与 `children` 叶子。更深 `children` 会被忽略。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { Cart, HouseFilled, Lock, Setting } from '@veltra/icons/normal'
import type { GroupNavGroup } from '@veltra/desktop'

const currentPath = shallowRef('/home')
const groups = shallowRef<GroupNavGroup[]>([
  {
    title: '概览',
    children: [{ title: '首页', icon: HouseFilled, path: '/home' }]
  },
  {
    title: '业务中心',
    children: [
      { title: '功能模块', path: '/business/modules' },
      { title: '数据字典', icon: Cart, path: '/business/dict' },
      {
        title: '角色管理',
        icon: Lock,
        path: '/business/role',
        // 更深 children 会被舍弃，本项仍作为叶子展示
        children: [
          { title: '角色列表', path: '/business/role/list' },
          { title: '权限配置', path: '/business/role/permission' }
        ]
      }
    ]
  },
  {
    title: '帮助',
    children: [{ title: '使用帮助', icon: Cart, path: '/help' }]
  },
  {
    title: '系统设置',
    children: [
      { title: '基础设置', icon: Setting, path: '/settings/basic' },
      { title: '安全设置', icon: Lock, path: '/settings/security', disabled: true }
    ]
  }
])
</script>

<template>
  <u-group-nav
    :groups="groups"
    :current-path="currentPath"
    @item-click="currentPath = $event.path"
  />
</template>
```

## 与路由联动

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, shallowRef } from 'vue'
import type { GroupNavGroup, NavItem } from '@veltra/desktop'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.query.currentPath as string | undefined)
const groups = shallowRef<GroupNavGroup[]>([
  {
    title: '概览',
    children: [{ title: '首页', path: '/home' }]
  },
  {
    title: '业务中心',
    children: [
      { title: '功能模块', path: '/business/modules' },
      { title: '数据字典', path: '/business/dict' }
    ]
  },
  {
    title: '帮助',
    children: [{ title: '使用帮助', path: '/help' }]
  },
  {
    title: '系统设置',
    children: [
      { title: '基础设置', path: '/settings/basic' },
      { title: '安全设置', path: '/settings/security', disabled: true }
    ]
  }
])

function onItemClick(item: NavItem) {
  router.replace({ path: route.path, query: { currentPath: item.path } })
}
</script>

<template>
  <u-group-nav :groups="groups" :current-path="currentPath" @item-click="onItemClick" />
</template>
```
