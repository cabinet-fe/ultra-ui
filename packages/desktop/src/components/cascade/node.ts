import { TreeNode } from '@cat-kit/core'
import { shallowReactive } from 'vue'

export class CascadeNode<T extends Record<string, any> = Record<string, any>> extends TreeNode<
  T,
  CascadeNode<T>
> {
  visible = true

  value: string
  label: string

  constructor(options: {
    data: Record<string, any>
    index: number
    depth: number
    value: string
    label: string
    parent?: CascadeNode<T>
  }) {
    const { data, index, depth, parent, value, label } = options
    super(data as T, index, depth, parent)
    this.value = value
    this.label = label

    return shallowReactive(this)
  }
}
