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
  /** 单选点击高亮 */
  active = false
  /** 多选是否选中 */
  checked = false

  get allChecked() {
    return (
      this.children?.every(child => {
        return child.checked
      }) ?? false
    )
  }

  /** 中间状态 */
  get indeterminate() {
    // 没被选中 并且 子级全部为true 子级被选中 才出现indeterminate
    return (
      !this.checked &&
      (this.children?.some(child => child.checked) ?? false) &&
      !this.allChecked
    )
  }

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
