import type { BEM } from '@ultra-ui/utils'
import type { InjectionKey } from 'vue'

export const ThemeDIKey: InjectionKey<{
  cls: BEM<'theme', 'u-'>
}> = Symbol('ThemeDIKey')
