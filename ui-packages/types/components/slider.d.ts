import type { ShallowReactive } from 'vue'
import type { DeconstructValue } from '../helper'

/** 滑块组件属性 */
export interface SliderProps {
  modelValue: number
  range: Boolean
  disable?: Boolean
  /** 是否垂直 */
  vertical?: boolean
  height?: number
  min?: number
  max?: number
  step?: number
  /** 是否显示断点 */
  showStops?: Boolean
}

/** 滑块组件定义的事件 */
export interface SliderEmits {
  (e: 'update:modelValue', value: number): void
}

export interface SliderButtonEmits {
  (e: 'mousedown', e: MouseEvent): void
  (e: 'touchstart', e: TouchEvent): void
}

export interface SliderButtonTransform {
  x: number
  y: number
}
export interface SliderInitData {
  /** 是否正在拖拽 */
  dragging: Boolean
  currentX?: number
  currentY?: number
  newPosition?: number
  oldValue: number
  sliderSize: number
  transform: ShallowReactive<SliderButtonTransform>
  currentTransform: SliderButtonTransform
}

/** 滑块组件暴露的属性和方法(组件内部使用) */
export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
