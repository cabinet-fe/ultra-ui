import type { BEM } from '@veltra/utils'
import type { InjectionKey } from 'vue'

export const ContextMenuDIKey: InjectionKey<{ cls: BEM<'context-menu'> }> =
  Symbol('ContextMenuDIKey')
