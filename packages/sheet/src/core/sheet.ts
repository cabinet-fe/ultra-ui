import { iterateRange, type CellAddress, type CellRange } from './address'
import { isEmptyCellData, CellStore, type CellData, type CellValue } from './cell-store'
import { TypedEventEmitter } from './events'
import { MergeManager, type CellInfo } from './merge-manager'
import { SelectionModel, type SelectionState } from './selection'

/**
 * Sheet = cell-store + merge-manager + selection 的组合，统一操作入口。
 *
 * 语义约定：
 * - `getCellData`：原始存储语义，被合并覆盖的非锚点格 → undefined
 * - `getDisplayValue`：锚点解析语义，被覆盖格返回锚点的值
 * - `setCellValue` / `selectCell`：内部先 resolveAnchor（用户操作永远落锚点）
 */

export type SheetEvents = {
  /** 单元格数据变化（含删除） */
  'cell-change': { addr: CellAddress }
  /** 合并结构变化（合并/取消合并） */
  'merge-change': { range: CellRange }
  /** 选区变化 */
  'selection-change': SelectionState
}

export class Sheet {
  readonly store = new CellStore()
  readonly merges = new MergeManager()
  readonly selection: SelectionModel

  name: string

  private emitter = new TypedEventEmitter<SheetEvents>()

  constructor(name = 'Sheet1') {
    this.name = name
    this.selection = new SelectionModel((addr) => this.merges.resolveAnchor(addr))
    this.selection.on((state) => this.emitter.emit('selection-change', state))
  }

  get rowCount(): number {
    return this.store.rowCount
  }

  get colCount(): number {
    return this.store.colCount
  }

  // ─── 单元格数据 ────────────────────────────────────────────

  /** 原始存储语义读取（被覆盖格 → undefined） */
  getCellData(addr: CellAddress): CellData | undefined {
    return this.store.getCell(addr)
  }

  /** 锚点解析语义读取（被覆盖格 → 锚点的值） */
  getDisplayValue(addr: CellAddress): CellValue | undefined {
    const anchor = this.merges.resolveAnchor(addr)
    return this.store.getCell(anchor)?.v ?? undefined
  }

  /** 写入原始值（解析到锚点；空值 = 清除） */
  setCellValue(addr: CellAddress, value: CellValue): void {
    const anchor = this.merges.resolveAnchor(addr)
    this.store.setCellValue(anchor, value)
    this.emitter.emit('cell-change', { addr: anchor })
  }

  /** 写入完整 CellData（解析到锚点；空数据 = 清除） */
  setCell(addr: CellAddress, data?: CellData): void {
    const anchor = this.merges.resolveAnchor(addr)
    this.store.setCell(anchor, data)
    this.emitter.emit('cell-change', { addr: anchor })
  }

  // ─── 合并 ────────────────────────────────────────────────

  /** 合并语义下的单元格信息（普通格 / 合并锚点 / 被覆盖格） */
  getCellInfo(addr: CellAddress): CellInfo {
    return this.merges.getCellInfo(addr)
  }

  /**
   * 合并区域。值保留规则（同 Excel/univer）：
   * 仅保留包围盒内按行主序第一个有值格的值，写入新锚点，其余被覆盖格清空。
   * @returns 最终生效的合并区域（与既有合并相交时取包围盒）
   */
  mergeCells(range: CellRange): CellRange {
    const { range: finalRange } = this.merges.merge(range)

    let retained: CellData | undefined
    for (const addr of iterateRange(finalRange)) {
      const data = this.store.getCell(addr)
      if (data && !isEmptyCellData(data)) {
        retained = data
        break
      }
    }

    for (const addr of iterateRange(finalRange)) {
      this.store.deleteCell(addr)
    }
    if (retained) {
      this.store.setCell(finalRange.start, retained)
    }

    this.emitter.emit('merge-change', { range: finalRange })
    return finalRange
  }

  /** 解除与 range 相交的所有合并；仅原锚点保留值（被覆盖格本就无值） */
  unmergeCells(range: CellRange): void {
    const removed = this.merges.unmerge(range)
    for (const item of removed) {
      this.emitter.emit('merge-change', { range: item })
    }
  }

  // ─── 选区 ────────────────────────────────────────────────

  getSelection(): SelectionState {
    return this.selection.getState()
  }

  /** 选中单格（被覆盖格自动定位锚点） */
  selectCell(addr: CellAddress): void {
    this.selection.selectCell(addr)
  }

  selectRange(range: CellRange): void {
    this.selection.selectRange(range)
  }

  // ─── 事件 ────────────────────────────────────────────────

  on<K extends keyof SheetEvents>(type: K, handler: (payload: SheetEvents[K]) => void): () => void {
    return this.emitter.on(type, handler)
  }

  off<K extends keyof SheetEvents>(type: K, handler: (payload: SheetEvents[K]) => void): void {
    this.emitter.off(type, handler)
  }
}
