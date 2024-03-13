import { type InjectionKey, inject, provide } from 'vue'
import type { FormProps } from '@ui/types/components/form'
type DIContext = {
  /** 表单属性 */
  formProps: FormProps
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

/**
 * 表单组件本身的组合式方法
 * @param isForm 是否为form组件
 * @returns
 */
export function useFormComponent(isForm: true, props: FormProps): void
/**
 * 表单内的组件的组合式方法
 * @param isForm 是否为form组件
 * @returns 提供一个form的上下文
 */
export function useFormComponent(isForm: false): {
    /** 是否在表单中 */
   inForm: boolean
 } & (DIContext | undefined)
export function useFormComponent(isForm: boolean, props?: any) {
  if (isForm) {
    return provide(FormComponentDIKey, {
      formProps: props
    })
  }
  const context = inject(FormComponentDIKey)
  return {
    inForm: !!context,
    ...context
  }
}
