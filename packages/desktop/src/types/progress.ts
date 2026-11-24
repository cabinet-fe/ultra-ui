import type { ColorType, DeconstructValue } from '@veltra/utils'

export interface ProgressProps {
  type: ColorType | ((percentage: number) => ColorType)
  /** 圆形进度条尺寸 */
  size?: number | string
  percentage?: number
  circle?: boolean
}

export interface ProgressEmits {}

export interface _ProgressExposed {}

/** progress组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressExposed = DeconstructValue<_ProgressExposed>
