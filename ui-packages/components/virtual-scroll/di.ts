import { BEM } from '@ui/utils'
import { InjectionKey } from 'vue'

export const VirtualScrollDIKey: InjectionKey<{
  cls: BEM<'virtual-scroll'>
}> = Symbol()
