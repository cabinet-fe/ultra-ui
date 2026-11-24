import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface RadioGroupProps extends FormComponentProps {
  modelValue?: any
  items: Record<string, any>[]
  /**
   * @default 'value'
   */
  valueKey?: string
  /**
   * @default 'label'
   */
  labelKey?: string
  disabled?: boolean
  disabledItem?: (item: Record<string, any>) => boolean
  block?: boolean
}

export interface RadioGroupEmits {
  (e: 'update:modelValue', modelValue: any): void
  (e: 'change', item: Record<string, any>): void
}

export interface _RadioGroupExposed {}

/** 单选框默认父组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioGroupExposed = DeconstructValue<_RadioGroupExposed>
