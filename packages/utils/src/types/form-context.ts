import { type InjectionKey, inject, provide } from 'vue'

import type { ComponentSize } from './component-common'

export interface FormContextModel {
  errors: Map<any, string[] | undefined>
  fields: Record<string, { required?: unknown }>
}

export interface FormContextProps {
  labelWidth?: string | number
  labelPosition?: 'top' | 'left'
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
  noTips?: boolean
  model?: Record<string, any>
}

type FormPropsLike = Partial<FormContextProps> & Record<string, any>

export interface FormFieldItem {
  validate: () => Promise<boolean>
  clearValidate?: () => void
}

type DIContext = {
  formProps: FormPropsLike
  registerField: (field: string, item: FormFieldItem) => void
  unregisterField: (field: string) => void
  /** 校验指定字段，未传 keys 时校验全部已注册字段 */
  validateFields?: (keys?: string[]) => Promise<boolean>
  shouldValidate?: () => boolean
  /** 处理字段 model 更新（watch 触发） */
  handleFieldUpdate: (field: string, value: any) => void
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

export function provideFormContext(context: DIContext): void {
  provide(FormComponentDIKey, context)
}

export function injectFormContext(): { inForm: boolean } & Partial<DIContext> {
  const context = inject(FormComponentDIKey, undefined) || {}
  return { inForm: !!context, ...context }
}
