import { type InjectionKey, inject, provide } from 'vue'

import type { ComponentSize } from './component-common'

export interface FormContextModel {
  errors: Map<any, string[] | undefined>
  fields: Record<string, { required?: unknown }>
}

export interface FormContextProps {
  /** 表单列宽 */
  labelWidth?: string | number
  /** 表单项 label 位置 */
  labelPosition?: 'top' | 'left'
  /** 表单尺寸 */
  size?: ComponentSize
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否隐藏提示 */
  noTips?: boolean
  /** 表单数据 */
  model?: Record<string, any>
}

type FormPropsLike = Partial<FormContextProps> & Record<string, any>

export interface FormFieldItem {
  validate: () => Promise<boolean>
  clearValidate?: () => void
}

type DIContext = {
  /** 表单属性 */
  formProps: FormPropsLike
  /** 注册表单字段 */
  registerField: (field: string, item: FormFieldItem) => void
  /** 注销表单字段 */
  unregisterField: (field: string) => void
  /** 校验指定字段，未传 keys 时校验全部已注册字段 */
  validateFields?: (keys?: string[]) => Promise<boolean>
  /** 是否需要校验 */
  shouldValidate?: () => boolean
  /** 处理字段值变化 */
  handleFieldChange: (field: string, value: any) => void
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

export function provideFormContext(context: DIContext): void {
  provide(FormComponentDIKey, context)
}

export function injectFormContext(): {
  /** 是否在表单中 */
  inForm: boolean
} & Partial<DIContext> {
  const context = inject(FormComponentDIKey, undefined) || {}
  return { inForm: !!context, ...context }
}
