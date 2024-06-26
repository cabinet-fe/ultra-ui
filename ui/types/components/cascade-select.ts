import type { DeconstructValue } from '../helper'

/** 级联选择器组件属性 */
export interface CascadeSelectProps {
  modelValue?: string
  labelKey?: string
  valueKey?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
}

/** 级联选择器组件定义的事件 */
export interface CascadeSelectEmits<Option extends Record<string, any>> {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: Option[]): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeSelectExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeSelectExposed = DeconstructValue<_CascadeSelectExposed>
