import type { Dater } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** date-range-picker组件属性 */
export interface DateRangePickerProps extends FormComponentProps {
  modelValue?: [string, string]
  /** 占位 */
  placeholder?: [string, string]
  /** 日期类型 */
  type?: 'date' | 'month' | 'year'
  /** 日期格式化 */
  format?: string
  /** 日期值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /** 最小可选日期 */
  disabledDate?: (date: Dater) => boolean
  /** 是否显示清除按钮 */
  clearable?: boolean
}

/** date-range-picker组件定义的事件 */
export interface DateRangePickerEmits {
  (e: 'update:modelValue', value?: [string, string]): void
}

/** date-range-picker组件暴露的属性和方法(组件内部使用) */
export interface _DateRangePickerExposed {}

/** date-range-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DateRangePickerExposed = DeconstructValue<_DateRangePickerExposed>
