import type { BEM } from '@ultra-ui/core'
import type { InjectionKey } from 'vue'

/** 滚动条依赖注入 */
export const ScrollDIKey: InjectionKey<{
  cls: BEM<'scroll'>
}> = Symbol()
