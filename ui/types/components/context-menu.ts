import type { Component } from 'vue'
import type { DeconstructValue } from '../helper'
import type { ComponentProps } from '../component-common'

/**
 * 右键菜单项
 */
export interface ContextMenuItem {
  /** 菜单名称 */
  label: string
  /** 菜单描述 */
  description?: string
  /** 菜单图标 */
  icon?: Component
  /** 菜单点击时的回调 */
  callback?: () => void | Promise<void>
  /** 是否禁用 */
  disabled?: boolean | (() => boolean)
}

/** 鼠标右键菜单组件属性 */
export interface ContextMenuProps extends ComponentProps {
  /** 鼠标位置 */
  mousePosition: { x: number; y: number }
  /**
   * 菜单宽度
   * @default 200
   */
  width?: number | string
  /** 菜单项 */
  menus: ContextMenuItem[] | (() => ContextMenuItem[])
}

/** 鼠标右键菜单组件定义的事件 */
export interface ContextMenuEmits {
  (e: 'destroy'): void
}

/** 鼠标右键菜单组件暴露的属性和方法(组件内部使用) */
export interface _ContextMenuExposed {}

/** 鼠标右键菜单组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ContextMenuExposed = DeconstructValue<_ContextMenuExposed>
