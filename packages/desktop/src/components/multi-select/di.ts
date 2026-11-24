import type { InjectionKey } from 'vue'

export const MultiSelectDIKey: InjectionKey<{
  optionClass: string
  rippleClass: string
  checkboxClass: string
}> = Symbol('MultiSelectDIKey')
