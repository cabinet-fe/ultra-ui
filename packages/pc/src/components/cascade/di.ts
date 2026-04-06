import type { BEM, ComponentSize } from '@ultra-ui/core'
import type { CascadeProps } from '@ultra-ui/pc/types'
import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'

export const CascadeDIKey: InjectionKey<{
  /** 样式*/
  cls: BEM<'cascade'>
  size: ComputedRef<ComponentSize>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  cascadeProps: CascadeProps
  checkedSet: ShallowRef<Set<Record<string, any>>>
}> = Symbol('CascadeDIKey')
