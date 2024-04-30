import type { DeconstructValue } from '../helper'
import type { DefineComponent } from 'vue'

/** 菜单组件组件属性 */
export interface MenuProps {
  modelValue?: string
  expand?: boolean
  activeIndex?: string
  simple?: boolean
  open?: (index: string) => void
  close?: (index: string) => void
  router?: boolean
}

export interface MenuSubProps {
  disabled?: boolean
  index: string
  icon?: DefineComponent
}

export interface MenuItemProps {
  disabled?: boolean
  index: string
  icon?: DefineComponent
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
