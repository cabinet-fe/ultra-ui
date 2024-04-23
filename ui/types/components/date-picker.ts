import type { Dater } from 'cat-kit/fe'
import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

/** date-picker组件属性 */
export interface DatePickerProps extends FormComponentProps {
  modelValue?: string
  /** 占位 */
  placeholder?: string
  /** 日期格式化 */
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /** 最小可选日期 */
  disabledDate?: (date: Dater) => boolean
}

/** date-picker组件定义的事件 */
export interface DatePickerEmits {
  (e: 'update:modelValue', value: string): void
}

/** date-picker组件暴露的属性和方法(组件内部使用) */
export interface _DatePickerExposed {}

/** date-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DatePickerExposed = DeconstructValue<_DatePickerExposed>
