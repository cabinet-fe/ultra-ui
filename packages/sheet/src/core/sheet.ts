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
import { InsertCellsCommand } from './command/insert-delete-cells'
import { MergeCellsCommand, UnmergeCellsCommand } from './command/merge-cells'
import { SetCellFormulaCommand } from './command/set-cell-formula'
import { SetCellStyleCommand, type SetCellStyleItem } from './command/set-cell-style'
import { SetCellValueCommand, type SetCellValueItem } from './command/set-cell-value'
import type { Mutation, Patch, PatchDirection, CellPatch, StructureChange } from './command/types'
import { TypedEventEmitter } from './events'
import { DependencyGraph } from './formula/dependency-graph'
import { shiftFormulaText } from './formula/shift'
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
  /** 表格尺寸（行列插入/删除后的行列数；0 = 未声明，由视图层 props 决定） */
  rows: number
  cols: number
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
  /** 结构变化（行列插入/删除；grid 层据此调整渲染行列数） */
  'structure-change': StructureChange
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
  /** 表格尺寸（0 = 未声明，grid 用渲染 props；行列操作后增长，随快照持久化） */
  private _rows = 0
  private _cols = 0

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

  /** 表格行数（0 = 未声明，由视图层渲染 props 决定；行列操作后增长） */
  get rows(): number {
    return this._rows
  }

  /** 表格列数（0 = 未声明，由视图层渲染 props 决定；行列操作后增长） */
  get cols(): number {
    return this._cols
  }

  /**
   * 声明表格尺寸（视图层初始化调用：把渲染 props 写入模型）。
   * 扩张语义：只增大不缩小（max 合并）——插入行/列以「渲染尺寸」为基准增长，
   * 否则 _rows 从 0 起步、插入点小于 props 时 max(props, sheet.rows) 恒取 props，
   * 渲染窗口永不扩大（表现为插入后数据平移但行/列数不变）。
   * 不进 undo、不发事件（仅初始化声明）；restore 后由视图层再次声明兜底。
   * @internal 视图层（SheetGrid 构造）调用；无头场景不需要
   */
  ensureTableSize(rows: number, cols: number): void {
    if (Number.isFinite(rows) && rows > this._rows) this._rows = Math.floor(rows)
    if (Number.isFinite(cols) && cols > this._cols) this._cols = Math.floor(cols)
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

  // ─── 行列插入/删除（结构变更）────────────────────────────

  /** 插入 count 行到 at 行之前（数据/合并/行高/公式引用平移；可 undo） */
  insertRows(at: number, count = 1): void {
    this.executeCommand(InsertCellsCommand.id, { change: { kind: 'insert-rows', at, count } })
  }

  /** 插入 count 列到 at 列之前（数据/合并/公式引用平移；可 undo） */
  insertCols(at: number, count = 1): void {
    this.executeCommand(InsertCellsCommand.id, { change: { kind: 'insert-cols', at, count } })
  }

  /** 删除 [at, at+count) 行（数据/合并/行高/公式引用裁剪；可 undo） */
  deleteRows(at: number, count = 1): void {
    this.executeCommand(InsertCellsCommand.id, { change: { kind: 'delete-rows', at, count } })
  }

  /** 删除 [at, at+count) 列（数据/合并/公式引用裁剪；可 undo） */
  deleteCols(at: number, count = 1): void {
    this.executeCommand(InsertCellsCommand.id, { change: { kind: 'delete-cols', at, count } })
  }

  /** 结构变更的反向操作（undo 回放用） */
  static reverseStructureChange(change: StructureChange): StructureChange {
    switch (change.kind) {
      case 'insert-rows':
        return { kind: 'delete-rows', at: change.at, count: change.count }
      case 'delete-rows':
        return { kind: 'insert-rows', at: change.at, count: change.count }
      case 'insert-cols':
        return { kind: 'delete-cols', at: change.at, count: change.count }
      case 'delete-cols':
        return { kind: 'insert-cols', at: change.at, count: change.count }
    }
  }

  /**
   * 应用结构变更（数据/合并/行高/表格尺寸/事件）。
   * 公式引用的平移由 prepareFormulaShift 生成 CellPatch 后经 applyPatch 应用
   * （依赖图同步与 undo 恢复统一走补丁通道）。
   * @param restoreDims undo 回放时传入操作前尺寸（精确还原，插入/删除计算不可逆）
   * @internal 命令与 undo/redo 回放调用
   */
  applyStructureChange(
    change: StructureChange,
    restoreDims?: { rows: number; cols: number }
  ): void {
    const axis = change.kind.endsWith('rows') ? 'rows' : 'cols'
    const isInsert = change.kind.startsWith('insert')
    const { at, count } = change

    if (axis === 'rows') {
      if (isInsert) this.store.insertRows(at, count)
      else this.store.deleteRows(at, count)
      this.shiftRowHeights(at, count, isInsert ? 1 : -1)
      this._rows = restoreDims
        ? restoreDims.rows
        : isInsert
          ? Math.max(this._rows, at) + count
          : Math.max(0, this._rows - count)
    } else {
      if (isInsert) this.store.insertCols(at, count)
      else this.store.deleteCols(at, count)
      this._cols = restoreDims
        ? restoreDims.cols
        : isInsert
          ? Math.max(this._cols, at) + count
          : Math.max(0, this._cols - count)
    }

    if (isInsert) {
      if (axis === 'rows') this.merges.shiftRowsInsert(at, count)
      else this.merges.shiftColsInsert(at, count)
    } else {
      if (axis === 'rows') this.merges.shiftRowsDelete(at, count)
      else this.merges.shiftColsDelete(at, count)
    }

    this.emitter.emit('structure-change', change)
  }

  /**
   * 计算结构变更引起的公式引用平移补丁（在 applyStructureChange 之前调用——
   * 需要读取平移前的公式原文；patch.addr 为平移后坐标，before 为平移前数据）。
   * 引用被删除区间覆盖的公式格 → after=undefined（公式死亡，显示 #REF!）。
   * @internal 结构命令 handler 使用
   */
  prepareFormulaShift(change: StructureChange): CellPatch[] {
    const axis = change.kind.endsWith('rows') ? 'rows' : 'cols'
    const isInsert = change.kind.startsWith('insert')
    const { at, count } = change
    const end = at + count
    const patches: CellPatch[] = []

    for (const [formulaSheet, node] of this.formulaGraph.allNodes()) {
      const before = formulaSheet.store.getCell(node.addr)
      if (!before?.f) continue
      // 公式格坐标只随「其所在 sheet」的结构操作平移；其他 sheet 的公式格仅平移引用文本
      const ownSheet = formulaSheet === this
      let addr = { ...node.addr }
      let removed = false
      if (ownSheet) {
        if (axis === 'rows') {
          if (isInsert) {
            if (addr.row >= at) addr.row += count
          } else if (addr.row >= at && addr.row < end) {
            removed = true
          } else if (addr.row >= end) {
            addr.row -= count
          }
        } else if (isInsert) {
          if (addr.col >= at) addr.col += count
        } else if (addr.col >= at && addr.col < end) {
          removed = true
        } else if (addr.col >= end) {
          addr.col -= count
        }
      }

      if (removed) {
        patches.push({
          kind: 'cell',
          sheet: formulaSheet,
          addr: node.addr,
          before,
          after: undefined
        })
        continue
      }
      const result = shiftFormulaText(before.f, axis, at, count, isInsert ? 'insert' : 'delete')
      if (!result.broken && result.text === before.f) continue
      const after: CellData = result.broken ? { v: '#REF!', t: 'e' } : { ...before, f: result.text }
      patches.push({ kind: 'cell', sheet: formulaSheet, addr, before, after })
    }
    return patches
  }

  /** 行高稀疏表随行平移（插入 +count / 删除 -count，区间内删除） */
  private shiftRowHeights(at: number, count: number, delta: 1 | -1): void {
    if (delta === 1) {
      const shifted: Array<[number, number]> = []
      for (const [row, height] of this.rowHeights) {
        if (row >= at) shifted.push([row, height])
      }
      for (const [row] of shifted) this.rowHeights.delete(row)
      for (const [row, height] of shifted) this.rowHeights.set(row + count, height)
      return
    }
    const end = at + count
    for (const row of Array.from(this.rowHeights.keys())) {
      if (row >= at && row < end) this.rowHeights.delete(row)
    }
    const shifted: Array<[number, number]> = []
    for (const [row, height] of this.rowHeights) {
      if (row >= end) shifted.push([row, height])
    }
    for (const [row] of shifted) this.rowHeights.delete(row)
    for (const [row, height] of shifted) this.rowHeights.set(row - count, height)
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
      frozen: this.frozen,
      rows: this._rows,
      cols: this._cols
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
    this._rows = snapshot.rows ?? 0
    this._cols = snapshot.cols ?? 0
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
    if (patch.kind === 'merge') {
      const exists = direction === 'redo' ? patch.after : patch.before
      if (exists) {
        this.merges.addMerge(patch.range)
      } else {
        this.merges.removeMerge(patch.range)
      }
      this.emitter.emit('merge-change', { range: patch.range })
      return
    }
    // 结构变更：redo = 正向结构操作；undo = 反向结构操作（公式平移经 CellPatch 恢复），
    // undo 同时精确还原操作前表格尺寸
    this.applyStructureChange(
      direction === 'redo' ? patch.change : Sheet.reverseStructureChange(patch.change),
      direction === 'undo' ? { rows: patch.beforeRows, cols: patch.beforeCols } : undefined
    )
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
