import { type InjectionKey, inject, provide } from 'vue'

import type { FormProps } from '../types/form'

type DIContext = {
  /** 表单属性 */
  formProps: FormProps
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

export function provideFormContext(props: FormProps): void {
  if (props) {
    return provide(FormComponentDIKey, { formProps: props })
  }
}

export function injectFormContext(): {
  /** 是否在表单中 */
  inForm: boolean
} & Partial<DIContext> {
  const context = inject(FormComponentDIKey, undefined) || {}
  return { inForm: !!context, ...context }
}
