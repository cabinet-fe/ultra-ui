import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'
import type { ValidateRule, Data } from '../utils/form/validate'

export type FormModelItem<Val = unknown> = {
  value?: Val
  min?: number
  max?: number
  required?: boolean
}

export type ModelData<Model extends Record<string, FormModelItem>> = {
  [key in keyof Model]: Model[key]['value']
}

export type ModelRules<Model extends Record<string, FormModelItem>> = {
  [key in keyof Model]: Omit<Model[key], 'value'>
}

/** 表单组件属性 */
export interface FormProps<
  Rules extends Record<string, ValidateRule> = Record<string, ValidateRule>
> extends FormComponentProps {
  /** 表单模式, edit为编辑模式, view为查看模式 */
  mode?: 'edit' | 'view'
  /** 表单数据, 如果 */
  data?: Data
  /** 指定表单使用的数据模型，此属性需要配合useForm使用 */
  use?: string
  /** 字段校验规则 */
  rules?: Rules
  /** 表单项label宽度 */
  labelWidth?: string | number
}

export interface _FormExposed<Fields> {
  validate: (fields?: Fields) => Promise<boolean>
}

export type FormExposed<Fields = string> = DeconstructValue<_FormExposed<Fields>>
