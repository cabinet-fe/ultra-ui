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

import { makeFieldRenderer, parseMultiValue, serializeMultiValue } from './cell-renderers'
import {
  type CellValue as DocCellValue,
  type FieldType,
  type TableDoc,
  type TableField
} from './types'

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

/** 各字段类型的默认列宽（仅首次装配写入模型，用户拖拽调宽后不再覆盖） */
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

/** 各类型行内编辑器注册名（P4 在 cell-editors.ts 注册同名编辑器接管；未注册回落文本编辑器） */
const EDITOR_NAMES: Record<FieldType, string> = {
  text: 'smart-text',
  number: 'smart-number',
  select: 'smart-select',
  'multi-select': 'smart-multi-select',
  date: 'smart-date',
  checkbox: 'smart-checkbox',
  progress: 'smart-progress',
  member: 'smart-member',
  image: 'smart-image'
}

/** 字段集签名：字段增删/改名/选项变化才重建列头并触发网格重建 */
function fieldsSignature(doc: TableDoc): string {
  return doc.fields
    .map((field) => `${field.id}:${field.name}:${field.type}:${field.options?.join(',') ?? ''}`)
    .join('|')
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
  /** 列头配置入口点击（P6 接列设置面板） */
  onFieldConfig: (fieldId: string) => void
  /** 底层网格实例（u-sheet 暴露的 getGrid） */
  getGrid: () => SheetGrid | undefined
  /** u-sheet 外层包裹元素（行头勾选覆盖层定位用） */
  getHost: () => HTMLElement | null
}

/**
 * doc ↔ Sheet 双向装配：
 * - 字段数组映射列（列头 DOM 内容/类型图标、类型默认列宽、编辑器名路由）；
 * - 行记录映射网格值（multi-select/member/image 以 JSON 字符串存格、渲染还原）；
 * - `cell-change` 回写 doc（与 use-table-doc 共用同一文档，防抖整表 PUT）；
 * - 字段/行列结构变化触发网格重建同步（列头引用更替驱动 u-sheet 重建）；
 * - 行头勾选覆盖层：对齐行号列几何，点击切换行勾选态。
 */
export function useSmartSheet(options: UseSmartSheetOptions) {
  const { doc, onFieldConfig, getGrid, getHost } = options

  const workbook = new Workbook()
  const sheet = workbook.activeSheet

  /** 装配态（稳定引用的 hook 闭包读取，remap 时整体替换） */
  const ctx = { fields: [] as TableField[], rowIds: [] as string[], rowCount: 0 }
  /** remap 期间抑制 cell-change 回写（批量写入不是用户编辑） */
  let remapping = false
  let lastFieldsSig = ''
  let lastRowCount = -1
  let remapCount = 0
  /** 已写过类型默认列宽的字段（用户拖拽调宽后不被 remap 覆盖） */
  const widthInited = new Set<string>()

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

  /** 类型化渲染 hook（稳定引用：按列查表 O(1)，空值回落默认渲染） */
  const resolveCellRenderer: ResolveCellRenderer = (addr, base) => {
    if (base == null || base === '') return undefined
    return renderers[addr.col]
  }

  /** 编辑器路由（稳定引用；P4 注册同名编辑器后按类型接管） */
  const editors: SheetGridEditorsOptions = {
    editors: [],
    route: (addr) => {
      const field = ctx.fields[addr.col]
      return field ? EDITOR_NAMES[field.type] : undefined
    }
  }

  // ─── doc → Sheet 全量重装配 ────────────────────────────────

  function remap(next: TableDoc): void {
    const prevRows = ctx.rowCount
    const prevCols = ctx.fields.length
    ctx.fields = [...next.fields]
    ctx.rowIds = next.rows.map((row) => row.id)
    ctx.rowCount = next.rows.length
    // 已删行的勾选态随手清掉（行 id 复用时不得残留旧勾选）
    const aliveRows = new Set(ctx.rowIds)
    for (const id of checkedRowIds) if (!aliveRows.has(id)) checkedRowIds.delete(id)

    remapping = true
    try {
      // 模型列数对齐字段数：ensureTableSize 只增不缩，删字段需显式删列；
      // 行数保持高水位声明（resolveRenderSize 模型尺寸优先，钉死行数会让纵向滚动失效）
      if (sheet.colCount > ctx.fields.length) {
        sheet.deleteCols(ctx.fields.length, sheet.colCount - ctx.fields.length)
      }
      sheet.ensureTableSize(
        Math.max(RENDER_WATERMARK_ROWS, ctx.rowCount),
        Math.max(ctx.fields.length, 1)
      )

      // 全量重写（新旧区域并集：收缩侧写 undefined 清残留）
      const maxRow = Math.max(prevRows, ctx.rowCount)
      const maxCol = Math.max(prevCols, ctx.fields.length)
      const items: SetCellValueItem[] = []
      for (let row = 0; row < maxRow; row++) {
        const record = next.rows[row]
        for (let col = 0; col < maxCol; col++) {
          const field = ctx.fields[col]
          const value = field && record ? toSheetValue(record.values[field.id] ?? null) : null
          const addr: CellAddress = { row, col }
          items.push(value == null ? { addr, data: undefined } : { addr, data: { v: value } })
        }
      }
      if (items.length > 0) sheet.setCells(items)

      // 新字段落类型默认列宽；已删除字段的记录同步清出
      const alive = new Set(ctx.fields.map((field) => field.id))
      for (const id of widthInited) if (!alive.has(id)) widthInited.delete(id)
      ctx.fields.forEach((field, col) => {
        if (widthInited.has(field.id)) return
        widthInited.add(field.id)
        sheet.setColWidth(col, FIELD_COL_WIDTHS[field.type])
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
    const fieldsSig = fieldsSignature(next)
    if (fieldsSig !== lastFieldsSig) {
      lastFieldsSig = fieldsSig
      header.value = buildHeaderOptions(ctx.fields)
    }

    // 显式新增行（非初次装载）→ 选中末行首格，视口自动滚入
    remapCount++
    if (remapCount > 1 && ctx.rowCount > prevRows) {
      sheet.selectCell({ row: ctx.rowCount - 1, col: 0 })
    }
    void nextTick(bindGrid)
  }

  watch(
    doc,
    (next) => {
      if (!next) return
      const fieldsSig = fieldsSignature(next)
      const rowCount = next.rows.length
      if (fieldsSig === lastFieldsSig && rowCount === lastRowCount) return
      lastRowCount = rowCount
      remap(next)
    },
    { deep: true }
  )

  // ─── Sheet → doc 编辑回写 ─────────────────────────────────

  const offCellChange = sheet.on('cell-change', ({ addr }) => {
    if (remapping || !doc.value) return
    const field = ctx.fields[addr.col]
    const record = doc.value.rows[addr.row]
    if (!field || !record) return
    record.values[field.id] = toDocValue(sheet.getCellData(addr)?.v, field)
    // 编辑可能改变 wrap 行高 → 微任务里行头勾选层随新几何对齐
    void Promise.resolve().then(syncRowChecks)
  })

  // ─── 行头勾选覆盖层（对齐行号列几何） ──────────────────────

  const checkedRowIds = new Set<string>()
  const checkItems = new Map<number, HTMLButtonElement>()
  let overlay: HTMLDivElement | null = null
  let boundGrid: SheetGrid | null = null
  let detachFrame: (() => void) | null = null
  let detachRowResize: (() => void) | null = null

  function toggleRowCheck(rowId: string): void {
    if (checkedRowIds.has(rowId)) checkedRowIds.delete(rowId)
    else checkedRowIds.add(rowId)
    syncRowChecks()
  }

  /** 按可视窗口对齐勾选框：滚动帧/行高变化/网格重建后调用 */
  function syncRowChecks(): void {
    const grid = boundGrid
    if (!grid || !overlay || !overlay.isConnected) return
    const table = grid.getTable()
    const { rows } = table.getBodyVisibleCellRange()
    const limit = Math.min(rows.end, ctx.rowCount)
    for (let row = rows.start; row < limit; row++) {
      const rect = table.getCellRelativeRect(0, row)
      if (!rect) continue
      let item = checkItems.get(row)
      if (!item) {
        item = document.createElement('button')
        item.type = 'button'
        item.className = 'smart-table-row-check__box'
        item.title = '勾选该行'
        // 不夺网格容器焦点（键盘导航/撤销快捷键依赖容器焦点）
        item.addEventListener('pointerdown', (event) => event.preventDefault())
        item.addEventListener('click', (event) => {
          const id = (event.currentTarget as HTMLButtonElement).dataset.rowId
          if (id) toggleRowCheck(id)
        })
        checkItems.set(row, item)
      }
      const rowId = ctx.rowIds[row] ?? ''
      item.dataset.rowId = rowId
      item.classList.toggle('is-checked', checkedRowIds.has(rowId))
      item.style.top = `${rect.y}px`
      item.style.height = `${rect.height}px`
      if (item.parentElement !== overlay) overlay.appendChild(item)
    }
    for (const [row, item] of checkItems) {
      if (row < rows.start || row >= limit) {
        item.remove()
        checkItems.delete(row)
      }
    }
  }

  /** 绑定当前网格实例（挂载/重建/视图切回后调用；实例未变仅同步勾选层） */
  function bindGrid(): void {
    const grid = getGrid()
    if (!grid) return
    if (grid !== boundGrid) {
      detachFrame?.()
      detachRowResize?.()
      boundGrid = grid
      const table = grid.getTable()
      detachFrame = table.onScrollFrame(syncRowChecks)
      detachRowResize = table.onRowResizeEnd(syncRowChecks)
    }
    if (!overlay || !overlay.isConnected) {
      const host = getHost()?.querySelector<HTMLElement>('.u-sheet__grid')
      if (host) {
        overlay = document.createElement('div')
        overlay.className = 'smart-table-row-check'
        overlay.style.width = `${grid.getTable().rowHeaderWidth}px`
        host.appendChild(overlay)
        checkItems.clear()
      }
    }
    syncRowChecks()
  }

  onScopeDispose(() => {
    offCellChange()
    detachFrame?.()
    detachRowResize?.()
    overlay?.remove()
    overlay = null
    boundGrid = null
  })

  /** 渲染高水位：行数超 100 才扩张（props 变化触发 u-sheet 网格重建） */
  const gridRows = computed(() => Math.max(100, doc.value?.rows.length ?? 0))
  /** 列数与字段数一致：不渲染字段列以外的字母列 */
  const gridCols = computed(() => doc.value?.fields.length ?? 26)

  return { workbook, header, editors, resolveCellRenderer, gridRows, gridCols, bindGrid }
}
