import type { BEM } from '@ui/utils'
import type { InjectionKey, ShallowRef } from 'vue'
import type {
  Row,
  RowFormColumn,
  RowFormEmits
} from '@ui/types/components/row-form'

/** 表格编辑器的依赖注入类型 */
export const RowFormInjectType: InjectionKey<{

}> = Symbol('RowFormStoreType')
