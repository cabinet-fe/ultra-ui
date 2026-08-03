import type { CellAddress, CellRange } from './address'
import { iterateRange } from './address'
import {
  inferCellType,
  CellStore,
  type CellData,
  type CellSnapshotItem,
  type CellValue
} from './cell-store'
import { defaultCommandRegistry } from './command/default-registry'
import { HistoryManager, type HistoryState } from './command/history'
import { MergeCellsCommand, UnmergeCellsCommand } from './command/merge-cells'
import { SetCellFormulaCommand } from './command/set-cell-formula'
import { SetCellStyleCommand, type SetCellStyleItem } from './command/set-cell-style'
import { SetCellValueCommand, type SetCellValueItem } from './command/set-cell-value'
import type { Mutation, Patch, PatchDirection, CellPatch } from './command/types'
import { TypedEventEmitter } from './events'
import { DependencyGraph } from './formula/dependency-graph'
import { MergeManager, type CellInfo } from './merge-manager'
import { SelectionModel, type SelectionState } from './selection'
import { StylePool } from './style/style-pool'
import type { CellStyle, CellStylePatch } from './style/types'

/**
 * Sheet = cell-store + merge-manager + selection + history 的组合，统一操作入口。
 *
 * 语义约定：
 * - `getCellData`：原始存储语义，被合并覆盖的非锚点格 → undefined
 * - `getDisplayValue`：锚点解析语义，被覆盖格返回锚点的值
 * - `setCellValue` / `selectCell`：内部先 resolveAnchor（用户操作永远落锚点）
 * - 一切写操作（setCellValue / setCell / setCells / setCellFormula / mergeCells / unmergeCells）
 *   都经命令系统执行（applyPatch 是唯一变更通道），天然获得 undo/redo 能力
 * - 公式：`setCellValue` 识别 '=' 前缀走 `setCellFormula`；命令执行后自动增量重算，
 *   重算派生变更（含跨表）并入同一 undo 单元
 */

/** 冻结状态（Excel 语义：rows = 冻结顶部行数，cols = 冻结左侧列数） */
export interface FrozenState {
  rows: number
  cols: number
}

/** Sheet 全量快照（宿主序列化持久化用；frozen 随快照保存/还原） */
export interface SheetSnapshot {
  cells: CellSnapshotItem[]
  styles: CellStyle[]
  merges: CellRange[]
  frozen: FrozenState
}

export type SheetEvents = {
  /** 单元格数据变化（含删除） */
  'cell-change': { addr: CellAddress }
  /** 合并结构变化（合并/取消合并） */
  'merge-change': { range: CellRange }
  /** 选区变化 */
  'selection-change': SelectionState
  /** 历史栈变化（undo/redo 可用状态，供工具栏按钮置灰） */
  'history-change': HistoryState
  /** 冻结状态变化（不进 undo；grid 层据此更新冻结布局） */
  'frozen-change': FrozenState
}

export class Sheet {
  readonly store = new CellStore()
  readonly merges = new MergeManager()
  readonly selection: SelectionModel
  /**  undo/redo 历史（命令系统） */
  readonly history: HistoryManager
  /** 公式依赖图（工作簿内多 sheet 共享；独立 Sheet 自建） */
  readonly formulaGraph: DependencyGraph
  /** 样式池：样式定义集中存储，单元格只持 StyleId（相同样式共享一份定义） */
  readonly stylePool = new StylePool()
  /**
   * 稀疏行高（模型行号 → 像素高度）。
   * 供 SheetGrid 在 tab 切换重建时还原；本期不进 undo。
   */
  private readonly rowHeights = new Map<number, number>()
  /** 冻结状态（模型持有；不进 undo，随快照序列化/还原，grid 重建时还原） */
  private frozenState: FrozenState = { rows: 0, cols: 0 }

  /** sheet 名（受控：只读 getter，改名必须经 Workbook.renameSheet 校验后调用 setName） */
  private _name: string

  private emitter = new TypedEventEmitter<SheetEvents>()

  constructor(name = 'Sheet1', formulaGraph?: DependencyGraph) {
    this._name = name
    this.selection = new SelectionModel((addr) => this.merges.resolveAnchor(addr))
    this.selection.on((state) => this.emitter.emit('selection-change', state))
    this.history = new HistoryManager(this.boundApplyPatch)
    this.history.onChange((state) => this.emitter.emit('history-change', state))
    this.formulaGraph = formulaGraph ?? new DependencyGraph()
    this.formulaGraph.registerSheet(this)
  }

  get rowCount(): number {
    return this.store.rowCount
  }

  /** sheet 名（只读；改名必须经 Workbook.renameSheet，直接赋值被类型系统拒绝） */
  get name(): string {
    return this._name
  }

  /**
   * 改名（仅供 Workbook.renameSheet 调用——重名/空名校验与依赖图索引同步由 Workbook 编排；
   * 业务代码不得直接调用，请使用 Workbook.renameSheet）。
   * @internal
   */
  setName(next: string): void {
    this._name = next
  }

  get colCount(): number {
    return this.store.colCount
  }

  /** 读取自定义行高；未设置返回 undefined（由视图层用默认行高） */
  getRowHeight(row: number): number | undefined {
    return this.rowHeights.get(row)
  }

  /** 设置自定义行高（不进 undo）；height ≤ 0 时清除自定义高度 */
  setRowHeight(row: number, height: number): void {
    if (!Number.isInteger(row) || row < 0) return
    if (!Number.isFinite(height) || height <= 0) {
      this.rowHeights.delete(row)
      return
    }
    this.rowHeights.set(row, height)
  }

  /** 遍历已设置的自定义行高（SheetGrid 重建还原用） */
  getRowHeights(): ReadonlyMap<number, number> {
    return this.rowHeights
  }

  // ─── 冻结 ────────────────────────────────────────────────

  /** 读取冻结状态（返回副本，外部修改不影响模型） */
  get frozen(): FrozenState {
    return { rows: this.frozenState.rows, cols: this.frozenState.cols }
  }

  /**
   * 设置冻结行列数（Excel 语义：rows = 冻结顶部行数，cols = 冻结左侧列数）。
   * 值规范化到非负整数；与当前值相同不触发事件。
   * 不进 undo（同 rowHeights 先例），随快照序列化/还原。
   */
  setFrozen(rows: number, cols: number): void {
    const next: FrozenState = {
      rows: Number.isFinite(rows) && rows > 0 ? Math.floor(rows) : 0,
      cols: Number.isFinite(cols) && cols > 0 ? Math.floor(cols) : 0
    }
    if (next.rows === this.frozenState.rows && next.cols === this.frozenState.cols) return
    this.frozenState = next
    this.emitter.emit('frozen-change', { ...next })
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

  /** 写入原始值（解析到锚点；空值 = 清除）；'=' 前缀按公式处理；经命令执行，可撤销 */
  setCellValue(addr: CellAddress, value: CellValue): void {
    if (typeof value === 'string' && value.startsWith('=')) {
      this.setCellFormula(addr, value)
      return
    }
    const data = value == null || value === '' ? undefined : { v: value, t: inferCellType(value) }
    this.setCells([{ addr, data }])
  }

  /** 写入完整 CellData（解析到锚点；空数据 = 清除）；经命令执行，可撤销 */
  setCell(addr: CellAddress, data?: CellData): void {
    this.setCells([{ addr, data }])
  }

  /**
   * 写入公式（可带 '=' 前缀；空白公式 = 清除）；经命令执行，可撤销。
   * 公式原文存 CellData.f，计算缓存（v/t）由增量重算填充；解析失败 → #ERROR!。
   */
  setCellFormula(addr: CellAddress, formula: string): void {
    const text = formula.startsWith('=') ? formula.slice(1) : formula
    if (text.trim() === '') {
      this.setCells([{ addr, data: undefined }])
      return
    }
    this.executeCommand(SetCellFormulaCommand.id, { addr, formula: text })
  }

  /** 批量写入（一次调用 = 一个 undo 单元，供粘贴/填充复用） */
  setCells(items: SetCellValueItem[]): void {
    this.executeCommand(SetCellValueCommand.id, { items })
  }

  // ─── 样式 ────────────────────────────────────────────────

  /**
   * 设置区域样式（部分合并语义：只给 fill 保留既有 border，反之亦然；
   * 见 CellStylePatch）。空样式 = 删除 s 字段（不破坏空单元格不占存储原则）。
   * 样式只存锚点格（被覆盖格不占数据位）。
   */
  setCellStyle(range: CellRange, partial: CellStylePatch): void {
    const items: SetCellStyleItem[] = []
    for (const addr of iterateRange(range)) items.push({ addr, partial })
    this.executeCommand(SetCellStyleCommand.id, { items })
  }

  /** 批量设置样式（按格不同 partial / clear；一次调用 = 一个 undo 单元） */
  setCellStyles(items: SetCellStyleItem[]): void {
    this.executeCommand(SetCellStyleCommand.id, { items })
  }

  /** 清除区域样式（保留值 / 公式；纯样式格被整体删除） */
  clearCellStyle(range: CellRange): void {
    const items: SetCellStyleItem[] = []
    for (const addr of iterateRange(range)) items.push({ addr, clear: true })
    this.executeCommand(SetCellStyleCommand.id, { items })
  }

  /** 读取单元格样式（原始存储语义：被覆盖格 → undefined） */
  getCellStyle(addr: CellAddress): CellStyle | undefined {
    const data = this.store.getCell(addr)
    return data?.s != null ? this.stylePool.get(data.s) : undefined
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

  /** 经默认注册表执行命令；产生的 mutation 与公式重算派生 mutation 一并推入历史 */
  executeCommand<R = void>(commandId: string, params: unknown): R | undefined {
    const result = defaultCommandRegistry.execute<R>(
      { sheet: this, applyPatch: this.boundApplyPatch },
      commandId,
      params
    )
    if (result && result.mutations.length > 0) {
      const mutations = [...result.mutations]
      const recalcMutation = this.recalcAfterCommand(result.mutations)
      if (recalcMutation) mutations.push(recalcMutation)
      this.history.push(mutations)
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

  /**
   * 应用依赖图重算的派生补丁（删除 sheet 联动等不入 undo 的场景）。
   * 与 recalcAfterCommand 走同一变更通道（boundApplyPatch）；不推入历史。
   * @internal
   */
  applyDerivedPatches(patches: CellPatch[]): void {
    for (const patch of patches) this.boundApplyPatch(patch, 'redo')
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

  // ─── 快照 ────────────────────────────────────────────────

  /** 全量快照：单元格 + 样式池 + 合并 + 冻结状态（宿主序列化持久化用） */
  snapshot(): SheetSnapshot {
    return {
      cells: this.store.snapshot(),
      styles: this.stylePool.snapshot(),
      merges: this.merges.getMerges(),
      frozen: this.frozen
    }
  }

  /**
   * 从快照还原。单元格 / 样式 / 合并静默恢复（与 cell-store.restore 先例一致，不发事件）；
   * 冻结状态变化时发 frozen-change（grid 层据此更新冻结布局）。
   */
  restore(snapshot: SheetSnapshot): void {
    this.store.restore(snapshot.cells)
    this.stylePool.restore(snapshot.styles)
    this.merges.clear()
    for (const range of snapshot.merges) this.merges.addMerge(range)
    this.setFrozen(snapshot.frozen.rows, snapshot.frozen.cols)
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
    // 跨表重算的派生补丁路由到目标 sheet（回放经源 sheet 历史时同样按此路由）
    const target = patch.kind === 'cell' ? (patch.sheet ?? this) : this
    target.applyPatch(patch, direction)
  }

  /** 应用补丁：命令执行与 undo/redo 回放共用的唯一变更通道 */
  private applyPatch(patch: Patch, direction: PatchDirection): void {
    if (patch.kind === 'cell') {
      const data = direction === 'redo' ? patch.after : patch.before
      const previous = direction === 'redo' ? patch.before : patch.after
      this.store.setCell(patch.addr, data)
      // 公式依赖图同步（f 增/删/改 → 节点增/删/重建；undo/redo 回放同样覆盖）
      this.formulaGraph.syncCell(this, patch.addr, previous, data)
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

  /**
   * 命令执行后的公式增量重算：从命令 mutation 提取变更格 → 依赖图标脏 +
   * 拓扑序重算 → 派生补丁立即应用，作为附加 mutation 并入同一 undo 单元。
   * undo/redo 纯补丁回放（不重算），图状态由 applyPatch 内的 syncCell 维持。
   */
  private recalcAfterCommand(mutations: Mutation[]): Mutation | undefined {
    const changed: { sheet: Sheet; addr: CellAddress }[] = []
    for (const mutation of mutations) {
      for (const patch of mutation.redo) {
        if (patch.kind !== 'cell') continue
        // 仅样式变化的补丁（v/t/f 相同）不触发公式重算——样式与公式值无关
        if (
          patch.before?.v === patch.after?.v &&
          patch.before?.t === patch.after?.t &&
          patch.before?.f === patch.after?.f
        ) {
          continue
        }
        changed.push({ sheet: patch.sheet ?? this, addr: patch.addr })
      }
    }
    const derived = this.formulaGraph.recalc(changed)
    if (derived.length === 0) return undefined
    for (const patch of derived) this.boundApplyPatch(patch, 'redo')
    return { redo: derived, undo: [...derived].reverse() }
  }
}
