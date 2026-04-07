import type { DeconstructValue } from '../helper'

/** 多量自动完成组件组件属性 */
export interface MultiAutoCompleteProps {
  modelValue?: string
}

/** 多量自动完成组件组件定义的事件 */
export interface MultiAutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 多量自动完成组件组件暴露的属性和方法(组件内部使用) */
export interface _MultiAutoCompleteExposed {}

/** 多量自动完成组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiAutoCompleteExposed =
  DeconstructValue<_MultiAutoCompleteExposed>
