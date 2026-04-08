import { TreeNode } from '@cat-kit/core'
import { shallowReactive } from 'vue'

export class CascadeNode<T extends Record<string, any>> extends TreeNode<T, CascadeNode<T>> {
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
