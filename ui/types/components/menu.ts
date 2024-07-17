import type { DeconstructValue } from '../helper'
import type { DefineComponent } from 'vue'

/** 菜单项 */
export interface MenuItem {
  /** 图标 */
  icon?: string | DefineComponent
  /** 菜单标题 */
  title: string
  /** 菜单路径 */
  path: string
  /** 是否禁用 */
  disabled?: boolean
  /** 子菜单 */
  children?: MenuItem[]

  [key: string]: any
}

/** 菜单组件组件属性 */
export interface MenuProps {
  /** 当前路径 */
  currentPath?: string
  /** 是否折叠 */
  collapsed?: boolean
  /** 仅允许一个菜单可以打开 */
  uniqueOpened?: boolean
  /** 菜单列表 */
  menus?: MenuItem[]
}

/** 菜单组件组件定义的事件 */
export interface MenuEmits {
  (e: 'item-click', item: MenuItem): void
}

/** 菜单组件组件暴露的属性和方法(组件内部使用) */
export interface _MenuExposed {}

/** 菜单组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MenuExposed = DeconstructValue<_MenuExposed>
