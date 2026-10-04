import type { DeconstructValue } from '@veltra/utils'

/** 行内提示条语义类型 */
export type AlertType = 'info' | 'success' | 'warning' | 'error'

/** 行内提示条组件属性 */
export interface AlertProps {
  /** 语义类型，默认 'info' */
  type?: AlertType
  /** 标题 */
  title?: string
  /** 描述文案，默认插槽可替代 */
  description?: string
  /** 是否显示语义图标 */
  showIcon?: boolean
  /** 是否显示关闭图标 */
  closable?: boolean
}

/** 行内提示条组件定义的事件 */
export interface AlertEmits {
  (e: 'close'): void
}

/** 行内提示条组件暴露的属性和方法(组件内部使用) */
export interface _AlertExposed {}

/** 行内提示条组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AlertExposed = DeconstructValue<_AlertExposed>
