import type { TableColumn, TableProps } from '@ui/types/components/table'
import { computed, type ComputedRef } from 'vue'

interface Options {
  props: TableProps
}

export interface StructColumns {
   /** 固定到左侧的列 */
   fixedOnLeft: ComputedRef<TableColumn[]>,
   /** 未固定的列 */
   unfixed: ComputedRef<TableColumn[]>,
   /** 固定到右侧的列 */
   fixedOnRight: ComputedRef<TableColumn[]>
}

export function useColumns(options: Options): StructColumns {
  const { props } = options

  const preColumns = computed<TableColumn[]>(() => {
    const { selectable, checkable } = props
    const columns: TableColumn[] = []
    if (selectable) {
      columns.push({
        key: '$_column_select',
        name: ''
      })
    } else if (checkable) {
      columns.push({
        key: '$_column_check',
        name: ''
      })
    }
    return columns
  })

  /** 固定到左侧的列 */
  const fixedOnLeft = computed<TableColumn[]>(() => {
    const fixedOnLeft = props.columns?.filter(
      column => column.fixed === 'left'
    )
    if (!fixedOnLeft) return preColumns.value
    return [...preColumns.value, ...fixedOnLeft]
  })

  /** 未固定的列 */
  const unfixed = computed<TableColumn[]>(() => {
    return props.columns?.filter(column => !column.fixed) ?? []
  })

  /** 固定到右侧的列 */
  const fixedOnRight = computed<TableColumn[]>(() => {
    const fixedOnRight = props.columns?.filter(
      column => column.fixed === 'right'
    )
    return fixedOnRight ?? []
  })

  return {
    /** 固定到左侧的列 */
    fixedOnLeft,
    /** 未固定的列 */
    unfixed,
    /** 固定到右侧的列 */
    fixedOnRight
  }
}