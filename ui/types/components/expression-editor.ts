import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

export interface VariableItem {
  label: string
  value: string
}

/** 表达式编辑器组件属性 */
export interface ExpressionEditorProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  /** 变量列表 */
  variables?: VariableItem[]
}

/** 表达式编辑器组件定义的事件 */
export interface ExpressionEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 表达式编辑器组件暴露的属性和方法(组件内部使用) */
export interface _ExpressionEditorExposed {}

/** 表达式编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ExpressionEditorExposed = DeconstructValue<_ExpressionEditorExposed>
