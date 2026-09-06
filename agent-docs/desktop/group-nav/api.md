---
title: "UGroupNav - 分组导航"
description: "UGroupNav 组件 API"
---

# UGroupNav - 分组导航

## 类型

```ts
import type { NavItem } from './nav'

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

## 示例

见 `./examples.md`

## 备注

外观（底色、文字、悬停/激活色）不在组件 props 上，由主题 `nav` 配置控制：`nav.variant` 选择深/浅侧栏（默认 `dark` 深底浅字），`nav` 其余键覆盖同名 `--u-nav-*` token。把侧栏自定义为浅色底时必须同时设 `variant: 'light'`，否则会浅底配白字看不清。详见主题文档「侧栏导航外观」。
