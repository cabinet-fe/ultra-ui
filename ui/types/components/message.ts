import type { DeconstructValue } from '../helper'
import type { DefineComponent } from 'vue'

/** 消息类型 */
export type MessageType = 'success' | 'warn' | 'info' | 'error' | 'default'

/** 消息弹框组件组件属性 */
export interface MessageProps {
  /** 消息内容 */
  message?: string
  /** 渲染样式 */
  type?: MessageType
  /** 是否可以关闭 */
  closable?: boolean
  /**
   * 持续时间, 单位ms
   * @default 3000
   */
  duration?: number
  /** 渲染html */
  html?: boolean
  /** 图标 */
  icon?: DefineComponent
}

/** 消息选项 */
export type MessageOptions = MessageProps & {
  /** 关闭回调 */
  onClose?: () => void
  /** 关闭结束后回调 */
  onClosed?: () => void
}

/** 消息弹框组件组件定义的事件 */
export interface MessageEmits {}

/** 消息弹框组件组件暴露的属性和方法(组件内部使用) */
export interface _MessageExposed {}

/** 消息弹框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageExposed = DeconstructValue<_MessageExposed>
