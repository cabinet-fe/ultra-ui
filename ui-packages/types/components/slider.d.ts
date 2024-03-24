import type { DeconstructValue } from '../helper'

/** 滑块组件属性 */
export interface SliderProps {
  modelValue?: string
}

/** 滑块组件定义的事件 */
export interface SliderEmits {
  (e: 'update:modelValue', value: string): void
}

/** 滑块组件暴露的属性和方法(组件内部使用) */
export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
