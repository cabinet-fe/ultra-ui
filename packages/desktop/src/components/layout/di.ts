import type { BEM } from '@veltra/utils'
import type { InjectionKey } from 'vue'

interface LayoutContext {
  cls: BEM<'layout'>
}

export const LayoutDIKey: InjectionKey<LayoutContext> = Symbol('LayoutDIKey')
