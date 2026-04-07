import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'

export const ThemeDIKey: InjectionKey<{
  cls: BEM<'theme', 'u-'>
}> = Symbol('ThemeDIKey')
