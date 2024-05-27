import type { TableProps } from '@ui/types/components/table'
import { Forest, TreeNode } from 'cat-kit/fe'
import { isReactive, shallowReactive, shallowRef, watch } from 'vue'

interface Options {
  props: TableProps
}

let uid = 0

export class TableRow<
  Data extends Record<string, any> = Record<string, any>
> extends TreeNode<Data> {
  /** 索引路径 */
  get indexes(): number[] {
    if (!this.parent) return []
    return this.parent.indexes.concat(this.index)
  }

  /** 是否操作中 */
  operating = false

  /** 是否展开 */
  expanded = false

  /** 是否为当前的点击行 */
  isCurrent = false

  /** 是否选中 */
  checked = false

  uid: number | string

  override children?: TableRow<Data>[] = undefined

  override parent: TableRow<Data> | null = null

  /**
   *
   * @param data 一个普通对象或者一个响应式对象
   * @param index 索引值
   * @param rowKey 行唯一标识
   * @returns
   */
  constructor(data: Data, index: number, rowKey?: string) {
    super(isReactive(data) ? data : shallowReactive(data), index)
    this.uid = rowKey ? data[rowKey] : uid++
    return shallowReactive(this)
  }
}

export function useRows(options: Options) {
  const { props } = options

  const rows = shallowRef<TableRow[]>([])

  let rowForest = shallowRef<Forest<TableRow>>()


  // 用于优化增删改时的性能
  let rowDicts = new WeakMap<Record<string, any>, TableRow>()
  let tempRowDicts: null | WeakMap<Record<string, any>, TableRow> = null

  watch(
    [() => props.data, () => props.tree, () => props.rowKey],
    ([data, tree, rowKey]) => {
      if (!data?.length) {
        rows.value = []
        rowDicts = new WeakMap()
        return
      }

      // 新建一个零时的数据映射
      tempRowDicts = new WeakMap()

      // 单层结构
      if (!tree) {
        let result: TableRow[] = []
        let i = 0

        while (i < data.length) {
          const dataItem = data[i]!
          const existRow = rowDicts.get(dataItem)
          if (existRow) {
            existRow.index = i
            result.push(existRow)
            tempRowDicts.set(dataItem, existRow)
          } else {
            const row = new TableRow(dataItem, i, rowKey)
            result.push(row)
            tempRowDicts.set(dataItem, row)
          }
          i++
        }

        rowDicts = tempRowDicts
        tempRowDicts = null
        rows.value = result
        result = []
        rowForest.value = undefined
        return
      }

      // 树形结构
      rowForest.value = Forest.create(data, {
        createNode(val, index) {
          const existRow = rowDicts.get(val)
          if (existRow) {
            existRow.index = index
            tempRowDicts!.set(val, existRow)
            return existRow
          }
          const row = new TableRow(val, index, rowKey)
          tempRowDicts!.set(val, row)
          return row
        },
        childrenKey: typeof tree === 'string' ? tree : 'children'
      })

      rowDicts = tempRowDicts
      tempRowDicts = null

      getFlattedRows()
    },
    { immediate: true }
  )

  function getFlattedRows() {
    if (!rowForest) return
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

  return {
    /** 数据树 */
    rowForest,

    /** 数据行 */
    rows,
    /**
     * 切换节点的显示隐藏
     * @param node 节点
     */
    toggleTreeRowExpand
  }
}
