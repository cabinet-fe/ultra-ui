import { type InjectionKey, inject, provide } from 'vue'

type DIContext = {
  inForm: boolean
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

export function useFormComponent(isForm: true): void
export function useFormComponent(isForm: false): DIContext
export function useFormComponent(isForm: boolean) {
  if (isForm) {
    return provide(FormComponentDIKey, {
      inForm: true
    })
  }

  return inject(FormComponentDIKey, undefined) || {}
}
