import type { Dater } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 绑定值类型 */
export type DateRangePickerDataType = 'date' | 'timestamp' | 'string'

/** 日期范围绑定值 */
export type DateRangeValue = [string, string] | [number, number] | [Date, Date]

/** date-range-picker组件属性 */
export interface DateRangePickerProps extends FormComponentProps {
  modelValue?: DateRangeValue
  /** 占位 */
  placeholder?: [string, string]
  /** 日期类型 */
  type?: 'date' | 'month' | 'year'
  /** 日期格式化 */
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /**
   * 绑定值的类型，默认为字符串。
   * 当 dataType 没有指定为字符串时，valueFormat 属性不生效
   */
  dataType?: DateRangePickerDataType
  /** 最小可选日期 */
  disabledDate?: (date: Dater, raw: Date) => boolean
  /** 是否显示清除按钮 */
  clearable?: boolean
}

/** date-range-picker组件定义的事件 */
export interface DateRangePickerEmits {
  (e: 'update:modelValue', value?: DateRangeValue): void
  (e: 'change', dates?: [Date, Date]): void
}

/** date-range-picker组件暴露的属性和方法(组件内部使用) */
export interface _DateRangePickerExposed {}

/** date-range-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DateRangePickerExposed = DeconstructValue<_DateRangePickerExposed>
