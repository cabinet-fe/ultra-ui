import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'

export const VirtualScrollDIKey: InjectionKey<{
  cls: BEM<'virtual-scroll'>
}> = Symbol()
