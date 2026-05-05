import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface VariableItem {
  label: string
  value: string
  /** 可选类型标识（如 string、number） */
  type?: string
  /** 子级变量（支持树形结构） */
  children?: VariableItem[]
}

/** 选中范围：仅叶子节点，或允许任意层级（含分支） */
export type ExpressionSelectableLevels = 'leaf' | 'any'

/** 表达式编辑器组件属性 */
export interface ExpressionEditorProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  /** 变量列表 */
  variables?: VariableItem[]
  /**
   * 是否允许选中任意层级的变量（含中间分支）。
   * - `'leaf'`（默认）：仅叶子节点可选；分支节点上 Enter / → 进入下一级
   * - `'any'`：分支节点上 Enter 选中分支本身、→ 进入下一级
   */
  selectableLevels?: ExpressionSelectableLevels
}

/** 表达式编辑器组件定义的事件 */
export interface ExpressionEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 表达式编辑器组件暴露的属性和方法(组件内部使用) */
export interface _ExpressionEditorExposed {}

/** 表达式编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ExpressionEditorExposed = DeconstructValue<_ExpressionEditorExposed>
