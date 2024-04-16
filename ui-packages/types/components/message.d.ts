import type { DeconstructValue } from '../helper'
import type { DefineComponent, VNode } from 'vue'
import type { ButtonType } from './button'

/** 消息弹框组件组件属性 */
export interface MessageProps {
  modelValue?: string
  message?: string
  type?: ButtonType
  closable?: boolean
  duration?: number
  offset?: number
  onClose?: (vm: VNode) => void
  id?: string
  icon?: DefineComponent
}

/** 消息弹框组件组件定义的事件 */
export interface MessageEmits {
  (e: 'update:modelValue', value: string): void
}

/** 消息弹框组件组件暴露的属性和方法(组件内部使用) */
export interface _MessageExposed {}

/** 消息弹框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageExposed = DeconstructValue<_MessageExposed>
