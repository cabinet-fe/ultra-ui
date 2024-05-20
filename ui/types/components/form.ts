import type { ComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'
import type { ValidateRule } from '../utils/form/validate'

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

export interface DataSettingConfig {
  /**
   * 是否校验
   * @default true
   */
  validate?: boolean
}

export type IFormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> = {
  /** 表单数据 */
  readonly data: ModelData<Fields>
  /** 字段校验规则 */
  readonly rules: ModelRules<Fields>
  /** 字段键 */
  readonly keyOfFields: (keyof Fields)[]
  /** 错误 */
  readonly errors: Map<keyof Fields, string[] | undefined>
  /** 字段校验 */
  validate: (fields?: keyof Fields | (keyof Fields)[]) => Promise<boolean>
  /** 重置数据 */
  resetData(fields?: keyof Fields | (keyof Fields)[]): void
  /**
   * 执行函数
   * @param fn 待执行函数
   * @param validate 是否进行校验
   */
  run(fn: () => void | Promise<void>, validate?: boolean): Promise<any>
  /**
   * 设置数据
   * @param formData 表单值
   * @param options 配置
   */
  setData(formData: Partial<ModelData<Fields>>, config?: DataSettingConfig): void
  /** 清除校验 */
  clearValidate(): void
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
