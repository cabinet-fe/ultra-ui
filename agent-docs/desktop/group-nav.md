---
title: "UGroupNav - 分组导航"
description: "分组导航按 groups 渲染一层叶子，用 current-path 与 item-click 受控"
---

# UGroupNav - 分组导航

## 引入

```ts
import { UGroupNav } from '@veltra/desktop'
```

## 示例

`UGroupNav` 的 `groups` 每组有 `title` 和 `children`。只渲染一层叶子：`children` 再嵌套会被丢掉，该项仍当叶子展示。选中用 `current-path`，点击用 `@item-click`，没有 `v-model:current-path`。外观走主题 `nav`，不在 props 上。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { GroupNavGroup, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting } from '@veltra/icons/normal'

const currentPath = ref('/home')

const groups: GroupNavGroup[] = [
  { title: '概览', children: [{ title: '首页', icon: HouseFilled, path: '/home' }] },
  {
    title: '系统',
    children: [
      { title: '基础设置', icon: Setting, path: '/settings/basic' },
      { title: '安全设置', path: '/settings/security', disabled: true }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path
}
</script>

<template>
  <u-group-nav :groups="groups" :current-path="currentPath" @item-click="onItemClick" />
</template>
```

## API / 类型

```ts
export interface NavItem {
  /** 图标 */
  icon?: string | DefineComponent
  /** 导航标题 */
  title: string
  /** 导航路径 */
  path: string
  /**
   * 应用描述；仅根级导航项有效，在 UDualNav 左轨 tooltip 与右栏顶部展示
   * @see DualNavRootItem
   */
  description?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 子导航 */
  children?: NavItem[]

  [key: string]: any
}

/** 分组：标题 + 叶子菜单 */
export interface GroupNavGroup {
  title: string
  children: NavItem[]
}

/** 分组导航组件属性 */
export interface GroupNavProps {
  /** 当前路径 */
  currentPath?: string
  /** 分组列表（每组仅渲染一层叶子，更深嵌套舍弃） */
  groups?: GroupNavGroup[]
}

/** 分组导航组件定义的事件 */
export interface GroupNavEmits {
  (e: 'item-click', item: NavItem): void
}
```

## 避坑与使用要点

- 外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。详见主题文档「侧栏导航外观」。
