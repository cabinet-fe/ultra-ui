import { TreeNode } from '@cat-kit/core'
import { shallowReactive } from 'vue'

export class CascadeNode extends TreeNode<Record<string, any>> {
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
    const { data, value, label } = options
    super(data)
    this.value = value
    this.label = label
    return shallowReactive(this)
  }
}
