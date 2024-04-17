import type { InjectionKey } from 'vue'

export const MultiSelectDIKey: InjectionKey<{
  /** 选项类 */
  optionClass: string
  /** 波纹类 */
  rippleClass: string
}> = Symbol('MultiSelectDIKey')
