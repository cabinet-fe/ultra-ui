import { BEM } from '@ui/utils'
import { InjectionKey } from 'vue'

export const VirtualListDIKey: InjectionKey<{
  cls: BEM<'virtual-list'>
}> = Symbol()
