import type { ColorType, ComponentProps, DeconstructValue } from '@veltra/utils'
import type { AppContext } from 'vue'

export type MessageConfirmAction = 'confirm' | 'cancel'

export interface MessageConfirmProps extends ComponentProps {
  title?: string
  message: string
  confirmButtonText?: string
  /** 取消按钮文字，为空则不显示 */
  cancelButtonText?: string
  confirmButtonType?: ColorType
  /** 层级，默认由 API 创建时自增分配 */
  zIndex?: number
}

export interface MessageConfirmOptions extends MessageConfirmProps {
  onClose?: (action: MessageConfirmAction) => void
  /** 关闭动画结束后回调 */
  onClosed?: (action: MessageConfirmAction) => void
}

export interface MessageConfirmInstance {
  id: string
  /** 手动关闭，未指定操作时视为 cancel */
  close(action?: MessageConfirmAction): void
  /** 彻底关闭（含动画结束）后的 Promise，值为用户操作 */
  onClosed: Promise<MessageConfirmAction>
}

type MessageConfirmShortcutConfig = Omit<MessageConfirmOptions, 'message' | 'confirmButtonType'>

export interface MessageConfirm {
  (options: MessageConfirmOptions | string): MessageConfirmInstance
  primary(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  success(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  info(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  warning(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  danger(message: string, config?: MessageConfirmShortcutConfig): MessageConfirmInstance
  closeAll(): void
  _context: AppContext | null
}

export interface MessageConfirmEmits {
  (e: 'close', action: MessageConfirmAction): void
}

export interface _MessageConfirmExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type MessageConfirmExposed = DeconstructValue<_MessageConfirmExposed>
