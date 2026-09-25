import {
  normalizeRange,
  type ListTable,
  type RangeBounds,
  type SelectionSnapshot
} from '@infinite-table/core'

import { createRange, type CellAddress, type CellRange } from '../core/address'
import { computeFillTargetRange, generateFill, type FillDirection } from '../core/fill'
import type { SelectionState } from '../core/selection'
import type { Sheet } from '../core/sheet'

export interface GridSelectionControllerOptions {
  /** 整表只读：禁用填充柄写入口（选区照常） */
  isReadonly?: boolean
  interceptSelection?: () => boolean
  onSelectionIntercept?: (range: CellRange) => void
  /** 引擎容器：引用拾取手势接线（pointerdown 起手置位 / window 抬手收敛） */
  container?: HTMLElement
}

/** 引擎选区段 → 模型区域（min/max 归一，闭区间） */
function boundsToSheetRange(bounds: RangeBounds): CellRange {
  return {
    start: { row: bounds.minRow, col: bounds.minCol },
    end: { row: bounds.maxRow, col: bounds.maxCol }
  }
}

/** 快照末段 → 模型区域（画布选区写模型的取段口径：末段为最新交互段） */
function lastSnapshotRange(snapshot: SelectionSnapshot): CellRange | null {
  const last = snapshot.ranges[snapshot.ranges.length - 1]
  if (!last) return null
  return boundsToSheetRange(normalizeRange(last))
}

/** 引擎填充拖拽方向：目标范围相对锚定段的扩展侧（无扩展为 null） */
function fillDirection(anchor: RangeBounds, target: RangeBounds): FillDirection | null {
  if (target.maxRow > anchor.maxRow) return 'bottom'
  if (target.minRow < anchor.minRow) return 'top'
  if (target.maxCol > anchor.maxCol) return 'right'
  if (target.minCol < anchor.minCol) return 'left'
  return null
}

/** 两范围并集（min/max 取大） */
function unionBounds(a: RangeBounds, b: RangeBounds): RangeBounds {
  return {
    minCol: Math.min(a.minCol, b.minCol),
    minRow: Math.min(a.minRow, b.minRow),
    maxCol: Math.max(a.maxCol, b.maxCol),
    maxRow: Math.max(a.maxRow, b.maxRow)
  }
}

/**
 * 选区双向同步与填充生成（引擎公开事件 ↔ Sheet 模型）：
 * - 表格 → 模型：`onSelectionChange` 驱动 `sheet.selectRange`（画布选区落模型）；
 *   引用选择拦截命中时不落模型，把模型选区经 `applyExternalSelection` 回推画布
 *   （引擎侧不广播，天然断开回环），不滚动视口——点选远处参数格不应把视口拉回目标格；
 * - 模型 → 表格：`selection-change` → `applyExternalSelection` + 不可见目标滚动可见
 *   （错误面板定位等模型驱动选区）；引擎外部回写不广播，无回环；
 * - 填充柄：内核画柄抛事件（`onFillHandleDown`/`onFillDragEnd`），生成算法用
 *   ultra-ui 自有 `generateFill`（公式相对引用位移 + tile，写经 `setCells` 单 undo 单元），
 *   只读格不被填充覆盖（从只读格向外复制仍允许，只拦截写入目标）。
 */
export class GridSelectionController {
  private readonly sheet: Sheet
  private readonly table: ListTable
  private readonly isReadonly: boolean
  private readonly interceptSelection?: () => boolean
  private readonly onSelectionIntercept?: (range: CellRange) => void
  private readonly container?: HTMLElement
  /** 引用拾取手势期（pointerdown 起手 → pointerup 收敛）：选区变更只记录不回交 */
  private picking = false
  /** 手势期最新拦截范围（引擎连续发射，抬手取末值） */
  private gestureRange: CellRange | null = null

  constructor(sheet: Sheet, table: ListTable, options: GridSelectionControllerOptions = {}) {
    this.sheet = sheet
    this.table = table
    this.isReadonly = options.isReadonly ?? false
    this.interceptSelection = options.interceptSelection
    this.onSelectionIntercept = options.onSelectionIntercept
    this.container = options.container
  }

  /** 接线引擎选区/填充事件与模型选区订阅；返回退订函数集合 */
  bind(): (() => void)[] {
    const disposers: (() => void)[] = []

    // 引用拾取手势接线：容器 capture 阶段 pointerdown 起手置位（先于引擎 bodyRoot
    // 的目标监听，保证首个选区发射前 picking 已就位），window 级抬起收敛
    // （拖出容器也兜底）；无容器（单测直挂）退化为即时拦截
    if (this.container) {
      const onPointerDown = (): void => {
        if (this.interceptSelection?.()) this.picking = true
      }
      this.container.addEventListener('pointerdown', onPointerDown, true)
      disposers.push(() => this.container?.removeEventListener('pointerdown', onPointerDown, true))
      const onPointerUp = (): void => this.finishPickGesture()
      window.addEventListener('pointerup', onPointerUp)
      disposers.push(() => window.removeEventListener('pointerup', onPointerUp))
    }

    disposers.push(
      this.table.onSelectionChange((snapshot) => {
        const range = lastSnapshotRange(snapshot)
        if (!range) return
        // 指针拾取手势期只记录最新范围：引擎选区连续发射（vtable 时代为抬手单事件），
        // 若逐事件回交，首个引用插入后 fx 光标离开引用触发位、上下文断裂，
        // 拖选余段会跌落普通选区路径污染模型；抬手后一次回交最终范围。
        // 非手势选区变更（程序化 selectCells / 键盘）走下方即时拦截路径
        if (this.picking && this.interceptSelection?.()) {
          this.gestureRange = range
          return
        }
        if (this.tryInterceptSelection(range)) {
          this.restoreInterceptedSelection()
          return
        }
        this.sheet.selectRange(range, this.resolveSelectionActive(snapshot, range))
      })
    )

    if (!this.isReadonly) {
      disposers.push(
        this.table.onFillDragEnd((event) => {
          this.commitFill(event.anchor, event.target)
        })
      )
    }

    disposers.push(
      this.sheet.on('selection-change', (state) => {
        this.pushSelectionToTable(state)
      })
    )

    return disposers
  }

  /** 挂载后初始同步：模型既有选区（默认 A1 / 宿主预置选区）落引擎画布绘制，
   * 不滚动视口——native 初挂即绘制活动格选区框，缺失会整页少画初始选区 */
  syncInitialSelection(): void {
    this.pushSelectionToTable(this.sheet.getSelection(), { scroll: false })
  }

  /** 模型选区 → 画布（applyExternalSelection 不广播防回环）；不可见活动格滚动可见 */
  pushSelectionToTable(state: SelectionState, options: { scroll?: boolean } = {}): void {
    let range =
      state.ranges[0] ??
      (state.activeCell ? { start: state.activeCell, end: state.activeCell } : null)
    if (!range) return
    // 单格选区若处于合并单元格内部，自动扩展到该合并单元格的完整包围盒
    if (range.start.row === range.end.row && range.start.col === range.end.col) {
      const merge = this.sheet.merges.getMergeAt(range.start)
      if (merge) range = merge
    }
    const focus = state.activeCell
      ? {
          col: Math.min(Math.max(state.activeCell.col, range.start.col), range.end.col),
          row: Math.min(Math.max(state.activeCell.row, range.start.row), range.end.row)
        }
      : range.start
    this.table.applyExternalSelection({
      ranges: [
        {
          start: { col: range.start.col, row: range.start.row },
          end: { col: range.end.col, row: range.end.row }
        }
      ],
      focus
    })
    if (options.scroll !== false && !this.isCellVisible(focus.col, focus.row)) {
      this.table.scrollToCell(focus)
    }
  }

  /** 画布选区写模型时整行/整列选区的活动格（落在用户交互的行/列上，Excel 语义） */
  private resolveSelectionActive(
    snapshot: SelectionSnapshot,
    range: CellRange
  ): CellAddress | undefined {
    const bounds = normalizeRange({
      start: { col: range.start.col, row: range.start.row },
      end: { col: range.end.col, row: range.end.row }
    })
    const cols = this.sheet.cols
    const rows = this.sheet.rows
    const spansAllCols = bounds.minCol === 0 && bounds.maxCol >= cols - 1
    const spansAllRows = bounds.minRow === 0 && bounds.maxRow >= rows - 1
    if (!spansAllCols && !spansAllRows) return undefined
    const focus = snapshot.focus
    if (!focus) return undefined
    return {
      row: Math.min(Math.max(focus.row, range.start.row), range.end.row),
      col: Math.min(Math.max(focus.col, range.start.col), range.end.col)
    }
  }

  /** 引用选择拦截命中后：画布选区回推为模型选区（公式目标格高亮），不滚动 */
  private restoreInterceptedSelection(): void {
    this.pushSelectionToTable(this.sheet.getSelection(), { scroll: false })
  }

  /** 引用选择拦截：宿主 hook 命中即拦截画布选区回写并抛拦截区域 */
  private tryInterceptSelection(range: CellRange): boolean {
    if (!this.interceptSelection?.()) return false
    this.onSelectionIntercept?.(range)
    return true
  }

  /** 引用拾取手势收敛（window pointerup）：抬手一次回交最新范围并恢复模型选区视觉（不滚动） */
  private finishPickGesture(): void {
    if (!this.picking) return
    this.picking = false
    const range = this.gestureRange
    this.gestureRange = null
    if (range) this.onSelectionIntercept?.(range)
    this.restoreInterceptedSelection()
  }

  /** 填充生成落模型：方向按目标范围扩展侧推导，生成值过滤只读格后一次 setCells（单 undo 单元） */
  private commitFill(anchor: RangeBounds, target: RangeBounds): void {
    const direction = fillDirection(anchor, target)
    if (!direction) return
    const source = boundsToSheetRange(anchor)
    const expanded = boundsToSheetRange(unionBounds(anchor, target))
    const fillTarget = computeFillTargetRange(source, direction, expanded)
    if (!fillTarget) return
    const items = generateFill({
      source,
      target: fillTarget,
      direction,
      getCellData: (a) => this.sheet.getCellData(a)
    })
    const writable = items.filter((item) => !this.sheet.isCellReadonly(item.addr))
    if (writable.length === 0) return
    this.sheet.setCells(writable)
    this.sheet.selectRange(createRange(source.start, expanded.end))
  }

  /** 格是否完整落在画布内容区内（滚动可见性判定） */
  private isCellVisible(col: number, row: number): boolean {
    const rect = this.table.getCellRelativeRect(col, row)
    if (!rect) return false
    const drawRange = this.table.getDrawRange()
    return (
      rect.x >= drawRange.x &&
      rect.y >= drawRange.y &&
      rect.x + rect.width <= drawRange.x + drawRange.width &&
      rect.y + rect.height <= drawRange.y + drawRange.height
    )
  }
}
