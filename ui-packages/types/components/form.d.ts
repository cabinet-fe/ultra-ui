import { FormComponentProps } from '../component-common'
import { DeconstructValue } from '../helper'

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
export interface FormProps<Data extends Record<string, any> = Record<string, any>>
  extends FormComponentProps {
  /** 表单模式, edit为编辑模式, view为查看模式 */
  mode?: 'edit' | 'view'
  /** 表单数据 */
  data: Data
  /** 字段校验规则 */
  rules?: { [key in keyof Data]?: Omit<FormModelItem, 'value'> }
  /** 表单项label宽度 */
  labelWidth?: string | number
}

export interface _FormExposed {
  validate: () => Promise<boolean>
}

export type FormExposed = DeconstructValue<_FormExposed>
