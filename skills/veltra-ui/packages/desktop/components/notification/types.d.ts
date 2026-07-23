import type { ColorType, ComponentSize, DeconstructValue } from '@veltra/utils'
import type { AppContext, DefineComponent } from 'vue'

/** 通知弹出位置 */
export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** 通知组件属性 */
export interface NotificationProps {
  /** 标题 */
  title?: string
  /** 内容 */
  message?: string
  /** 类型 */
  type?: ColorType
  /** 是否显示关闭按钮 */
  closable?: boolean
  /**
   * 自动关闭时长, 单位ms, 0 表示常驻
   * @default 4500
   */
  duration?: number
  /** 图标 */
  icon?: DefineComponent
  /** 操作按钮文字，为空则不显示 */
  buttonText?: string
  /** 尺寸 */
  size?: ComponentSize
}

/** 通知调用选项 */
export interface NotificationOptions extends NotificationProps {
  /** 弹出位置 */
  position?: NotificationPosition
  /** 距离屏幕边缘的偏移, 单位px */
  offset?: number
  /** 层级，默认由 API 创建时自增分配 */
  zIndex?: number
  /** 点击操作按钮时回调 */
  onClick?: (e: MouseEvent) => void
  /** 触发关闭时回调 */
  onClose?: () => void
  /** 关闭动画结束后回调 */
  onClosed?: () => void
}

/** 通知实例 */
export interface NotificationInstance {
  /** 唯一标识 */
  id: string
  /** 手动关闭 */
  close(): void
  /** 彻底关闭（含动画结束）后的 Promise */
  onClosed: Promise<void>
}

type NotificationShortcutConfig = Omit<NotificationOptions, 'type' | 'message'>

/** 通知函数式 API */
export interface Notification {
  /** 创建通知 */
  (options: NotificationOptions | string): NotificationInstance
  /** 主要通知 */
  primary(message: string, config?: NotificationShortcutConfig): NotificationInstance
  /** 成功通知 */
  success(message: string, config?: NotificationShortcutConfig): NotificationInstance
  /** 信息通知 */
  info(message: string, config?: NotificationShortcutConfig): NotificationInstance
  /** 警告通知 */
  warning(message: string, config?: NotificationShortcutConfig): NotificationInstance
  /** 危险通知 */
  danger(message: string, config?: NotificationShortcutConfig): NotificationInstance
  /** 关闭所有通知，可指定位置 */
  closeAll(position?: NotificationPosition): void
  /** 设置全局渲染上下文 */
  _context: AppContext | null
}

/** 通知组件定义的事件 */
export interface NotificationEmits {
  (e: 'close'): void
  (e: 'action', evt: MouseEvent): void
}

/** 通知组件暴露的属性和方法(组件内部使用) */
export interface _NotificationExposed {}

/** 通知组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NotificationExposed = DeconstructValue<_NotificationExposed>
