import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey } from 'vue'

import type { CollapseProps } from '../../types'

export interface CollapseContext {
  cls: BEM
  collapseProps: CollapseProps
  activeValues: ComputedRef<(string | number)[]>
  handleItemClick: (value: string | number) => void
}

export const CollapseDIKey: InjectionKey<CollapseContext> = Symbol('Collapse')
