import type { DeconstructValue } from '../helper'

/** 通知组件组件属性 */
export interface NotificationProps {
  modelValue?: string
  title?: string
  message?: string
  type?: 'primary' | 'info' | 'success' | 'warning' | 'danger'
  closable?: boolean
  duration?: number
  offset?: number
  onClose?: (vm: VNode) => void
  onClick?: (e: MouseEvent) => void
  id?: string
  icon?: DefineComponent
  zIndex?: number
  button?: string
}

/** 通知组件组件定义的事件 */
export interface NotificationEmits {
  (e: 'update:modelValue', value: string): void
}

/** 通知组件组件暴露的属性和方法(组件内部使用) */
export interface _NotificationExposed {}

/** 通知组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NotificationExposed = DeconstructValue<_NotificationExposed>
