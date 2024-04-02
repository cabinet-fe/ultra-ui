import type { ShallowRef, shallowReadonly } from 'vue'
import type { ComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'
import type { ValidateRule, Data } from '../utils/form/validate'

export interface FormModelItem<Val = unknown> extends ValidateRule {
  /** 模型值 */
  value?: Val
}

export type ModelData<Fields extends Record<string, FormModelItem>> = {
  [key in keyof Fields]: Fields[key]['value']
}

export type ModelRules<Fields extends Record<string, FormModelItem>> = {
  [key in keyof Fields]: Omit<Fields[key], 'value'>
}

export type IFormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> = {
  /** 表单数据 */
  readonly data: ModelData<Fields>
  /** 字段校验规则 */
  readonly rules: ModelRules<Fields>
  /** 错误 */
  readonly errors: Map<keyof Fields, string[] | undefined>
  /** 字段校验 */
  validate: (fields?: keyof Fields | (keyof Fields)[]) => Promise<boolean>
}

/** 表单组件属性 */
export interface FormProps<Model extends IFormModel = IFormModel>
  extends ComponentProps {
  /** 表单模式, edit为编辑模式, view为查看模式 */
  mode?: 'edit' | 'view'
  /** 表单数据模型 */
  model: Model
  /** 表单项label宽度 */
  labelWidth?: string | number
  /** 是否不显示tips */
  noTips?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

export interface _FormExposed<Fields> {
  validate: (fields?: Fields) => Promise<boolean>
}

export type FormExposed<Fields = string> = DeconstructValue<
  _FormExposed<Fields>
>
