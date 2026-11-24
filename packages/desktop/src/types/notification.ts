import type { ColorType, ComponentSize, DeconstructValue } from '@veltra/utils'
import type { AppContext, DefineComponent } from 'vue'

export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface NotificationProps {
  title?: string
  message?: string
  type?: ColorType
  closable?: boolean
  /**
   * 自动关闭时长, 单位ms, 0 表示常驻
   * @default 4500
   */
  duration?: number
  icon?: DefineComponent
  /** 操作按钮文字，为空则不显示 */
  buttonText?: string
  size?: ComponentSize
}

export interface NotificationOptions extends NotificationProps {
  position?: NotificationPosition
  /** 距离屏幕边缘的偏移, 单位px */
  offset?: number
  /** 层级，默认由 API 创建时自增分配 */
  zIndex?: number
  /** 点击操作按钮时回调 */
  onClick?: (e: MouseEvent) => void
  onClose?: () => void
  /** 关闭动画结束后回调 */
  onClosed?: () => void
}

export interface NotificationInstance {
  id: string
  close(): void
  /** 彻底关闭（含动画结束）后的 Promise */
  onClosed: Promise<void>
}

type NotificationShortcutConfig = Omit<NotificationOptions, 'type' | 'message'>

export interface Notification {
  (options: NotificationOptions | string): NotificationInstance
  primary(message: string, config?: NotificationShortcutConfig): NotificationInstance
  success(message: string, config?: NotificationShortcutConfig): NotificationInstance
  info(message: string, config?: NotificationShortcutConfig): NotificationInstance
  warning(message: string, config?: NotificationShortcutConfig): NotificationInstance
  danger(message: string, config?: NotificationShortcutConfig): NotificationInstance
  closeAll(position?: NotificationPosition): void
  _context: AppContext | null
}

export interface NotificationEmits {
  (e: 'close'): void
  (e: 'action', evt: MouseEvent): void
}

export interface _NotificationExposed {}

/** 通知组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NotificationExposed = DeconstructValue<_NotificationExposed>
