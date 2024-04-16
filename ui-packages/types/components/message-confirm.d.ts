import type { DeconstructValue } from '../helper'
import type { ButtonType } from './button'

/** 消息确认框组件属性 */
export interface MessageConfirmProps {
  modelValue?: string
  title?: string
  message: string
  buttonText?: string
  buttonType?: ButtonType
  onClose?: () => void
}

/** 消息确认框组件定义的事件 */
export interface MessageConfirmEmits {
  (e: 'update:modelValue', value: string): void
}

/** 消息确认框组件暴露的属性和方法(组件内部使用) */
export interface _MessageConfirmExposed {}

/** 消息确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageConfirmExposed = DeconstructValue<_MessageConfirmExposed>
