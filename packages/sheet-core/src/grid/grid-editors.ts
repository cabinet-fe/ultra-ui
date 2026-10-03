import { EditorRegistry, type EditorRoute, type ListTable } from 'infinitable'

import type { CellAddress } from '../core/address'
import type { CellValue } from '../core/cell-store'
import type { Sheet } from '../core/sheet'
import { getSheetEditValue } from './grid-model'

/** 统一文本编辑器注册名（未命中路由的回落目标，引擎侧等价于列级 `editor` 声明） */
export const SHEET_TEXT_EDITOR = 'sheet-text'

/** 锚定格视口矩形（CSS 像素，容器坐标系；与引擎文本编辑浮层同口径） */
export interface GridEditorRect {
  x: number
  y: number
  width: number
  height: number
}

/** 编辑会话上下文（`GridCellEditor.open` 入参）：机制负责生命周期与提交通道，宿主只管编辑 UI */
export interface GridEditorSession {
  /** 锚定格（0-based） */
  addr: CellAddress
  /** 编辑 UI 挂载容器（表格容器；绝对定位坐标系，编辑浮层直接挂其内） */
  container: HTMLElement
  /** 锚定格视口矩形（CSS 像素，容器坐标系） */
  rect: GridEditorRect
  /** 编辑初值（基础值口径：公式格为 `'=' + f` 原文） */
  value: CellValue | undefined
  /** 提交：写模型（经命令系统，可 undo）并结束会话 */
  commit(value: CellValue): void
  /** 取消：结束会话，不写模型 */
  cancel(): void
  /** 滚动跟随：会话内锚定格矩形变化时回调（编辑 UI 据此重定位；重复订阅替换前一监听） */
  onRectChange(listener: (rect: GridEditorRect) => void): void
}

/** 类型化单元格编辑器：宿主实现编辑 UI，挂载/回收与提交由机制驱动 */
export interface GridCellEditor {
  /** 编辑器名（注册 key；格级路由返回此名命中） */
  readonly name: string
  /** 会话打开：编辑 UI 挂到 `session.container` 并定位到 `session.rect` */
  open(session: GridEditorSession): void
  /** 会话关闭（提交/取消后机制回收）：摘除编辑 UI */
  close(): void
}

/** 编辑器机制 options（`SheetGridOptions.editors`） */
export interface SheetGridEditorsOptions {
  /** 自定义编辑器集合；`name` 重复以后者为准 */
  editors: GridCellEditor[]
  /** 格级路由：返回编辑器名（须在 `editors` 内）；返回 undefined 或未注册名回落统一文本编辑器 */
  route?: (addr: CellAddress) => string | undefined
}

interface RoutingInit {
  options: SheetGridEditorsOptions
  /** 自定义会话开始/结束（对齐 SheetGridOptions.onEditStart / onEditEnd 口径） */
  onSessionStart?: (addr: CellAddress) => void
  onSessionEnd?: (addr: CellAddress) => void
}

interface ActiveSession {
  addr: CellAddress
  editor: GridCellEditor
  rectListener: ((rect: GridEditorRect) => void) | null
}

/**
 * 类型化编辑器路由（引擎 `EditorRegistry` 的 `route` hook 机制化）：
 * - 引擎侧注册名只承担可编判定（引擎编辑会话恒开内置文本编辑器）；
 * - 自定义编辑器在引擎 `onEditStart` 时接管——取消文本会话、挂载宿主编辑 UI，
 *   提交经 `table.updateCell` 走模型命令系统（可 undo），滚动跟随锚定格矩形。
 */
export class GridEditorRouting {
  private readonly options: SheetGridEditorsOptions
  private readonly editors = new Map<string, GridCellEditor>()
  private readonly onSessionStart?: (addr: CellAddress) => void
  private readonly onSessionEnd?: (addr: CellAddress) => void
  private sheet: Sheet | null = null
  private table: ListTable | null = null
  private container: HTMLElement | null = null
  private session: ActiveSession | null = null
  /** 接管中取消文本会话的合成事件标记（SheetGrid 转发引擎编辑事件前查询抑制） */
  private suppressing = false

  constructor(init: RoutingInit) {
    this.options = init.options
    this.onSessionStart = init.onSessionStart
    this.onSessionEnd = init.onSessionEnd
    for (const editor of init.options.editors) this.editors.set(editor.name, editor)
  }

  /** 引擎编辑事件是否为接管路径的合成事件（转发宿主回调前抑制） */
  shouldSuppressEngineEvent(): boolean {
    return this.suppressing
  }

  /**
   * 构造引擎注册表（ListTable 构造期装配）：文本编辑器 + 自定义编辑器注册名标记；
   * route 包装只放行已注册的自定义编辑器名，未命中回落列级 `sheet-text` 声明。
   */
  createRegistry(): EditorRegistry {
    const registry = new EditorRegistry(this.engineRoute)
    registry.registerEditor(SHEET_TEXT_EDITOR, {})
    for (const editor of this.editors.values()) {
      registry.registerEditor(editor.name, { name: editor.name })
    }
    return registry
  }

  /** 接线引擎表与容器（ListTable 构造后调用一次） */
  attach(sheet: Sheet, table: ListTable, container: HTMLElement): void {
    this.sheet = sheet
    this.table = table
    this.container = container
  }

  /**
   * 引擎编辑会话开启拦截：命中自定义编辑器则接管（取消文本会话、打开自定义编辑器）
   * 并返回 true；未命中返回 false（文本会话照常），同时结束残留的旧自定义会话。
   */
  handleEngineEditStart(col: number, row: number): boolean {
    const editor = this.routeEditor(col, row)
    if (!editor) {
      this.cancelSession()
      return false
    }
    const table = this.table
    if (!table) return false
    const rect = table.getCellRelativeRect(col, row)
    if (!rect) return false
    this.cancelSession()
    this.suppressing = true
    try {
      table.cancelEdit()
    } finally {
      this.suppressing = false
    }
    this.openSession(editor, { row, col }, rect)
    return true
  }

  /** 滚动帧：会话中锚定格矩形变化通知编辑器；滚出视口自动取消 */
  handleScrollFrame(): void {
    const session = this.session
    const table = this.table
    if (!session || !table) return
    const rect = table.getCellRelativeRect(session.addr.col, session.addr.row)
    if (!rect) {
      this.cancelSession()
      return
    }
    session.rectListener?.(rect)
  }

  dispose(): void {
    this.cancelSession()
  }

  /** 引擎 route hook：命中已注册自定义编辑器才返回其名（否则 undefined → 列级 sheet-text） */
  private readonly engineRoute: EditorRoute = (col, row) => {
    return this.routeEditor(col, row)?.name
  }

  private routeEditor(col: number, row: number): GridCellEditor | null {
    const name = this.options.route?.({ row, col })
    return (name ? this.editors.get(name) : undefined) ?? null
  }

  private openSession(editor: GridCellEditor, addr: CellAddress, rect: GridEditorRect): void {
    const session: ActiveSession = { addr, editor, rectListener: null }
    this.session = session
    editor.open({
      addr,
      container: this.container!,
      rect,
      value: this.sheet ? getSheetEditValue(this.sheet, addr.col, addr.row) : undefined,
      commit: (value) => this.commitSession(value),
      cancel: () => this.cancelSession(),
      onRectChange: (listener) => {
        session.rectListener = listener
      }
    })
    this.onSessionStart?.(addr)
  }

  /** 提交：经引擎 updateCell 回写模型（命令系统，可 undo）后结束会话 */
  private commitSession(value: CellValue): void {
    const session = this.session
    if (!session || !this.table) return
    this.table.updateCell(session.addr.col, session.addr.row, value)
    this.endSession(session)
  }

  private cancelSession(): void {
    const session = this.session
    if (!session) return
    this.endSession(session)
  }

  private endSession(session: ActiveSession): void {
    this.session = null
    session.editor.close()
    this.onSessionEnd?.(session.addr)
    // 焦点交还网格容器（键盘导航），对齐引擎文本编辑会话结束行为
    this.container?.focus({ preventScroll: true })
  }
}
