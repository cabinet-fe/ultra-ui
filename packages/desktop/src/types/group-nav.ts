import type { NavItem } from './nav'

export interface GroupNavGroup {
  title: string
  children: NavItem[]
}

export interface GroupNavProps {
  currentPath?: string
  /** 分组列表（每组仅渲染一层叶子，更深嵌套舍弃） */
  groups?: GroupNavGroup[]
}

export interface GroupNavEmits {
  (e: 'item-click', item: NavItem): void
}
