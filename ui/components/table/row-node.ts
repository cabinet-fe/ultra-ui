import { TreeNode } from 'cat-kit/fe'
import { isReactive, shallowReactive } from 'vue'

export class TableRowNode<
  Data extends Record<string, any> = Record<string, any>
> extends TreeNode<Data> {
  /** 索引路径 */
  get indexes(): number[] {
    const isVirtualRoot = this.depth === 0 && !this.isLeaf
    if (isVirtualRoot) return []
    if (!this.parent) return [this.index]
    if (this.depth === 1) return [this.index]
    return this.parent.indexes.concat(this.index)
  }

  /** 是否操作中 */
  operating = false

  /** 是否展开 */
  expanded = false

  /** 是否为当前的点击行 */
  isCurrent = false

  /** 是否选中 */
  checked = false

  uid: number | string

  override children?: TableRowNode<Data>[] = undefined

  override parent: TableRowNode<Data> | null = null

  /**
   *
   * @param data 一个普通对象或者一个响应式对象
   * @param index 索引值
   * @param rowKey 行唯一标识
   * @returns
   */
  constructor(options: { data: Data; index: number; uid: number | string }) {
    const { data, index, uid } = options

    if (!data) {
      super(data, index)
    } else {
      super(isReactive(data) ? data : shallowReactive(data), index)
    }
    this.uid = uid
    return shallowReactive(this)
  }
}
