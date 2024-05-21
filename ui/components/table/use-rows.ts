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
  get indexes(): number[] {
    let ret: number[] = []
    let node: TableRow | null = this
    while (node) {
      ret.unshift(node.index)
      node = this.parent
    }
    return ret
  }

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

  watch(
    [() => props.data, () => props.tree, () => props.rowKey],
    ([data, tree, rowKey]) => {
      if (!data?.length) {
        rows.value = []
        return
      }

      if (!tree) {
        let result: TableRow[] = []
        let i = 0
        while (i < data.length) {
          result.push(new TableRow(data[i]!, i, rowKey))
          i++
        }
        rows.value = result
        result = []
        rowForest.value = undefined
        return
      }

      rowForest.value = Forest.create(data, {
        createNode(val, index) {
          return new TableRow(val, index, rowKey)
        },
        childrenKey: typeof tree === 'string' ? tree : 'children'
      })

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
