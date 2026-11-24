import type { DeconstructValue } from '@veltra/utils'

export interface MultiAutoCompleteProps {
  modelValue?: string
}

export interface MultiAutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _MultiAutoCompleteExposed {}

/** 多量自动完成组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiAutoCompleteExposed = DeconstructValue<_MultiAutoCompleteExposed>
