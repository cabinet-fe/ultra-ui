import { Forest, o } from '@cat-kit/core'
import { useModel } from '@ultra-ui/compositions'
import { shallowRef, watch, type ShallowRef } from 'vue'

import type { TableColumn, TableEmits, TableProps, TableRow } from '../../types'
import { TableRowNode } from './node/row'

interface Options {
  props: TableProps
  emit: TableEmits
}

interface UseRowsReturned {
  /** 所有的行森林（树形数据） */
  rowForest: ShallowRef<Forest<Record<string, unknown>, any> | undefined>
  /** 当前可见的展平行列表 */
  rows: ShallowRef<TableRowNode[]>
  /** 切换树形行节点的展开/折叠 */
  toggleTreeRowExpand: (node: TableRow) => void
  /** 是否全部展开 */
  allExpanded: ShallowRef<boolean>
  /** 切换全部展开/折叠 */
  toggleAllTreeRowExpand: () => void
  /** 行点击处理 */
  handleRowClick: (row: TableRow, e: MouseEvent) => void
  /** 单元格点击处理 */
  handleCellClick: (row: TableRow, column: TableColumn, e: MouseEvent) => void
  /** 根据原始数据对象获取对应的 TableRow */
  getRowByData: (data: Record<string, any>) => TableRow | undefined
}

export function useRows(options: Options): UseRowsReturned {
  const { props, emit } = options

  // --- 状态定义 ---

  /** 所有可见的行 */
  const rows = shallowRef<TableRowNode[]>([])
  /** 数据行， 不包括展开和折叠的行 */
  const dataRows = shallowRef<TableRowNode[]>([])
  /** 行森林（数据结构树） */
  const rowForest = shallowRef<Forest<Record<string, unknown>, any>>()
  /** 树形节点是否全部展开 */
  const allExpanded = shallowRef(props.defaultExpandAll ?? false)

  /** 当前高亮的行 */
  const currentRow = useModel({
    props,
    emit,
    propName: 'current',
    shallow: true,
    local: () => !!props.highlightCurrent
  })

  // --- 行字典维护 (性能优化) ---

  /**
   * 用于优化增删改时的性能。
   * 原理：Vue 的组件在属性发生改变时会重新渲染，通过 WeakMap 缓存 data -> TableRow 的映射，
   * 可以在数据更新时复用已有的 TableRowNode 实例，避免重复创建和 DOM 抖动。
   */
  let rowDicts = new WeakMap<Record<string, any>, TableRowNode>()
  let tempRowDicts: null | WeakMap<Record<string, any>, TableRowNode> = null
  let uidSeed = 0

  /** 获取行唯一标识 */
  const getRowUID = props.rowKey
    ? (rowData: Record<string, any>) => rowData && o(rowData).get(props.rowKey!)
    : () => uidSeed++

  /** 创建或复用 TableRow 实例 */
  const createRow = (
    data: Record<string, any>,
    index: number,
    depth = 0,
    parent?: TableRowNode
  ) => {
    const existRow = data ? rowDicts.get(data) : undefined
    if (existRow) {
      existRow.index = index
      existRow.depth = depth
      existRow.parent = parent
      return existRow
    }
    return new TableRowNode({ data, index, depth, parent, uid: getRowUID(data) })
  }

  // --- 行处理逻辑 ---

  /** 处理常规扁平列表 */
  function getDataRows(data: Record<string, any>[]): TableRowNode[] {
    let i = data.length
    const result = Array.from({ length: i }) as TableRowNode[]
    tempRowDicts = new WeakMap()

    while (i--) {
      const dataItem = data[i]!
      const row = createRow(dataItem, i)
      result[i] = row
      tempRowDicts.set(dataItem, row)
    }

    rowDicts = tempRowDicts
    tempRowDicts = null
    return result
  }

  function expandDataRows(): void {
    const result: TableRowNode[] = []
    let i = -1
    while (++i < dataRows.value.length) {
      const row = dataRows.value[i]!
      result.push(row)
      if (row.expanded) {
        result.push(row.copy())
      }
    }
    rows.value = result
  }

  /** 处理树形森林结构 */
  function getRowForest(data: Record<string, any>[]): Forest<Record<string, unknown>, any> {
    tempRowDicts = new WeakMap()
    const childrenKey = typeof props.tree === 'string' ? props.tree : 'children'
    const ret = new Forest<Record<string, unknown>, any>({
      data,
      childrenKey,
      createNode(val, index, depth, _forest, parent) {
        const row = createRow(val, index, depth, parent)
        if (props.defaultExpandAll) {
          row.expanded = true
        }
        val && tempRowDicts!.set(val, row)
        return row
      }
    })

    rowDicts = tempRowDicts
    tempRowDicts = null
    return ret
  }

  /** 展平树形结构为可见行列表 */
  function updateFlattedRows(): void {
    if (!rowForest.value) return
    rows.value = rowForest.value.flattenVisible((n) => n.expanded)
  }

  // --- 副作用监听 ---

  // 监听当前行切换，维护 isCurrent 状态
  watch(
    () => currentRow.value,
    (row, oldRow) => {
      if (oldRow) oldRow.isCurrent = false
      if (row) row.isCurrent = true
    }
  )

  // 同步状态给外部
  watch(rows, (rows) => emit('update:rows', rows))
  watch(rowForest, (forest) => emit('update:forest', forest))

  // 核心：监听原始数据变化，重新构建行列表或树
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
        dataRows.value = getDataRows(data)
        rows.value = dataRows.value
      } else {
        dataRows.value = []
        rowForest.value = getRowForest(data)
        updateFlattedRows()
      }
    },
    { immediate: true }
  )

  // --- 交互方法 ---

  function toggleTreeRowExpand(node: TableRow): void {
    node.expanded = !node.expanded

    if (props.tree) {
      return updateFlattedRows()
    }
    if (props.expandable) {
      expandDataRows()
    }
  }

  function toggleAllTreeRowExpand(): void {
    allExpanded.value = !allExpanded.value
    if (props.tree) {
      rowForest.value?.dfs((node) => {
        node.expanded = allExpanded.value
      })
      updateFlattedRows()
      return
    }
    if (props.expandable) {
      dataRows.value.forEach((row) => {
        row.expanded = allExpanded.value
      })
      expandDataRows()
      return
    }
  }

  function handleRowClick(row: TableRow, e: MouseEvent): void {
    currentRow.value = currentRow.value === row ? undefined : row
    emit('row-click', row, e)
  }

  function handleCellClick(row: TableRow, column: TableColumn, e: MouseEvent): void {
    emit('cell-click', row, column, e)
  }

  function getRowByData(data: Record<string, any>): TableRow | undefined {
    return rowDicts.get(data)
  }

  return {
    rowForest,
    rows,
    allExpanded,
    toggleTreeRowExpand,
    toggleAllTreeRowExpand,
    handleRowClick,
    handleCellClick,
    getRowByData
  }
}
