import type { BEM } from '@ui/utils'
import type { ComputedRef, InjectionKey, ModelRef, ShallowRef } from 'vue'
import type { Row, RowFormColumn, RowFormEmits, RowFormProps } from '@ui/types/components/row-form'

/** 表格编辑器的依赖注入类型 */
export const RowFormStoreType: InjectionKey<{
  /** 表头 */
  columns: ComputedRef<RowFormColumn[]>
  /** 双向绑定的值 */
  rows: ShallowRef<Row<Record<string, any>>[]>,
  props?: Record<string, any>,
  rowFormSlots?: Record<string, any>,
  cls: BEM<'row-form'>
}> = Symbol('RowFormStoreType')
