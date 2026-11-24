import type { DeconstructValue } from '@veltra/utils'
import type { DefineComponent, AppContext } from 'vue'

export type MessageType = 'success' | 'warn' | 'info' | 'error' | 'default'

export type MessageOptions = MessageProps & { onClose?: () => void; onClosed?: () => void }

type MsgAliasConf = Omit<MessageOptions, 'type' | 'message'>

export interface MessageInstance {
  id: string
  close(): void
  /** 消息彻底销毁后的 Promise (包括动画结束) */
  onClosed: Promise<void>
}

export interface Message {
  (options: MessageOptions | string): MessageInstance
  closeAll(): void
  success(message: string, config?: MsgAliasConf): MessageInstance
  warn(message: string, config?: MsgAliasConf): MessageInstance
  info(message: string, config?: MsgAliasConf): MessageInstance
  error(message: string, config?: MsgAliasConf): MessageInstance
  default(message: string, config?: MsgAliasConf): MessageInstance
  _context: AppContext | null
}

export interface MessageProps {
  message?: string
  type?: MessageType
  closable?: boolean
  /**
   * 持续时间, 单位ms
   * @default 3000
   */
  duration?: number
  html?: boolean
  icon?: DefineComponent
}

export interface MessageEmits {}

export interface _MessageExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type MessageExposed = DeconstructValue<_MessageExposed>
