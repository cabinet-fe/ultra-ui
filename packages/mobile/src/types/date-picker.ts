import type { Dater } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type DatePickerDataType = 'date' | 'timestamp' | 'string'

/** date-picker组件属性（与 @veltra/desktop UDatePicker 对齐） */
export interface DatePickerProps extends FormComponentProps {
  modelValue?: string | number | Date
  placeholder?: string
  type?: 'date' | 'month' | 'year'
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /**
   * 绑定值的类型，默认为字符串。
   * 当 dataType 没有指定为字符串时，valueFormat 属性不生效
   */
  dataType?: DatePickerDataType
  disabledDate?: (date: Dater, raw: Date) => boolean
  clearable?: boolean
}

export interface DatePickerEmits {
  (e: 'update:modelValue', value?: string | number | Date): void
  (e: 'change', date?: Date): void
}

export interface _DatePickerExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type DatePickerExposed = DeconstructValue<_DatePickerExposed>
