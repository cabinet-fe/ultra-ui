import type { TableColumn, TableColumnAlign, TableProps } from '@ui/types/components/table'
import { Forest, TreeNode } from 'cat-kit/fe'
import { computed, type ComputedRef } from 'vue'

interface Options {
  props: TableProps
}

/**
 * 定义表格列
 * @param columns 表格列
 */
export function defineTableColumns(columns: TableColumn[]) {
  return columns
}

export class ColumnNode extends TreeNode<TableColumn> {
  children?: ColumnNode[] | undefined

  parent: ColumnNode | null = null

  /** 叶子节点数量 */
  leafs?: number

  /** 列key */
  key: string

  /** 列名 */
  name: string

  /** 列对齐方式 */
  align: TableColumnAlign = 'left'

  constructor(val: TableColumn, index: number) {
    super(val, index)

    this.key = val.key
    this.name = val.name
    if (val.align) {
      this.align = val.align
    }
  }

  override createNode(val: TableColumn, index: number): ColumnNode {
    return new ColumnNode(val, index)
  }
}

export interface ColumnConfig {
  /** 表头 */
  headers: ComputedRef<ColumnNode[][]>

  /** 列 */
  columns: ComputedRef<ColumnNode[]>
}

export function useColumns(options: Options): ColumnConfig {
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

  const forest = computed(() => {
    const result = Forest.create(
      [...fixedOnLeft.value, ...unfixed.value, ...fixedOnRight.value],
      ColumnNode
    )

    return result
  })

  const headers = computed(() => {
    const headers: ColumnNode[][] = []
    let currentLayer: ColumnNode[] = []
    let layerDepth = -1
    forest.value.bft(node => {
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

    // 从叶子节点开始回溯计算每个节点的累计叶子节点数量，叶子节点数量代表表头的宽度
    for (let i = headers.length - 1; i > 0; i--) {
      const header = headers[i]!

      header.forEach(node => {
        const parent = node.parent!
        if (parent.leafs !== undefined) return
        parent.leafs = parent.children!.reduce((sum, node) => {
          return sum + (node.leafs ?? 1)
        }, 0)
      })
    }

    return headers
  })

  const columns = computed(() => {
    const columns: ColumnNode[] = []
    forest.value.dft(node => {
      if (node.isLeaf) {
        columns.push(node)
      }
    })
    return columns
  })

  return {
    /** 列 */
    columns,

    /** 表格头的分层展示 */
    headers
  }
}
