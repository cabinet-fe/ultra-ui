import type { BEM } from '@veltra/utils'
import type { InjectionKey } from 'vue'

export const ContextmenuDIKey: InjectionKey<{ cls: BEM<'contextmenu'> }> =
  Symbol('ContextmenuDIKey')
