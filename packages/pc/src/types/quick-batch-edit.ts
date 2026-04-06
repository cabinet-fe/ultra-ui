import type { DeconstructValue } from '../helper'

/** 快速批量编辑组件属性 */
export interface QuickBatchEditProps {
  modelValue?: string
}

/** 快速批量编辑组件定义的事件 */
export interface QuickBatchEditEmits {
  (e: 'update:modelValue', value: string): void
}

/** 快速批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _QuickBatchEditExposed {}

/** 快速批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type QuickBatchEditExposed = DeconstructValue<_QuickBatchEditExposed>
