import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'

export const VirtualListDIKey: InjectionKey<{
  cls: BEM<'virtual-list'>
}> = Symbol()
