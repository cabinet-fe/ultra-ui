import type { FormContextInjectProps } from '@veltra/utils'
import { type InjectionKey, inject, provide } from 'vue'

type DIContext = {
  /** 表单属性 */
  formProps: FormContextInjectProps
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

/**
 * 表单组件本身的组合式方法
 * @param props 表单属性
 * @returns
 */
export function useFormComponent(props: FormContextInjectProps): void
/**
 * 表单内的组件的组合式方法
 * @returns 提供一个form的上下文
 */
export function useFormComponent(): {
  /** 是否在表单中 */
  inForm: boolean
} & Partial<DIContext>
export function useFormComponent(props?: any): any {
  if (props) {
    return provide(FormComponentDIKey, { formProps: props })
  }
  const context = inject(FormComponentDIKey, undefined) || {}
  return { inForm: !!context, ...context }
}
