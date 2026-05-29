# UMenu — 菜单

> `import type { MenuProps, MenuEmits, MenuExposed, MenuItem } from '@veltra/desktop'`

侧边导航菜单：多级嵌套、图标、折叠/展开、当前路径高亮。`UMenuItem` / `UMenuSub` 是内部递归组件，由 `UMenu` 自动渲染，仅在自定义布局时直接使用。

## Import

```ts
// UMenu / UMenuItem / UMenuSub 由 Vite 自动导入，无需手动 import
import type { MenuItem } from '@veltra/desktop'
```

## 关联类型

```ts
interface MenuItem {
  title: string // 菜单标题
  path: string // 路径，匹配 currentPath 高亮
  icon?: string | DefineComponent // 图片 URL 或图标组件
  disabled?: boolean
  children?: MenuItem[] // 子菜单
  [key: string]: any // 透传字段
}
```

## Props

| prop           | type         | default | 说明                                                  |
| -------------- | ------------ | ------- | ----------------------------------------------------- |
| `menus`        | `MenuItem[]` | —       | 菜单数据                                              |
| `currentPath`  | `string`     | —       | 当前激活路径，匹配 `MenuItem.path` 高亮并自动展开祖先 |
| `collapsed`    | `boolean`    | `false` | 折叠模式：一级菜单仅显示图标，hover 弹出子菜单        |
| `uniqueOpened` | `boolean`    | `false` | 同级仅允许一个子菜单展开                              |

## Emits

| event        | 参数               | 说明                            |
| ------------ | ------------------ | ------------------------------- |
| `item-click` | `(item: MenuItem)` | 点击菜单项（disabled 项不触发） |

## Slots / Exposed

无。

## UMenuItem / UMenuSub Props

仅在自定义递归布局时使用：

- `UMenuItem`：`menu: MenuItem` / `depth: number`
- `UMenuSub`：`menu: MenuItem`（含 `children`）/ `parentKey: string` / `depth: number`

## Examples

### 基础

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

### 折叠 + 路由联动

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

### 禁用项 + uniqueOpened + 图片图标

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
