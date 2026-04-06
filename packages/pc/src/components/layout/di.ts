import type { BEM } from '@ultra-ui/core'
import type { InjectionKey } from "vue"

interface LayoutContext {
  cls: BEM<'layout'>

}

export const LayoutDIKey: InjectionKey<LayoutContext> = Symbol('LayoutDIKey')