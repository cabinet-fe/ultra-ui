import type { DeconstructValue } from '../helper'

/** 消息弹框组件组件属性 */
export interface MessageProps {
  modelValue?: string
  message: string
  type: 'primary' | 'info' | 'success' | 'warning' | 'danger'
  closable: boolean
}

/** 消息弹框组件组件定义的事件 */
export interface MessageEmits {
  (e: 'update:modelValue', value: string): void
}

/** 消息弹框组件组件暴露的属性和方法(组件内部使用) */
export interface _MessageExposed {}

/** 消息弹框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageExposed = DeconstructValue<_MessageExposed>
