import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 绑定值类型 */
export type TimePickerDataType = 'date' | 'timestamp' | 'string'

/** time-picker组件属性（与 @veltra/desktop UTimePicker 对齐） */
export interface TimePickerProps extends FormComponentProps {
  modelValue?: string | number | Date
  /** 占位 */
  placeholder?: string
  /** 时间格式化 */
  format?: string
  /** 时间值格式化, 当没有指定时默认使用format属性，仅当值和显示的内容不一致时才需要使用到该属性 */
  valueFormat?: string
  /**
   * 绑定值的类型，默认为字符串。
   * 当 dataType 没有指定为字符串时，valueFormat 属性不生效
   */
  dataType?: TimePickerDataType
  /** 禁用的小时 */
  disabledHours?: () => number[]
  /** 禁用的分钟 */
  disabledMinutes?: (hour: number) => number[]
  /** 禁用的秒 */
  disabledSeconds?: (hour: number, minute: number) => number[]
  /** 是否显示清除按钮 */
  clearable?: boolean
}

/** time-picker组件定义的事件 */
export interface TimePickerEmits {
  (e: 'update:modelValue', value?: string | number | Date): void
  (e: 'change', time?: Date): void
}

/** time-picker组件暴露的属性和方法(组件内部使用) */
export interface _TimePickerExposed {}

/** time-picker组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TimePickerExposed = DeconstructValue<_TimePickerExposed>
