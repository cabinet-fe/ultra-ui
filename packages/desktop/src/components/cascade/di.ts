import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'

import type { CascadeProps, ComponentSize } from '../../types'

export const CascadeDIKey: InjectionKey<{
  /** 样式*/
  cls: BEM<'cascade'>
  size: ComputedRef<ComponentSize>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  cascadeProps: CascadeProps
  checkedSet: ShallowRef<Set<Record<string, any>>>
}> = Symbol('CascadeDIKey')
