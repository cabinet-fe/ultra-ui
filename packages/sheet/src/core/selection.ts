import { createRange, type CellAddress, type CellRange } from './address'
import { TypedEventEmitter } from './events'

/**
 * 选区模型：activeCell + ranges。
 * activeCell 永远指向锚点（构造时注入 resolveAnchor）。
 */

export interface SelectionState {
  /** 活动单元格（锚点语义）；未选中时为 null */
  activeCell: CellAddress | null
  /** 选中区域列表（本阶段单选区，预留多选区） */
  ranges: CellRange[]
}

type SelectionEvents = { change: SelectionState }

export class SelectionModel {
  private state: SelectionState = { activeCell: null, ranges: [] }
  private emitter = new TypedEventEmitter<SelectionEvents>()

  constructor(private readonly resolveAnchor: (addr: CellAddress) => CellAddress) {}

  get activeCell(): CellAddress | null {
    return this.state.activeCell
  }

  get ranges(): CellRange[] {
    return this.state.ranges
  }

  /** 选中单格；被覆盖格自动解析到锚点 */
  selectCell(addr: CellAddress): void {
    const anchor = this.resolveAnchor(addr)
    this.setState({ activeCell: anchor, ranges: [createRange(anchor, anchor)] })
  }

  /**
   * 选中区域。
   * `active` 缺省为区域起点锚点；整行/整列头点击可传入视口边缘格作为活动格
   * （与 Excel 一致：选区仍为整行/列，锚点落在当前可见边缘）。
   */
  selectRange(range: CellRange, active?: CellAddress): void {
    const normalized = createRange(range.start, range.end)
    let anchor = this.resolveAnchor(active ?? normalized.start)
    anchor = {
      row: Math.min(Math.max(anchor.row, normalized.start.row), normalized.end.row),
      col: Math.min(Math.max(anchor.col, normalized.start.col), normalized.end.col)
    }
    anchor = this.resolveAnchor(anchor)
    this.setState({ activeCell: anchor, ranges: [normalized] })
  }

  getState(): SelectionState {
    return {
      activeCell: this.state.activeCell ? { ...this.state.activeCell } : null,
      ranges: this.state.ranges.map((range) => ({
        start: { ...range.start },
        end: { ...range.end }
      }))
    }
  }

  clear(): void {
    this.setState({ activeCell: null, ranges: [] })
  }

  on(handler: (state: SelectionState) => void): () => void {
    return this.emitter.on('change', handler)
  }

  private setState(state: SelectionState): void {
    this.state = state
    this.emitter.emit('change', this.getState())
  }
}
