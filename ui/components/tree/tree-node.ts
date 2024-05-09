import { TreeNode as _TreeNode } from 'cat-kit/fe'
import { shallowReactive } from 'vue'

export class TreeNode<Val extends Record<string, any>> extends _TreeNode<Val> {
  override parent: TreeNode<Val> | null = null

  override children?: TreeNode<Val>[] = undefined

  visible = true
  expanded = false
  loading = false
  loaded = false
  /** 单选点击高亮 */
  active = false
  /** 多选是否选中 */
  checked = false
  indeterminate = false
  disabled = false

  constructor(val: Val, index: number, parent?: any) {
    super(val, index)
    if (parent) {
      this.parent = parent
    }

    return shallowReactive(this)
  }
}
