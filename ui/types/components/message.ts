import type { DeconstructValue } from '../helper'
import type { DefineComponent } from 'vue'

/** 消息类型 */
export type MessageType = 'success' | 'warn' | 'info' | 'error' | 'default'

/** 消息弹框组件组件属性 */
export interface MessageProps {
  message?: string
  type?: MessageType
  closable?: boolean
  duration?: number
  offset?: number
  html?: boolean
  onClose?: () => void
  icon?: DefineComponent
}

/** 消息弹框组件组件定义的事件 */
export interface MessageEmits {}

/** 消息弹框组件组件暴露的属性和方法(组件内部使用) */
export interface _MessageExposed {}

/** 消息弹框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageExposed = DeconstructValue<_MessageExposed>
