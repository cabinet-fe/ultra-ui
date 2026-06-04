import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'

import type {
  BatchEditEmits,
  BatchEditFeature,
  BatchEditProps,
  IFormModel,
  TableExposed,
  TableRow
} from '../../types'
import type { EditReturned } from './use-edit'
export const BatchEditDIKey: InjectionKey<
  {
    cls: BEM<'batch-edit', 'u-'>
    props: BatchEditProps<IFormModel>
    emit: BatchEditEmits
    tableRef: ShallowRef<TableExposed | undefined>
    staticFeatures: ComputedRef<Set<BatchEditFeature>>
    dynamicFeatures: ComputedRef<
      Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
    >
  } & EditReturned
> = Symbol('BatchEditDIKey')
