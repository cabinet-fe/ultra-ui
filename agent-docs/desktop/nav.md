---
title: "UNav 侧边导航"
description: "侧边树形导航组件：menus 传入任意层级菜单树，currentPath 控制选中并自动展开祖先、自动滚动定位，collapsed 一键折叠为窄栏浮层。需要两层「应用 + 子菜单」结构用 UDualNav，扁平分组用 UGroupNav。"
aliases: [Nav, UNavSub, UNavItem, 侧边栏, 侧边导航栏, 导航菜单, sidebar, Menu]
keywords:
  - currentPath
  - collapsed
  - menus
  - item-click
  - NavItem
  - NavExposed
  - expandAll
  - collapseAll
  - 侧边栏
  - 导航菜单
  - 树形导航
  - 多级菜单
  - 折叠
  - 展开
  - 深色侧栏
  - 浅色侧栏
  - 路由联动
  - 选中高亮
  - 自动展开
---

# UNav 侧边导航

`@veltra/desktop` 导出 `UNav`（侧边导航）。`menus` 传入任意层级的 `NavItem` 树，组件渲染为可展开/收起的多级侧栏菜单；选中由 `currentPath` 受控，点击叶子项发出 `item-click`，**不内置 vue-router，路由跳转由宿主在 `item-click` 里自行接线**。分工规则：需要多级树形菜单用 `UNav`；需要「左轨应用 + 右栏子菜单」两层结构用 `UDualNav`；菜单是「分组标题 + 一层叶子」扁平结构用 `UGroupNav`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UNav } from '@veltra/desktop'
import type { NavItem } from '@veltra/desktop'
import { HouseFilled, Setting } from '@veltra/icons/normal'

const currentPath = shallowRef('/home')

const menus: NavItem[] = [
  { title: '首页', icon: HouseFilled, path: '/home' },
  {
    title: '系统设置',
    icon: Setting,
    path: '/settings',
    children: [
      { title: '角色管理', path: '/settings/role' },
      { title: '用户管理', path: '/settings/user' }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path // => 点击「角色管理」后 currentPath 为 '/settings/role'
}
</script>

<template>
  <u-nav
    :menus="menus"
    :current-path="currentPath"
    :style="{ width: '260px', height: '600px' }"
    @item-click="onItemClick"
  />
</template>
```

## API 签名

```ts
import type { DefineComponent } from 'vue'

/** 导航项 */
export interface NavItem {
  /** 图标；字符串按图片 URL 渲染为 <img>，组件渲染进 <u-icon> */
  icon?: string | DefineComponent
  /** 导航标题。必填 */
  title: string
  /** 导航路径，同时是选中与展开状态的键，必须在整棵树内唯一。必填 */
  path: string
  /** 应用描述；仅根级导航项有效，在 UDualNav 左轨 tooltip 与右栏顶部展示，UNav 不消费 */
  description?: string
  /** 是否禁用。禁用项点击不触发 item-click。默认 false */
  disabled?: boolean
  /** 子导航；非空数组时该项渲染为可展开的父级 */
  children?: NavItem[]

  [key: string]: any
}

/** 导航组件属性 */
export interface NavProps {
  /** 当前路径；等于某叶子项 path 时该项高亮，并自动展开其祖先链 */
  currentPath?: string
  /** 是否折叠为窄栏。默认 false */
  collapsed?: boolean
  /** 导航列表 */
  menus?: NavItem[]
}

/** 导航组件定义的事件 */
export interface NavEmits {
  (e: 'item-click', item: NavItem): void
}

/** 导航暴露的方法；源类型 `_NavExposed` 经 DeconstructValue 解包，模板 ref 上直接调用 */
export interface NavExposed {
  /** 展开所有含子级的导航项。同步，无返回值 */
  expandAll: () => void
  /** 折叠所有导航项。同步，无返回值 */
  collapseAll: () => void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `menus` | `NavItem[]` | — | 否 | `title`、`path` 必填；有 `children` 的项渲染为父级（点击只展开/收起），无 `children` 的渲染为叶子；层级不限 |
| `currentPath` | `string` | — | 否 | 与叶子项 `path` 全等才高亮；变化时自动展开命中项的祖先并把该项滚动到可视区；`path` 不唯一的树展开状态会互相污染 |
| `collapsed` | `boolean` | `false` | 否 | 折叠态组件不设宽度，宿主必须自定宽度（配合 64px） |

事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `item-click` | `(item: NavItem)` | 点击非 `disabled` 的叶子项；点击父级（有 `children`）只切换展开，不触发本事件 |

暴露方法（模板 ref 上直接调用，见下表）：

| 方法 | 签名 | 返回 | 说明 |
| --- | --- | --- | --- |
| `expandAll` | `() => void` | `void`，同步 | 展开所有含子级的节点 |
| `collapseAll` | `() => void` | `void`，同步 | 清空展开集合，全部收起 |

## 方法与事件

- 选中态完全受控：`item.path === currentPath` 的叶子项高亮（左侧 3px 主色条 + 激活底色）。组件没有 `v-model:current-path`，也没有 `update:currentPath` 事件。
- 自动展开：`currentPath` 或 `menus` 变化时，深度优先找到 `path === currentPath` 的节点，把其所有祖先的 `path` 加入展开集合（`immediate` 执行，首屏即展开）。
- 自动滚动：激活项因 `currentPath` 变化（非本次点击）成为激活时，自动滚动进滚动容器可视区。
- `disabled: true` 的项：样式半透明、`cursor: not-allowed`，点击不发出 `item-click`。
- 折叠态（`collapsed: true`）：一级叶子项只显示图标（无 `icon` 时显示 `title` 首字），悬停弹出右侧 tooltip；一级父级项点击后向右弹出浮层菜单（浮层内为完整文字的子菜单，最大高度 `min(320px, 60vh)`，超出滚动），点击浮层内叶子后浮层关闭。组件自身不设折叠宽度，宿主需给宽度，配合 `64px`。
- 展开动画：子列表高度 + 透明度过渡（进入 0.25s，离开 0.2s）。

## 典型示例

### 与 vue-router 联动 + 折叠开关

```vue
<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UNav } from '@veltra/desktop'
import type { NavItem } from '@veltra/desktop'
import { HouseFilled, Setting } from '@veltra/icons/normal'

const route = useRoute()
const router = useRouter()

// 用 query 里的 currentPath 当唯一事实源，刷新后选中与展开都能恢复
const currentPath = computed(() => (route.query.currentPath as string) || '/home')
const collapsed = ref(false)

const menus = shallowRef<NavItem[]>([
  { title: '首页', path: '/home' },
  {
    title: '系统设置',
    path: '/settings',
    children: [
      { title: '角色管理', path: '/settings/role' },
      { title: '用户管理', path: '/settings/user' }
    ]
  }
])

function onItemClick(item: NavItem) {
  router.replace({ path: route.path, query: { currentPath: item.path } })
}
</script>

<template>
  <label><input v-model="collapsed" type="checkbox" />折叠</label>
  <u-nav
    :menus="menus"
    :current-path="currentPath"
    :collapsed="collapsed"
    :style="{ width: collapsed ? '64px' : '260px', height: '600px', transition: 'width 0.25s' }"
    @item-click="onItemClick"
  />
</template>
```

### ref 调用 expandAll / collapseAll

```vue
<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'
import { UNav } from '@veltra/desktop'
import type { NavExposed, NavItem } from '@veltra/desktop'

// NavExposed 已解包：ref.value 上直接是 expandAll / collapseAll 方法
const navRef = useTemplateRef<NavExposed>('navRef')
const currentPath = shallowRef('/home')

const menus = shallowRef<NavItem[]>([
  {
    title: '业务中心',
    path: '/business',
    children: [
      {
        title: '角色管理',
        path: '/business/role',
        children: [{ title: '角色列表', path: '/business/role/list' }]
      },
      { title: '数据字典', path: '/business/dict' }
    ]
  }
])
</script>

<template>
  <button @click="navRef?.expandAll()">全部展开</button>
  <button @click="navRef?.collapseAll()">全部收起</button>
  <u-nav ref="navRef" :menus="menus" :current-path="currentPath" :style="{ width: '260px' }" />
</template>
```

### 禁用项与多级深树

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UNav } from '@veltra/desktop'
import type { NavItem } from '@veltra/desktop'
import { Lock } from '@veltra/icons/normal'

const currentPath = shallowRef('/biz/role/list')

const menus = shallowRef<NavItem[]>([
  {
    title: '业务中心',
    path: '/biz',
    children: [
      {
        title: '角色管理',
        path: '/biz/role',
        children: [
          { title: '角色列表', path: '/biz/role/list' },
          { title: '权限配置', path: '/biz/role/permission', disabled: true }
        ]
      },
      {
        title: '安全设置',
        path: '/biz/security',
        icon: Lock,
        children: [{ title: '登录日志', path: '/biz/security/log' }]
      }
    ]
  }
])

// 首屏 currentPath 为 '/biz/role/list'，'业务中心'、'角色管理' 自动展开，角色列表高亮
</script>

<template>
  <u-nav :menus="menus" :current-path="currentPath" :style="{ width: '260px', height: '480px' }" />
</template>
```

## 注意事项

> [!WARNING]
> - 外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。
> - 本库选中是 `currentPath` + `@item-click` 受控，不是 `v-model`，也不是 Element Plus 的 `default-active` + `router` 模式；不内置 vue-router，跳转必须宿主自己写。
> - 有 `children` 的项是父级：点击只展开/收起，不触发 `item-click`；高亮只发生在叶子上。
> - 树枝节点的 `path` 是展开状态的键，必须整树唯一；重复的 `path` 会导致展开状态互相影响。
> - 组件不设宽度与外边距；宿主必须给宽度（展开态常用 `260px`，折叠态 `64px`）。
> - `UNavSub` / `UNavItem` 虽从包内导出，但依赖 `UNav` 的 provide，模板里禁止手写这两个标签，菜单一律通过 `menus` 数据驱动。

自定义侧栏外观示例（应用入口执行一次）：

```ts
// src/main.ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

// 浅色侧栏：必须同时给 variant: 'light'
loadTheme(lightTheme.new({ nav: { variant: 'light', 'bg-color': '#f1ede0' } }))
```

## 常见问题

### 点击菜单项没有反应

按顺序排查：该项是否 `disabled: true`（禁用项不发事件）；是否父级项（有 `children` 时点击只切换展开）；`item-click` 处理器里是否忘了更新 `currentPath` / 调路由。

### 刷新页面后选中项没展开

`currentPath` 必须与目标叶子项 `path` 全等（字符串级），且祖先节点 `path` 在树内唯一。`currentPath` 带尾斜杠或大小写不一致时不会命中。
