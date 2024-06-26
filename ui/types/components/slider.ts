import type { DeconstructValue } from '../helper'

/** 滑块组件属性 */
export interface SliderProps {
  modelValue?: number[] | number
  disabled?: boolean | undefined
  /** 是否垂直 */
  vertical?: boolean
  height?: number
  min?: number
  max?: number
  /** 步长模式 */
  step?: number
  /** 是否是范围模式 */
  range?: boolean
  /** 是否显示断点 */
  showStops?: boolean
}

/** 滑块组件定义的事件 */
export interface SliderEmits {
  (e: 'update:modelValue', value: number[] | number): void
}

export interface SliderButtonEmits {
  (e: 'update:modelValue', value: number): void

  (e: 'dragPosition', value: number): void

  (e: 'dragEnd', value: number): void

  (e: 'getDragPx', value: number): void
}

export interface SliderButtonTransform {
  x: number
  y: number
}

/** 滑块组件暴露的属性和方法(组件内部使用) */
export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
