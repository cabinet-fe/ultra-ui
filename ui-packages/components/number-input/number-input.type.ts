import { FormComponentProps } from "@ui/shared"

/** 数字输入组件属性 */
export interface NumberInputProps extends FormComponentProps {
  modelValue?: number
  /** 是否为货币模式 */
  currency?: boolean
  /** 精度 */
  precision?: number
  /** 最小精度 */
  minPrecision?: number
  /** 最大精度 */
  maxPrecision?: number
  /** 可清除 */
  clearable?: boolean
}

/** 数字输入组件定义的事件 */
export interface NumberInputEmits {
  (event: 'update:modelValue', value?: number): void
}

/** 数字输入组件暴露的属性和方法 */
export interface NumberInputExposed {}
