import { type InjectionKey, inject, provide } from 'vue'
import { FormProps } from '@ui/types/components/form'
type DIContext = {
  inForm: boolean
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

/**
 * 表单组件本身的组合式方法
 * @param isForm 是否为form组件
 * @returns
 */
export function useFormComponent(isForm: true, props?: FormProps): void
/**
 * 表单内的组件的组合式方法
 * @param isForm 是否为form组件
 * @returns 提供一个form的上下文
 */
export function useFormComponent(isForm: false): DIContext
export function useFormComponent(isForm: boolean) {
  if (isForm) {
    return provide(FormComponentDIKey, {
      inForm: true,
      // formProps: {}
    })
  }

  return inject(FormComponentDIKey, undefined) || {}
}
