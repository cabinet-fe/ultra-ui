import type { BEM } from '@ui/utils'
import type { InjectionKey, ShallowRef } from 'vue'
import type {
  Row,
  RowFormColumn,
  RowFormEmits
} from '@ui/types/components/row-form'

/** 表格编辑器的依赖注入类型 */
export const RowFormInjectType: InjectionKey<{
  /** 表头 */
  columns: ShallowRef<RowFormColumn[]>
  /** 双向绑定的值 */
  rows: ShallowRef<Row<Record<string, any>>[]>
  props?: Record<string, any>
  emits: RowFormEmits<Record<string, any>>,
  rowFormSlots?: Record<string, any>
  cls: BEM<'row-form'>
}> = Symbol('RowFormStoreType')
