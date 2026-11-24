import type { DeconstructValue } from '@veltra/utils'

export interface WatermarkProps {
  text?: string
  image?: string
  appendToBody?: boolean
  /** 旋转弧度 */
  route?: number
  fontSize?: number
}

export interface WatermarkEmits {}

export interface _WatermarkExposed {}

/** watermark组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type WatermarkExposed = DeconstructValue<_WatermarkExposed>
