# UMenu — 菜单

> `import type { MenuProps, MenuEmits, MenuExposed, MenuItem } from '@veltra/desktop'`

侧边导航菜单，支持多级嵌套、图标、折叠/展开模式、当前路径高亮。

## Import

```ts
// UMenu、UMenuItem、UMenuSub 由 Vite 自动导入，无需手动 import
```

## MenuItem

```ts
import type { DefineComponent } from 'vue'

interface MenuItem {
  /** 图标：字符串为图片 URL，DefineComponent 为 Vue 组件（如 @veltra/icons/normal 中的图标） */
  icon?: string | DefineComponent
  /** 菜单标题 */
  title: string
  /** 菜单路径，用于匹配 currentPath 激活高亮 */
  path: string
  /** 是否禁用 */
  disabled?: boolean
  /** 子菜单 */
  children?: MenuItem[]
  /** 额外透传字段 */
  [key: string]: any
}
```

# UMenu

## Props

| prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `menus` | `MenuItem[]` | — | 菜单列表 |
| `currentPath` | `string` | — | 当前激活路径，匹配 `MenuItem.path` 高亮对应项并自动展开祖先 |
| `collapsed` | `boolean` | `false` | 是否折叠模式。折叠后一级菜单仅显示图标，hover 弹出子菜单 |
| `uniqueOpened` | `boolean` | `false` | 是否仅允许一个子菜单展开 |

## Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `item-click` | `(item: MenuItem)` | 点击菜单项时触发（disabled 项不触发） |

## Slots

无。菜单项完全由 `menus` 数据驱动渲染。

## Exposed

```ts
interface MenuExposed {}
```

无暴露的方法或属性。

---

# UMenuItem

> 内部组件，通常由 `UMenu` 自动渲染。仅在自定义布局时直接使用。

## Props

| prop | 类型 | 说明 |
|------|------|------|
| `menu` | `MenuItem` | 菜单项数据 |
| `depth` | `number` | 嵌套深度（`0` 为顶级） |

## Emits

无。点击通过依赖注入向上传递 `item-click`。

## Slots

无。

---

# UMenuSub

> 内部组件，渲染含有 `children` 的父级菜单项。通常由 `UMenu` 自动渲染。

## Props

| prop | 类型 | 说明 |
|------|------|------|
| `menu` | `MenuItem` | 菜单项数据（须含 `children`） |
| `parentKey` | `string` | 父级 key，用于递归渲染时生成唯一 key |
| `depth` | `number` | 嵌套深度（`0` 为顶级） |

## Emits

无。展开/折叠通过内部 `expandedPath`（Set）管理。

---

## Examples

### 基础菜单

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

### 折叠菜单 + 路由联动

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, reactive, shallowRef } from 'vue'
import type { MenuItem } from '@veltra/desktop'

const route = useRoute()
const router = useRouter()
const config = reactive({ collapsed: false })

const currentPath = computed(() => (route.query.menuPath as string) || '/')

const menus = shallowRef<MenuItem[]>([
  { title: '首页', path: '/' },
  { title: '数据看板', path: '/dashboard' },
  {
    title: '系统设置',
    path: '/settings',
    children: [
      { title: '角色管理', path: '/settings/role' },
      { title: '用户管理', path: '/settings/user' }
    ]
  }
])

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

### 禁用项与 uniqueOpened

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { MenuItem } from '@veltra/desktop'

const currentPath = shallowRef('/')

const menus = shallowRef<MenuItem[]>([
  { title: '可访问页面', path: '/' },
  { title: '无权限页面', path: '/forbidden', disabled: true },
  {
    title: '分组一',
    path: '/group-1',
    children: [
      { title: '子项 A', path: '/group-1/a' },
      { title: '子项 B', path: '/group-1/b' }
    ]
  },
  {
    title: '分组二',
    path: '/group-2',
    children: [
      { title: '子项 C', path: '/group-2/c' }
    ]
  }
])
</script>

<template>
  <u-menu
    :menus="menus"
    :current-path="currentPath"
    unique-opened
    @item-click="currentPath = $event.path"
  />
</template>
```

### 自定义图标（图片 URL）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { MenuItem } from '@veltra/desktop'

const menus = shallowRef<MenuItem[]>([
  { title: '首页', icon: '/assets/home.svg', path: '/' },
  { title: '设置', icon: '/assets/settings.png', path: '/settings' }
])
</script>

<template>
  <u-menu :menus="menus" current-path="/" />
</template>
```
