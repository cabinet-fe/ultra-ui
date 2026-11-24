import type { Dater } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type DateRangePickerDataType = 'date' | 'timestamp' | 'string'

export type DateRangeValue = [string, string] | [number, number] | [Date, Date]

export interface DateRangePickerProps extends FormComponentProps {
  modelValue?: DateRangeValue
  placeholder?: [string, string]
  type?: 'date' | 'month' | 'year'
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /**
   * 绑定值的类型，默认为字符串。
   * 当 dataType 没有指定为字符串时，valueFormat 属性不生效
   */
  dataType?: DateRangePickerDataType
  disabledDate?: (date: Dater, raw: Date) => boolean
  clearable?: boolean
}

export interface DateRangePickerEmits {
  (e: 'update:modelValue', value?: DateRangeValue): void
  (e: 'change', dates?: [Date, Date]): void
}

export interface _DateRangePickerExposed {}

/** date-range-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DateRangePickerExposed = DeconstructValue<_DateRangePickerExposed>
