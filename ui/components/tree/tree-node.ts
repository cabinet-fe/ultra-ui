import { TreeNode as _TreeNode, getChainValue } from 'cat-kit/fe'
import { shallowReactive } from 'vue'

export class TreeNode<
  Val extends Record<string, any> = Record<string, any>
> extends _TreeNode<Val> {
  override parent: TreeNode<Val> | null = null

  override children?: TreeNode<Val>[] = undefined

  expanded = false
  loading = false
  loaded = false
  /** 多选是否选中 */
  checked = false
  indeterminate = false
  disabled = false
  visible = true

  get parentExpanded() {
    if (!this.parent) return true
    return this.parent.expanded || this.depth === 1
  }

  labelKey: string
  valueKey: string

  constructor(params: {
    data: Val
    index: number
    parent?: any
    labelKey: string
    valueKey: string
  }) {
    const { data, index, parent, labelKey, valueKey } = params
    super(data, index)
    if (parent) {
      this.parent = parent
    }
    this.labelKey = labelKey
    this.valueKey = valueKey

    return shallowReactive(this)
  }

  get label(): string {
    return String(getChainValue(this.data, this.labelKey))
  }

  get key(): string | number {
    return getChainValue(this.data, this.valueKey)
  }
}
