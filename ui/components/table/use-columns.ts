import type {
  TableColumn,
  TableColumnAlign,
  TableProps
} from '@ui/types/components/table'
import { Forest, Tree, TreeNode, debounce, last } from 'cat-kit/fe'
import {
  computed,
  reactive,
  shallowReactive,
  shallowRef,
  watch,
  type ComputedRef,
  type ShallowRef
} from 'vue'

/**
 * 定义表格列
 * @param columns 表格列
 */
export function defineTableColumns(
  columns: TableColumn[],
  commonProps?: Partial<Pick<TableColumn, 'align' | 'minWidth'>>
) {
  columns.forEach(col => {
    Tree.dft(col, node => {
      for (const key in commonProps) {
        if (node[key] !== undefined) continue
        node[key] = commonProps[key]
      }

      // 当列没有定义任何宽度时给叶子节点一个最小宽度
      if (
        !node.children &&
        node.width === undefined &&
        node.minWidth === undefined
      ) {
        node.minWidth = 100
      }
    })
  })
  return columns
}

export class ColumnNode extends TreeNode<TableColumn> {
  children?: ColumnNode[] | undefined
  parent: ColumnNode | null = null
  /** 叶子节点数量 */
  leafs?: number

  get keySuffix(): string {
    if (!this.parent) return ''
    if (this.depth === 1) return `${this.index}`
    return this.parent.keySuffix + `-${this.index}`
  }

  /** 列key */
  get key(): string {
    return this.data.key
  }
  set key(val) {
    this.data.key = val
  }
  /** 列名 */
  get name(): string {
    return this.data.name
  }
  set name(val) {
    this.data.name = val
  }

  /**
   * 列对齐方式
   * @default 'left'
   */
  get align(): TableColumnAlign {
    return this.data.align ?? 'left'
  }
  set align(val) {
    this.data.align = val
  }

  /** 宽度 */
  get width(): number | undefined {
    return this.data.width
  }
  set width(val) {
    this.data.width = val
  }
  /** 最小宽度 */
  get minWidth(): number | undefined {
    return this.data.minWidth
  }
  set minWidth(val) {
    this.data.minWidth = val
  }

  /** 列固定方向 */
  get fixed(): 'left' | 'right' | undefined {
    if (this.depth > 1) return
    return this.data.fixed
  }
  set fixed(val) {
    this.data.fixed = val
  }

  /** 是否是左侧的最后一个固定列 */
  get isLastFixed(): boolean {
    return this.data.isLastFixed ?? false
  }

  /** 是否是右侧的第一个固定列 */
  get isFirstFixed(): boolean {
    return this.data.isFirstFixed ?? false
  }

  style: Record<string, number> = reactive({})

  constructor(val: TableColumn, index: number) {
    super(val ? shallowReactive(val) : val, index)
  }
}

export interface ColumnConfig {
  /** 表头 */
  headers: ComputedRef<ColumnNode[][]>

  /**
   *  body列, 在body中使用
   */
  columns: ShallowRef<ColumnNode[]>

  /** 所有列 */
  allColumns: ShallowRef<ColumnNode[]>

  /** 第一列 */
  expandColumn: ShallowRef<ColumnNode | undefined>

  /**
   * 更新列的样式
   * @description 在尺寸变更时重新计算固定列的宽度和偏移量
   */
  updateStylesOfColumns: () => void
}

interface Options {
  props: TableProps
  colgroupRef: ShallowRef<HTMLElement | undefined>
  /** 创建复选框 */
  createCheckColumn: () => TableColumn
  createSelectColumn: () => TableColumn
}

export function useColumns(options: Options): ColumnConfig {
  const { props, createCheckColumn, createSelectColumn, colgroupRef } = options

  const preColumns = computed<TableColumn[]>(() => {
    const { selectable, checkable, showIndex } = props
    
    const columns: TableColumn[] = []

    if (selectable) {
      columns.push(createSelectColumn())
    } else if (checkable) {
      columns.push(createCheckColumn())
    }
    if (showIndex) {
      columns.push({
        key: '__index__',
        name: '#',
        width: 60,
        align: 'center',
        fixed: 'left',
        render({ row }) {
          return row.index + 1
        }
      })
    }

    return columns
  })

  const columnForest = shallowRef<Forest<ColumnNode>>()

  watch(
    [preColumns, () => props.columns, () => props.tree],
    ([preColumns, columns, tree]) => {
      /** 固定到左侧的列 */
      const fixedOnLeft: TableColumn[] = [...preColumns]

      /** 未固定的列 */
      const unfixed: TableColumn[] = []
      /** 固定到右侧的列 */
      const fixedOnRight: TableColumn[] = []

      columns?.forEach(column => {
        if (!column.fixed || column.children) {
          column.fixed = undefined
          return unfixed.push(column)
        }
        if (column.fixed === 'left') {
          fixedOnLeft.push(column)
        } else {
          fixedOnRight.push(column)
        }
      })

      if (last(fixedOnLeft)) {
        last(fixedOnLeft)!.isLastFixed = true
      }
      if (fixedOnRight[0]) {
        fixedOnRight[0].isFirstFixed = true
      }

      const sortedColumns = [...fixedOnLeft, ...unfixed, ...fixedOnRight]

      const firstColumns = sortedColumns[0]

      if (!!tree && firstColumns) {
        firstColumns.align = 'left'
        firstColumns.minWidth = firstColumns.width
          ? firstColumns.width + 20
          : undefined
        firstColumns.width = undefined
      }

      const result = Forest.create(sortedColumns, {
        createNode(data, index) {
          return new ColumnNode(data, index)
        }
      })

      // 计算定位位置
      let leftAcc = 0
      fixedOnLeft.some((_, i) => {
        const colNode = result.nodes[i]!
        colNode.style.left = leftAcc
        if (colNode.width === undefined || colNode.width <= 0) {
          return false
        }
        leftAcc += colNode.width
      })

      let rightAcc = 0
      fixedOnRight.some((_, i) => {
        const colNode = result.nodes[result.nodes.length - 1 - i]!
        colNode.style.right = rightAcc
        if (colNode.width === undefined || colNode.width <= 0) {
          return false
        }
        rightAcc += colNode.width
      })

      columnForest.value = result
    },
    { immediate: true }
  )

  const headers = computed(() => {
    const headers: ColumnNode[][] = []
    let currentLayer: ColumnNode[] = []
    let layerDepth = -1
    columnForest.value?.bft(node => {
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

  const columns = shallowRef<ColumnNode[]>([])
  const allColumns = shallowRef<ColumnNode[]>([])

  const expandColumn = shallowRef<ColumnNode>()

  watch(
    [columnForest, () => props.tree],
    ([forest]) => {
      const _columns: ColumnNode[] = []

      forest?.dft(node => {
        if (node.isLeaf) {
          _columns.push(node)
        }
      })

      allColumns.value = _columns

      if (props.tree) {
        expandColumn.value = _columns[0]
        columns.value = _columns.slice(1)
      } else {
        columns.value = _columns
        expandColumn.value = undefined
      }
    },
    { immediate: true }
  )

  /**
   * 更新列的样式
   * @description 在尺寸变更时重新计算固定列的宽度和偏移量
   */
  const updateStylesOfColumns = debounce(
    () => {
      const colgroup = colgroupRef.value

      if (!colgroup) return

      const fixedOnLeft = Array.from(
        colgroup.getElementsByClassName('left')
      ) as HTMLElement[]

      const fixedOnRight = Array.from(
        colgroup.getElementsByClassName('right')
      ) as HTMLElement[]
      fixedOnLeft.reduce((acc, col, colIndex) => {
        const colNode = allColumns.value[colIndex]!
        if (!colNode.width) {
          colNode.width = col.offsetWidth
        }

        colNode.style.left = acc
        return acc + col.offsetWidth
      }, 0)

      const rightColumns = allColumns.value.slice(-fixedOnRight.length)

      fixedOnRight.reduceRight((acc, col, colIndex) => {
        const colNode = rightColumns[colIndex]!

        if (!colNode.width) {
          colNode.width = col.offsetWidth
        }
        colNode.style.right = acc
        return acc + col.offsetWidth
      }, 0)
    },
    100,
    true
  )

  return {
    /** 第一列 */
    expandColumn,

    /** 所有列 */
    allColumns,

    /** 列 */
    columns,

    /** 表格头的分层展示 */
    headers,

    updateStylesOfColumns
  }
}
