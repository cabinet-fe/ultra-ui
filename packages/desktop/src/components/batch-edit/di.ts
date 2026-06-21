import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'

import type {
  BatchEditEmits,
  BatchEditFeature,
  BatchEditProps,
  BatchEditStates,
  TableRow
} from '../../types'
import type { EditReturned } from './use-handlers'

export const BatchEditDIKey: InjectionKey<
  {
    cls: BEM<'batch-edit', 'u-'>
    props: BatchEditProps
    emit: BatchEditEmits
    state: BatchEditStates
    staticFeatures: ComputedRef<Set<BatchEditFeature>>
    dynamicFeatures: ComputedRef<
      Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
    >
    /** 组件或其子节点是否处于聚焦状态 */
    focused: ShallowRef<boolean>
  } & EditReturned
> = Symbol('BatchEditDIKey')
