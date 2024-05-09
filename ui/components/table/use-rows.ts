import type { TableProps } from '@ui/types/components/table'
import { Forest, TreeNode } from 'cat-kit/fe'
import { computed, shallowReactive } from 'vue'

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

  expanded = true

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

  const rows = computed(() => {
    const { data } = props
    if (!data) return []
    const result = Forest.create(data, TableRow)

    return result.nodes!
  })

  return rows
}
