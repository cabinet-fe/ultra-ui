---
title: "UDualNav - 双栏导航"
description: "双栏导航用 current-path 与 item-click 受控，没有 v-model:current-path"
---

# UDualNav - 双栏导航

## 引入

```ts
import { UDualNav } from '@veltra/desktop'
```

## 示例

`UDualNav` 左轨是根级应用，右栏是当前根项的子导航。`menus` 项类型为 `DualNavRootItem`（`title` / `path` 必填，`icon` 建议用 `@veltra/icons/normal` 组件）。选中态用 `current-path`，点击用 `@item-click`；没有 `v-model:current-path`。左轨默认只显示图标，需要名称时设 `rail-variant="labeled"`（名称最多 4 个字）。外观由主题 `nav` 配置，不在 props 上。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { DualNavRootItem, NavItem } from '@veltra/desktop'
import { HouseFilled, Setting, User } from '@veltra/icons/normal'

const currentPath = ref('/home')

const menus: DualNavRootItem[] = [
  { title: '工作台', icon: HouseFilled, path: '/home', description: '常用入口' },
  {
    title: '系统',
    icon: Setting,
    path: '/system',
    children: [
      { title: '用户', icon: User, path: '/system/users' },
      { title: '设置', icon: Setting, path: '/system/settings' }
    ]
  }
]

function onItemClick(item: NavItem) {
  currentPath.value = item.path
}
</script>

<template>
  <u-dual-nav
    :menus="menus"
    :current-path="currentPath"
    rail-variant="labeled"
    @item-click="onItemClick"
  />
</template>
```

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

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

/** 双栏导航左轨变体 */
export type DualNavRailVariant = 'icon' | 'labeled'

/** 双栏导航根级应用项；`description` 在左轨 tooltip 与右栏顶部展示 */
export interface DualNavRootItem extends NavItem {
  /** 子导航 */
  children?: NavItem[]
}

/** 双栏导航组件属性 */
export interface DualNavProps {
  /** 当前路径 */
  currentPath?: string
  /** 根级应用导航列表 */
  menus?: DualNavRootItem[]
  /**
   * 左轨变体
   * - `icon`：仅图标（默认）
   * - `labeled`：加宽左轨，图标下方显示菜单名称（最多 4 个字）
   */
  railVariant?: DualNavRailVariant
}

/** 双栏导航组件定义的事件 */
export interface DualNavEmits {
  (e: 'item-click', item: NavItem): void
}

/** 双栏导航组件暴露的属性和方法(组件内部使用) */
export interface _DualNavExposed {}

/** 双栏导航组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DualNavExposed = DeconstructValue<_DualNavExposed>
```

## 避坑与使用要点

- 外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。详见主题文档「侧栏导航外观」。
