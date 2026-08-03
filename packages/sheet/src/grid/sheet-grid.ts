import { ListTable, register } from '@visactor/vtable'
import type { ListTableConstructorOptions } from '@visactor/vtable'
import { InputEditor } from '@visactor/vtable-editors'
import type { EditContext } from '@visactor/vtable-editors'
import type { ITextStyleOption } from '@visactor/vtable/es/ts-types/column/style'
import type { StylePropertyFunctionArg } from '@visactor/vtable/es/ts-types/style-define'

import type { CellAddress, CellRange } from '../core/address'
import { cellKey, colIndexToName, createRange } from '../core/address'
import type { CellValue } from '../core/cell-store'
import { computeFillTargetRange, generateFill, type FillDirection } from '../core/fill'
import type { SelectionState } from '../core/selection'
import type { FrozenState, Sheet } from '../core/sheet'
import { BORDER_SIDES, type BorderLineStyle, type CellStyle } from '../core/style/types'
import {
  SHEET_DEFAULT_ROW_HEIGHT,
  sheetRowSeriesNumberStyle,
  sheetVTableTheme
} from './vtable-theme'

/**
 * VTable 适配层：数据模型完全自持有，ListTable 只做渲染与输入。
 *
 * - 模型 → VTable：records 由 store 行视图桥接；customMergeCell 闭包直读 MergeManager
 *   （VTable 逐格动态求值、无缓存，合并变更后 setRecords 重建场景树即生效）
 * - VTable → 模型：change_cell_value 回写 store；selected_cell 经 resolveAnchor 更新选区
 * - 公式：公式格 record 存计算缓存（显示值）；进入编辑时编辑器显示公式原文（'=f'）。
 *   编辑提交期间模型变更（含公式重算派生格）先入待同步队列，提交结束统一回推表格——
 *   VTable 自己只更新了被编辑格的 record（还是输入文本），派生格它不知道
 * - 键盘：容器 keydown 绑定 undo/redo（Cmd/Ctrl+Z、Cmd/Ctrl+Shift+Z、Ctrl+Y），
 *   编辑器 input 打开时不拦截；编辑态方向键不换格（moveEditCellOnArrowKeys: false）
 * - 填充柄：excelOptions.fillHandle + mousedown/drag_end → core/fill → setCells
 * - 行列尺寸：列宽仅列头；行高仅行号列（包装 _canResizeRow）。稀疏存 Sheet.rowHeights，
 *   RESIZE_ROW_END 同步，重建时还原
 * - 冻结：模型 Sheet.frozen（rows/cols）→ VTable frozenRowCount/frozenColCount
 *   （+1 偏移：列头行 / 行号列；frozen-change 即时生效，tab 重建时从构造选项还原）
 * - 选区回驱：模型 selectCell/selectRange → selection-change → VTable selectCells 高亮 +
 *   scrollToCell 滚动可见（补足「选区单向同步」限制；回驱期间 SELECTED_CELL 不写回模型，防递归）
 * - 坐标换算：行号列不计入 rowHeaderLevelCount，偏移量在首个表格实例上
 *   用 columnHeaderLevelCount + isSeriesNumber 实测并缓存（见 getOffsets）
 */

/** 公式感知编辑器：进入编辑时公式格显示原文（同 Excel），其余格显示当前值 */
class FormulaAwareInputEditor extends InputEditor {
  /** 由 SheetGrid 注入：返回进入编辑时应显示的文本；undefined = 用 VTable 默认值 */
  resolveEditText?: (col: number, row: number) => string | undefined
  /** 由 SheetGrid 注入：进入编辑（onStart）时通知，供公式栏镜像实时文本 */
  notifyEditStart?: (col: number, row: number) => void
  /** 由 SheetGrid 注入：编辑结束（onEnd，提交/取消）时通知，供公式栏退出镜像 */
  notifyEditEnd?: () => void

  override onStart(context: EditContext<string>): void {
    this.notifyEditStart?.(context.col, context.row)
    const text = this.resolveEditText?.(context.col, context.row)
    super.onStart(text === undefined ? context : { ...context, value: text })
  }

  override onEnd(): void {
    // 编辑结束即通知（先于 super：happy-dom 下 element 未挂载时 super 直接 return）
    this.notifyEditEnd?.()
    super.onEnd()
  }
}

/** 编辑器按 grid 实例注册（hook 闭包各自 sheet），名称递增防冲突 */
let editorSeq = 0

/** 右键菜单回调参数（vue 层弹 UContextmenu；grid 不依赖 desktop） */
export interface SheetGridContextMenuInfo {
  x: number
  y: number
  /** body 格地址；行号/列头为 null */
  addr: CellAddress | null
}

/** 线型 → VTable borderLineDash（null = 实线，回落主题） */
const BORDER_STYLE_DASH: Record<BorderLineStyle, number[] | null> = {
  thin: null,
  medium: null,
  thick: null,
  dashed: [4, 2],
  dotted: [1, 2]
}

/**
 * 模型样式 → VTable ITextStyleOption。
 * 四边数组顺序 [top, right, bottom, left]（与 VTable ColorsPropertyDefine 一致）；
 * 未设置的边 = null（回落主题默认边框，即网格线）。
 */
function cellStyleToVTableStyle(style: CellStyle): ITextStyleOption {
  const borderColor: (string | null)[] = [null, null, null, null]
  const borderLineWidth: (number | null)[] = [null, null, null, null]
  const borderLineDash: (number[] | null)[] = [null, null, null, null]
  for (let i = 0; i < BORDER_SIDES.length; i++) {
    const side = BORDER_SIDES[i]
    const edge = side ? style.border?.[side] : undefined
    if (!edge) continue
    borderColor[i] = edge.color
    borderLineWidth[i] = edge.width
    borderLineDash[i] = BORDER_STYLE_DASH[edge.style]
  }
  return {
    ...(style.fill ? { bgColor: style.fill.color } : {}),
    borderColor,
    borderLineWidth,
    borderLineDash
  }
}

/** 从 VTable 事件载荷提取 viewport 坐标（兼容 nativeEvent 嵌套） */
function clientPointFromEvent(event: unknown): { x: number; y: number } | null {
  let current: unknown = event
  for (let i = 0; i < 3 && current && typeof current === 'object'; i++) {
    if ('clientX' in current && typeof (current as { clientX: unknown }).clientX === 'number') {
      const { clientX, clientY } = current as { clientX: number; clientY: number }
      return { x: clientX, y: clientY }
    }
    current = 'nativeEvent' in current ? (current as { nativeEvent: unknown }).nativeEvent : null
  }
  return null
}

export interface SheetGridOptions {
  container: HTMLElement
  sheet: Sheet
  /** 渲染行数，默认 100 */
  rows?: number
  /** 渲染列数，默认 26（A..Z） */
  cols?: number
  /** 单元格右键（已 preventDefault）；由 vue 层弹出菜单 */
  onContextMenu?: (info: SheetGridContextMenuInfo) => void
  /** 进入单元格编辑（双击 / 程序化）时通知（模型地址）；公式栏镜像实时文本用 */
  onEditStart?: (addr: CellAddress) => void
  /** 编辑结束（提交/取消）时通知（模型地址）；公式栏退出镜像用 */
  onEditEnd?: (addr: CellAddress) => void
}

export class SheetGrid {
  private readonly sheet: Sheet
  private readonly table: ListTable
  private readonly container: HTMLElement
  private readonly rows: number
  private readonly cols: number
  private readonly editorName: string
  private readonly onContextMenu?: (info: SheetGridContextMenuInfo) => void
  private readonly onEditStart?: (addr: CellAddress) => void
  private readonly onEditEnd?: (addr: CellAddress) => void
  /** 当前编辑格（模型地址；编辑器 onStart → onEnd 期间非空） */
  private editingAddr: CellAddress | null = null
  private readonly disposers: (() => void)[] = []
  /** 编辑提交期间累积的模型变更（提交结束统一回推表格，覆盖公式派生格） */
  private pendingTableSync: Map<number, CellAddress> | null = null
  /** 实测坐标偏移（行号列数 / 列头行数），首次使用时测量 */
  private offsets?: { colOffset: number; rowOffset: number }
  /** 填充柄：mousedown 时的源选区（模型坐标） */
  private fillSourceRange: CellRange | null = null
  /** 选区回驱进行中：VTable 侧 SELECTED_CELL 不回写模型（防递归） */
  private syncingSelection = false

  constructor(options: SheetGridOptions) {
    this.sheet = options.sheet
    this.container = options.container
    // 视图声明尺寸写入模型（扩张语义）——插入行/列以「渲染尺寸」为基准增长：
    // 否则 _rows 从 0 起步、插入点小于 props 时 max(props, sheet.rows) 恒取 props，
    // 数据平移但渲染窗口不扩大（表现为插入后行/列数不变）
    this.sheet.ensureTableSize(options.rows ?? 100, options.cols ?? 26)
    // 数据高水位（导入/粘贴写入 store 后 rowCount/colCount 升高）也并入渲染尺寸
    this.sheet.ensureTableSize(this.sheet.rowCount, this.sheet.colCount)
    // 渲染尺寸 = max(视图层 props, 模型表格尺寸)；模型 rows/cols 随行列插入/删除/导入增长
    // （ensureTableSize 后 sheet.rows/cols ≥ props，max 恒取模型值，保留作兜底）
    this.rows = Math.max(options.rows ?? 100, this.sheet.rows)
    this.cols = Math.max(options.cols ?? 26, this.sheet.cols)
    this.onContextMenu = options.onContextMenu
    this.onEditStart = options.onEditStart
    this.onEditEnd = options.onEditEnd

    // 每个 grid 实例注册自己的编辑器（hook 闭包本实例的 sheet 与坐标换算）
    this.editorName = `veltra-sheet-input-${editorSeq++}`
    const editor = new FormulaAwareInputEditor()
    editor.resolveEditText = (col, row) => {
      const addr = this.toSheetAddr(this.table, col, row)
      if (!addr) return undefined
      const data = this.sheet.getCellData(this.sheet.merges.resolveAnchor(addr))
      return data?.f ? `=${data.f}` : undefined
    }
    editor.notifyEditStart = (col, row) => {
      const addr = this.toSheetAddr(this.table, col, row)
      if (addr) {
        this.editingAddr = addr
        this.onEditStart?.(addr)
      }
    }
    editor.notifyEditEnd = () => {
      const addr = this.editingAddr
      this.editingAddr = null
      if (addr) this.onEditEnd?.(addr)
    }
    register.editor(this.editorName, editor)

    this.table = new ListTable(options.container, this.buildOptions())
    this.restrictRowResizeToSeriesNumber()
    this.applyStoredRowHeights()
    this.bindTableEvents()
    this.bindSheetEvents()
    this.bindKeyboard()
    // 构造后按模型冻结值校正一次（构造选项已含偏移，此处覆盖外部在构造前的变更）
    this.applyFrozen()
    // 模型已有选区（如 tab 切换重建）→ 回驱 VTable 高亮
    this.pushSelectionToTable(this.sheet.getSelection())
  }

  /** 底层 ListTable 实例（调试与测试用） */
  getTable(): ListTable {
    return this.table
  }

  /** 全量刷新（合并结构变化、批量数据变更后调用） */
  refresh(): void {
    this.table.setRecords(this.buildRecords())
  }

  /** 撤销一步（模型命令历史） */
  undo(): boolean {
    return this.sheet.undo()
  }

  /** 重做一步（模型命令历史） */
  redo(): boolean {
    return this.sheet.redo()
  }

  release(): void {
    for (const dispose of this.disposers) dispose()
    this.disposers.length = 0
    this.table.release()
  }

  // ─── 坐标换算 ─────────────────────────────────────────────

  /**
   * 实测偏移：列头行数取 columnHeaderLevelCount；
   * 行号列不被计入 rowHeaderLevelCount，用 isSeriesNumber 逐列探测。
   * 结果缓存（表格实例不变，布局不变）。
   */
  private getOffsets(table: ListTable): { colOffset: number; rowOffset: number } {
    if (!this.offsets) {
      const rowOffset = table.columnHeaderLevelCount
      let colOffset = 0
      while (colOffset < table.colCount && table.isSeriesNumber(colOffset, rowOffset)) colOffset++
      this.offsets = { colOffset, rowOffset }
    }
    return this.offsets
  }

  /** VTable 坐标 → 模型地址；行号列/列头返回 null */
  private toSheetAddr(table: ListTable, col: number, row: number): CellAddress | null {
    const { colOffset, rowOffset } = this.getOffsets(table)
    const addr = { row: row - rowOffset, col: col - colOffset }
    if (addr.row < 0 || addr.col < 0) return null
    return addr
  }

  /** 模型地址 → VTable 坐标 */
  private toTableCoord(table: ListTable, addr: CellAddress): { col: number; row: number } {
    const { colOffset, rowOffset } = this.getOffsets(table)
    return { col: addr.col + colOffset, row: addr.row + rowOffset }
  }

  // ─── 冻结映射 ────────────────────────────────────────────

  /**
   * 模型冻结值 → VTable frozenRowCount/frozenColCount。
   * 偏移：非转置 ListTable 中列头行（row 0）与行号列（col 0）恒冻结，
   * 且列头列与数据列共享同一表格列——冻结 body N 行/列 = frozen N + 1。
   * 钳制上限：冻结行数 ≤ 渲染行数（总行数 - 列头行），冻结列数 ≤ 渲染列数。
   */
  private static frozenToVTableCounts(
    frozen: FrozenState,
    rows: number,
    cols: number
  ): { frozenRowCount: number; frozenColCount: number } {
    return {
      frozenRowCount: Math.min(frozen.rows + 1, Math.max(rows, 1)),
      frozenColCount: Math.min(frozen.cols + 1, Math.max(cols, 1))
    }
  }

  /** 按当前模型冻结值刷新 VTable 冻结布局（frozen-change 即时生效） */
  private applyFrozen(): void {
    const { frozenRowCount, frozenColCount } = SheetGrid.frozenToVTableCounts(
      this.sheet.frozen,
      this.rows,
      this.cols
    )
    if (this.table.frozenRowCount !== frozenRowCount) this.table.frozenRowCount = frozenRowCount
    if (this.table.frozenColCount !== frozenColCount) this.table.frozenColCount = frozenColCount
  }

  // ─── 选区回驱（模型 → VTable）─────────────────────────────

  /**
   * 模型选区 → VTable 高亮 + 滚动可见。
   * selectCells 自身会触发 SELECTED_CELL 事件（stateManager 同步派发），
   * 用 syncingSelection 拦截回写，避免 VTable ↔ 模型无限循环。
   * 滚动目标优先 activeCell（整行/列头点击的视口边缘锚点），已完整可见时不滚动
   * （scrollToCell 会把目标滚到视口左/上缘，避免点击跳动）。
   */
  private pushSelectionToTable(state: SelectionState): void {
    const range =
      state.ranges[0] ??
      (state.activeCell ? { start: state.activeCell, end: state.activeCell } : null)
    if (!range) return
    const start = this.toTableCoord(this.table, range.start)
    const end = this.toTableCoord(this.table, range.end)
    const scrollAddr = state.activeCell ?? range.start
    const scrollTarget = this.toTableCoord(this.table, scrollAddr)
    // 结构变更（行列删除）后模型选区可能越界：钳制到当前渲染范围
    const clamp = (v: { col: number; row: number }): { col: number; row: number } => ({
      col: Math.min(Math.max(v.col, 1), this.cols),
      row: Math.min(Math.max(v.row, 1), this.rows)
    })
    const startClamped = clamp(start)
    const endClamped = clamp(end)
    const scrollClamped = clamp(scrollTarget)
    // VTable 时序缺陷兜底：mouseup 事件流中 SELECTED_CELL 派发时 eventManager.isDraging
    // 尚未重置（window 级 pointerup 在后）。此时 selectCells 内部的 updateSelectPos 会走
    // 「拖拽扩展」分支：不清空旧选区（旧组件残留成孤儿 → 画布多区域高亮），且对反向
    // 选区（从右往左 / 从下往上拖选）扩展错乱（选区收缩/畸形）。
    // 兜底：回驱前临时复位 isDraging，让 selectCells 走标准「清空-重建」路径；并显式
    // 清空全部选区绘制层 + 组件索引，保证画布只剩当前选区一个框。
    const eventManager = (this.table as unknown as { eventManager?: { isDraging: boolean } })
      .eventManager
    const wasDraging = eventManager?.isDraging === true
    if (wasDraging) eventManager!.isDraging = false
    this.syncingSelection = true
    try {
      this.clearSelectionOverlays()
      this.table.selectCells([{ start: startClamped, end: endClamped }])
      if (!this.isCellVisible(scrollClamped.col, scrollClamped.row)) {
        this.table.scrollToCell({ col: scrollClamped.col, row: scrollClamped.row })
      }
    } finally {
      // window 级 pointerup 稍后会把 isDraging 复位为 false；这里还原现场避免
      // 破坏 VTable 自身的事件流状态
      if (wasDraging) eventManager!.isDraging = true
      this.syncingSelection = false
    }
  }

  /** 清空 VTable 全部选区绘制层（SelectGroup 子节点 + 组件索引 Map） */
  private clearSelectionOverlays(): void {
    const scene = (this.table as unknown as { scenegraph?: { [k: string]: unknown } }).scenegraph
    if (!scene) return
    const groups = [
      'bodySelectGroup',
      'rowHeaderSelectGroup',
      'colHeaderSelectGroup',
      'cornerHeaderSelectGroup',
      'rightFrozenSelectGroup',
      'bottomFrozenSelectGroup',
      'rightTopCornerSelectGroup',
      'leftBottomCornerSelectGroup',
      'rightBottomCornerSelectGroup'
    ]
    for (const name of groups) {
      const group = scene[name] as { removeAllChild?: (deep?: boolean) => void } | undefined
      group?.removeAllChild?.()
    }
    scene.selectedRangeComponents = new Map()
    scene.selectingRangeComponents = new Map()
    scene.customSelectedRangeComponents = new Map()
  }

  /** 目标格（表格坐标）是否完整落在可视区内（冻结区内恒视为可见） */
  private isCellVisible(col: number, row: number): boolean {
    const rect = this.table.getCellRelativeRect(col, row)
    const drawRange = this.table.getDrawRange()
    return (
      rect.left >= drawRange.left &&
      rect.top >= drawRange.top &&
      rect.right <= drawRange.right &&
      rect.bottom <= drawRange.bottom
    )
  }

  // ─── 模型 → VTable ────────────────────────────────────────

  private buildColumns() {
    return Array.from({ length: this.cols }, (_, col) => ({
      field: String(col),
      title: colIndexToName(col),
      // 列级 style 函数回调：按 StyleId 从样式池解析 VTable 样式（逐格动态求值）
      style: (styleArg: StylePropertyFunctionArg) => this.resolveCellStyle(styleArg)
    }))
  }

  /** 模型样式 → VTable 样式（合并格读锚点；无样式回落主题默认） */
  private resolveCellStyle(styleArg: StylePropertyFunctionArg): ITextStyleOption {
    // StylePropertyFunctionArg.table 是 BaseTableAPI 接口；运行时必为 ListTable
    // 实例（本类自建），按既有先例（customMergeCell）断言
    const table = styleArg.table as ListTable
    const addr = this.toSheetAddr(table, styleArg.col, styleArg.row)
    if (!addr) return {}
    const anchor = this.sheet.merges.resolveAnchor(addr)
    const data = this.sheet.store.getCell(anchor)
    const style = data?.s != null ? this.sheet.stylePool.get(data.s) : undefined
    return style ? cellStyleToVTableStyle(style) : {}
  }

  private buildRecords(): Record<string, CellValue>[] {
    const records: Record<string, CellValue>[] = Array.from({ length: this.rows }, () => ({}))
    for (const [addr, data] of this.sheet.store.entries()) {
      if (addr.row < this.rows && addr.col < this.cols && data.v != null) {
        records[addr.row]![String(addr.col)] = data.v
      }
    }
    return records
  }

  private buildOptions(): ListTableConstructorOptions {
    return {
      records: this.buildRecords(),
      columns: this.buildColumns(),
      widthMode: 'standard',
      defaultRowHeight: SHEET_DEFAULT_ROW_HEIGHT,
      // 列宽只在列头（A/B/C…）。行高：VTable rowResizeMode:'header' 以 isHeader()
      // 判定，而行号列 body 格不是 header——设 'header' 会禁用行号列调行高。
      // 因此 row 用 'all'，构造后限制到行号列（见 restrictRowResizeToSeriesNumber）。
      resize: { columnResizeMode: 'header', rowResizeMode: 'all' },
      theme: sheetVTableTheme,
      rowSeriesNumber: { width: 46, style: sheetRowSeriesNumberStyle },
      excelOptions: { fillHandle: true },
      // 禁止浏览器默认右键菜单，改由 CONTEXTMENU_CELL → UContextmenu
      eventOptions: { preventDefaultContextMenu: true },
      editor: this.editorName,
      editCellTrigger: 'doubleclick',
      // 冻结：模型 rows/cols + 偏移 1（列头行 / 行号列；与 frozenToVTableCounts 一致，
      // 此处无法调用需 table 实例的 getOffsets，当前配置偏移恒为 1）
      frozenRowCount: Math.min(this.sheet.frozen.rows + 1, Math.max(this.rows, 1)),
      frozenColCount: Math.min(this.sheet.frozen.cols + 1, Math.max(this.cols, 1)),
      keyboardOptions: {
        moveFocusCellOnTab: true,
        editCellOnEnter: true,
        moveFocusCellOnEnter: true,
        // 编辑中方向键只移输入光标；未编辑时选区导航不受影响
        moveEditCellOnArrowKeys: false,
        selectAllOnCtrlA: true,
        // 始终单选高亮：禁用 Ctrl 追加选区（VTable 默认允许，会与旧区域并存；
        // 模型层本就单选区，回驱 selectCells 会替换收敛，这里从交互源头掐掉）
        ctrlMultiSelect: false
      },
      customMergeCell: (col, row, table) => {
        const addr = this.toSheetAddr(table as ListTable, col, row)
        if (!addr) return undefined
        const merge = this.sheet.merges.getMergeAt(addr)
        if (!merge) return undefined
        const anchorCoord = this.toTableCoord(table as ListTable, merge.start)
        const recordValue = (table as ListTable).getCellOriginValue(
          anchorCoord.col,
          anchorCoord.row
        )
        return {
          range: { start: anchorCoord, end: this.toTableCoord(table as ListTable, merge.end) },
          // 关键 1：必须携带 text。VTable 的 getCellRange 仅在 text/customLayout/
          // customRender 有效时才认这个自定义合并——没有 text 时选区与编辑不会
          // 扩展为整个合并区域，且合并格渲染为空。
          // 关键 2：text 必须读 VTable records 而非模型。编辑提交的顺序是
          // 先更新 record → 重绘 → 最后才发 change_cell_value 回写模型；
          // 若此时读模型，拿到的还是回写前的旧值（合并格显示旧文本）。
          text: recordValue == null ? '' : String(recordValue)
        }
      }
    }
  }

  /**
   * 行高只允许在行号列拖拽（Excel 语义）。
   * VTable 无 canResizeRow，且 'header' 不含 rowSeriesNumber body，故包装 _canResizeRow。
   */
  private restrictRowResizeToSeriesNumber(): void {
    const table = this.table
    const base = table._canResizeRow.bind(table)
    table._canResizeRow = (col, row) => table.isSeriesNumber(col, row) && base(col, row)
  }

  /** 按 Sheet 稀疏行高还原到 VTable（tab 切换重建后保留） */
  private applyStoredRowHeights(): void {
    for (const [row, height] of this.sheet.getRowHeights()) {
      const tableRow = this.toTableCoord(this.table, { row, col: 0 }).row
      this.table.setRowHeight(tableRow, height)
    }
  }

  // ─── 事件桥接 ─────────────────────────────────────────────

  private bindTableEvents(): void {
    this.table.on(ListTable.EVENT_TYPE.CHANGE_CELL_VALUE, (args) => {
      const addr = this.toSheetAddr(this.table, args.col, args.row)
      if (addr == null) return
      // 编辑提交期间模型变更（含公式重算派生格）先入队列，提交结束统一回推。
      // 被编辑格自身也入队：VTable 已把输入文本写进 record，公式格需回推计算值
      this.pendingTableSync = new Map([[cellKey(addr), addr]])
      try {
        this.sheet.setCellValue(addr, args.changedValue ?? null)
      } finally {
        const pending = this.pendingTableSync
        this.pendingTableSync = null
        if (pending) {
          for (const pendingAddr of pending.values()) {
            this.pushCellToTable(pendingAddr)
            this.refreshCellStyle(pendingAddr)
          }
        }
      }
    })

    this.table.on(ListTable.EVENT_TYPE.SELECTED_CELL, (args) => {
      // 回驱期间的 SELECTED_CELL（selectCells 同步派发）不写回模型，防递归
      if (this.syncingSelection) return
      // 以 VTable 当前完整选区为准同步模型：拖选结束的 SELECTED_CELL 携带整个
      // 区域，若只同步 args 单格会把拖选区域收缩成单格；单击时选区即单格，等价。
      // 行号/列头选区的 start 落在 header（toSheetAddr 为 null），必须先读完整选区
      // 再钳制，不能因 args 是 header 或 end 格而提前 return / selectCell(末格)。
      const range = this.readSelectedModelRange()
      if (range) {
        this.sheet.selectRange(range, this.resolveSelectionActive(range))
        return
      }
      const addr = this.toSheetAddr(this.table, args.col, args.row)
      if (addr) this.sheet.selectCell(addr)
    })

    // 拖选结束 → 选区同步为区域（合并等区域操作的前提）
    this.table.on(ListTable.EVENT_TYPE.DRAG_SELECT_END, () => {
      const range = this.readSelectedModelRange()
      if (!range) return
      this.sheet.selectRange(range, this.resolveSelectionActive(range))
    })

    // 行高拖拽结束 → 写入模型稀疏表（不进 undo）
    this.table.on(ListTable.EVENT_TYPE.RESIZE_ROW_END, (args) => {
      const addr = this.toSheetAddr(this.table, this.getOffsets(this.table).colOffset, args.row)
      if (!addr) return
      this.sheet.setRowHeight(addr.row, args.rowHeight)
    })

    // 填充柄：记下源选区
    this.table.on(ListTable.EVENT_TYPE.MOUSEDOWN_FILL_HANDLE, () => {
      this.fillSourceRange = this.readSelectedModelRange()
    })

    // 填充柄拖拽结束 → generateFill → setCells
    this.table.on(ListTable.EVENT_TYPE.DRAG_FILL_HANDLE_END, (args) => {
      const source = this.fillSourceRange
      this.fillSourceRange = null
      const direction = args.direction as FillDirection | undefined
      if (!source || !direction) return
      const expanded = this.readSelectedModelRange()
      if (!expanded) return
      const target = computeFillTargetRange(source, direction, expanded)
      if (!target) return
      const items = generateFill({
        source,
        target,
        direction,
        getCellData: (addr) => this.sheet.getCellData(addr)
      })
      if (items.length === 0) return
      this.sheet.setCells(items)
      this.sheet.selectRange(createRange(source.start, expanded.end))
    })

    // 右键 → vue 层 UContextmenu（grid 不依赖 desktop）
    // VTable 在 rightdown 上派发 CONTEXTMENU_CELL（非原生 contextmenu）
    this.table.on(ListTable.EVENT_TYPE.CONTEXTMENU_CELL, (args) => {
      const event = args.event
      if (event && typeof event === 'object' && 'preventDefault' in event) {
        ;(event as { preventDefault: () => void }).preventDefault()
      }
      if (!this.onContextMenu) return
      const point = clientPointFromEvent(event)
      // 延后一帧：避开 VTable rightdown 同步阶段，保证菜单挂载后不被同轮指针事件干扰
      const info: SheetGridContextMenuInfo = {
        x: point?.x ?? 0,
        y: point?.y ?? 0,
        addr: this.toSheetAddr(this.table, args.col, args.row)
      }
      queueMicrotask(() => this.onContextMenu?.(info))
    })
  }

  /**
   * 当前 VTable 选区 → 规范化模型区域；无有效 body 选区返回 null。
   * 取最后一个 range（用户最新操作）；多选区残留时回驱 selectCells 会收敛为单选。
   *
   * 行号列 / 列头上的角点钳制进 body：VTable 整行选区 start.col 常为行号列、
   * 整列选区 start.row 常为列头，直接 toSheetAddr 会得到 null 并丢掉整段选区。
   */
  private readSelectedModelRange(): CellRange | null {
    const ranges = this.table.getSelectedCellRanges()
    const range = ranges[ranges.length - 1]
    if (!range) return null
    const { colOffset, rowOffset } = this.getOffsets(this.table)
    const minCol = Math.min(range.start.col, range.end.col)
    const maxCol = Math.max(range.start.col, range.end.col)
    const minRow = Math.min(range.start.row, range.end.row)
    const maxRow = Math.max(range.start.row, range.end.row)
    const startCol = Math.max(minCol, colOffset)
    const startRow = Math.max(minRow, rowOffset)
    const endCol = Math.max(maxCol, colOffset)
    const endRow = Math.max(maxRow, rowOffset)
    const start = this.toSheetAddr(this.table, startCol, startRow)
    const end = this.toSheetAddr(this.table, endCol, endRow)
    if (!start || !end) return null
    return createRange(start, end)
  }

  /**
   * 整行 / 整列选区的活动格：取当前视口可见边缘（含部分可见），与 Excel 一致。
   * 非整行/整列时返回 undefined，由 selectRange 回落区域起点。
   */
  private resolveSelectionActive(range: CellRange): CellAddress | undefined {
    const spansAllCols = range.start.col === 0 && range.end.col >= this.cols - 1
    const spansAllRows = range.start.row === 0 && range.end.row >= this.rows - 1
    if (!spansAllCols && !spansAllRows) return undefined
    return this.visibleEdgeInRange(range, spansAllCols, spansAllRows)
  }

  /** 视口左上可见边缘（模型坐标），钳制到选区内；冻结行/列恒视为从 0 可见 */
  private visibleEdgeInRange(
    range: CellRange,
    useVisibleCol: boolean,
    useVisibleRow: boolean
  ): CellAddress {
    const { colOffset, rowOffset } = this.getOffsets(this.table)
    const visible = this.table.getBodyVisibleCellRange()
    let leftCol = range.start.col
    let topRow = range.start.row
    if (visible) {
      if (useVisibleCol) {
        leftCol = this.sheet.frozen.cols > 0 ? 0 : Math.max(0, visible.colStart - colOffset)
      }
      if (useVisibleRow) {
        topRow = this.sheet.frozen.rows > 0 ? 0 : Math.max(0, visible.rowStart - rowOffset)
      }
    }
    return {
      row: Math.min(Math.max(topRow, range.start.row), range.end.row),
      col: Math.min(Math.max(leftCol, range.start.col), range.end.col)
    }
  }

  private bindSheetEvents(): void {
    this.disposers.push(
      this.sheet.on('cell-change', ({ addr }) => {
        if (this.pendingTableSync) {
          this.pendingTableSync.set(cellKey(addr), addr)
          return
        }
        this.pushCellToTable(addr)
        // 样式随模型变化（style 回调实时解析），复用 cell-change 触发该格重绘
        this.refreshCellStyle(addr)
      })
    )

    this.disposers.push(
      this.sheet.on('merge-change', () => {
        this.refresh()
      })
    )

    // 冻结变更 → 即时更新 VTable 冻结布局
    this.disposers.push(
      this.sheet.on('frozen-change', () => {
        this.applyFrozen()
      })
    )

    // 模型选区变更 → 回驱 VTable 高亮 + 滚动可见（查找跳转依赖）
    this.disposers.push(
      this.sheet.on('selection-change', (state) => {
        this.pushSelectionToTable(state)
      })
    )
  }

  /** 模型格 → 表格 record（显示值；公式格为计算缓存） */
  private pushCellToTable(addr: CellAddress): void {
    const { col, row } = this.toTableCoord(this.table, addr)
    const value = this.sheet.getDisplayValue(addr)
    this.table.changeCellValue(col, row, value as string | number | null, false, false)
  }

  /** 重绘单格（updateCellContent 清除该格样式缓存；样式/值变化后调用） */
  private refreshCellStyle(addr: CellAddress): void {
    const { col, row } = this.toTableCoord(this.table, addr)
    this.table.updateCellContent(col, row)
  }

  /**
   * 键盘绑定：Cmd/Ctrl+Z undo，Cmd/Ctrl+Shift+Z 与 Ctrl+Y redo。
   * 编辑器打开时（事件来自编辑器 input）不拦截，保留文本编辑自身的撤销行为。
   */
  private bindKeyboard(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        if (this.undo()) event.preventDefault()
      } else if ((key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey)) {
        if (this.redo()) event.preventDefault()
      }
    }
    this.container.addEventListener('keydown', onKeyDown)
    this.disposers.push(() => this.container.removeEventListener('keydown', onKeyDown))
  }
}
