import type { CellAddress, CellRange } from './address'
import { createRange, iterateRange } from './address'
import type { CellMetaSnapshotItem } from './cell-meta'
import { CellMetaStore } from './cell-meta-store'
import { CELL_READONLY_META_NAMESPACE } from './cell-readonly'
import {
  inferCellType,
  normalizeInputValue,
  CellStore,
  type CellData,
  type CellSnapshotItem,
  type CellValue
} from './cell-store'
import { ClearCellMetaCommand, SetCellMetaCommand } from './command/cell-meta'
import { defaultCommandRegistry } from './command/default-registry'
import { HistoryManager, type HistoryState } from './command/history'
import {
  InsertImageCommand,
  RemoveImageCommand,
  UpdateImageCommand,
  type ImageUpdateFields
} from './command/image'
import { InsertCellsCommand } from './command/insert-delete-cells'
import {
  MergeCellsBatchCommand,
  MergeCellsCommand,
  UnmergeCellsCommand
} from './command/merge-cells'
import { SetAxisStyleCommand } from './command/set-axis-style'
import { SetCellFormulaCommand } from './command/set-cell-formula'
import { SetCellStyleCommand, type SetCellStyleItem } from './command/set-cell-style'
import { SetCellValueCommand, type SetCellValueItem } from './command/set-cell-value'
import type {
  Mutation,
  Patch,
  PatchDirection,
  CellPatch,
  ImagePatch,
  StructureChange
} from './command/types'
import { TypedEventEmitter } from './events'
import { DependencyGraph } from './formula/dependency-graph'
import { shiftFormulaText } from './formula/shift'
import { cloneSheetImage, imageAnchorsEqual, type ImageInput, type SheetImage } from './image'
import { MergeManager, type CellInfo } from './merge-manager'
import { SelectionModel, type SelectionState } from './selection'
import { composeCellStyles } from './style/compose'
import { StylePool } from './style/style-pool'
import type { CellStyle, CellStylePatch, StyleId } from './style/types'

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

/** 默认选区 A1（新建 / 旧快照无 selection 时回落） */
const DEFAULT_SELECTION_CELL: CellAddress = { row: 0, col: 0 }

/** Sheet 全量快照（宿主序列化持久化用；frozen / selection 随快照保存/还原） */
export interface SheetSnapshot {
  cells: CellSnapshotItem[]
  styles: CellStyle[]
  merges: CellRange[]
  frozen: FrozenState
  /** 表格尺寸（行列插入/删除后的行列数；0 = 未声明，由视图层 props 决定） */
  rows: number
  cols: number
  /**
   * 选区（可选，向后兼容）。
   * 有则还原；旧快照缺省 → 回落 A1。不进 undo 历史（与 Excel 不同，有意为之）。
   */
  selection?: { activeCell: CellAddress; ranges: CellRange[] }
  /**
   * 自定义行高：[行号, 像素] 元组。
   */
  rowHeights?: [number, number][]
  /**
   * 自定义列宽：[列号, 像素] 元组（对称 rowHeights；不进 undo）。
   */
  colWidths?: [number, number][]
  /**
   * 行默认样式：[行号, StyleId]，引用同一 styles 池。
   */
  rowStyles?: [number, StyleId][]
  /**
   * 列默认样式：[列号, StyleId]，引用同一 styles 池。
   */
  colStyles?: [number, StyleId][]
  /**
   * 浮动图片
   */
  images?: SheetImage[]
  /**
   * Cell Meta 侧车数据
   */
  meta?: CellMetaSnapshotItem[]
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
  /**
   * 整表内容替换（SnapshotPatch 应用：导入 replaceWorkbookWithSnapshots / undo/redo 回放）。
   * 不发逐格 cell-change（避免十万级视图同步）；grid 层全量刷新（setRecords）、
   * 状态源 bump 都以此为信号。
   */
  'content-reset': undefined
  /**
   * 图片集合变化（插入/删除/结构移除/restoreContent 整表替换）。
   * 单图变更带 id；整表替换时 id 缺省（视图层全量重排）。
   */
  'image-change': { id?: string }
  /**
   * Cell Meta 变化（设置/清除/restoreContent 整表替换）。
   * 单条变更带 addr + namespace；整表替换时二者缺省（视图层全量刷新）。
   */
  'meta-change': { addr?: CellAddress; namespace?: string }
  /**
   * 行/列默认样式变化（setRowStyle / setColStyle / undo 回放）。
   * grid 层据此刷新样式回调。
   */
  'axis-style-change': { axis: 'row' | 'col'; index: number }
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
  /**
   * 稀疏列宽（模型列号 → 像素宽度）。
   * 对称 rowHeights；不进 undo，随快照序列化/还原。
   */
  private readonly colWidths = new Map<number, number>()
  /**
   * 行默认样式（模型行号 → StyleId）；进 undo，随 restoreContent 还原。
   */
  private readonly rowStyles = new Map<number, StyleId>()
  /**
   * 列默认样式（模型列号 → StyleId）；进 undo，随 restoreContent 还原。
   */
  private readonly colStyles = new Map<number, StyleId>()
  /** 浮动图片（id → SheetImage）；写操作经 ImagePatch / 结构变更通道 */
  private readonly images = new Map<string, SheetImage>()
  /** Cell Meta 侧车（与 CellStore 平行；写操作经 CellMetaPatch） */
  private readonly cellMeta = new CellMetaStore()
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
    // 新建默认选中 A1（名称框 / 画布高亮 / fx 输入栏联动；构造期无订阅者无害）
    this.selectCell(DEFAULT_SELECTION_CELL)
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

  /** 读取自定义列宽；未设置返回 undefined（由视图层用默认列宽） */
  getColWidth(col: number): number | undefined {
    return this.colWidths.get(col)
  }

  /** 设置自定义列宽（不进 undo）；width ≤ 0 时清除自定义宽度 */
  setColWidth(col: number, width: number): void {
    if (!Number.isInteger(col) || col < 0) return
    if (!Number.isFinite(width) || width <= 0) {
      this.colWidths.delete(col)
      return
    }
    this.colWidths.set(col, width)
  }

  /** 遍历已设置的自定义列宽（SheetGrid 重建还原用） */
  getColWidths(): ReadonlyMap<number, number> {
    return this.colWidths
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
    if (value == null || value === '') {
      this.setCells([{ addr, data: undefined }])
      return
    }
    const normalized = normalizeInputValue(value)
    this.setCells([{ addr, data: { v: normalized, t: inferCellType(normalized) } }])
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

  /** 读取行默认样式（StyleId → 池定义）；未设置 → undefined */
  getRowStyle(row: number): CellStyle | undefined {
    const id = this.rowStyles.get(row)
    return id != null ? this.stylePool.get(id) : undefined
  }

  /** 读取行默认样式 StyleId（命令 / 快照内部用） */
  getRowStyleId(row: number): StyleId | undefined {
    return this.rowStyles.get(row)
  }

  /** 遍历已设置的行默认样式 StyleId（拷贝 / 测试） */
  getRowStyleIds(): ReadonlyMap<number, StyleId> {
    return this.rowStyles
  }

  /**
   * 设置行默认样式（部分合并语义，经命令进 undo）。
   * 空样式 = 清除该行默认样式。
   */
  setRowStyle(row: number, partial: CellStylePatch): void {
    this.executeCommand(SetAxisStyleCommand.id, { axis: 'row', items: [{ index: row, partial }] })
  }

  /** 清除行默认样式（经命令进 undo） */
  clearRowStyle(row: number): void {
    this.executeCommand(SetAxisStyleCommand.id, {
      axis: 'row',
      items: [{ index: row, clear: true }]
    })
  }

  /** 读取列默认样式（StyleId → 池定义）；未设置 → undefined */
  getColStyle(col: number): CellStyle | undefined {
    const id = this.colStyles.get(col)
    return id != null ? this.stylePool.get(id) : undefined
  }

  /** 读取列默认样式 StyleId（命令 / 快照内部用） */
  getColStyleId(col: number): StyleId | undefined {
    return this.colStyles.get(col)
  }

  /** 遍历已设置的列默认样式 StyleId（拷贝 / 测试） */
  getColStyleIds(): ReadonlyMap<number, StyleId> {
    return this.colStyles
  }

  /**
   * 设置列默认样式（部分合并语义，经命令进 undo）。
   * 空样式 = 清除该列默认样式。
   */
  setColStyle(col: number, partial: CellStylePatch): void {
    this.executeCommand(SetAxisStyleCommand.id, { axis: 'col', items: [{ index: col, partial }] })
  }

  /** 清除列默认样式（经命令进 undo） */
  clearColStyle(col: number): void {
    this.executeCommand(SetAxisStyleCommand.id, {
      axis: 'col',
      items: [{ index: col, clear: true }]
    })
  }

  /**
   * 有效样式：列 → 行 → 单元格字段级叠加（合并格读锚点）。
   * 空单元格无 `s` 时仍可继承行列默认样式。
   */
  getEffectiveStyle(addr: CellAddress): CellStyle | undefined {
    const anchor = this.merges.resolveAnchor(addr)
    const colStyle = this.colStyles.has(anchor.col)
      ? this.stylePool.peek(this.colStyles.get(anchor.col)!)
      : undefined
    const rowStyle = this.rowStyles.has(anchor.row)
      ? this.stylePool.peek(this.rowStyles.get(anchor.row)!)
      : undefined
    const data = this.store.peekCell(anchor)
    const cellStyle = data?.s != null ? this.stylePool.peek(data.s) : undefined
    return composeCellStyles(composeCellStyles(colStyle, rowStyle), cellStyle)
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

  /**
   * 批量合并（一次调用 = 一个 undo 单元；导入等批量场景用，避免逐区域命令
   * 的命令/历史/重算编排开销）。与逐条 mergeCells 同语义（相交包围盒 +
   * 锚点值保留；源 Excel 合并区域互不相交，批量收集行为一致）。
   */
  mergeCellsBatch(ranges: CellRange[]): void {
    if (ranges.length === 0) return
    this.executeCommand(MergeCellsBatchCommand.id, { ranges })
  }

  /** 解除与 range 相交的所有合并；仅原锚点保留值（被覆盖格本就无值） */
  unmergeCells(range: CellRange): void {
    this.executeCommand(UnmergeCellsCommand.id, { range })
  }

  // ─── 图片 ────────────────────────────────────────────────

  /** 只读图片列表（快照副本，外部修改不影响模型） */
  getImages(): readonly SheetImage[] {
    return [...this.images.values()].map(cloneSheetImage)
  }

  /** 按 id 读取单张图片（副本）；不存在返回 undefined */
  getImage(id: string): SheetImage | undefined {
    const image = this.images.get(id)
    return image ? cloneSheetImage(image) : undefined
  }

  /** 插入浮动图片（经命令，可撤销）；返回生成的 id */
  insertImage(input: ImageInput): string {
    return this.executeCommand<string>(InsertImageCommand.id, { image: input })!
  }

  /** 删除浮动图片（经命令，可撤销）；不存在则无操作 */
  removeImage(id: string): void {
    this.executeCommand(RemoveImageCommand.id, { id })
  }

  /** 更新浮动图片锚点/尺寸/文案（经命令，可撤销）；不存在或无变更则无操作 */
  updateImage(id: string, patch: ImageUpdateFields): void {
    this.executeCommand(UpdateImageCommand.id, { id, patch })
  }

  // ─── Cell Meta ───────────────────────────────────────────

  /** 读取指定地址与 namespace 的 Cell Meta（副本）；不存在返回 undefined */
  getCellMeta<T = unknown>(addr: CellAddress, namespace: string): T | undefined {
    const resolved = this.merges.resolveAnchor(addr)
    return this.cellMeta.get(resolved, namespace) as T | undefined
  }

  /** 设置 Cell Meta（经命令，可撤销） */
  setCellMeta(addr: CellAddress, namespace: string, payload: unknown): void {
    const resolved = this.merges.resolveAnchor(addr)
    this.executeCommand(SetCellMetaCommand.id, { addr: resolved, namespace, payload })
  }

  /** 清除 Cell Meta（经命令，可撤销）；不存在则无操作 */
  clearCellMeta(addr: CellAddress, namespace: string): void {
    const resolved = this.merges.resolveAnchor(addr)
    this.executeCommand(ClearCellMetaCommand.id, { addr: resolved, namespace })
  }

  /** 迭代所有 Cell Meta 条目（视图层占位覆盖等场景） */
  *entriesCellMeta(): Generator<[CellAddress, string, unknown]> {
    yield* this.cellMeta.entries()
  }

  // ─── 单元格只读 ──────────────────────────────────────────

  /**
   * 标记/解除单元格只读（填报模板场景；经 Cell Meta 存储，可撤销、随快照序列化、
   * 行列插入删除时平移；合并格解析锚点）。
   * 编辑拦截在 grid 层：SheetGrid 不为只读格开启编辑器，编辑回写与填充柄均跳过只读格。
   * 模型层不设防（同整表 readonly 约定）——绕过 SheetGrid 的命令仍可写入。
   */
  setCellReadonly(addr: CellAddress, readonly = true): void {
    if (readonly) this.setCellMeta(addr, CELL_READONLY_META_NAMESPACE, true)
    else this.clearCellMeta(addr, CELL_READONLY_META_NAMESPACE)
  }

  /** 批量标记/解除区域只读（事务合并为单 undo 单元） */
  setRangeReadonly(range: CellRange, readonly = true): void {
    this.beginTransaction()
    try {
      for (const addr of iterateRange(range)) this.setCellReadonly(addr, readonly)
      this.commit()
    } catch (error) {
      this.rollback()
      throw error
    }
  }

  /** 是否只读格（合并格解析锚点） */
  isCellReadonly(addr: CellAddress): boolean {
    return this.getCellMeta<boolean>(addr, CELL_READONLY_META_NAMESPACE) === true
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
   * 应用结构变更（数据/合并/行高/列宽/行列样式/表格尺寸/事件）。
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
      this.shiftIndexMap(this.rowHeights, at, count, isInsert ? 1 : -1)
      this.shiftIndexMap(this.rowStyles, at, count, isInsert ? 1 : -1)
      this._rows = restoreDims
        ? restoreDims.rows
        : isInsert
          ? Math.max(this._rows, at) + count
          : Math.max(0, this._rows - count)
    } else {
      if (isInsert) this.store.insertCols(at, count)
      else this.store.deleteCols(at, count)
      this.shiftIndexMap(this.colWidths, at, count, isInsert ? 1 : -1)
      this.shiftIndexMap(this.colStyles, at, count, isInsert ? 1 : -1)
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

    this.shiftImages(change)

    this.cellMeta.applyStructureChange(change)
    this.emitter.emit('meta-change', {})

    this.emitter.emit('structure-change', change)
  }

  /**
   * 捕获删除区间内所有单元格（值/公式/样式），供 undo 在反向结构之后精确还原。
   * 插入操作返回空数组。
   * @internal 结构命令 handler 使用
   */
  prepareDeletedCellPatches(change: StructureChange): CellPatch[] {
    if (!change.kind.startsWith('delete')) return []
    const { at, count } = change
    const end = at + count
    const axis = change.kind === 'delete-rows' ? 'rows' : 'cols'
    const patches: CellPatch[] = []
    for (const [addr, data] of this.store.entries()) {
      const hit =
        axis === 'rows' ? addr.row >= at && addr.row < end : addr.col >= at && addr.col < end
      if (!hit) continue
      patches.push({ kind: 'cell', addr: { ...addr }, before: { ...data }, after: undefined })
    }
    return patches
  }

  /**
   * 计算结构变更引起的公式引用平移补丁（在 applyStructureChange 之前调用——
   * 需要读取平移前的公式原文；patch.addr 为平移后坐标，before 为平移前数据）。
   * 引用被删除区间覆盖的公式格 → after=#REF!（公式死亡）；
   * 公式格本身落在删除区间内 → 跳过（由 prepareDeletedCellPatches 覆盖）。
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

      // 删除区间内的公式格由 prepareDeletedCellPatches 捕获（undo 在反向结构之后恢复）；
      // 此处若再发 after:undefined 补丁，redo 会在结构删除后误清上移到该坐标的幸存者。
      if (removed) continue
      const result = shiftFormulaText(before.f, axis, at, count, isInsert ? 'insert' : 'delete')
      if (!result.broken && result.text === before.f) continue
      const after: CellData = result.broken ? { v: '#REF!', t: 'e' } : { ...before, f: result.text }
      patches.push({ kind: 'cell', sheet: formulaSheet, addr, before, after })
    }
    return patches
  }

  /**
   * 捕获删除区间内将被移除的图片（from 锚点落在删除区间），供 undo 在反向结构之后还原。
   * 插入操作返回空数组。语义对齐 hucre：from 在删除区间内 → 移除。
   * @internal 结构命令 handler 使用
   */
  prepareDeletedImagePatches(change: StructureChange): ImagePatch[] {
    if (!change.kind.startsWith('delete')) return []
    const { at, count } = change
    const end = at + count
    const axis = change.kind === 'delete-rows' ? 'row' : 'col'
    const patches: ImagePatch[] = []
    for (const image of this.images.values()) {
      const coord = axis === 'row' ? image.anchor.from.row : image.anchor.from.col
      if (coord < at || coord >= end) continue
      patches.push({
        kind: 'image',
        id: image.id,
        before: cloneSheetImage(image),
        after: undefined
      })
    }
    return patches
  }

  /**
   * 捕获删除后仍存活但锚点发生变化的图片（如 to 落入删除区间被收缩）。
   * 反向结构 insert 无法从 at-1 还原原始 to，故把 before 写入 undo，在反向结构之后精确恢复。
   * @internal 结构命令 handler 使用
   */
  prepareShiftedImagePatches(change: StructureChange): ImagePatch[] {
    if (!change.kind.startsWith('delete')) return []
    const patches: ImagePatch[] = []
    for (const image of this.images.values()) {
      const preview = Sheet.previewImageAfterStructure(image, change)
      if (preview === 'remove') continue
      if (imageAnchorsEqual(image.anchor, preview.anchor)) continue
      patches.push({ kind: 'image', id: image.id, before: cloneSheetImage(image), after: preview })
    }
    return patches
  }

  /**
   * 结构变更引起的图片锚点平移 / 移除（在 merges 平移之后调用）。
   * - 插入：from/to 坐标 ≥ at → +count（同 hucre）
   * - 删除：仅 from 落在 [at, end) → 移除；to ∈ [at, end) → 收缩为 at-1
   *   （若 to < from 或 to < 0 则去掉 to）；其余 ≥ end → -count
   * 被移除 / 锚点收缩的图由 prepare*ImagePatches 捕获进同一 undo 单元。
   */
  private shiftImages(change: StructureChange): void {
    const removedIds: string[] = []

    for (const image of this.images.values()) {
      const preview = Sheet.previewImageAfterStructure(image, change)
      if (preview === 'remove') {
        removedIds.push(image.id)
        continue
      }
      image.anchor = preview.anchor
    }

    for (const id of removedIds) {
      this.images.delete(id)
      this.emitter.emit('image-change', { id })
    }
  }

  /**
   * 计算结构变更后的图片状态（不修改原对象）。
   * @returns `'remove'` = from 落在删除区间；否则为锚点已平移/收缩的副本
   */
  private static previewImageAfterStructure(
    image: SheetImage,
    change: StructureChange
  ): SheetImage | 'remove' {
    const axis = change.kind.endsWith('rows') ? 'row' : 'col'
    const isInsert = change.kind.startsWith('insert')
    const { at, count } = change
    const end = at + count
    const next = cloneSheetImage(image)
    const fromCoord = axis === 'row' ? next.anchor.from.row : next.anchor.from.col

    if (isInsert) {
      if (fromCoord >= at) {
        if (axis === 'row') next.anchor.from.row += count
        else next.anchor.from.col += count
      }
      if (next.anchor.to) {
        const toCoord = axis === 'row' ? next.anchor.to.row : next.anchor.to.col
        if (toCoord >= at) {
          if (axis === 'row') next.anchor.to.row += count
          else next.anchor.to.col += count
        }
      }
      return next
    }

    // 删除：仅 from 在区间内 → 移除
    if (fromCoord >= at && fromCoord < end) return 'remove'

    if (fromCoord >= end) {
      if (axis === 'row') next.anchor.from.row -= count
      else next.anchor.from.col -= count
    }

    if (next.anchor.to) {
      const toCoord = axis === 'row' ? next.anchor.to.row : next.anchor.to.col
      if (toCoord >= end) {
        if (axis === 'row') next.anchor.to.row -= count
        else next.anchor.to.col -= count
      } else if (toCoord >= at) {
        // to 落在删除区间 → 收缩为 at - 1；非法则去掉 to
        const shrunk = at - 1
        const fromAfter = axis === 'row' ? next.anchor.from.row : next.anchor.from.col
        if (shrunk < 0 || shrunk < fromAfter) {
          delete next.anchor.to
        } else if (axis === 'row') {
          next.anchor.to.row = shrunk
        } else {
          next.anchor.to.col = shrunk
        }
      }
    }

    return next
  }

  /**
   * 稀疏索引表随轴平移（插入 +count / 删除 -count，区间内删除）。
   * 行高 / 列宽 / 行列样式共用。
   */
  private shiftIndexMap<T>(map: Map<number, T>, at: number, count: number, delta: 1 | -1): void {
    if (delta === 1) {
      const shifted: Array<[number, T]> = []
      for (const [index, value] of map) {
        if (index >= at) shifted.push([index, value])
      }
      for (const [index] of shifted) map.delete(index)
      for (const [index, value] of shifted) map.set(index + count, value)
      return
    }
    const end = at + count
    for (const index of Array.from(map.keys())) {
      if (index >= at && index < end) map.delete(index)
    }
    const shifted: Array<[number, T]> = []
    for (const [index, value] of map) {
      if (index >= end) shifted.push([index, value])
    }
    for (const [index] of shifted) map.delete(index)
    for (const [index, value] of shifted) map.set(index - count, value)
  }

  // ─── 选区 ────────────────────────────────────────────────

  getSelection(): SelectionState {
    return this.selection.getState()
  }

  /** 选中单格（被覆盖格自动定位锚点） */
  selectCell(addr: CellAddress): void {
    this.selection.selectCell(addr)
  }

  selectRange(range: CellRange, active?: CellAddress): void {
    this.selection.selectRange(range, active)
  }

  // ─── 快照 ────────────────────────────────────────────────

  /** 全量快照：单元格 + 样式池 + 合并 + 冻结 + 选区 + 尺寸 + 行高/列宽 + 行列样式 + 图片（宿主序列化持久化用） */
  snapshot(): SheetSnapshot {
    const selection = this.selection.getState()
    const metaSnapshot = this.cellMeta.snapshot()
    return {
      cells: this.store.snapshot(),
      styles: this.stylePool.snapshot(),
      merges: this.merges.getMerges(),
      frozen: this.frozen,
      rows: this._rows,
      cols: this._cols,
      // 仅在设置过自定义行高时写入（空数组不序列化）
      ...(this.rowHeights.size > 0 ? { rowHeights: [...this.rowHeights] } : {}),
      ...(this.colWidths.size > 0 ? { colWidths: [...this.colWidths] } : {}),
      ...(this.rowStyles.size > 0 ? { rowStyles: [...this.rowStyles] } : {}),
      ...(this.colStyles.size > 0 ? { colStyles: [...this.colStyles] } : {}),
      // 仅在有图片时写入（旧快照无 images 字段 → 向后兼容）
      ...(this.images.size > 0 ? { images: [...this.images.values()].map(cloneSheetImage) } : {}),
      // 仅在有 meta 时写入（旧快照无 meta 字段 → 向后兼容）
      ...(metaSnapshot.length > 0 ? { meta: metaSnapshot } : {}),
      // 仅在有活动格时写入（空选区不序列化；restore 缺省回落 A1）
      ...(selection.activeCell
        ? { selection: { activeCell: selection.activeCell, ranges: selection.ranges } }
        : {})
    }
  }

  /**
   * 从快照还原。单元格 / 样式 / 合并 / 选区 / 图片静默恢复（与 cell-store.restore 先例一致，不发事件）；
   * 冻结状态变化时发 frozen-change（grid 层据此更新冻结布局）。
   * 旧快照无 selection → 回落默认 A1；无 rowHeights/colWidths → 无自定义尺寸；无 images → 无图片。
   */
  restore(snapshot: SheetSnapshot): void {
    this.store.restore(snapshot.cells)
    this.stylePool.restore(snapshot.styles)
    this.merges.clear()
    for (const range of snapshot.merges) this.merges.addMerge(range)
    this.setFrozen(snapshot.frozen.rows, snapshot.frozen.cols)
    this._rows = snapshot.rows ?? 0
    this._cols = snapshot.cols ?? 0
    this.rowHeights.clear()
    for (const [row, height] of snapshot.rowHeights ?? []) this.setRowHeight(row, height)
    this.colWidths.clear()
    for (const [col, width] of snapshot.colWidths ?? []) this.setColWidth(col, width)
    this.restoreAxisStyles(snapshot)
    this.replaceImages(snapshot.images, false)
    this.replaceMeta(snapshot.meta, false)
    this.restoreSelection(snapshot.selection)
  }

  /**
   * 整表内容替换（SnapshotPatch 应用：RestoreSheetCommand 执行 / undo/redo 回放）。
   * 只替换 cells/styles/merges/images/rowStyles/colStyles（含公式依赖图重建）；
   * 冻结 / 行高 / 列宽 / 尺寸 / 选区保持当前——对齐「冻结与行高/列宽不进 undo」
   * 「选区不进 undo」「渲染尺寸不进 undo」既有约定。
   * 静默（不发 cell-change / merge-change），发 content-reset + image-change 供视图层全量刷新。
   * @internal 命令与 undo/redo 回放调用
   */
  restoreContent(snapshot: SheetSnapshot): void {
    this.store.restore(snapshot.cells)
    this.stylePool.restore(snapshot.styles)
    this.merges.clear()
    for (const range of snapshot.merges) this.merges.addMerge(range)
    this.restoreAxisStyles(snapshot)
    this.replaceImages(snapshot.images, true)
    this.replaceMeta(snapshot.meta, true)
    this.formulaGraph.rebuildSheet(this, snapshot.cells)
    this.emitter.emit('content-reset', undefined)
  }

  /** 还原行/列默认样式 Map（StyleId 与 styles 池同事务） */
  private restoreAxisStyles(snapshot: SheetSnapshot): void {
    this.rowStyles.clear()
    for (const [row, id] of snapshot.rowStyles ?? []) {
      if (Number.isInteger(row) && row >= 0 && Number.isInteger(id)) this.rowStyles.set(row, id)
    }
    this.colStyles.clear()
    for (const [col, id] of snapshot.colStyles ?? []) {
      if (Number.isInteger(col) && col >= 0 && Number.isInteger(id)) this.colStyles.set(col, id)
    }
  }

  /** 替换图片集合；emitEvent 时发 image-change（无 id = 整表替换） */
  private replaceImages(images: SheetImage[] | undefined, emitEvent: boolean): void {
    this.images.clear()
    for (const image of images ?? []) {
      this.images.set(image.id, cloneSheetImage(image))
    }
    if (emitEvent) this.emitter.emit('image-change', {})
  }

  /** 替换 Cell Meta 集合；emitEvent 时发 meta-change（无 addr = 整表替换） */
  private replaceMeta(meta: CellMetaSnapshotItem[] | undefined, emitEvent: boolean): void {
    this.cellMeta.restore(meta)
    if (emitEvent) this.emitter.emit('meta-change', {})
  }

  /**
   * 静默还原选区：有快照且含合法 activeCell → 解析锚点后写入；否则回落 A1。
   * 不发 selection-change（调用方重建 grid 时按模型选区回驱）。
   */
  private restoreSelection(selection: SheetSnapshot['selection'] | undefined): void {
    if (selection?.activeCell) {
      const active = this.merges.resolveAnchor(selection.activeCell)
      // ranges 缺省（畸形/手写 JSON）视为空 → 回落单格活动区
      const rawRanges = selection.ranges ?? []
      const ranges =
        rawRanges.length > 0
          ? rawRanges.map((range) => createRange(range.start, range.end))
          : [createRange(active, active)]
      // 活动格钳入首个选区（防御畸形快照）
      const primary = ranges[0]!
      const clamped: CellAddress = {
        row: Math.min(Math.max(active.row, primary.start.row), primary.end.row),
        col: Math.min(Math.max(active.col, primary.start.col), primary.end.col)
      }
      this.selection.restoreState({ activeCell: this.merges.resolveAnchor(clamped), ranges })
      return
    }
    this.selection.restoreState({
      activeCell: { ...DEFAULT_SELECTION_CELL },
      ranges: [createRange(DEFAULT_SELECTION_CELL, DEFAULT_SELECTION_CELL)]
    })
  }

  // ─── 事件 ────────────────────────────────────────────────

  on<K extends keyof SheetEvents>(type: K, handler: (payload: SheetEvents[K]) => void): () => void {
    return this.emitter.on(type, handler)
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
    if (patch.kind === 'image') {
      const next = direction === 'redo' ? patch.after : patch.before
      if (next) {
        this.images.set(next.id, cloneSheetImage(next))
      } else {
        this.images.delete(patch.id)
      }
      this.emitter.emit('image-change', { id: patch.id })
      return
    }
    if (patch.kind === 'cell-meta') {
      const next = direction === 'redo' ? patch.after : patch.before
      this.cellMeta.set(patch.addr, patch.namespace, next)
      this.emitter.emit('meta-change', { addr: patch.addr, namespace: patch.namespace })
      return
    }
    if (patch.kind === 'axis-style') {
      const next = direction === 'redo' ? patch.after : patch.before
      const map = patch.axis === 'row' ? this.rowStyles : this.colStyles
      if (next == null) map.delete(patch.index)
      else map.set(patch.index, next)
      this.emitter.emit('axis-style-change', { axis: patch.axis, index: patch.index })
      return
    }
    if (patch.kind === 'snapshot') {
      // 整表内容替换（导入执行 / undo/redo 回放）：restore 静默 + 发 content-reset。
      // 不还原冻结/行高/列宽/尺寸/选区（对齐「不进 undo」约定；redo 侧尺寸由命令
      // handler 在首次执行时 ensureTableSize，回放不重复）
      this.restoreContent(patch.snapshot)
      return
    }
    // 结构变更：redo = 正向结构操作；undo = 反向结构操作（公式平移经 CellPatch 恢复），
    // undo 同时精确还原操作前表格尺寸
    this.applyStructureChange(
      direction === 'redo' ? patch.change : Sheet.reverseStructureChange(patch.change),
      direction === 'undo' ? { rows: patch.beforeRows, cols: patch.beforeCols } : undefined
    )
    return
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
        if (patch.kind === 'cell') {
          // 仅样式变化的补丁（v/t/f 相同）不触发公式重算——样式与公式值无关
          if (
            patch.before?.v === patch.after?.v &&
            patch.before?.t === patch.after?.t &&
            patch.before?.f === patch.after?.f
          ) {
            continue
          }
          changed.push({ sheet: patch.sheet ?? this, addr: patch.addr })
          continue
        }
        if (patch.kind === 'snapshot') {
          // 整表替换：快照全部格都是变更格（值/公式被替换，跨表引用方需联动重算）。
          // 被清空的旧格（旧快照有、新快照无）同样标脏——否则引用它们的跨表公式缓存 stale
          for (const item of patch.snapshot.cells) {
            changed.push({ sheet: this, addr: { row: item.row, col: item.col } })
          }
          const beforeSnapshot = mutation.undo.find(
            (p): p is Extract<Patch, { kind: 'snapshot' }> => p.kind === 'snapshot'
          )?.snapshot
          if (beforeSnapshot) {
            const afterKeys = new Set(patch.snapshot.cells.map((item) => `${item.row},${item.col}`))
            for (const item of beforeSnapshot.cells) {
              if (!afterKeys.has(`${item.row},${item.col}`)) {
                changed.push({ sheet: this, addr: { row: item.row, col: item.col } })
              }
            }
          }
        }
      }
    }
    const derived = this.formulaGraph.recalc(changed)
    if (derived.length === 0) return undefined
    for (const patch of derived) this.boundApplyPatch(patch, 'redo')
    return { redo: derived, undo: [...derived].reverse() }
  }
}
