---
title: "UDualNav 双栏导航"
description: "左轨应用切换 + 右栏子菜单的双栏侧栏导航：menus 根级为应用，点击左轨切换右栏菜单并发出首个叶子项；railVariant 支持 icon 与 labeled 两种左轨。需要不限层级树形菜单用 UNav，扁平分组用 UGroupNav。"
aliases: [DualNav, 双栏侧栏, 应用导航, 双层导航, rail 导航]
keywords:
  - currentPath
  - railVariant
  - labeled
  - DualNavRootItem
  - DualNavRailVariant
  - item-click
  - description
  - findFirstLeaf
  - 左轨
  - 右栏
  - 应用切换
  - 应用菜单
  - 子菜单
  - 图标栏
  - 深色侧栏
  - 浅色侧栏
  - 路由联动
---

# UDualNav 双栏导航

`@veltra/desktop` 导出 `UDualNav`（双栏导航）。左轨是 `menus` 根级应用（图标或图标 + 名称），右栏展示当前应用的子菜单；点击左轨把右栏切到对应应用并发出 `item-click`（payload 为该应用深度优先的第一个叶子项）。选中由 `currentPath` 受控，**不内置 vue-router**。分工规则：需要「应用 → 子菜单」两层工作区结构用 `UDualNav`；需要不限层级多级菜单用 `UNav`；菜单是「分组标题 + 一层叶子」扁平结构用 `UGroupNav`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UDualNav } from '@veltra/desktop'
import type { DualNavRootItem, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting } from '@veltra/icons/normal'

const currentPath = shallowRef('/apps/home')

const menus: DualNavRootItem[] = [
  {
    title: '工作台',
    icon: HouseFilled,
    path: '/apps/home',
    description: '个人工作台与常用入口'
  },
  {
    title: '系统设置',
    icon: Setting,
    path: '/apps/settings',
    children: [{ title: '基础设置', path: '/apps/settings/basic' }]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path
}
</script>

<template>
  <!-- 宿主必须给整体尺寸；右栏内部自带滚动 -->
  <u-dual-nav
    :menus="menus"
    :current-path="currentPath"
    :style="{ width: '320px', height: '480px' }"
    @item-click="onItemClick"
  />
</template>
```

## API 签名

```ts
import type { DefineComponent } from 'vue'

/** 导航项（与 UNav 共用） */
export interface NavItem {
  /** 图标；字符串按图片 URL 渲染为 <img>，组件渲染进 <u-icon> */
  icon?: string | DefineComponent
  /** 导航标题。必填 */
  title: string
  /** 导航路径，必须在整棵树内唯一。必填 */
  path: string
  /** 应用描述；仅根级有效，在左轨 tooltip 与右栏顶部展示 */
  description?: string
  /** 是否禁用。禁用应用点击无事件。默认 false */
  disabled?: boolean
  /** 子导航 */
  children?: NavItem[]

  [key: string]: any
}

/** 双栏导航左轨变体 */
export type DualNavRailVariant = 'icon' | 'labeled'

/** 双栏导航根级应用项；`description` 在左轨 tooltip 与右栏顶部展示 */
export interface DualNavRootItem extends NavItem {
  /** 子导航；为空时右栏以该应用自身渲染为单项菜单 */
  children?: NavItem[]
}

/** 双栏导航组件属性 */
export interface DualNavProps {
  /** 当前路径；决定左轨激活应用与右栏菜单内的高亮项 */
  currentPath?: string
  /** 根级应用导航列表 */
  menus?: DualNavRootItem[]
  /**
   * 左轨变体
   * - `icon`：仅图标（默认），轨道宽 `--u-nav-rail-width`（默认 56px）
   * - `labeled`：加宽左轨，图标下方显示菜单名称（最多 4 个字），轨道宽 `--u-nav-rail-labeled-width`（默认 72px）
   */
  railVariant?: DualNavRailVariant
}

/** 双栏导航组件定义的事件 */
export interface DualNavEmits {
  (e: 'item-click', item: NavItem): void
}

/** 暴露方法为空：ref 上没有公开方法 */
export interface DualNavExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `menus` | `DualNavRootItem[]` | — | 否 | 根级每项是一个应用；`title`、`path` 必填；无 `icon` 时左轨显示 `title` 首字 |
| `currentPath` | `string` | — | 否 | 深度优先反查所属根应用：命中的应用在左轨呈激活态，右栏展示其子菜单并高亮命中叶子；未命中且尚未手动切换时右栏默认展示 `menus[0]` |
| `railVariant` | `'icon' \| 'labeled'` | `'icon'` | 否 | `labeled` 时名称取 `title` 前 4 个字；`labeled` 且名称未截断且无 `description` 时左轨不弹 tooltip |

事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `item-click` | `(item: NavItem)` | 点击左轨应用：发出该应用深度优先第一个叶子（`findFirstLeaf`，无 `children` 时为应用自身）；点击右栏菜单叶子：发出该叶子。`disabled` 应用点击无事件 |

## 方法与事件

- 左轨激活（active）：`currentPath` 落在该应用子树内时呈激活态；选中（selected）：右栏已切到该应用但 `currentPath` 尚未落在其下时呈悬停风格——先切应用再跳路由的过渡态两者依次出现。
- 右栏切换：内部维护当前应用路径，`currentPath` 变化时用 `findRootApp` 反查所属根应用；反查不中且用户从未手动切换时回退到 `menus[0]`。
- 右栏头部：展示应用 `title` 与 `description`；当右栏菜单含可展开分支时出现「展开全部/折叠全部」按钮（内部调用 `UNav` 的 `expandAll` / `collapseAll`）；切换应用时展开状态重置为全部收起。
- 右栏主体：渲染应用的 `children` 为 `UNav`（非折叠）；应用无 `children` 时以 `[应用自身]` 渲染为单项菜单。
- 左轨 tooltip：悬停显示应用 `title` 与 `description`，方向朝右；点击后暂禁 tooltip，移出触发区恢复。
- 组件没有暴露方法；`item-click` 不会自动更新 `currentPath`，路由跳转由宿主完成。

## 典型示例

### 应用切换 + 路由联动

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UDualNav } from '@veltra/desktop'
import type { DualNavRootItem, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting, UserGroup } from '@veltra/icons/normal'

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => route.query.currentPath as string | undefined)

const menus = shallowRef<DualNavRootItem[]>([
  { title: '工作台', icon: HouseFilled, path: '/apps/home' },
  {
    title: '业务中心',
    icon: UserGroup,
    path: '/apps/business',
    description: '业务模块与数据管理',
    children: [
      { title: '功能模块', path: '/apps/business/modules' },
      { title: '数据字典', path: '/apps/business/dict' }
    ]
  },
  {
    title: '系统设置',
    icon: Setting,
    path: '/apps/settings',
    children: [{ title: '基础设置', path: '/apps/settings/basic' }]
  }
])

function handleItemClick(item: NavItem) {
  // 左轨点击时 item 是该应用第一个叶子；右栏点击时是叶子本身
  router.replace({ path: route.path, query: { currentPath: item.path } })
}
</script>

<template>
  <u-dual-nav
    :menus="menus"
    :current-path="currentPath"
    :style="{ width: '320px', height: '480px' }"
    @item-click="handleItemClick"
  />
</template>
```

### labeled 左轨（图标 + 名称）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UDualNav } from '@veltra/desktop'
import type { DualNavRootItem } from '@veltra/desktop'
import { HouseFilled, UserGroup } from '@veltra/icons/normal'

const currentPath = shallowRef('/apps/home')

const menus = shallowRef<DualNavRootItem[]>([
  { title: '工作台', icon: HouseFilled, path: '/apps/home' },
  {
    title: '业务中心',
    icon: UserGroup,
    path: '/apps/business',
    description: '名称超 4 字被截断，tooltip 补全',
    children: [{ title: '功能模块', path: '/apps/business/modules' }]
  }
])
</script>

<template>
  <u-dual-nav
    rail-variant="labeled"
    :menus="menus"
    :current-path="currentPath"
    :style="{ width: '360px', height: '480px' }"
    @item-click="currentPath = $event.path"
  />
</template>
```

### 无子级应用（右栏单项 + 首叶子派发）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UDualNav } from '@veltra/desktop'
import type { DualNavRootItem, NavItem } from '@veltra/desktop'
import { Cart } from '@veltra/icons/normal'

const currentPath = shallowRef('/docs/start')

const menus = shallowRef<DualNavRootItem[]>([
  {
    title: '文档中心',
    path: '/docs',
    children: [{ title: '快速开始', path: '/docs/start' }]
  },
  { title: '帮助', icon: Cart, path: '/help' } // 无 children：右栏渲染它自身为单项
])

function onItemClick(item: NavItem) {
  // 点击「帮助」左轨时 payload 是 '/help' 自身（findFirstLeaf 无子级返回自身）
  console.log(item.path) // => '/help'
  currentPath.value = item.path
}
</script>

<template>
  <u-dual-nav
    :menus="menus"
    :current-path="currentPath"
    :style="{ width: '320px', height: '480px' }"
    @item-click="onItemClick"
  />
</template>
```

## 注意事项

> [!WARNING]
> - 外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。
> - 点击左轨后 `currentPath` 不会自动变化：`item-click` 发出的是应用第一个叶子的 `NavItem`，宿主必须拿它跳路由（或更新 `currentPath`），否则左轨只呈现 selected 悬停态而非激活态。
> - 本库是受控组件（`currentPath` + `@item-click`），不是 `v-model`，也不内置 vue-router。
> - 左轨名称最多显示 4 个字（`title.slice(0, 4)`），需要完整名称时写进 `description` 由 tooltip 展示。
> - 组件整体没有默认尺寸，宿主必须给宽高（如 `320px × 480px`）；右栏菜单区域内部自带滚动。
> - 根级应用与各级菜单的 `path` 必须整树唯一，`currentPath` 反查与激活判定都依赖它。

自定义侧栏外观示例（应用入口执行一次）：

```ts
// src/main.ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

// 浅色侧栏：必须同时给 variant: 'light'
loadTheme(lightTheme.new({ nav: { variant: 'light', 'bg-color': '#f1ede0' } }))
```

## 常见问题

### 点击左轨应用后右栏变了，但菜单里没有高亮项

左轨点击只切换右栏并发出 `item-click`（首个叶子），`currentPath` 仍指向旧路径。在 `item-click` 里把 `item.path` 写回路由或 `currentPath` 即可高亮。

### 左轨 tooltip 不出现

`railVariant: 'labeled'` 且 `title` 不超过 4 个字且没有 `description` 时 tooltip 被组件禁用（无额外信息）；刚点击过的应用鼠标未移出前 tooltip 也被暂时禁用。
