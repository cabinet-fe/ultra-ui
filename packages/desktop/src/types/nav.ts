import type { DeconstructValue } from '@veltra/utils'
import type { DefineComponent } from 'vue'

/** 导航项 */
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

/** 导航组件属性 */
export interface NavProps {
  /** 当前路径 */
  currentPath?: string
  /** 是否折叠 */
  collapsed?: boolean
  /** 导航列表 */
  menus?: NavItem[]
}

/** 导航组件定义的事件 */
export interface NavEmits {
  (e: 'item-click', item: NavItem): void
}

/** 导航组件暴露的属性和方法(组件内部使用) */
export interface _NavExposed {
  /** 展开所有含子级的导航项 */
  expandAll: () => void
  /** 折叠所有导航项 */
  collapseAll: () => void
}

/** 导航组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NavExposed = DeconstructValue<_NavExposed>
