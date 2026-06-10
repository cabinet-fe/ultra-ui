import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

/**
 * 右键菜单项
 */
export interface ContextmenuItem {
  /** 菜单名称 */
  label: string
  /** 菜单描述 */
  description?: string
  /** 菜单图标 */
  icon?: Component
  /** 子菜单 */
  children?: ContextmenuItem[]
  /** 菜单点击时的回调 */
  callback?: () => any
  /** 是否禁用 */
  disabled?: boolean | (() => boolean)
}

/** 鼠标右键菜单组件属性 */
export interface ContextmenuProps extends ComponentProps {
  /** 鼠标位置 */
  mousePosition: { x: number; y: number }
  /**
   * 菜单宽度
   * @default 200
   */
  width?: number | string
  /** 菜单项 */
  menus: ContextmenuItem[] | (() => ContextmenuItem[])
}

/** 鼠标右键菜单组件定义的事件 */
export interface ContextmenuEmits {
  (e: 'destroy'): void
}

/** 鼠标右键菜单组件暴露的属性和方法(组件内部使用) */
export interface _ContextmenuExposed {}

/** 鼠标右键菜单组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ContextmenuExposed = DeconstructValue<_ContextmenuExposed>
