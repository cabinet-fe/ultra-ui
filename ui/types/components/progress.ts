import type { ColorType } from '../component-common'
import type { DeconstructValue } from '../helper'

export type ProgressType = ColorType

export type ProgressStatus = 'success' | 'warning' | 'danger'

/** progress组件属性 */
export interface ProgressProps {
  /** 类型 */
  type: ProgressType
  /** 进度百分比 */
  percentage: number
  /** 是否圆形进度条 */
  isCircle?: boolean
  status?: ProgressStatus
}

/** progress组件定义的事件 */
export interface ProgressEmits {
  (e: 'update:modelValue', value: string): void
}

/** progress组件暴露的属性和方法(组件内部使用) */
export interface _ProgressExposed {}

/** progress组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressExposed = DeconstructValue<_ProgressExposed>
