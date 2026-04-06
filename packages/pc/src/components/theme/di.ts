import type { BEM } from '@ultra-ui/core'
import type { InjectionKey } from 'vue'

export const ThemeDIKey: InjectionKey<{
  cls: BEM<'theme', 'u-'>
}> = Symbol('ThemeDIKey')
