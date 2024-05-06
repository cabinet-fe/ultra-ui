import type { DeconstructValue } from '../helper'
import type { DefineComponent } from 'vue'

/** 菜单组件组件属性 */
export interface MenuProps {
  modelValue?: string
  /** 是否展开菜单 */
  expand?: boolean
  /** 指定当前激活的菜单项 */
  activeIndex?: string
  /** 是否缩略模式 */
  simple?: boolean
  /** 展开回调 */
  open?: (index: string) => void
  /** 关闭回调 */
  close?: (index: string) => void
  /** 是否以index作为path进行路由跳转 */
  router?: boolean
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  textColor?: string
  /** 激活的文字颜色 */
  activeTextColor?: string
}

export interface MenuSubProps {
  /** 是否禁用 */
  disabled?: boolean
  /** 唯一标识，可作为路由path */
  index: string
  /** 菜单图标 */
  icon?: DefineComponent
}

export interface MenuItemProps {
  /** 是否禁用 */
  disabled?: boolean
  /** 唯一标识，可作为路由path */
  index: string
  /** 菜单图标 */
  icon?: DefineComponent
  /** 路由path */
  route?: string
}

/** 菜单组件组件定义的事件 */
export interface MenuEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'open', index: string): void
  (e: 'close', index: string): void
}

/** 菜单组件组件暴露的属性和方法(组件内部使用) */
export interface _MenuExposed {}

/** 菜单组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MenuExposed = DeconstructValue<_MenuExposed>
