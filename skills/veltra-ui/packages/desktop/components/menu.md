# UMenu — 菜单

> `import type { MenuProps } from '@veltra/desktop'`

侧边菜单，支持折叠/展开、多级嵌套、图标。

## Import

```ts
import { UMenu } from '@veltra/desktop'
```

## MenuItem

```ts
interface MenuItem {
  title: string
  path: string
  icon?: Component      // 来自 @veltra/icons/normal
  disabled?: boolean
  children?: MenuItem[]
  [key: string]: any    // 额外透传字段
}
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `menus` | `MenuItem[]` | — | 菜单列表 |
| `currentPath` | `string` | — | 当前激活路径 |
| `collapsed` | `boolean` | — | 折叠模式 |
| `uniqueOpened` | `boolean` | — | 仅允许一个菜单展开 |

## Emits

| event | 参数 |
|-------|------|
| `item-click` | `(item: MenuItem)` |

## Examples

### 基础菜单

```vue
<script setup>
import { shallowRef } from 'vue'
import { HouseFilled, UserGroup, Lock } from '@veltra/icons/normal'

const menus = shallowRef([
  { title: '首页', icon: HouseFilled, path: '/' },
  { title: '功能管理', icon: UserGroup, path: '/modules' },
  {
    title: '系统设置', icon: Lock, path: '/settings',
    children: [
      { title: '角色管理', path: '/settings/role' },
      { title: '用户管理', path: '/settings/user' }
    ]
  }
])
</script>

<template>
  <u-menu :menus="menus" :current-path="currentPath" />
</template>
```

### 折叠菜单 + 路由联动

```vue
<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, reactive } from 'vue'

const route = useRoute()
const router = useRouter()
const config = reactive({ collapsed: false })

const currentPath = computed(() => route.query.currentPath as string)

function onItemClick(item) {
  router.replace({ path: route.path, query: { currentPath: item.path } })
}
</script>

<template>
  <u-checkbox v-model="config.collapsed">折叠</u-checkbox>

  <u-menu
    :menus="menus"
    :collapsed="config.collapsed"
    :current-path="currentPath"
    :style="{ width: config.collapsed ? '64px' : '260px' }"
    @item-click="onItemClick"
  />
</template>
```
