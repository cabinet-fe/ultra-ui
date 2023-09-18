import type { FormComponentProps } from '@ui/shared'
import type { DeconstructValue } from '@ui/utils'


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
export interface FormProps<Data extends Record<string, any>> extends FormComponentProps {
  /** 表单模式, edit为编辑模式, view为查看模式 */
  mode?: 'edit' | 'view'

  data: Data

  rules?: { [key in keyof Data]?: Omit<FormModelItem, 'value'>}
}

export interface _FormExposed {
  validate: () => Promise<boolean>
}

export type FormExposed = DeconstructValue<_FormExposed>
