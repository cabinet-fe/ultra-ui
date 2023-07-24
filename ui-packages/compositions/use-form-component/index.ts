import { type InjectionKey, inject, provide } from 'vue'

type DIContent = {
  inForm: boolean
}

const FormComponentDIKey: InjectionKey<DIContent> = Symbol('FormComponentDIKey')

export function useFormComponent(isForm: true): void
export function useFormComponent(isForm: false): DIContent
export function useFormComponent(isForm: boolean) {
  if (isForm) {
    return provide(FormComponentDIKey, {
      inForm: true
    })
  }

  return inject(FormComponentDIKey, undefined) || {}
}
