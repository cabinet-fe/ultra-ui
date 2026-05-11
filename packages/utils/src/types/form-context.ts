import { type InjectionKey, inject, provide } from 'vue'

import type { ComponentSize } from './component-common'

export interface FormContextModel {
  errors: Map<any, string[] | undefined>
  fields: Record<string, { required?: unknown }>
}

export interface FormContextProps {
  /** 表单列宽 */
  labelWidth?: string | number
  /** 表单尺寸 */
  size?: ComponentSize
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否隐藏提示 */
  noTips?: boolean
  /** 表单数据模型 */
  model?: FormContextModel
}

type FormPropsLike = Partial<FormContextProps> & Record<string, any>

type DIContext = {
  /** 表单属性 */
  formProps: FormPropsLike
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

export function provideFormContext<T extends FormPropsLike>(props: T): void {
  if (props) {
    provide(FormComponentDIKey, { formProps: props })
  }
}

export function injectFormContext(): {
  /** 是否在表单中 */
  inForm: boolean
} & Partial<DIContext> {
  const context = inject(FormComponentDIKey, undefined) || {}
  return { inForm: !!context, ...context }
}
