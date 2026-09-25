import {
  EditorRegistry,
  ListTable,
  type CellRange as EngineCellRange,
  type CellRenderer,
  type ColumnDefine,
  type ListTableOptions
} from '@infinite-table/core'
import { excelKeymapPreset } from '@infinite-table/plugins'

import type { CellAddress, CellRange } from '../core/address'
import { colIndexToName } from '../core/address'
import type { CellValue } from '../core/cell-store'
import type { Sheet } from '../core/sheet'
import {
  buildContextMenuInfo,
  hitTestSheetAddr as hitTestSheetAddrAt,
  type SheetGridContextMenuInfo
} from './grid-coords'
import { GridFloatImages } from './grid-float-images'
import {
  createEngineCellStyle,
  createEngineDisplayValue,
  createSheetTableModel,
  getSheetDisplayValue,
  type ResolveCellStyleHook,
  type ResolveDisplayValue
} from './grid-model'
import { GridRowHeightEngine } from './grid-row-height-engine'
import { GridSelectionController } from './grid-selection-controller'
import {
  SHEET_DEFAULT_COL_WIDTH,
  SHEET_DEFAULT_ROW_HEIGHT,
  SHEET_GRID_THEME,
  SHEET_HEADER_HEIGHT,
  SHEET_ROW_HEADER_WIDTH
} from './grid-theme'

/** 动态单元格渲染 hook（门面形态）：返回引擎 CellRenderer 接管该格内容绘制，undefined 回落默认渲染 */
export type ResolveCellRenderer = (
  addr: CellAddress,
  base: CellValue | undefined
) => CellRenderer | undefined

/** 编辑器注册名（实例级 EditorRegistry；引擎无全局注册表，无泄露坑） */
const EDITOR_NAME = 'sheet-text'

/** 容器未布局时的视口兜底尺寸（happy-dom / 隐藏挂载场景） */
const FALLBACK_VIEW_W = 960
const FALLBACK_VIEW_H = 420

export interface SheetGridOptions {
  container: HTMLElement
  sheet: Sheet
  rows?: number
  cols?: number
  /** 表视口宽（CSS 像素）；缺省测量容器，未布局回落 960 */
  width?: number
  /** 表视口高（CSS 像素）；缺省测量容器，未布局回落 420 */
  height?: number
  resolveDisplayValue?: ResolveDisplayValue
  resolveCellStyle?: ResolveCellStyleHook
  resolveCellRenderer?: ResolveCellRenderer
  onContextMenu?: (info: SheetGridContextMenuInfo) => void
  onEditStart?: (addr: CellAddress) => void
  onEditEnd?: (addr: CellAddress) => void
  interceptSelection?: () => boolean
  onSelectionIntercept?: (range: CellRange) => void
  readonly?: boolean
  /** 是否显示行号列，默认 true */
  showRowHeader?: boolean
  /** 是否显示列字母表头，默认 true */
  showColHeader?: boolean
}

/**
 * 引擎适配层 Facade 入口类：ultra-ui Sheet 模型 ↔ `@infinite-table/core` ListTable。
 *
 * 数据面模型直挂（TableModel 适配 Sheet 存储，编辑提交经引擎回写 Sheet 命令系统）；
 * 样式/显示 pull 式按格取值（引擎渲染热路径回调，模型变更无需推送）；选区/冻结/
 * 合并/浮动图经公开事件与运行时 API 双向同步。渲染、触控/惯性滚动、表头拖选、
 * 填充柄交互、编辑浮层、共享边裁决均为引擎内置，无 vtable 绕坑代码。
 */
export class SheetGrid {
  private readonly sheet: Sheet
  private readonly table: ListTable
  private readonly container: HTMLElement
  private readonly hooks: {
    resolveDisplayValue?: ResolveDisplayValue
    resolveCellStyle?: ResolveCellStyleHook
    resolveCellRenderer?: ResolveCellRenderer
  }
  private readonly isReadonly: boolean
  private readonly showRowHeader: boolean
  private readonly showColHeader: boolean
  private readonly rowHeightEngine: GridRowHeightEngine
  private readonly selectionController: GridSelectionController
  private readonly floatImages: GridFloatImages
  private readonly disposers: (() => void)[] = []
  /** LRU 可见性：隐藏实例停用视图同步（只置脏），激活时一次性全量同步 */
  private visible = true
  private dirty = false
  private resyncScheduled = false
  /** 隐藏期间发生值变更的行（激活后补 wrap 行高估算） */
  private pendingWrapRows = new Set<number>()
  private released = false
  private resizeObserver: ResizeObserver | undefined
  /** 已应用到引擎的合并区签名（判重跳过） */
  private lastMergeSignature = ''

  constructor(options: SheetGridOptions) {
    this.sheet = options.sheet
    this.container = options.container
    this.hooks = {
      resolveDisplayValue: options.resolveDisplayValue,
      resolveCellStyle: options.resolveCellStyle,
      resolveCellRenderer: options.resolveCellRenderer
    }
    this.isReadonly = options.readonly ?? false
    this.showRowHeader = options.showRowHeader ?? true
    this.showColHeader = options.showColHeader ?? true

    // options 仅扩张：已声明更小的模型尺寸（删行后）不被 props 下限撑回；
    // 与已存数据高水位一次 max 合并（原两次连续 ensureTableSize 合并为一次声明）
    this.sheet.ensureTableSize(
      Math.max(options.rows ?? 100, this.sheet.rowCount),
      Math.max(options.cols ?? 26, this.sheet.colCount)
    )
    const rows = Math.max(this.sheet.rows, 1)
    const cols = Math.max(this.sheet.cols, 1)

    this.normalizeContainer()

    // wrap 估算先写模型：行高覆盖在构造后统一落地
    this.rowHeightEngine = new GridRowHeightEngine(this.sheet, rows, cols)
    this.rowHeightEngine.applyWrapEstimates(SHEET_DEFAULT_COL_WIDTH)

    const editorRegistry = new EditorRegistry()
    if (!this.isReadonly) editorRegistry.registerEditor(EDITOR_NAME, {})

    this.table = new ListTable({
      width: options.width ?? this.measureContainerWidth(),
      height: options.height ?? this.measureContainerHeight(),
      columns: this.buildColumns(cols),
      model: createSheetTableModel(this.sheet),
      resolveDisplayValue: createEngineDisplayValue(this.sheet, this.hooks),
      resolveCellStyle: createEngineCellStyle(this.sheet, this.hooks),
      // 仅宿主提供 hook 时安装分发器：渲染热路径零差异（ADR-0004）
      ...(this.hooks.resolveCellRenderer
        ? {
            resolveCellRenderer: (col: number, row: number): CellRenderer | null =>
              this.resolveCellLayout(col, row)
          }
        : {}),
      resolveEditable:
        this.isReadonly === false
          ? (col: number, row: number) => !this.sheet.isCellReadonly({ row, col })
          : undefined,
      editorRegistry,
      editorMaxLength: 50000,
      rowHeight: SHEET_DEFAULT_ROW_HEIGHT,
      defaultColWidth: SHEET_DEFAULT_COL_WIDTH,
      headerHeight: SHEET_HEADER_HEIGHT,
      rowHeaderWidth: SHEET_ROW_HEADER_WIDTH,
      showRowHeader: this.showRowHeader,
      showColHeader: this.showColHeader,
      theme: SHEET_GRID_THEME,
      frozenColCount: this.sheet.frozen.cols,
      frozenRowCount: this.sheet.frozen.rows,
      mergeCells: this.readMergeCells(),
      canResizeCol: this.isReadonly ? () => false : undefined,
      canResizeRow: this.isReadonly ? () => false : undefined,
      // Excel 键位组合预设（Enter 进编辑 / 关闭 Ctrl 加选）；只读覆盖为关闭
      ...(this.isReadonly ? {} : excelKeymapPreset),
      ctrlMultiSelect: false,
      editCellOnEnter: !this.isReadonly,
      hostOptions: { container: this.container }
    } satisfies ListTableOptions)

    // 构造期一次落地行列尺寸覆盖（列宽已随列定义写入，行为运行时 API）
    for (const [row, height] of this.sheet.getRowHeights()) {
      if (height !== SHEET_DEFAULT_ROW_HEIGHT) this.table.setRowHeight(row, height)
    }
    this.lastMergeSignature = JSON.stringify(this.readMergeCells())

    this.selectionController = new GridSelectionController(this.sheet, this.table, {
      isReadonly: this.isReadonly,
      container: this.container,
      interceptSelection: options.interceptSelection,
      onSelectionIntercept: options.onSelectionIntercept
    })
    this.disposers.push(...this.selectionController.bind())
    // 模型初始选区（默认 A1 / 宿主预置）落引擎画布：native 初挂即绘制活动格选区框
    this.selectionController.syncInitialSelection()

    this.floatImages = new GridFloatImages({
      table: this.table,
      sheet: this.sheet,
      readonly: this.isReadonly
    })
    this.floatImages.sync()
    this.disposers.push(() => this.floatImages.dispose())

    this.bindSheetEvents()
    this.bindKeyboard()
    this.bindWheel()
    this.bindContextMenu(options.onContextMenu)
    this.bindEditLifecycle(options.onEditStart, options.onEditEnd)
    this.bindResize()
    this.bindFocus()
  }

  /** 底层引擎表实例（调试/测试用） */
  getTable(): ListTable {
    return this.table
  }

  /** 容器内相对坐标 → 模型地址（行号/列头返回 null）；宿主拖放命中用 */
  hitTestSheetAddr(x: number, y: number): CellAddress | null {
    return hitTestSheetAddrAt(this.table, x, y)
  }

  /**
   * 选区锚点（fx 引用拾取等编辑会话）：锚定格以选区样式持续绘制（合并格自动按
   * 包围盒展开），实际选区照常流动；null 清除。纯视图态，不写模型。
   */
  setSelectionAnchor(addr: CellAddress | null): void {
    if (this.released) return
    this.table.setSelectionAnchor(addr)
  }

  /**
   * LRU 可见性：隐藏只置脏；激活时若脏则一次性全量同步（选区/冻结/合并/
   * 行列尺寸/浮动图/可视窗口刷新），隐藏期间的值变更补 wrap 行高估算。
   */
  setVisible(on: boolean): void {
    if (this.released) return
    this.visible = on
    if (on && this.dirty) {
      this.dirty = false
      this.fullResync()
    }
  }

  release(): void {
    if (this.released) return
    this.released = true
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined
    this.table.destroy()
  }

  /**
   * 模型尺寸覆盖 → 引擎 table 即时同步（右键菜单数值项写入路径；`Sheet.setRowHeight`
   * /`setColWidth` 不发事件，拖拽路径经 resize 事件已即时生效，此路径补齐门面写入）。
   * 对齐拖拽落定语义：列宽变化重估该列各内容行 wrap 行高（只升不降），几何重绘由
   * 引擎 set API 自带；隐藏实例只置脏，激活时 fullResync 全量落地。
   */
  applyAxisSizes(axis: 'row' | 'col', indexes: number[]): void {
    if (this.released) return
    if (!this.visible) {
      this.dirty = true
      return
    }
    if (axis === 'row') {
      for (const row of indexes) {
        const height = this.sheet.getRowHeight(row)
        if (height != null && this.table.getRowHeight(row) !== height) {
          this.table.setRowHeight(row, height)
        }
      }
      return
    }
    for (const col of indexes) {
      const width = this.sheet.getColWidth(col)
      if (width == null || this.table.getColWidth(col) === width) continue
      this.table.setColWidth(col, width)
      // 列宽变化影响 wrap 折行：该列各行重估 wrap 行高（同拖拽落定路径）
      for (const row of this.sheet.store.rowsForColumn(col)) {
        this.rowHeightEngine.syncWrapRowHeight(row, this.table)
      }
    }
  }

  // ─── 构造装配 ───────────────────────────────────────────

  private buildColumns(cols: number): ColumnDefine[] {
    return Array.from({ length: cols }, (_, col) => ({
      field: String(col),
      title: colIndexToName(col),
      // 列宽进列定义：构造期一次布局，避免逐列 setColWidth 反复全量重建
      width: this.sheet.getColWidth(col) ?? SHEET_DEFAULT_COL_WIDTH,
      // 单元格级只读由 resolveEditable 拦截；整表只读不注册编辑器
      ...(this.isReadonly ? {} : { editor: EDITOR_NAME })
    }))
  }

  /** 读取模型合并区为引擎区间（过滤模型越界项；跨冻结边界合并区引擎合法） */
  private readMergeCells(): EngineCellRange[] {
    return this.sheet.merges
      .getMerges()
      .filter((merge) => merge.end.row < this.sheet.rows && merge.end.col < this.sheet.cols)
      .map((merge) => ({
        startCol: merge.start.col,
        startRow: merge.start.row,
        endCol: merge.end.col,
        endRow: merge.end.row
      }))
  }

  /**
   * custom renderer 按格分发器（ADR-0004）：仅数据格回调宿主 hook（引擎命中
   * 已合并区路由主格）；hook 返回 undefined 时回落默认渲染。
   */
  private resolveCellLayout(col: number, row: number): CellRenderer | null {
    if (col >= 0 && row >= 0) {
      const base = getSheetDisplayValue(this.sheet, col, row, this.hooks)
      const renderer = this.hooks.resolveCellRenderer?.({ row, col }, base)
      if (renderer) return renderer
    }
    return null
  }

  /** 容器定位归一：引擎层画布绝对定位，静态容器会导致多实例叠放错位 */
  private normalizeContainer(): void {
    try {
      if (getComputedStyle(this.container).position === 'static') {
        this.container.style.position = 'relative'
      }
    } catch {
      // 无 getComputedStyle 环境（极端测试）跳过
    }
  }

  private measureContainerWidth(): number {
    return this.container.clientWidth || FALLBACK_VIEW_W
  }

  private measureContainerHeight(): number {
    return this.container.clientHeight || FALLBACK_VIEW_H
  }

  // ─── 事件接线 ───────────────────────────────────────────

  private bindSheetEvents(): void {
    const syncWrapRow = (row: number): void => {
      if (this.released) return
      if (!this.visible) {
        this.pendingWrapRows.add(row)
        this.dirty = true
        return
      }
      this.rowHeightEngine.syncWrapRowHeight(row, this.table)
    }

    const scheduleResync = (): void => {
      if (this.released || this.resyncScheduled) return
      this.resyncScheduled = true
      queueMicrotask(() => {
        this.resyncScheduled = false
        if (this.released) return
        if (!this.visible) {
          this.dirty = true
          return
        }
        this.applyMerges()
        this.refreshWindow()
      })
    }

    const scheduleFloatSync = (): void => {
      if (this.released) return
      if (!this.visible) {
        this.dirty = true
        return
      }
      this.floatImages.sync()
    }

    this.disposers.push(
      this.sheet.on('cell-change', ({ addr }) => syncWrapRow(addr.row)),
      // 拖拽落定持久化：行列尺寸写模型（切 sheet 重建后还原；不进 undo 同旧约定）
      this.table.onRowResizeEnd((event) => {
        this.sheet.setRowHeight(event.row, event.height)
      }),
      this.table.onColResizeEnd((event) => {
        this.sheet.setColWidth(event.col, event.width)
        // 列宽变化影响 wrap 折行：该列各行重估 wrap 行高
        for (const row of this.sheet.store.rowsForColumn(event.col)) {
          syncWrapRow(row)
        }
      }),
      this.sheet.on('merge-change', () => scheduleResync()),
      this.sheet.on('content-reset', () => {
        scheduleResync()
        scheduleFloatSync()
      }),
      this.sheet.on('axis-style-change', () => scheduleResync()),
      this.sheet.on('meta-change', ({ addr }) => {
        // 只读标记的编辑拦截在下次 startEdit 拉取生效；占位样式覆盖需刷新可视窗口
        if (addr) return
        scheduleResync()
      }),
      this.sheet.on('frozen-change', () => {
        if (this.released) return
        if (!this.visible) {
          this.dirty = true
          return
        }
        this.applyFrozen()
      }),
      this.sheet.on('image-change', () => scheduleFloatSync()),
      this.sheet.on('structure-change', () => {
        // 行列数运行时变化超出发擎适配面（引擎维度构造期固定），交宿主重建实例
        if (this.released) return
        if (!this.visible) this.dirty = true
      })
    )
  }

  /** 合并区运行时整体替换（签名判重跳过无变化；引擎校验失败抛错——越界项构造期已过滤） */
  private applyMerges(): void {
    const merges = this.readMergeCells()
    const signature = JSON.stringify(merges)
    if (this.lastMergeSignature === signature) return
    this.lastMergeSignature = signature
    this.table.setMergeCells(merges)
  }

  /** 冻结映射：模型冻结数即引擎数据冻结数（行列头不计数，无 ±1） */
  private applyFrozen(): void {
    const frozen = this.sheet.frozen
    if (this.table.getFrozenRowCount() !== frozen.rows) this.table.setFrozenRowCount(frozen.rows)
    if (this.table.getFrozenColCount() !== frozen.cols) this.table.setFrozenColCount(frozen.cols)
  }

  /** 可视窗口刷新（pull 式样式/显示的触发器）：窗口内逐格局部失效，批内合并提交 */
  private refreshWindow(): void {
    const { rows, cols } = this.table.getBodyVisibleCellRange()
    this.table.batchUpdate(() => {
      for (let row = rows.start; row < rows.end; row++) {
        for (let col = cols.start; col < cols.end; col++) {
          this.table.refreshCell(col, row)
        }
      }
    })
  }

  /** 全量同步（激活/隐藏后切回）：选区/冻结/合并/行列尺寸/浮动图/可视窗口 */
  private fullResync(): void {
    const wrapRows = this.pendingWrapRows
    this.pendingWrapRows = new Set()
    for (const row of wrapRows) this.rowHeightEngine.syncWrapRowHeight(row, this.table)
    this.applyFrozen()
    this.applyMerges()
    for (const [col, width] of this.sheet.getColWidths()) {
      if (this.table.getColWidth(col) !== width) this.table.setColWidth(col, width)
    }
    for (const [row, height] of this.sheet.getRowHeights()) {
      if (this.table.getRowHeight(row) !== height) this.table.setRowHeight(row, height)
    }
    this.floatImages.sync()
    this.refreshWindow()
    this.selectionController.pushSelectionToTable(this.sheet.getSelection())
  }

  private bindContextMenu(onContextMenu?: (info: SheetGridContextMenuInfo) => void): void {
    if (!onContextMenu) return
    this.disposers.push(
      this.table.onContextMenu((event) => {
        onContextMenu(buildContextMenuInfo(this.table, this.container, event))
      })
    )
  }

  private bindEditLifecycle(
    onEditStart?: (addr: CellAddress) => void,
    onEditEnd?: (addr: CellAddress) => void
  ): void {
    if (onEditStart) {
      this.disposers.push(
        this.table.onEditStart((event) => onEditStart({ row: event.row, col: event.col }))
      )
    }
    if (onEditEnd) {
      this.disposers.push(
        this.table.onEditEnd((event) => onEditEnd({ row: event.row, col: event.col }))
      )
    }
  }

  /** 全局快捷键：Ctrl/Cmd+Z 撤销、Shift+Z / Ctrl+Y 重做（模型命令栈），Ctrl+A 全选，Delete 删选中图 */
  private bindKeyboard(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        return
      // Delete/Backspace：删除选中浮动图片（无选中不接管；编辑器输入已被上方守卫拦截）
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (this.isReadonly) return
        if (!this.floatImages.getSelectedId()) return
        event.preventDefault()
        event.stopPropagation()
        this.floatImages.removeSelected()
        return
      }
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 'a' && !event.shiftKey) {
        this.table.selectAll()
        event.preventDefault()
        return
      }
      if (this.isReadonly) return
      if (key === 'z' && !event.shiftKey) {
        if (this.sheet.undo()) event.preventDefault()
      } else if ((key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey)) {
        if (this.sheet.redo()) event.preventDefault()
      }
    }
    this.container.addEventListener('keydown', onKeyDown)
    this.disposers.push(() => this.container.removeEventListener('keydown', onKeyDown))
  }

  /** 宿主滚轮接线：引擎无内置滚轮；shift+deltaY→deltaX 换轴（Chrome 不自动换轴） */
  private bindWheel(): void {
    const onWheel = (event: WheelEvent): void => {
      let deltaX = Number.isFinite(event.deltaX) ? event.deltaX : 0
      let deltaY = Number.isFinite(event.deltaY) ? event.deltaY : 0
      if (event.shiftKey && deltaY && !deltaX) {
        deltaX = deltaY
        deltaY = 0
      }
      if (!deltaX && !deltaY) return
      this.table.scrollBy(deltaX, deltaY)
      if (event.cancelable) event.preventDefault()
    }
    this.container.addEventListener('wheel', onWheel, { passive: false })
    this.disposers.push(() => this.container.removeEventListener('wheel', onWheel))
  }

  /** 容器 resize 原地自适应（不重建实例，滚动位置与选区保留） */
  private bindResize(): void {
    if (typeof ResizeObserver === 'undefined') return
    this.resizeObserver = new ResizeObserver(() => {
      if (this.released) return
      this.table.resize(this.measureContainerWidth(), this.measureContainerHeight())
    })
    this.resizeObserver.observe(this.container)
  }

  /**
   * 容器可聚焦（tabindex="-1"：不进 Tab 序，指针/挂载编程聚焦）——键盘事件
   * 经冒泡进入容器监听（撤销/重做/引擎方向键导航）；对齐引擎 demo 宿主契约。
   */
  private bindFocus(): void {
    this.container.tabIndex = -1
    // 指针按下聚焦容器；编辑器输入等容器内已有焦点不夺（其 Cmd/Ctrl+Z 走原生文本撤销）
    const onPointerDown = (): void => {
      if (!this.container.contains(document.activeElement)) {
        this.container.focus({ preventScroll: true })
      }
    }
    this.container.addEventListener('pointerdown', onPointerDown)
    this.disposers.push(() => this.container.removeEventListener('pointerdown', onPointerDown))
    // 挂载即聚焦：指针点击前键盘快捷键即可用；preventScroll 避免首屏滚动跳位。
    // 构造期宿主可能仍隐藏（focus 静默失败），下一帧兜底重试一次；
    // 重试仅在期间无其它元素获焦（activeElement 仍为 body）时进行，不抢即时焦点
    this.container.focus({ preventScroll: true })
    if (document.activeElement !== this.container) {
      requestAnimationFrame(() => {
        if (this.released) return
        if (document.activeElement !== document.body) return
        this.container.focus({ preventScroll: true })
      })
    }
  }
}
