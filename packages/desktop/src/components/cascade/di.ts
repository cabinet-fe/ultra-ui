import type { BEM } from '@ultra-ui/utils'
import type { CascadeProps, ComponentSize } from '@ultra-ui/desktop/types'
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
