import { useModel } from '@ui/compositions'
import type {
  TableEmits,
  TableProps,
  TableRow
} from '@ui/types/components/table'
import { Forest, getChainValue } from 'cat-kit/fe'
import { shallowRef, watch } from 'vue'
import { TableRowNode } from './row-node'

interface Options {
  props: TableProps
  emit: TableEmits
}

export function useRows(options: Options) {
  const { props, emit } = options

  /** 所有可见的行 */
  const rows = shallowRef<TableRow[]>([])
  /** 行树 */
  const rowForest = shallowRef<Forest<TableRow>>()

  let uid = 0

  const currentRow = useModel({
    props,
    emit,
    propName: 'currentRow',
    shallow: true
  })

  watch(currentRow, (row, oldRow) => {
    if (oldRow) {
      oldRow.isCurrent = false
    }
    if (row) {
      row.isCurrent = true
    }
  })

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

  function getRows(data: Record<string, any>[]) {
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

  function getRowForest(data: Record<string, any>[]) {
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

  function getFlattedRows() {
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

  function toggleTreeRowExpand(node: TableRow) {
    node.expanded = !node.expanded
    getFlattedRows()
  }

  const allExpanded = shallowRef(props.defaultExpandAll ?? false)
  function toggleAllTreeRowExpand() {
    allExpanded.value = !allExpanded.value
    rowForest.value?.dft(node => {
      node.expanded = allExpanded.value
    })
    getFlattedRows()
  }

  const handleRowClick = (row: TableRow) => {
    emit('row-click', row)

    if (row === currentRow.value) {
      currentRow.value = undefined
    } else {
      currentRow.value = row
    }
  }

  function getRowByData(data: Record<string, any>) {
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

    /** 通过数据获取表格行 */
    getRowByData
  }
}
