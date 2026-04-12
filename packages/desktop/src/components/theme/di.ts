import type { BEM } from '@veltra/utils'
import type { InjectionKey } from 'vue'

export const ThemeDIKey: InjectionKey<{ cls: BEM<'theme', 'u-'> }> = Symbol('ThemeDIKey')
