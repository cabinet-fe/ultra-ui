import type { DeconstructValue } from '@veltra/utils'
import type { DefineComponent } from 'vue'

export interface NavItem {
  icon?: string | DefineComponent
  title: string
  path: string
  /**
   * 应用描述；仅根级导航项有效，在 UDualNav 左轨 tooltip 与右栏顶部展示
   * @see DualNavRootItem
   */
  description?: string
  disabled?: boolean
  children?: NavItem[]

  [key: string]: any
}

export interface NavProps {
  currentPath?: string
  collapsed?: boolean
  menus?: NavItem[]
}

export interface NavEmits {
  (e: 'item-click', item: NavItem): void
}

export interface _NavExposed {
  expandAll: () => void
  collapseAll: () => void
}

/** 导航组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NavExposed = DeconstructValue<_NavExposed>
