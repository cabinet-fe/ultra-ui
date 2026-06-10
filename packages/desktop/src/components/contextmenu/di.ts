import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey } from 'vue'

export const ContextmenuRootDIKey: InjectionKey<{
  cls: BEM<'contextmenu'>
  onItemClickStart: () => void
  onItemClickEnd: () => void
}> = Symbol('ContextmenuRootDIKey')

export const ContextmenuPanelDIKey: InjectionKey<{
  showIconColumn: ComputedRef<boolean>
  showArrowColumn: ComputedRef<boolean>
}> = Symbol('ContextmenuPanelDIKey')
