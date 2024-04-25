import type { DeconstructValue } from '../helper'

/** 表格编辑组件组件属性 */
export interface TableEditorProps {
  modelValue?: string
}

/** 表格编辑组件组件定义的事件 */
export interface TableEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 表格编辑组件组件暴露的属性和方法(组件内部使用) */
export interface _TableEditorExposed {}

/** 表格编辑组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableEditorExposed = DeconstructValue<_TableEditorExposed>
