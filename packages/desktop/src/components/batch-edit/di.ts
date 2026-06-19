import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey, ShallowRef, Ref } from 'vue'

import type {
  BatchEditEmits,
  BatchEditFeature,
  BatchEditProps,
  TableExposed,
  TableRow
} from '../../types'
import type { EditReturned } from './use-edit'
export const BatchEditDIKey: InjectionKey<
  {
    cls: BEM<'batch-edit', 'u-'>
    props: BatchEditProps
    emit: BatchEditEmits
    tableRef: ShallowRef<TableExposed | undefined>
    staticFeatures: ComputedRef<Set<BatchEditFeature>>
    dynamicFeatures: ComputedRef<
      Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
    >
    /** 组件或其子节点是否处于聚焦状态 */
    focused: Ref<boolean>
  } & EditReturned
> = Symbol('BatchEditDIKey')
