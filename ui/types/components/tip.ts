import type { CSSProperties } from 'vue'
import type { DeconstructValue } from '../helper'

export type TipDirection = 'top' | 'bottom' | 'left' | 'right'

export type TipAlign = 'start' | 'center' | 'end'

/** tip提示组件组件属性 */
export interface TipProps {
  /**提示内容 */
  content?: string
  /** 自定义tip样式 */
  style?: CSSProperties | string
  /** 自定义tip的class */
  class?: string | string[] | Record<string, boolean>
  /**触发tip方式 */
  trigger?: 'hover' | 'click'
  /**
   * 方向
   * @default 'auto'
   */
  direction?: TipDirection
  /**
   * 对齐方式
   * @default 'center'
   */
  alignment?: TipAlign

  /**
   * 点击空白区域是否可关闭
   */
  clickClose?: boolean

  /**
   * tip内容标签
   */
  contentTag?: string
}

/** tip提示组件组件定义的事件 */
export interface TipEmits {
  (e: 'update:modelValue', value: string): void
}

/** tip提示组件组件暴露的属性和方法(组件内部使用) */
export interface _TipExposed {
  close: () => void
}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipExposed = DeconstructValue<_TipExposed>
