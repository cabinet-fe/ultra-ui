import type { ComponentProps, DeconstructValue, ValidateRule } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export interface NestedFieldMarker<T extends Record<string, any> = Record<string, any>> {
  __isNested: true
  fields: T
}

export interface FormModelItem<Val = any> extends ValidateRule {
  /** 模型值 */
  value?: Val
}

export type FormModelField = FormModelItem | NestedFieldMarker

// 最终暴露的 ModelData 类型
export type ModelData<Fields extends Record<string, any>> = {
  [key in keyof Fields]: Fields[key] extends NestedFieldMarker<infer SubFields>
    ? ModelData<SubFields>
    : Fields[key] extends FormModelItem
      ? Fields[key]['value'] extends () => infer T
        ? T
        : Fields[key]['value']
      : never
}

// 获取所有的扁平路径 Union（如 'name' | 'contact.email'）
export type AllKeys<Fields extends Record<string, any>> = {
  [K in keyof Fields]: K extends string
    ? Fields[K] extends NestedFieldMarker<infer SubFields>
      ? `${K}.${AllKeys<SubFields>}`
      : K
    : never
}[keyof Fields]

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

export type IFormModel<Fields extends Record<string, any> = Record<string, any>> = {
  /** 表单数据 */
  readonly data: ModelData<Fields>
  /** 字段校验规则 */
  readonly fields: Fields
  /**
   * 字段键
   */
  readonly allKeys: string[]
  /** 需要校验的key */
  formKeys: Map<number, string[]>
  /** 错误 */
  readonly errors: Map<string, string[] | undefined>
  /**
   * 字段校验
   * @param fields 字段， 如果不传入时将会使用keyFields来进行校验
   */
  validate: (fields?: string | string[]) => Promise<boolean>
  /** 重置数据 */
  resetData(fields?: string | string[]): void

  /**
   * 设置数据
   * @param formData 表单值
   * @param options 配置
   */
  setData(formData: Partial<Record<string, any>>, config?: DataSettingConfig): void
  /** 清除校验 */
  clearValidate(): void
  /** 监听值变更 */
  onChange(cb: (field: string, val: any) => void): void
  /** 关闭监听值变更 */
  offChange(cb: (field: string, val: any) => void): void
}

/** 表单组件属性 */
export interface FormProps<Model extends IFormModel = IFormModel> extends ComponentProps {
  /**
   * 自定义表单列数
   * - 默认根据尺寸断点自动排列
   */
  cols?: number
  /** 是否显示初始数据 */
  showInitialData?: boolean
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

export interface _FormExposed {
  el: ShallowRef<HTMLElement | null | undefined>
}

export type FormExposed = DeconstructValue<_FormExposed>
