import type { TableProps } from '@ui/types/components/table'
import { Forest, TreeNode } from 'cat-kit/fe'
import { shallowReactive, shallowRef, watch } from 'vue'

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

  uid = uid++

  override children?: TableRow<Data>[] = undefined

  override parent: TableRow<Data> | null = null

  constructor(data: Data, index: number) {
    super(shallowReactive(data), index)
    return shallowReactive(this)
  }
}

export function useRows(options: Options) {
  const { props } = options

  const rows = shallowRef<TableRow[]>([])

  let rowForest = shallowRef<Forest<TableRow>>()

  watch(
    [() => props.data, () => props.tree],
    ([data, tree]) => {
      if (!data?.length) {
        rows.value = []
        return
      }

      if (!tree) {
        let result: TableRow[] = []
        let i = 0
        while (i < data.length) {
          result.push(new TableRow(data[i]!, i))
          i++
        }
        rows.value = result
        result = []
        rowForest.value = undefined
        return
      }

      rowForest.value = Forest.create(data, TableRow, {
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
