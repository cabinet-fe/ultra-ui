import type { BEM } from '@ultra-ui/core'
import type { InjectionKey } from "vue"


export const ContextMenuDIKey: InjectionKey<{
  cls: BEM<'context-menu'>
}> = Symbol('ContextMenuDIKey')