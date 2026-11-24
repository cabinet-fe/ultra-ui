import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface SliderProps<T extends number | [number, number]> extends FormComponentProps {
  modelValue?: T
  /**
   * @default 0
   */
  min?: number
  /**
   * @default 100
   */
  max?: number
  /**
   * 步长
   * - 如果设置步长, 则滑块会按照步长进行滑动
   * - 同时，滑块上将会显示步长刻度
   */
  step?: number
  range?: boolean
  vertical?: boolean
}

export interface SliderEmits<T extends number | [number, number]> {
  (e: 'update:modelValue', value: T): void
}

export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
