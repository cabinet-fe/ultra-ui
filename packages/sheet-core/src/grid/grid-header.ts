import { resolveCellX, type ListTable } from 'infinitable'

/**
 * 列头机制（引擎无表头渲染 hook 的补偿层）：
 * - 列头内容：`resolveTitle` 按列给标题，经引擎列定义 `title` 画布绘制（覆盖缺省 A/B/C 字母）；
 * - 表头自定义渲染：`resolveHeader` 按列返回 DOM 元素，由表头 DOM 覆盖层挂载定位
 *   （类型图标、可点击配置入口等交互宿主自定）；引擎列头画布只承担底色/网格线底座。
 */
export interface SheetGridHeaderOptions {
  /** 按列列头标题；返回 undefined 该列回落缺省字母表头。构造期逐列调用一次 */
  resolveTitle?: (col: number) => string | undefined
  /**
   * 按列自定义表头渲染：返回元素挂到该列列头位置（内容与交互宿主自定）；
   * 返回 undefined 回落标题/字母表头。每个列号在实例生命周期内至多调用一次，
   * 元素由宿主持有可就地更新内容。
   */
  resolveHeader?: (col: number) => HTMLElement | undefined
}

/**
 * 表头 DOM 覆盖层：自定义列头元素按可视窗口挂载定位，滚动/列宽变化随帧同步。
 * 覆盖层与列头元素 `pointer-events: none`——画布表头交互（拖选、列宽拖拽）保持，
 * 可点击内容在宿主元素的子节点上开 `pointer-events: auto`。
 */
export class GridHeaderLayer {
  private readonly options: SheetGridHeaderOptions
  private readonly customElements = new Map<number, HTMLElement | null>()
  private readonly mounted = new Map<number, HTMLElement>()
  private table: ListTable | null = null
  private root: HTMLElement | null = null

  constructor(options: SheetGridHeaderOptions) {
    this.options = options
  }

  /**
   * 列定义标题（构造期列装配用）：自定义渲染列返回空串（画布不重复绘制文字，
   * 由覆盖层接管内容）；`resolveTitle` 未命中返回 undefined（回落字母表头）。
   */
  colTitle(col: number): string | undefined {
    if (this.elementFor(col)) return ''
    return this.options.resolveTitle?.(col)
  }

  /** 接线引擎表与容器（ListTable 构造后调用一次）：建覆盖层并初始同步 */
  attach(table: ListTable, container: HTMLElement): void {
    if (this.root) return
    this.table = table
    const root = document.createElement('div')
    root.style.cssText = `position:absolute;top:0;left:0;right:0;height:${table.headerHeight}px;pointer-events:none;overflow:hidden;`
    container.appendChild(root)
    this.root = root
    this.sync()
  }

  /** 可视窗口同步：挂载/定位窗口内自定义列头元素，卸载窗口外元素（滚动帧、列宽变化后调用） */
  sync(): void {
    const table = this.table
    const root = this.root
    if (!table || !root) return
    const { cols } = table.getBodyVisibleCellRange()
    const scrollLeft = table.getScrollLeft()
    for (let col = cols.start; col < cols.end; col++) {
      const el = this.elementFor(col)
      if (!el) continue
      if (!this.mounted.has(col)) {
        el.style.position = 'absolute'
        el.style.top = '0'
        el.style.pointerEvents = 'none'
        el.style.boxSizing = 'border-box'
        root.appendChild(el)
        this.mounted.set(col, el)
      }
      el.style.left = `${resolveCellX(col, scrollLeft, table.colOffsets, table.frozenColCount, table.rowHeaderWidth)}px`
      el.style.width = `${table.colWidths[col] ?? 0}px`
      el.style.height = `${table.headerHeight}px`
    }
    // Map 迭代中删除条目是安全的（未访问条目跳过），无需拷贝键集
    for (const [col, el] of this.mounted) {
      if (col < cols.start || col >= cols.end) {
        el.remove()
        this.mounted.delete(col)
      }
    }
  }

  dispose(): void {
    for (const el of this.mounted.values()) el.remove()
    this.mounted.clear()
    this.customElements.clear()
    this.root?.remove()
    this.root = null
    this.table = null
  }

  /** 该列自定义表头元素（每列至多查询一次，null 表示无且不再回调 hook） */
  private elementFor(col: number): HTMLElement | null {
    if (!this.options.resolveHeader) return null
    if (!this.customElements.has(col)) {
      this.customElements.set(col, this.options.resolveHeader(col) ?? null)
    }
    return this.customElements.get(col) ?? null
  }
}
