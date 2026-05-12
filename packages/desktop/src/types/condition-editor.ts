import type { ComponentSize, DeconstructValue } from '@veltra/utils'

import type { VariableItem } from './expression-editor'

export interface ConditionField {
  label: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  enumOptions?: { label: string; value: string }[]
}

export type ConditionValue =
  | { kind: 'constant'; value: string }
  | { kind: 'variable'; name: string }

export interface ConditionItem {
  field: string
  operator: string
  value: ConditionValue
  _result?: boolean
}

export interface ConditionGroup {
  logic: 'and' | 'or'
  conditions: ConditionItem[]
  groups: ConditionGroup[]
  _result?: boolean
}

export type ConditionExpression = ConditionGroup

export interface ConditionEditorProps {
  modelValue?: ConditionExpression
  fields?: ConditionField[]
  variables?: VariableItem[]
  data?: Record<string, unknown>
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
}

export interface ConditionEditorEmits {
  (e: 'update:modelValue', value: ConditionExpression): void
  (e: 'evaluate', results: ConditionExpression): void
}

export interface _ConditionEditorExposed {}

export type ConditionEditorExposed = DeconstructValue<_ConditionEditorExposed>
