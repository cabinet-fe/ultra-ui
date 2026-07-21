import type { DeconstructValue } from '@veltra/utils'
import type { CSSProperties } from 'vue'

export type TipDirection = 'top' | 'bottom' | 'left' | 'right'

export type TipAlign = 'center' | 'start' | 'end'

/** tip提示组件组件属性 */
export interface TipProps {
  /** 控制显影 */
  visible?: boolean
  /**提示内容 */
  content?: string
  /** 自定义tip样式 */
  style?: CSSProperties | string
  /** 自定义tip的class */
  class?: string | string[] | Record<string, boolean>
  /** 触发方式 */
  trigger?: 'hover' | 'click'
  /**
   * 触发元素
   * - 通过指定`triggerDom`来更改弹框弹出位置
   */
  triggerDom?: HTMLElement
  /**
   * 方向
   * @default 'auto'
   */
  direction?: TipDirection

  /** 隐藏箭头 */
  hideArrow?: boolean

  /**
   * 对齐方式
   * @default 'center'
   */
  alignment?: TipAlign

  /**
   * tip内容标签
   */
  contentTag?: string

  /** 禁用tip */
  disabled?: boolean

  /**
   * 弹出延时（毫秒），仅 `trigger="hover"` 时生效
   * @default 0
   */
  showDelay?: number
}

/** tip提示组件组件定义的事件 */
export interface TipEmits {
  (e: 'update:visible', value: boolean): void
}

/** tip提示组件组件暴露的属性和方法(组件内部使用) */
export interface _TipExposed {}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipExposed = DeconstructValue<_TipExposed>
