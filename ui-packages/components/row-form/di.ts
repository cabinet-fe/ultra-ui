import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'
import type { RowFormColumn, RowFormProps } from '@ui/types/components/row-form'

/** 表格编辑器的依赖注入类型 */
export const RowFormStoreType: InjectionKey<{
  /** 表头 */
  columns: RowFormColumn[]
  /** 双向绑定的值 */
  modelData: Record<string, any>[]
  props: RowFormProps<Record<string, any>>
  cls: BEM<'row-form'>
}> = Symbol('RowFormStoreType')
