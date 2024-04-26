import type { DeconstructValue } from '../helper'

/** watermark组件属性 */
export interface WatermarkProps {
  text?: string
  font?: string
  fontColor?: string
  fontSize?: string
  fontWeight?: string
  fontStyle?: string
  fontFamily?: string
  rotate?: number
  width?: number
  height?: number
  gapX?: number
  gapY?: number
  offsetX?: number
  offsetY?: number
  zIndex?: number
  image?: string
}

/** watermark组件定义的事件 */
export interface WatermarkEmits {
  (e: 'update:modelValue', value: string): void
}

/** watermark组件暴露的属性和方法(组件内部使用) */
export interface _WatermarkExposed {}

/** watermark组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type WatermarkExposed = DeconstructValue<_WatermarkExposed>
