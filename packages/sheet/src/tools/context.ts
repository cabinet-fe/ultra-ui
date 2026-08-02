import type { CellAddress, CellRange } from '../core/address'
import type { CellData, CellValue } from '../core/cell-store'
import type { HistoryState } from '../core/command/history'
import type { SetCellValueItem } from '../core/command/set-cell-value'
import type { CellInfo } from '../core/merge-manager'
import type { SelectionState } from '../core/selection'
import type { Sheet } from '../core/sheet'

/**
 * SheetContext：工具的唯一操作门面。
 *
 * 工具（内置与第三方）对表格的全部操作都经由此门面：
 * - 读方法直达当前活动 sheet（语义与 Sheet 同名方法一致）
 * - 写方法全部走命令系统，天然进入 undo 历史——扩展无法绕过命令系统
 * - 不暴露 Sheet 实例本身，保证门面就是扩展能力的全部边界
 * - USheet 切换 sheet tab 后，同一上下文自动指向新的活动 sheet
 */
export interface SheetContext {
  /** 当前活动 sheet 名 */
  readonly sheetName: string

  // ─── 选区 ────────────────────────────────────────────────
  getSelection(): SelectionState
  /** 选中单格（被覆盖格自动定位锚点） */
  selectCell(addr: CellAddress): void
  selectRange(range: CellRange): void

  // ─── 读取 ────────────────────────────────────────────────
  /** 原始存储语义读取（被合并覆盖格 → undefined） */
  getCellData(addr: CellAddress): CellData | undefined
  /** 锚点解析语义读取（被覆盖格 → 锚点的值） */
  getDisplayValue(addr: CellAddress): CellValue | undefined
  /** 合并语义下的单元格信息（普通格 / 合并锚点 / 被覆盖格） */
  getCellInfo(addr: CellAddress): CellInfo

  // ─── 写入（全部经命令系统，可 undo） ───────────────────────
  setCellValue(addr: CellAddress, value: CellValue): void
  setCellFormula(addr: CellAddress, formula: string): void
  /** 批量写入（一次调用 = 一个 undo 单元） */
  setCells(items: SetCellValueItem[]): void
  mergeCells(range: CellRange): CellRange
  unmergeCells(range: CellRange): void
  /** 执行命令注册表中的自定义命令（高级扩展点） */
  executeCommand<R = void>(commandId: string, params: unknown): R | undefined

  // ─── 事务（事务内多次写入合并为一个 undo 单元） ─────────────
  beginTransaction(): void
  commit(): void
  rollback(): void

  // ─── 历史 ────────────────────────────────────────────────
  undo(): boolean
  redo(): boolean
  readonly canUndo: boolean
  readonly canRedo: boolean

  // ─── 事件订阅（订阅时绑定到当前活动 sheet；tab 切换后需重新订阅） ──
  onSelectionChange(handler: (state: SelectionState) => void): () => void
  onHistoryChange(handler: (state: HistoryState) => void): () => void
}

/**
 * 创建工具上下文。
 * @param resolveSheet 活动 sheet 解析器（USheet 传 `() => activeSheet`，
 *   tab 切换后上下文自动指向当前 sheet）；也可直接传 Sheet 实例（无头 / 测试场景）
 */
export function createSheetContext(resolveSheet: Sheet | (() => Sheet)): SheetContext {
  const sheet = typeof resolveSheet === 'function' ? resolveSheet : () => resolveSheet
  return {
    get sheetName() {
      return sheet().name
    },

    getSelection: () => sheet().getSelection(),
    selectCell: (addr) => sheet().selectCell(addr),
    selectRange: (range) => sheet().selectRange(range),

    getCellData: (addr) => sheet().getCellData(addr),
    getDisplayValue: (addr) => sheet().getDisplayValue(addr),
    getCellInfo: (addr) => sheet().getCellInfo(addr),

    setCellValue: (addr, value) => sheet().setCellValue(addr, value),
    setCellFormula: (addr, formula) => sheet().setCellFormula(addr, formula),
    setCells: (items) => sheet().setCells(items),
    mergeCells: (range) => sheet().mergeCells(range),
    unmergeCells: (range) => sheet().unmergeCells(range),
    executeCommand: <R = void>(commandId: string, params: unknown): R | undefined =>
      sheet().executeCommand<R>(commandId, params),

    beginTransaction: () => sheet().beginTransaction(),
    commit: () => sheet().commit(),
    rollback: () => sheet().rollback(),

    undo: () => sheet().undo(),
    redo: () => sheet().redo(),
    get canUndo() {
      return sheet().canUndo
    },
    get canRedo() {
      return sheet().canRedo
    },

    onSelectionChange: (handler) => sheet().on('selection-change', handler),
    onHistoryChange: (handler) => sheet().on('history-change', handler)
  }
}
