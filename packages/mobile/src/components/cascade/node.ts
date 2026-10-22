import { TreeNode } from '@cat-kit/core'
import { shallowReactive } from 'vue'

/** 级联节点（内部实现）：承载展示字段与可见性 */
export class CascadeItem<T extends Record<string, any> = Record<string, any>> extends TreeNode<
  T,
  CascadeItem<T>
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
    parent?: CascadeItem<T>
  }) {
    const { data, index, depth, parent, value, label } = options
    super(data as T, index, depth, parent)
    this.value = value
    this.label = label

    return shallowReactive(this)
  }
}
