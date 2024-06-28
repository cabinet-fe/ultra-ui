import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

/** 自动补全组件组件属性 */
export interface AutoCompleteProps extends FormComponentProps {
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 建议 */
  suggestions?: string[] | (() => Promise<string[]> | string[])
  /** 是否可清空 */
  clearable?: boolean
}

/** 自动补全组件组件定义的事件 */
export interface AutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 自动补全组件组件暴露的属性和方法(组件内部使用) */
export interface _AutoCompleteExposed {}

/** 自动补全组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AutoCompleteExposed = DeconstructValue<_AutoCompleteExposed>
