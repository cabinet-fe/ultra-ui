import type { DeconstructValue } from '../helper'
import type { ButtonProps } from './button'

/** 操作组件属性 */
export interface ActionProps extends ButtonProps {
  /** 是否需要确认 */
  needConfirm?: boolean

  /** 是否为下拉菜单中的操作项 */
  inDropdown?: boolean
}

/** 操作组组件属性 */
export interface ActionGroupProps {
  /** 最大可显示数量 */
  max?: number
}

/** 操作组件定义的事件 */
export interface ActionEmits {
  (e: 'run'): void
}

/** 操作组件暴露的属性和方法(组件内部使用) */
export interface _ActionExposed {}

/** 操作组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ActionExposed = DeconstructValue<_ActionExposed>
