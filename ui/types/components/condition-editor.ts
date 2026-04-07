import type { DeconstructValue } from '../helper'

/** 条件编辑器组件属性 */
export interface ConditionEditorProps {
  modelValue?: string
}

/** 条件编辑器组件定义的事件 */
export interface ConditionEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 条件编辑器组件暴露的属性和方法(组件内部使用) */
export interface _ConditionEditorExposed {}

/** 条件编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ConditionEditorExposed = DeconstructValue<_ConditionEditorExposed>
