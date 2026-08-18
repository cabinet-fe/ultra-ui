import { TreeNode } from '@cat-kit/core'
import { isReactive, reactive, shallowReactive } from 'vue'

import type { TableColumn, TableColumnAlign } from '../../../types'

export class ColumnNode extends TreeNode<TableColumn, ColumnNode> {
  declare children?: ColumnNode[] | undefined
  declare parent?: ColumnNode
  /** 叶子节点数量 */
  leafs?: number

  nextNode: ColumnNode | null = null

  /** 列key */
  get key(): string {
    return this.data.key
  }
  set key(val) {
    this.data.key = val
  }
  /** 列名 */
  get name(): string {
    return this.data.name
  }
  set name(val) {
    this.data.name = val
  }

  /**
   * 列对齐方式
   * @default 'left'
   */
  get align(): TableColumnAlign {
    return this.data.align ?? 'left'
  }
  set align(val) {
    this.data.align = val
  }

  get headerAlign(): TableColumnAlign {
    return this.data.headerAlign ?? this.align
  }
  set headerAlign(val) {
    this.data.headerAlign = val
  }

  /** 宽度 */
  get width(): number | undefined {
    const width = this.data.width ?? this.derived.allocatedWidth
    if (!width || (this.minWidth && width && width < this.minWidth)) {
      return this.minWidth
    }
    return width
  }
  set width(val) {
    if (this.minWidth && val && val < this.minWidth) {
      val = this.minWidth
    }
    this.data.width = val
    // 显式宽度（配置/拖拽）优先于分配宽度，旧的分配结果直接作废
    this.derived.allocatedWidth = undefined
  }

  /**
   * 列宽分配算法写入的宽度。
   * 与用户列配置 `data.width` 隔离：分配结果不回写列配置对象，
   * 避免列森林重建（重挂载 / v-if / columns 引用变化）时把上一次的
   * 分配残留误判为显式 width，导致列宽被永久锁定、容器变窄后出现滚动条。
   */
  get allocatedWidth(): number | undefined {
    return this.derived.allocatedWidth
  }
  set allocatedWidth(val: number | undefined) {
    this.derived.allocatedWidth = val
  }
  /** 最小宽度 */
  get minWidth(): number | undefined {
    const minWidth = this.data.minWidth
    if (!minWidth && this.isLeaf) {
      return 100
    }
    return minWidth
  }
  set minWidth(val) {
    this.data.minWidth = val
  }

  /** 列固定方向 */
  get fixed(): 'left' | 'right' | undefined {
    if (this.depth > 0) return
    return this.data.fixed
  }
  set fixed(val) {
    this.data.fixed = val
  }

  /** 是否是左侧的最后一个固定列 */
  get isLastFixed(): boolean {
    return this.data.isLastFixed ?? false
  }

  /** 是否是右侧的第一个固定列 */
  get isFirstFixed(): boolean {
    return this.data.isFirstFixed ?? false
  }

  /** 是否是可调整宽度的列 */
  get resizable(): boolean {
    return this.data.resizable ?? true
  }

  /**
   * 是否在列配置上显式指定了 width，或经表头拖拽锁定。
   * 此类列不参与剩余宽度的均分。
   */
  explicitWidth: boolean

  style: Record<string, number> = reactive({})

  /** 派生状态（响应式），与用户列配置 data 隔离 */
  private readonly derived = shallowReactive<{ allocatedWidth?: number }>({
    allocatedWidth: undefined
  })

  constructor(val: TableColumn, index: number, depth: number, parent?: ColumnNode) {
    super(isReactive(val) ? val : shallowReactive(val), index, depth, parent)
    this.explicitWidth = val.width !== undefined
  }
}
