import type { ComponentSize, DeconstructValue } from '@veltra/utils'

import type { VariableItem } from './expression-editor'

/** 字段定义 */
export interface ConditionField {
  label: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  enumOptions?: { label: string; value: string }[]
}

/** 条件右侧值：常量或变量引用 */
export type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }

/** 单行条件叶子节点 */
export interface ConditionLeaf {
  type: 'condition'
  field: string
  operator: string
  value: ConditionValue
}

/** 行间逻辑连接符 */
export type ConditionConnector = 'and' | 'or'

/** 条件组节点 —— 与叶子节点通过 children 统一编排 */
export interface ConditionGroup {
  type: 'group'
  children: ConditionNode[]
  /**
   * 子项之间的连接符
   *
   * - `connectors[i]` 用于 `children[i]` 与 `children[i + 1]` 之间
   * - 长度应等于 `children.length - 1`；缺失项默认为 `and`
   */
  connectors: ConditionConnector[]
}

/** 树节点：叶子或分组 */
export type ConditionNode = ConditionLeaf | ConditionGroup

/** 顶层表达式 = 根分组 */
export type ConditionExpression = ConditionGroup

export interface ConditionEditorProps {
  modelValue?: ConditionExpression
  fields?: ConditionField[]
  variables?: VariableItem[]
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
}

export interface ConditionEditorEmits {
  (e: 'update:modelValue', value: ConditionExpression): void
}

export interface _ConditionEditorExposed {}

export type ConditionEditorExposed = DeconstructValue<_ConditionEditorExposed>
