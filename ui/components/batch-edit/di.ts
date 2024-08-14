import type { BatchEditProps, TableExposed } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { InjectionKey, ShallowRef } from 'vue'
import type { EditReturned } from './use-edit'
import type { FormModel } from '../form'
export const BatchEditDIKey: InjectionKey<
  {
    cls: BEM<'batch-edit', 'u-'>
    props: BatchEditProps<FormModel>
    tableRef: ShallowRef<TableExposed | undefined>
  } & EditReturned
> = Symbol('BatchEditDIKey')
