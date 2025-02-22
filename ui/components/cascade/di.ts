import type { BEM } from '@ui/utils'
import type { CascadeProps, ComponentSize } from '@ui/types'
import type { ComputedRef, InjectionKey } from 'vue'

export const CascadeDIKey: InjectionKey<{
  /** 样式*/
  cls: BEM<'cascade'>
  size: ComputedRef<ComponentSize>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  cascadeProps: CascadeProps
}> = Symbol('CascadeDIKey')
