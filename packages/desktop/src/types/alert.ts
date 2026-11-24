import type { DeconstructValue } from '@veltra/utils'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  /** 默认 'info' */
  type?: AlertType
  title?: string
  /** 描述文案，默认插槽可替代 */
  description?: string
  showIcon?: boolean
  closable?: boolean
}

export interface AlertEmits {
  (e: 'close'): void
}

export interface _AlertExposed {}

/** 行内提示条组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AlertExposed = DeconstructValue<_AlertExposed>
