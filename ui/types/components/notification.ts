import type { DeconstructValue } from '../helper'
import type { ColorType } from '../component-common'
import type { DefineComponent, RendererElement } from 'vue'

/** 通知组件组件属性 */
export interface NotificationProps {
  modelValue?: string
  title?: string
  message?: string
  type?: ColorType
  closable?: boolean
  duration?: number
  offset?: number
  onClose?: (vm: RendererElement) => void
  onClick?: (e: MouseEvent) => void
  id?: string
  icon?: DefineComponent
  zIndex?: number
  buttonText?: string
  width?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/** 通知组件组件定义的事件 */
export interface NotificationEmits {
  (e: 'update:modelValue', value: string): void
}

/** 通知组件组件暴露的属性和方法(组件内部使用) */
export interface _NotificationExposed {}

/** 通知组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NotificationExposed = DeconstructValue<_NotificationExposed>
