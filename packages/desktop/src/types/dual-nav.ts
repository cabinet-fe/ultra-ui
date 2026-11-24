import type { DeconstructValue } from '@veltra/utils'

import type { NavItem } from './nav'

export type DualNavRailVariant = 'icon' | 'labeled'

/** 双栏导航根级应用项；`description` 在左轨 tooltip 与右栏顶部展示 */
export interface DualNavRootItem extends NavItem {
  children?: NavItem[]
}

export interface DualNavProps {
  currentPath?: string
  menus?: DualNavRootItem[]
  /**
   * 左轨变体
   * - `icon`：仅图标（默认）
   * - `labeled`：加宽左轨，图标下方显示菜单名称（最多 4 个字）
   */
  railVariant?: DualNavRailVariant
}

export interface DualNavEmits {
  (e: 'item-click', item: NavItem): void
}

export interface _DualNavExposed {}

/** 双栏导航组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DualNavExposed = DeconstructValue<_DualNavExposed>
