import type { TableProps } from '@ui/types/components/table'
import { Tree, TreeNode } from 'cat-kit'
import { computed, shallowReactive } from 'vue'

interface Options {
  props: TableProps
}

let uid = 0

export class TableRow<
  Data extends Record<string, any> = Record<string, any>
> extends TreeNode<Data> {
  indexes: number[]

  expanded = true

  uid = uid++

  override children?: TableRow<Data>[] = undefined

  override parent: TableRow<Data> | null = null

  constructor(data: Data, index: number, parent?: TableRow<Data>) {
    super(data, index)

    if (parent) {
      this.parent = parent
      this.indexes = parent.indexes.concat(index)
    } else {
      this.indexes = [index]
    }
  }
}

export function useRows(options: Options) {
  const { props } = options

  const rows = computed(() => {
    const { data } = props
    if (!data) return []
    const rootData = { children: data }
    const result = Tree.create(rootData, (data, index, parent) => {
      return shallowReactive(new TableRow(data, index, parent))
    })

    return result.children!
  })

  return rows
}
