import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type TimePickerDataType = 'date' | 'timestamp' | 'string'

export interface TimePickerProps extends FormComponentProps {
  modelValue?: string | number | Date
  placeholder?: string
  format?: string
  /** 时间值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /**
   * 绑定值的类型，默认为字符串。
   * 当 dataType 没有指定为字符串时，valueFormat 属性不生效
   */
  dataType?: TimePickerDataType
  disabledHours?: () => number[]
  disabledMinutes?: (hour: number) => number[]
  disabledSeconds?: (hour: number, minute: number) => number[]
  clearable?: boolean
}

export interface TimePickerEmits {
  (e: 'update:modelValue', value?: string | number | Date): void
  (e: 'change', time?: Date): void
}

export interface _TimePickerExposed {}

/** time-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TimePickerExposed = DeconstructValue<_TimePickerExposed>
