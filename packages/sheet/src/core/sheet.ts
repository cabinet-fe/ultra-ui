import type { CellAddress, CellRange } from './address'
import { inferCellType, CellStore, type CellData, type CellValue } from './cell-store'
import { defaultCommandRegistry } from './command/default-registry'
import { HistoryManager, type HistoryState } from './command/history'
import { MergeCellsCommand, UnmergeCellsCommand } from './command/merge-cells'
import { SetCellValueCommand, type SetCellValueItem } from './command/set-cell-value'
import type { Patch, PatchDirection } from './command/types'
import { TypedEventEmitter } from './events'
import { MergeManager, type CellInfo } from './merge-manager'
import { SelectionModel, type SelectionState } from './selection'

/**
 * Sheet = cell-store + merge-manager + selection + history 的组合，统一操作入口。
 *
 * 语义约定：
 * - `getCellData`：原始存储语义，被合并覆盖的非锚点格 → undefined
 * - `getDisplayValue`：锚点解析语义，被覆盖格返回锚点的值
 * - `setCellValue` / `selectCell`：内部先 resolveAnchor（用户操作永远落锚点）
 * - 一切写操作（setCellValue / setCell / setCells / mergeCells / unmergeCells）
 *   都经命令系统执行（applyPatch 是唯一变更通道），天然获得 undo/redo 能力
 */

export type SheetEvents = {
  /** 单元格数据变化（含删除） */
  'cell-change': { addr: CellAddress }
  /** 合并结构变化（合并/取消合并） */
  'merge-change': { range: CellRange }
  /** 选区变化 */
  'selection-change': SelectionState
  /** 历史栈变化（undo/redo 可用状态，供工具栏按钮置灰） */
  'history-change': HistoryState
}

export class Sheet {
  readonly store = new CellStore()
  readonly merges = new MergeManager()
  readonly selection: SelectionModel
  /**  undo/redo 历史（命令系统） */
  readonly history: HistoryManager

  name: string

  private emitter = new TypedEventEmitter<SheetEvents>()

  constructor(name = 'Sheet1') {
    this.name = name
    this.selection = new SelectionModel((addr) => this.merges.resolveAnchor(addr))
    this.selection.on((state) => this.emitter.emit('selection-change', state))
    this.history = new HistoryManager(this.boundApplyPatch)
    this.history.onChange((state) => this.emitter.emit('history-change', state))
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

  /** 写入原始值（解析到锚点；空值 = 清除）；经命令执行，可撤销 */
  setCellValue(addr: CellAddress, value: CellValue): void {
    const data = value == null || value === '' ? undefined : { v: value, t: inferCellType(value) }
    this.setCells([{ addr, data }])
  }

  /** 写入完整 CellData（解析到锚点；空数据 = 清除）；经命令执行，可撤销 */
  setCell(addr: CellAddress, data?: CellData): void {
    this.setCells([{ addr, data }])
  }

  /** 批量写入（一次调用 = 一个 undo 单元，供粘贴/填充复用） */
  setCells(items: SetCellValueItem[]): void {
    this.executeCommand(SetCellValueCommand.id, { items })
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
    return this.executeCommand<CellRange>(MergeCellsCommand.id, { range })!
  }

  /** 解除与 range 相交的所有合并；仅原锚点保留值（被覆盖格本就无值） */
  unmergeCells(range: CellRange): void {
    this.executeCommand(UnmergeCellsCommand.id, { range })
  }

  // ─── 命令与历史 ──────────────────────────────────────────

  /** 经默认注册表执行命令；产生的 mutation 推入历史 */
  executeCommand<R = void>(commandId: string, params: unknown): R | undefined {
    const result = defaultCommandRegistry.execute<R>(
      { sheet: this, applyPatch: this.boundApplyPatch },
      commandId,
      params
    )
    if (result && result.mutations.length > 0) {
      this.history.push(result.mutations)
    }
    return result?.result
  }

  /** 开启事务（事务内所有命令合并为一个 undo 单元；可嵌套，拍平到最外层） */
  beginTransaction(): void {
    this.history.beginTransaction()
  }

  /** 提交事务 */
  commit(): void {
    this.history.commit()
  }

  /** 回滚事务：还原缓冲中已应用的变更并放弃事务 */
  rollback(): void {
    this.history.rollback()
  }

  /** 撤销一步；无可撤销时返回 false */
  undo(): boolean {
    return this.history.undo()
  }

  /** 重做一步；无可重做时返回 false */
  redo(): boolean {
    return this.history.redo()
  }

  get canUndo(): boolean {
    return this.history.canUndo
  }

  get canRedo(): boolean {
    return this.history.canRedo
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

  // ─── 内部 ────────────────────────────────────────────────

  private readonly boundApplyPatch = (patch: Patch, direction: PatchDirection): void => {
    this.applyPatch(patch, direction)
  }

  /** 应用补丁：命令执行与 undo/redo 回放共用的唯一变更通道 */
  private applyPatch(patch: Patch, direction: PatchDirection): void {
    if (patch.kind === 'cell') {
      const data = direction === 'redo' ? patch.after : patch.before
      this.store.setCell(patch.addr, data)
      this.emitter.emit('cell-change', { addr: patch.addr })
      return
    }
    const exists = direction === 'redo' ? patch.after : patch.before
    if (exists) {
      this.merges.addMerge(patch.range)
    } else {
      this.merges.removeMerge(patch.range)
    }
    this.emitter.emit('merge-change', { range: patch.range })
  }
}
