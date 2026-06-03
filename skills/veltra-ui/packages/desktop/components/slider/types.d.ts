import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 滑块组件属性 */
export interface SliderProps<T extends number | [number, number]> extends FormComponentProps {
  modelValue?: T
  /**
   * 最小值
   * @default 0
   */
  min?: number
  /**
   * 最大值
   * @default 100
   */
  max?: number
  /**
   * 步长
   * - 如果设置步长, 则滑块会按照步长进行滑动
   * - 同时，滑块上将会显示步长刻度
   */
  step?: number
  /** 是否是范围滑块 */
  range?: boolean
  /** 是否是垂直模式 */
  vertical?: boolean
}

/** 滑块组件定义的事件 */
export interface SliderEmits<T extends number | [number, number]> {
  (e: 'update:modelValue', value: T): void
}

/** 滑块组件暴露的属性和方法(组件内部使用) */
export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
