---
title: "UGroupNav 分组导航"
description: "分组侧栏导航：groups 传入「标题 + 一层叶子菜单」数组，currentPath 控制选中高亮，item-click 发出点击项；无展开/折叠交互。需要多级树形菜单用 UNav，需要应用切换双栏用 UDualNav。"
aliases: [GroupNav, 分组菜单, 分组侧栏, group menu]
keywords:
  - currentPath
  - groups
  - GroupNavGroup
  - item-click
  - NavItem
  - 分组标题
  - 一层叶子
  - 菜单分组
  - 侧边栏
  - 扁平导航
  - 深色侧栏
  - 浅色侧栏
  - 路由联动
  - 选中高亮
  - 禁用项
---

# UGroupNav 分组导航

`@veltra/desktop` 导出 `UGroupNav`（分组导航）。`groups` 传入 `GroupNavGroup[]`（分组标题 + 叶子菜单），按组渲染一层扁平菜单；选中由 `currentPath` 受控，点击叶子发出 `item-click`，**不内置 vue-router，没有展开/折叠行为**。分工规则：菜单是「分组标题 + 一层叶子」扁平结构用 `UGroupNav`；需要多级树形展开菜单用 `UNav`；需要「左轨应用 + 右栏子菜单」两层结构用 `UDualNav`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UGroupNav } from '@veltra/desktop'
import type { GroupNavGroup, NavItem } from '@veltra/desktop'
import { HouseFilled } from '@veltra/icons/normal'

const currentPath = shallowRef('/home')

const groups: GroupNavGroup[] = [
  { title: '概览', children: [{ title: '首页', icon: HouseFilled, path: '/home' }] },
  {
    title: '业务中心',
    children: [
      { title: '功能模块', path: '/business/modules' },
      { title: '数据字典', path: '/business/dict' }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path // => 点击「功能模块」后 currentPath 为 '/business/modules'
}
</script>

<template>
  <u-group-nav
    :groups="groups"
    :current-path="currentPath"
    :style="{ width: '260px', height: '480px' }"
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
  /** 导航路径，作为选中键。必填 */
  path: string
  /** 应用描述；仅根级导航项有效，UGroupNav 不消费 */
  description?: string
  /** 是否禁用。禁用项点击不触发 item-click。默认 false */
  disabled?: boolean
  /** 子导航；UGroupNav 只渲染一层叶子，更深嵌套舍弃 */
  children?: NavItem[]

  [key: string]: any
}

/** 分组：标题 + 叶子菜单 */
export interface GroupNavGroup {
  /** 分组标题，渲染为组头小字。必填 */
  title: string
  /** 本组叶子菜单。必填 */
  children: NavItem[]
}

/** 分组导航组件属性 */
export interface GroupNavProps {
  /** 当前路径；等于某叶子项 path 时该项高亮 */
  currentPath?: string
  /** 分组列表（每组仅渲染一层叶子，更深嵌套舍弃） */
  groups?: GroupNavGroup[]
}

/** 分组导航组件定义的事件 */
export interface GroupNavEmits {
  (e: 'item-click', item: NavItem): void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `groups` | `GroupNavGroup[]` | — | 否 | 每组 `title`、`children` 必填；组间间距 16px；`children` 里再嵌套的 `children` 被舍弃，该节点仍作为叶子展示 |
| `currentPath` | `string` | — | 否 | 与叶子项 `path` 全等才高亮（左侧 3px 主色条 + 激活底色）；没有自动展开、自动滚动逻辑（组件无折叠） |

事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `item-click` | `(item: NavItem)` | 点击非 `disabled` 的叶子项 |

## 方法与事件

- 选中态完全受控：`child.path === currentPath` 的叶子高亮。没有 `v-model:current-path`。
- `disabled: true` 的叶子：半透明、`cursor: not-allowed`，点击不发出 `item-click`。
- 组标题（`group.title`）是纯文本组头，不可点击、不参与选中。
- `children` 深嵌套时只渲染第一层：带更深层级的节点按无子级叶子渲染，不做提示、不报错。
- 组件没有暴露方法、没有折叠与尺寸 props；列表内部自带滚动，宿主必须给宽高。

## 典型示例

### 基础分组（含禁用项与深嵌套舍弃）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UGroupNav } from '@veltra/desktop'
import type { GroupNavGroup, NavItem } from '@veltra/desktop'
import { Cart, HouseFilled, Lock, Setting } from '@veltra/icons/normal'

const currentPath = shallowRef('/business/modules')

const groups = shallowRef<GroupNavGroup[]>([
  { title: '概览', children: [{ title: '首页', icon: HouseFilled, path: '/home' }] },
  {
    title: '业务中心',
    children: [
      { title: '功能模块', path: '/business/modules' },
      { title: '数据字典', icon: Cart, path: '/business/dict' },
      {
        title: '角色管理',
        icon: Lock,
        path: '/business/role',
        // 更深 children 被舍弃，本项仍作为叶子展示
        children: [{ title: '角色列表', path: '/business/role/list' }]
      }
    ]
  },
  {
    title: '系统设置',
    children: [
      { title: '基础设置', icon: Setting, path: '/settings/basic' },
      { title: '安全设置', path: '/settings/security', disabled: true }
    ]
  }
])

function onItemClick(item: NavItem) {
  console.log(item.path) // => 点击项的 path
}
</script>

<template>
  <u-group-nav
    :groups="groups"
    :current-path="currentPath"
    :style="{ width: '260px', height: '480px' }"
    @item-click="onItemClick"
  />
</template>
```

### 与 vue-router 联动

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UGroupNav } from '@veltra/desktop'
import type { GroupNavGroup, NavItem } from '@veltra/desktop'

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => route.query.currentPath as string | undefined)

const groups = computed<GroupNavGroup[]>(() => [
  { title: '概览', children: [{ title: '首页', path: '/home' }] },
  {
    title: '业务中心',
    children: [
      { title: '功能模块', path: '/business/modules' },
      { title: '数据字典', path: '/business/dict' }
    ]
  }
])

function onItemClick(item: NavItem) {
  router.replace({ path: route.path, query: { currentPath: item.path } })
}
</script>

<template>
  <u-group-nav
    :groups="groups"
    :current-path="currentPath"
    :style="{ width: '260px', height: '480px' }"
    @item-click="onItemClick"
  />
</template>
```

## 注意事项

> [!WARNING]
> - 外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。
> - 本库是受控组件（`currentPath` + `@item-click`），不是 `v-model`，也不内置 vue-router。
> - `groups` 每组只渲染一层叶子：需要多级展开时改用 `UNav`，本组件不会渲染嵌套层级。
> - 组件没有折叠（无 `collapsed`）、没有暴露方法；宿主必须给宽高，菜单区超出时内部滚动。
> - `NavItem.description` 在本组件中不展示（仅 `UDualNav` 消费）。

自定义侧栏外观示例（应用入口执行一次）：

```ts
// src/main.ts
import { loadTheme, lightTheme } from '@veltra/styles/theme'

// 浅色侧栏：必须同时给 variant: 'light'
loadTheme(lightTheme.new({ nav: { variant: 'light', 'bg-color': '#f1ede0' } }))
```

## 常见问题

### 嵌套的子菜单没有渲染

`UGroupNav` 按设计只渲染每组第一层叶子，更深 `children` 直接舍弃。要展示多级菜单改用 `UNav`（树形）或 `UDualNav`（应用 + 子菜单双栏）。

### 点击菜单项没有反应

检查该项是否 `disabled: true`（禁用项不发事件），以及 `item-click` 处理器是否把 `item.path` 写回 `currentPath` 或路由——组件不会自己更新选中。
