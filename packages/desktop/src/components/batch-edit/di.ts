import type {
  BatchEditEmits,
  BatchEditFeature,
  BatchEditProps,
  TableExposed,
  TableRow
} from '@ultra-ui/desktop/types'
import type { BEM } from '@ultra-ui/utils'
import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'
import type { EditReturned } from './use-edit'
import type { FormModel } from '../form'
export const BatchEditDIKey: InjectionKey<
  {
    cls: BEM<'batch-edit', 'u-'>
    props: BatchEditProps<FormModel>
    emit: BatchEditEmits
    tableRef: ShallowRef<TableExposed | undefined>
    staticFeatures: ComputedRef<Set<BatchEditFeature>>
    dynamicFeatures: ComputedRef<
      Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
    >
  } & EditReturned
> = Symbol('BatchEditDIKey')
