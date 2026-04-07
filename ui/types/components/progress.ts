import type { ColorType } from '../component-common'
import type { DeconstructValue } from '../helper'

/** progress组件属性 */
export interface ProgressProps {
  /** 类型 */
  type: ColorType | ((percentage: number) => ColorType)
  /** 圆形进度条尺寸 */
  size?: number | string
  /** 进度百分比 */
  percentage?: number
  /** 是否圆形进度条 */
  circle?: boolean
}

/** progress组件定义的事件 */
export interface ProgressEmits {}

/** progress组件暴露的属性和方法(组件内部使用) */
export interface _ProgressExposed {}

/** progress组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressExposed = DeconstructValue<_ProgressExposed>
