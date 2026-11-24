import type { InputProps } from './input'

export interface NumberInputProps extends Omit<InputProps, 'modelValue'> {
  modelValue?: number
  currency?: boolean
  precision?: number
  minPrecision?: number
  maxPrecision?: number
  /** 步进, 指定为数字时开启累加按钮并将该值作为累加的步长, 为true则步长默认为1 */
  step?: boolean | number
  max?: number
  min?: number
  multiple?: number
}

export interface NumberInputEmits {
  (event: 'update:modelValue', value?: number): void
  (event: 'change', value?: number): void
  (event: 'clear'): void
}

export interface NumberInputExposed {}
