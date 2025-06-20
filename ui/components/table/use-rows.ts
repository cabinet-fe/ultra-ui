import { useModel } from '@ui/compositions'
import type { TableColumn, TableEmits, TableProps, TableRow } from '@ui/types'
import { Forest, getChainValue } from 'cat-kit/fe'
import { type ShallowRef, shallowRef, watch } from 'vue'
import { TableRowNode } from './node/row'

interface Options {
  props: TableProps
  emit: TableEmits
}

interface UseRowsReturned {
  rowForest: ShallowRef<Forest<TableRow> | undefined>
  rows: ShallowRef<TableRow[]>
  toggleTreeRowExpand: (node: TableRow) => void
  allExpanded: ShallowRef<boolean>
  toggleAllTreeRowExpand: () => void
  handleRowClick: (row: TableRow, e: MouseEvent) => void
  handleCellClick: (row: TableRow, column: TableColumn, e: MouseEvent) => void
  getRowByData: (data: Record<string, any>) => TableRow | undefined
}

export function useRows(options: Options): UseRowsReturned {
  const { props, emit } = options

  /** 所有可见的行 */
  const rows = shallowRef<TableRow[]>([])
  /** 行树 */
  const rowForest = shallowRef<Forest<TableRow>>()

  let uid = 0

  const currentRow = useModel({
    props,
    emit,
    propName: 'current',
    shallow: true,
    local: !!props.highlightCurrent
  })

  watch(
    () => currentRow.value,
    (row, oldRow) => {
      if (oldRow) {
        oldRow.isCurrent = false
      }
      if (row) {
        row.isCurrent = true
      }
    }
  )

  watch(rows, rows => emit('update:rows', rows))
  watch(rowForest, forest => emit('update:forest', forest))

  // 用于优化增删改时的性能
  // 原理：vue的组件在属性发生改变时会重新渲染，这个就是为了让数据保持一致
  let rowDicts = new WeakMap<Record<string, any>, TableRow>()
  let tempRowDicts: null | WeakMap<Record<string, any>, TableRow> = null

  const getRowUID = props.rowKey
    ? (rowData: Record<string, any>) =>
        rowData && getChainValue(rowData, props.rowKey!)
    : () => uid++

  const createRow = (data: Record<string, any>, index: number) => {
    const existRow = data ? rowDicts.get(data) : undefined
    if (existRow) {
      existRow.index = index
      return existRow
    } else {
      return new TableRowNode({
        data,
        index,
        uid: getRowUID(data)
      })
    }
  }

  function getRows(data: Record<string, any>[]): TableRow[] {
    let result: TableRow[] = []
    let i = 0
    tempRowDicts = new WeakMap()

    while (i < data.length) {
      const dataItem = data[i]!
      const row = createRow(dataItem, i)
      result.push(row)
      tempRowDicts.set(dataItem, row)
      i++
    }

    rowDicts = tempRowDicts
    tempRowDicts = null
    return result
  }

  function getRowForest(data: Record<string, any>[]): Forest<TableRow> {
    tempRowDicts = new WeakMap()
    const ret = Forest.create(data, {
      createNode(val, index) {
        const row = createRow(val, index)
        if (props.defaultExpandAll) {
          row.expanded = true
        }
        val && tempRowDicts!.set(val, row)
        return row
      },
      childrenKey: typeof props.tree === 'string' ? props.tree : 'children'
    })

    rowDicts = tempRowDicts
    tempRowDicts = null

    return ret
  }

  watch(
    [() => props.data, () => props.tree, () => props.defaultExpandAll],
    ([data, tree]) => {
      if (!data?.length) {
        rows.value = []
        rowDicts = new WeakMap()
        rowForest.value = undefined
        return
      }

      if (!tree) {
        rowForest.value = undefined
        rows.value = getRows(data)
      } else {
        rowForest.value = getRowForest(data)
        getFlattedRows()
      }
    },
    { immediate: true }
  )

  function getFlattedRows(): void {
    if (!rowForest.value) return
    const result: TableRow[] = []

    rowForest.value?.dft(node => {
      if (node.parent?.expanded || node.depth === 1) {
        result.push(node)
        return true
      }
      return false
    })

    rows.value = result
  }

  function toggleTreeRowExpand(node: TableRow): void {
    node.expanded = !node.expanded
    getFlattedRows()
  }

  const allExpanded = shallowRef(props.defaultExpandAll ?? false)
  function toggleAllTreeRowExpand(): void {
    allExpanded.value = !allExpanded.value
    rowForest.value?.dft(node => {
      node.expanded = allExpanded.value
    })
    getFlattedRows()
  }

  function handleRowClick(row: TableRow, e: MouseEvent): void {
    if (row === currentRow.value) {
      currentRow.value = undefined
    } else {
      currentRow.value = row
    }

    emit('row-click', row, e)
  }

  function handleCellClick(
    row: TableRow,
    column: TableColumn,
    e: MouseEvent
  ): void {
    emit('cell-click', row, column, e)
  }

  function getRowByData(data: Record<string, any>): TableRow | undefined {
    return rowDicts.get(data)
  }

  return {
    /** 数据树 */
    rowForest,

    /** 数据行 */
    rows,
    /**
     * 切换节点的显示隐藏
     * @param node 节点
     */
    toggleTreeRowExpand,

    /** 所有树形节点是否展开 */
    allExpanded,
    /** 切换所有树形节点的显示隐藏 */
    toggleAllTreeRowExpand,

    /** 行点击 */
    handleRowClick,

    /** 单元格点击 */
    handleCellClick,

    /** 通过数据获取表格行 */
    getRowByData
  }
}
