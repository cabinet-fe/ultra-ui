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
