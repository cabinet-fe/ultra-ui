import type { BEM } from "@ultra-ui/utils"
import type { InjectionKey } from "vue"


export const ContextMenuDIKey: InjectionKey<{
  cls: BEM<'context-menu'>
}> = Symbol('ContextMenuDIKey')