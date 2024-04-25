import type { DeconstructValue } from '../helper'

/** 菜单组件组件属性 */
export interface MenuProps {
  modelValue?: string
}

export interface SubMenuProps {
  disabled?: boolean
}

export interface MenuItemProps {
  disabled?: boolean
}

/** 菜单组件组件定义的事件 */
export interface MenuEmits {
  (e: 'update:modelValue', value: string): void
}

/** 菜单组件组件暴露的属性和方法(组件内部使用) */
export interface _MenuExposed {}

/** 菜单组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MenuExposed = DeconstructValue<_MenuExposed>