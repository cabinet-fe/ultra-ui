import type { DeconstructValue } from '../helper'

/** 自动补全组件组件属性 */
export interface AutoCompleteProps<Option extends Record<string, any> | string> {
  modelValue?: string
  placeholder?: string
  suggestions?: Option[]
  labelKey?: string
  clearable?: boolean
  linker?: string
}

/** 自动补全组件组件定义的事件 */
export interface AutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'complete', value: string): void
}

/** 自动补全组件组件暴露的属性和方法(组件内部使用) */
export interface _AutoCompleteExposed { }

/** 自动补全组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AutoCompleteExposed = DeconstructValue<_AutoCompleteExposed>
