import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

/** date-picker组件属性 */
export interface DatePickerProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
}

/** date-picker组件定义的事件 */
export interface DatePickerEmits {
  (e: 'update:modelValue', value: string): void
}

export interface Day {
  num: number
}

/** date-picker组件暴露的属性和方法(组件内部使用) */
export interface _DatePickerExposed {}

/** date-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DatePickerExposed = DeconstructValue<_DatePickerExposed>
