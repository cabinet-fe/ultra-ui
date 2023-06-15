import { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'

/** 滚动条依赖注入 */
export const ScrollDIKey: InjectionKey<{
  cls: BEM<'scroll'>
}> = Symbol()
