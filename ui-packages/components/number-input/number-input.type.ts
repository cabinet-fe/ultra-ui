import { InputProps } from '../input/input.type'

/** 数字输入组件属性 */
export interface NumberInputProps extends Omit<InputProps, 'modelValue' > {
  modelValue?: number
  /** 是否为货币模式 */
  currency?: boolean
  /** 精度 */
  precision?: number
  /** 最小精度 */
  minPrecision?: number
  /** 最大精度 */
  maxPrecision?: number
  /** 步进, 指定为数字时开启累加按钮并将该值作为累加的步长, 为true则步长默认为1 */
  step?: boolean | number
}

/** 数字输入组件定义的事件 */
export interface NumberInputEmits {
  (event: 'update:modelValue', value?: number): void
  (event: 'change', value?: number): void
}

/** 数字输入组件暴露的属性和方法 */
export interface NumberInputExposed {}
