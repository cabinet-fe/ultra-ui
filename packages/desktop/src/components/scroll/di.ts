import type { BEM } from '@veltra/utils'
import type { InjectionKey } from 'vue'

export const ScrollDIKey: InjectionKey<{ cls: BEM<'scroll'> }> = Symbol()
