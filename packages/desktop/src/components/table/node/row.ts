import { TreeNode } from '@cat-kit/core'
import { isReactive, shallowReactive } from 'vue'

/**
 * TODO: 优化参数，对大数据量来说，对象字面量参数会使内存占用过高
 */
export class TableRowNode<Data extends Record<string, any> = Record<string, any>> extends TreeNode<
  Data,
  TableRowNode<Data>
> {
  /** 索引路径 */
  get indexes(): number[] {
    if (!this.parent) return [this.index]
    return this.parent.indexes.concat(this.index)
  }

  isExpandRow = false

  /** 是否操作中 */
  operating = false

  /** 是否展开 */
  expanded = false

  /** 是否为当前的点击行 */
  isCurrent = false

  /** 是否选中 */
  checked = false

  /**
   * 行的稳定唯一标识。
   *
   * E2 不变式：`uid` 在单个 `TableRowNode` 实例的生命周期内不可变更。
   * `useVirtualizer` 的 `getItemKey: i => rows[i].uid` 依赖该不变式来复用测量缓存；
   * 若 uid 在运行时变更，虚拟列表的尺寸表会错配导致滚动抖动。
   * 当前代码路径（`createRow` / `copy`）始终为每个新节点分配一次 uid，
   * 所以该不变式天然成立；此处使用 `readonly` 做编译期锁定。
   */
  readonly uid: number | string

  override children?: TableRowNode<Data>[] = undefined

  /**
   *
   * @param data 一个普通对象或者一个响应式对象
   * @param index 索引值
   * @param depth 深度（根为 0）
   * @param parent 父行节点
   * @param uid 行唯一标识
   * @returns
   */
  constructor(options: {
    data: Data
    index: number
    depth: number
    parent?: TableRowNode<Data>
    uid: number | string
  }) {
    const { data, index, depth, parent, uid } = options

    if (!data) {
      super(data as Data, index, depth, parent)
    } else {
      super(isReactive(data) ? data : shallowReactive(data), index, depth, parent)
    }
    this.uid = uid
    return shallowReactive(this)
  }

  copy() {
    const row = new TableRowNode({
      data: this.data,
      index: this.index,
      depth: this.depth,
      parent: this.parent ?? undefined,
      uid: `expand_${this.uid}`
    })

    row.isExpandRow = true

    return row
  }
}
