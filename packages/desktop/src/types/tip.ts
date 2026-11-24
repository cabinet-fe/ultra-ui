import type { ColorType, DeconstructValue } from '@veltra/utils'
import type { CSSProperties } from 'vue'

export type TipDirection = 'top' | 'bottom' | 'left' | 'right'

export type TipAlign = 'center' | 'start' | 'end'

export type TipType = ColorType

export interface TipProps {
  visible?: boolean
  type?: TipType
  content?: string
  style?: CSSProperties | string
  class?: string | string[] | Record<string, boolean>
  trigger?: 'hover' | 'click'
  triggerDom?: HTMLElement
  /**
   * @default 'auto'
   */
  direction?: TipDirection

  hideArrow?: boolean

  /**
   * @default 'center'
   */
  alignment?: TipAlign

  contentTag?: string

  disabled?: boolean

  /**
   * 弹出延时（毫秒），仅 `trigger="hover"` 时生效
   * @default 0
   */
  showDelay?: number
}

export interface TipEmits {
  (e: 'update:visible', value: boolean): void
}

export interface _TipExposed {}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipExposed = DeconstructValue<_TipExposed>
