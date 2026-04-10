import { TreeNode } from '@cat-kit/core'
import { reactive, shallowReactive } from 'vue'

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
    const { width } = this.data
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

  style: Record<string, number> = reactive({})

  constructor(val: TableColumn, index: number, depth: number, parent?: ColumnNode) {
    super(val ? shallowReactive(val) : val, index, depth, parent)
  }
}
