import type { ColorType } from '../component-common'
import type { DeconstructValue } from '../helper'

export type ProgressType = ColorType

/** progress组件属性 */
export interface ProgressProps {
  /** 进度百分比 */
  percentage: number
  color?: ProgressType
}

/** progress组件定义的事件 */
export interface ProgressEmits {
  (e: 'update:modelValue', value: string): void
}

/** progress组件暴露的属性和方法(组件内部使用) */
export interface _ProgressExposed {}

/** progress组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressExposed = DeconstructValue<_ProgressExposed>
