import { TreeNode as CoreTreeNode, o } from '@cat-kit/core'
import { shallowReactive } from 'vue'

export class TreeNode<Val extends Record<string, any> = Record<string, any>> extends CoreTreeNode<
  Val,
  TreeNode<Val>
> {
  declare parent?: TreeNode<Val>

  declare children?: TreeNode<Val>[]

  expanded = false
  loading = false
  loaded = false
  /** 多选是否选中 */
  checked = false
  disabled = false
  visible = true
  /** 子节点选中数量 */
  childrenCheckCount = 0

  get indeterminate(): boolean {
    if (!this.children) return false
    return (
      this.childrenCheckCount > 0
      // && this.childrenCheckCount < this.children.length
    )
  }

  labelKey: string
  valueKey: string

  constructor(params: {
    data: Val
    index: number
    depth: number
    parent?: TreeNode<Val>
    labelKey: string
    valueKey: string
  }) {
    const { data, index, depth, parent, labelKey, valueKey } = params
    super(data, index, depth, parent)
    this.labelKey = labelKey
    this.valueKey = valueKey

    return shallowReactive(this)
  }

  get label(): string {
    return String(o(this.data).get(this.labelKey))
  }

  get key(): string | number {
    return o(this.data).get(this.valueKey) as string | number
  }

  /**
   * 向上冒泡设置
   * @param setter 设置函数, 返回 false 则停止冒泡
   */
  bubbleSet(setter: (node: TreeNode<Val>) => boolean | void): void {
    const ret = setter(this)
    ret !== false && this.parent?.bubbleSet(setter)
  }
}
