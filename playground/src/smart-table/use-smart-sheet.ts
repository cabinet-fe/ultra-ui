import {
  FormCheckbox,
  FormDatePicker,
  FormInput,
  FormMultiSelect,
  FormNumberInput,
  FormSelect,
  FormSlider,
  MoreVertical,
  PictureRounded,
  Right,
  User
} from '@veltra/icons/normal'
import {
  Workbook,
  type CellAddress,
  type CellValue as SheetCellValue,
  type SetCellValueItem
} from '@veltra/sheet-core'
import type {
  CellRenderer,
  ResolveCellRenderer,
  SheetGrid,
  SheetGridEditorsOptions,
  SheetGridHeaderOptions
} from '@veltra/sheet-core/grid'
import {
  computed,
  h,
  nextTick,
  onScopeDispose,
  render,
  shallowRef,
  watch,
  type Component,
  type Ref
} from 'vue'

import { createFieldEditors, FIELD_EDITOR_NAMES } from './cell-editors'
import {
  drawGroupBand,
  makeFieldRenderer,
  parseMultiValue,
  serializeMultiValue
} from './cell-renderers'
import {
  type CellValue as DocCellValue,
  type FieldType,
  type TableDoc,
  type TableField,
  type TableRow
} from './types'

/**
 * 视图项：工具栏管线（搜索/筛选/排序/分组）作用后的行序载体——
 * 分组段头（band，首列存段名文案）或数据行（row，与 doc 共享同一行对象）。
 */
export type ViewItem = { kind: 'band'; label: string } | { kind: 'row'; row: TableRow }

/** 列头类型图标（@veltra/icons 组件，经 vue render 挂进 DOM 表头元素） */
const FIELD_TYPE_ICONS: Record<FieldType, Component> = {
  text: FormInput,
  number: FormNumberInput,
  select: FormSelect,
  'multi-select': FormMultiSelect,
  date: FormDatePicker,
  checkbox: FormCheckbox,
  progress: FormSlider,
  member: User,
  image: PictureRounded
}

/** 各字段类型的默认列宽（remap 回放：优先用户拖拽后的记录值，见 colWidths） */
const FIELD_COL_WIDTHS: Record<FieldType, number> = {
  text: 170,
  number: 140,
  select: 120,
  'multi-select': 190,
  date: 120,
  checkbox: 90,
  progress: 150,
  member: 160,
  image: 150
}

/** 字段集签名：字段增删/改名/选项变化才重建列头并触发网格重建 */
function fieldsSignature(fields: TableField[]): string {
  return fields
    .map((field) => `${field.id}:${field.name}:${field.type}:${field.options?.join(',') ?? ''}`)
    .join('|')
}

/** 视图项签名：行集或行序变化（含分组段头增删）才触发网格重装配，纯值编辑不触发 */
function itemsSignature(items: ViewItem[]): string {
  return items
    .map((item) => (item.kind === 'band' ? `b:${item.label}` : `r:${item.row.id}`))
    .join(',')
}

/** 行渲染高水位：网格在数据行之外保留可滚动的空白行（同 gridRows 下限） */
const RENDER_WATERMARK_ROWS = 100

/** doc 单元格值 → 网格存储值（多值字段序列化为 JSON 字符串，空值为 null） */
function toSheetValue(value: DocCellValue): SheetCellValue {
  if (value == null || value === '') return null
  if (Array.isArray(value)) return serializeMultiValue(value)
  return value
}

/** 网格存储值 → doc 单元格值（按字段类型收拢，非法值回落空值保证 PUT 契约通过） */
function toDocValue(raw: SheetCellValue | undefined, field: TableField): DocCellValue {
  if (raw == null || raw === '') return null
  switch (field.type) {
    case 'text':
      return typeof raw === 'string' ? raw : String(raw)
    case 'number': {
      const num = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(num) ? num : null
    }
    case 'progress': {
      const num = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(num) && num >= 0 && num <= 100 ? num : null
    }
    case 'date':
      return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
    case 'checkbox':
      return typeof raw === 'boolean' ? raw : null
    case 'select':
      return typeof raw === 'string' && field.options?.includes(raw) ? raw : null
    case 'multi-select': {
      const items = parseMultiValue(raw)
      return items.length > 0 && items.every((item) => field.options?.includes(item)) ? items : null
    }
    case 'member':
    case 'image': {
      const items = parseMultiValue(raw)
      return items.length > 0 ? items : null
    }
  }
}

export interface UseSmartSheetOptions {
  doc: Ref<TableDoc | null>
  /** 视图列集（工具栏字段隐藏后的可见字段序），驱动网格列装配 */
  fields: Ref<TableField[]>
  /** 视图行集（工具栏搜索/筛选/排序/分组后的项序，含分组段头），驱动网格行装配 */
  items: Ref<ViewItem[]>
  /** 列头配置入口点击（打开该字段的列设置面板） */
  onFieldConfig: (fieldId: string) => void
  /** 行头展开入口点击（打开该行的详情侧边栏） */
  onRowExpand: (rowId: string) => void
  /** 底层网格实例（u-sheet 暴露的 getGrid） */
  getGrid: () => SheetGrid | undefined
  /** u-sheet 外层包裹元素（行头控件覆盖层定位用） */
  getHost: () => HTMLElement | null
}

/**
 * doc ↔ Sheet 双向装配：
 * - 视图列集映射列（列头 DOM 内容/类型图标、类型默认列宽、编辑器名路由）；
 * - 视图行集映射网格值（multi-select/member/image 以 JSON 字符串存格、渲染还原；
 *   分组段头行存段名文案并标记只读，按行路由段头渲染器）；
 * - `cell-change` 回写 doc（与 use-table-doc 共用同一文档，防抖整表 PUT）；
 * - 9 类型行内编辑器按字段路由（`cell-editors`），checkbox 点击格直接切换；
 * - 字段/行列结构变化触发网格重建同步（列头引用更替驱动 u-sheet 重建）；
 * - 行头控件覆盖层：对齐行号列几何，勾选切换行勾选态、展开打开行详情侧边栏。
 */
export function useSmartSheet(options: UseSmartSheetOptions) {
  const {
    doc,
    fields: viewFields,
    items: viewItems,
    onFieldConfig,
    onRowExpand,
    getGrid,
    getHost
  } = options

  const workbook = new Workbook()
  const sheet = workbook.activeSheet

  /** 装配态（稳定引用的 hook 闭包读取，remap 时整体替换） */
  const ctx = { fields: [] as TableField[], items: [] as ViewItem[] }
  /** remap 期间抑制 cell-change 回写（批量写入不是用户编辑） */
  let remapping = false
  let lastFieldsSig = ''
  let lastItemsSig = ''
  let remapCount = 0
  let lastDocRows = -1
  /** 各字段当前列宽（含用户拖拽调宽后的值，remap 时按字段回放，字段显隐切换不丢） */
  const colWidths = new Map<string, number>()

  // ─── 列头与渲染装配 ────────────────────────────────────────

  /** 按列自定义表头元素：类型图标 + 字段名 + 配置入口（引用更替触发网格重建） */
  const header = shallowRef<SheetGridHeaderOptions>(buildHeaderOptions(ctx.fields))
  const renderers: (CellRenderer | undefined)[] = []

  function buildHeaderOptions(fields: TableField[]): SheetGridHeaderOptions {
    return {
      resolveTitle: (col) => fields[col]?.name,
      resolveHeader: (col) => {
        const field = fields[col]
        if (!field) return undefined
        const head = document.createElement('div')
        head.className = 'smart-table-col-head'
        const icon = document.createElement('span')
        icon.className = 'smart-table-col-head__icon'
        icon.title = field.name
        render(h(FIELD_TYPE_ICONS[field.type]), icon)
        const name = document.createElement('span')
        name.className = 'smart-table-col-head__name'
        name.textContent = field.name
        const config = document.createElement('button')
        config.type = 'button'
        config.className = 'smart-table-col-head__config'
        config.title = '列设置'
        render(h(MoreVertical), config)
        config.addEventListener('click', (event) => {
          event.stopPropagation()
          onFieldConfig(field.id)
        })
        head.append(icon, name, config)
        return head
      }
    }
  }

  /** 类型化渲染 hook（稳定引用：按列查表 O(1)，空值回落默认渲染；分组段头行按行路由段头渲染） */
  const resolveCellRenderer: ResolveCellRenderer = (addr, base) => {
    if (base == null || base === '') return undefined
    if (ctx.items[addr.row]?.kind === 'band') return addr.col === 0 ? drawGroupBand : undefined
    return renderers[addr.col]
  }

  /** 编辑器路由（稳定引用：9 类型编辑器按字段类型路由，字段经 deps 打开时读取） */
  const editors: SheetGridEditorsOptions = {
    editors: createFieldEditors({ getField: (col) => ctx.fields[col] }),
    route: (addr) => {
      const field = ctx.fields[addr.col]
      return field ? FIELD_EDITOR_NAMES[field.type] : undefined
    }
  }

  // ─── 视图 → Sheet 全量重装配 ──────────────────────────────

  function remap(nextFields: TableField[], nextItems: ViewItem[], docRowsGrew: boolean): void {
    const prevRows = ctx.items.length
    const prevCols = ctx.fields.length
    ctx.fields = [...nextFields]
    ctx.items = [...nextItems]
    // 已删行的勾选态随手清掉（行 id 复用时不得残留旧勾选）
    const aliveRows = new Set<string>()
    for (const item of ctx.items) {
      if (item.kind === 'row') aliveRows.add(item.row.id)
    }
    for (const id of checkedRowIds) if (!aliveRows.has(id)) checkedRowIds.delete(id)

    remapping = true
    try {
      // 模型列数对齐字段数：ensureTableSize 只增不缩，删字段需显式删列；
      // 行数保持高水位声明（resolveRenderSize 模型尺寸优先，钉死行数会让纵向滚动失效）
      if (sheet.colCount > ctx.fields.length) {
        sheet.deleteCols(ctx.fields.length, sheet.colCount - ctx.fields.length)
      }
      sheet.ensureTableSize(
        Math.max(RENDER_WATERMARK_ROWS, ctx.items.length),
        Math.max(ctx.fields.length, 1)
      )

      // 全量重写（新旧区域并集：收缩侧写 undefined 清残留）；
      // 分组段头行只写首列段名，整行标只读防进入编辑会话
      const maxRow = Math.max(prevRows, ctx.items.length)
      const maxCol = Math.max(prevCols, ctx.fields.length, 1)
      const items: SetCellValueItem[] = []
      for (let row = 0; row < maxRow; row++) {
        const item = ctx.items[row]
        for (let col = 0; col < maxCol; col++) {
          let value: SheetCellValue = null
          if (item?.kind === 'band') value = col === 0 ? item.label : null
          else if (item) {
            const field = ctx.fields[col]
            value = field ? toSheetValue(item.row.values[field.id] ?? null) : null
          }
          const addr: CellAddress = { row, col }
          items.push(value == null ? { addr, data: undefined } : { addr, data: { v: value } })
        }
      }
      if (items.length > 0) sheet.setCells(items)
      if (maxRow > 0) {
        // 旧装配区间整体解除只读（旧段头位置可能已变为数据行），再标记新段头行
        sheet.setRangeReadonly(
          { start: { row: 0, col: 0 }, end: { row: maxRow - 1, col: maxCol - 1 } },
          false
        )
        for (let row = 0; row < ctx.items.length; row++) {
          if (ctx.items[row]?.kind !== 'band') continue
          sheet.setRangeReadonly({ start: { row, col: 0 }, end: { row, col: maxCol - 1 } }, true)
        }
      }

      // 按字段回放列宽（含用户拖拽后的值）；已删除字段的记录同步清出
      const alive = new Set(ctx.fields.map((field) => field.id))
      for (const [id] of colWidths) if (!alive.has(id)) colWidths.delete(id)
      ctx.fields.forEach((field, col) => {
        sheet.setColWidth(col, colWidths.get(field.id) ?? FIELD_COL_WIDTHS[field.type])
      })

      sheet.history.clear() // 重装配为基线，不进 undo 历史
    } finally {
      remapping = false
    }

    renderers.length = 0
    ctx.fields.forEach((field, col) => {
      renderers[col] = makeFieldRenderer(field)
    })
    // 仅字段集变化才换列头（引用更替驱动 u-sheet 网格重建；行增删原地重装配）
    const fieldsSig = fieldsSignature(ctx.fields)
    if (fieldsSig !== lastFieldsSig) {
      lastFieldsSig = fieldsSig
      header.value = buildHeaderOptions(ctx.fields)
    }

    // 显式新增行（非初次装载）→ 选中末行首格，视口自动滚入（段头行跳过）
    remapCount++
    if (remapCount > 1 && docRowsGrew) {
      for (let row = ctx.items.length - 1; row >= 0; row--) {
        if (ctx.items[row]?.kind === 'row') {
          sheet.selectCell({ row, col: 0 })
          break
        }
      }
    }
    void nextTick(bindGrid)
  }

  // watch 源用签名 getter 而非 computed 本身：viewFields 的 filter 只依赖
  // field.id，改名/改类型/选项增删不会让 computed 失效，列头与列渲染会滞留
  // 旧值；getter 逐字段读 name/type/options，这些变更即触发重装配。
  watch(
    [() => fieldsSignature(viewFields.value), () => itemsSignature(viewItems.value)],
    ([fieldsSig, sig]) => {
      if (fieldsSig === lastFieldsSig && sig === lastItemsSig) return
      lastItemsSig = sig
      const docRows = doc.value?.rows.length ?? -1
      const docRowsGrew = remapCount > 0 && docRows > lastDocRows
      lastDocRows = docRows
      remap(viewFields.value, viewItems.value, docRowsGrew)
    }
  )

  // ─── Sheet → doc 编辑回写 ─────────────────────────────────

  const offCellChange = sheet.on('cell-change', ({ addr }) => {
    if (remapping) return
    const field = ctx.fields[addr.col]
    const item = ctx.items[addr.row]
    if (!field || item?.kind !== 'row') return
    item.row.values[field.id] = toDocValue(sheet.getCellData(addr)?.v, field)
    // 编辑可能改变 wrap 行高 → 微任务里行头控件层随新几何对齐
    void Promise.resolve().then(syncRowWidgets)
  })

  /**
   * 外部程序化写入单元格（看板编辑 / AI 字段逐格回填通路）：写进网格模型即可，
   * 上面既有 cell-change 通路自动回写 doc 并汇入防抖整表持久化；
   * 字段或行不在当前视图（被隐藏/过滤/尚未装配/已被删）返回 false，由调用方兜底。
   */
  function writeCell(fieldId: string, rowId: string, value: DocCellValue): boolean {
    const col = ctx.fields.findIndex((field) => field.id === fieldId)
    const row = ctx.items.findIndex((item) => item.kind === 'row' && item.row.id === rowId)
    if (col < 0 || row < 0) return false
    const v = toSheetValue(value)
    const addr: CellAddress = { row, col }
    sheet.setCells(v == null ? [{ addr, data: undefined }] : [{ addr, data: { v } }])
    return true
  }

  // ─── 行头控件覆盖层（勾选 + 展开行详情，对齐行号列几何） ───

  const checkedRowIds = new Set<string>()
  /** 每条可视行一行控件（勾选 + 展开按钮），随滚动帧按行几何对齐 */
  interface RowWidget {
    line: HTMLDivElement
    check: HTMLButtonElement
    expand: HTMLButtonElement
  }
  const rowWidgets = new Map<number, RowWidget>()
  let overlay: HTMLDivElement | null = null
  let boundGrid: SheetGrid | null = null
  let detachFrame: (() => void) | null = null
  let detachRowResize: (() => void) | null = null
  let detachColResize: (() => void) | null = null
  let detachCheckboxToggle: (() => void) | null = null

  /**
   * checkbox 点击直接切换（不经编辑浮层）：点击命中 checkbox 字段格即翻转
   * 布尔值（经 setCellValue 走命令系统，可 undo，cell-change 回写 doc）。
   * 双击第二击（detail > 1）与拖拽选区落点（位移超阈值）不算点击。
   */
  function bindCheckboxToggle(grid: SheetGrid): () => void {
    const host = getHost()?.querySelector<HTMLElement>('.u-sheet__grid')
    if (!host) return () => {}
    let downX = 0
    let downY = 0
    const onPointerDown = (event: PointerEvent): void => {
      downX = event.clientX
      downY = event.clientY
    }
    const onClick = (event: MouseEvent): void => {
      if (event.detail > 1 || !(event.target instanceof Element)) return
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 4) return
      // 网格实例随重建更替，命中检测按当前存活实例的坐标系换算
      const instance = host.querySelector<HTMLElement>('.u-sheet__grid-instance')
      if (!instance || !instance.contains(event.target)) return
      const rect = instance.getBoundingClientRect()
      const addr = grid.hitTestSheetAddr(event.clientX - rect.left, event.clientY - rect.top)
      if (!addr || ctx.fields[addr.col]?.type !== 'checkbox') return
      if (ctx.items[addr.row]?.kind !== 'row') return
      sheet.setCellValue(addr, sheet.getCellData(addr)?.v !== true)
    }
    host.addEventListener('pointerdown', onPointerDown)
    host.addEventListener('click', onClick)
    return () => {
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('click', onClick)
    }
  }

  function toggleRowCheck(rowId: string): void {
    if (checkedRowIds.has(rowId)) checkedRowIds.delete(rowId)
    else checkedRowIds.add(rowId)
    syncRowWidgets()
  }

  function createRowWidget(): RowWidget {
    const line = document.createElement('div')
    line.className = 'smart-table-row-widget'
    const check = document.createElement('button')
    check.type = 'button'
    check.className = 'smart-table-row-widget__check'
    check.title = '勾选该行'
    check.addEventListener('pointerdown', (event) => event.preventDefault())
    check.addEventListener('click', (event) => {
      const id = (event.currentTarget as HTMLButtonElement).dataset.rowId
      if (id) toggleRowCheck(id)
    })
    const expand = document.createElement('button')
    expand.type = 'button'
    expand.className = 'smart-table-row-widget__expand'
    expand.title = '展开行详情'
    render(h(Right), expand)
    expand.addEventListener('pointerdown', (event) => event.preventDefault())
    expand.addEventListener('click', (event) => {
      event.stopPropagation()
      const id = (event.currentTarget as HTMLButtonElement).dataset.rowId
      if (id) onRowExpand(id)
    })
    line.append(check, expand)
    return { line, check, expand }
  }

  /** 按可视窗口对齐行控件：滚动帧/行高变化/网格重建后调用；分组段头行不渲染控件 */
  function syncRowWidgets(): void {
    const grid = boundGrid
    if (!grid || !overlay || !overlay.isConnected) return
    const table = grid.getTable()
    const { rows } = table.getBodyVisibleCellRange()
    const limit = Math.min(rows.end, ctx.items.length)
    for (let row = rows.start; row < limit; row++) {
      const item = ctx.items[row]
      if (item?.kind !== 'row') {
        rowWidgets.get(row)?.line.remove()
        rowWidgets.delete(row)
        continue
      }
      const rect = table.getCellRelativeRect(0, row)
      if (!rect) continue
      let widget = rowWidgets.get(row)
      if (!widget) {
        widget = createRowWidget()
        rowWidgets.set(row, widget)
      }
      const rowId = item.row.id
      widget.check.dataset.rowId = rowId
      widget.expand.dataset.rowId = rowId
      widget.check.classList.toggle('is-checked', checkedRowIds.has(rowId))
      widget.line.style.top = `${rect.y}px`
      widget.line.style.height = `${rect.height}px`
      if (widget.line.parentElement !== overlay) overlay.appendChild(widget.line)
    }
    for (const [row, widget] of rowWidgets) {
      if (row < rows.start || row >= limit) {
        widget.line.remove()
        rowWidgets.delete(row)
      }
    }
  }

  /** 绑定当前网格实例（挂载/重建/视图切回后调用；实例未变仅同步控件层） */
  function bindGrid(): void {
    const grid = getGrid()
    if (!grid) return
    if (grid !== boundGrid) {
      detachFrame?.()
      detachRowResize?.()
      detachColResize?.()
      detachCheckboxToggle?.()
      detachCheckboxToggle = bindCheckboxToggle(grid)
      boundGrid = grid
      const table = grid.getTable()
      detachFrame = table.onScrollFrame(syncRowWidgets)
      detachRowResize = table.onRowResizeEnd(syncRowWidgets)
      // 用户拖拽调宽按字段记录，字段显隐/重排后 remap 回放
      detachColResize = table.onColResizeEnd((event) => {
        const field = ctx.fields[event.col]
        if (field) colWidths.set(field.id, event.width)
      })
    }
    if (!overlay || !overlay.isConnected) {
      const host = getHost()?.querySelector<HTMLElement>('.u-sheet__grid')
      if (host) {
        overlay = document.createElement('div')
        overlay.className = 'smart-table-row-widgets'
        overlay.style.width = `${grid.getTable().rowHeaderWidth}px`
        host.appendChild(overlay)
        rowWidgets.clear()
      }
    }
    syncRowWidgets()
  }

  onScopeDispose(() => {
    offCellChange()
    detachFrame?.()
    detachRowResize?.()
    detachColResize?.()
    detachCheckboxToggle?.()
    overlay?.remove()
    overlay = null
    boundGrid = null
  })

  /** 渲染高水位：行数超 100 才扩张（props 变化触发 u-sheet 网格重建） */
  const gridRows = computed(() => Math.max(RENDER_WATERMARK_ROWS, viewItems.value.length))
  /** 列数与可见字段数一致：不渲染字段列以外的字母列 */
  const gridCols = computed(() => Math.max(viewFields.value.length, 1))

  return { workbook, header, editors, resolveCellRenderer, gridRows, gridCols, bindGrid, writeCell }
}
