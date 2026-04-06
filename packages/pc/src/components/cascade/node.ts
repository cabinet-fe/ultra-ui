import { TreeNode } from 'cat-kit/fe'
import { shallowReactive } from 'vue'

export class CascadeNode extends TreeNode {
  parent: CascadeNode | null = null
  children?: CascadeNode[]
  visible = true

  value: string
  label: string

  constructor(options: {
    data: Record<string, any>
    index: number
    value: string
    label: string
    parent?: CascadeNode
  }) {
    const { data, index, parent, value, label } = options
    super(data, index)
    if (parent) {
      this.parent = parent
    }
    this.value = value
    this.label = label

    return shallowReactive(this)
  }
}
