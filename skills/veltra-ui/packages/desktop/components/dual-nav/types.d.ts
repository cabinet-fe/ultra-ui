import type { DeconstructValue } from '@veltra/utils'

import type { NavItem } from './nav'

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
