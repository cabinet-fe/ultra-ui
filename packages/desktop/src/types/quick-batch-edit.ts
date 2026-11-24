import type { DeconstructValue } from '@veltra/utils'

export interface QuickBatchEditProps {
  modelValue?: string
}

export interface QuickBatchEditEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _QuickBatchEditExposed {}

/** 快速批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type QuickBatchEditExposed = DeconstructValue<_QuickBatchEditExposed>
