import { TreeNode } from 'cat-kit/fe'
import { shallowReactive } from 'vue'

export class CustomTreeNode<
  Val extends Record<string, any>
> extends TreeNode<Val> {
  override parent: CustomTreeNode<Val> | null = null

  override children?: CustomTreeNode<Val>[] = undefined

  visible = true
  expanded = false
  loading = false
  loaded = false
  active = false

  constructor(val: Val, index: number, parent?: any) {
    super(val, index)
    if (parent) {
      this.parent = parent
    }
    return shallowReactive(this)
  }

  createNode<Val extends Record<string, any>>(
    val: Val,
    index: number
  ): TreeNode<Val> {
    return new CustomTreeNode(val, index)
  }
}
