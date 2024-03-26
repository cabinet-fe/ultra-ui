import type { TableColumn, TableProps } from '@ui/types/components/table'
import { Forest, TreeNode } from 'cat-kit/fe'
import { computed, type ComputedRef } from 'vue'

interface Options {
  props: TableProps
}

export interface StructColumns {
  /** 固定到左侧的列 */
  fixedOnLeft: ComputedRef<TableColumn[]>
  /** 未固定的列 */
  unfixed: ComputedRef<TableColumn[]>
  /** 固定到右侧的列 */
  fixedOnRight: ComputedRef<TableColumn[]>

  headers: ComputedRef<ColumnNode<TableColumn>[][]>
}

/**
 * 定义表格列
 * @param columns 表格列
 */
export function defineTableColumns(columns: TableColumn[]) {
  return columns
}

class ColumnNode<Val extends Record<string, any>> extends TreeNode<Val> {
  children?: ColumnNode<Val>[] | undefined

  parent: ColumnNode<Val> | null = null

  override createNode<Val extends Record<string, any>>(
    val: Val,
    index: number
  ): ColumnNode<Val> {
    return new ColumnNode(val, index)
  }
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
    const fixedOnLeft = props.columns?.filter(column => column.fixed === 'left')
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

  const columnTree = computed(() => {
    return Forest.create(
      [...fixedOnLeft.value, ...unfixed.value, ...fixedOnRight.value],
      ColumnNode
    )
  })

  const headers = computed(() => {
    const headers: ColumnNode<TableColumn>[][] = []
    let currentLayer: ColumnNode<TableColumn>[] = []
    let layerDepth = -1
    columnTree.value.bft(node => {
      if (layerDepth !== node.depth) {
        if (currentLayer.length) {
          headers.push(currentLayer)
        }
        layerDepth = node.depth
        currentLayer = [node]
      } else {
        currentLayer.push(node)
      }
    })
    currentLayer.length && headers.push(currentLayer)
    currentLayer = []

    return headers
  })

  return {
    /** 固定到左侧的列 */
    fixedOnLeft,
    /** 未固定的列 */
    unfixed,
    /** 固定到右侧的列 */
    fixedOnRight,

    /** 表格头的分层展示 */
    headers
  }
}
