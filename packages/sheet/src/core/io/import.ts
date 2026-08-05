import type {
  AlignmentStyle as HucreAlignment,
  Cell as HucreCell,
  CellStyle as HucreCellStyle,
  CellValue as HucreCellValue,
  FontStyle as HucreFont,
  Sheet as HucreSheet,
  Workbook as HucreWorkbook
} from 'hucre'
import { parseCsv } from 'hucre/csv'
import { readXlsx } from 'hucre/xlsx'

import type { CellData } from '../cell-store'
import { inferCellType } from '../cell-store'
import { RestoreSheetCommand } from '../command/restore-sheet'
import type { SetCellValueItem } from '../command/set-cell-value'
import type { Sheet, SheetSnapshot } from '../sheet'
import {
  BORDER_STYLE_WIDTH,
  BORDER_SIDES,
  type BorderLineStyle,
  type CellAlign,
  type CellFont,
  type CellStyle,
  type HorizontalAlign,
  type VerticalAlign
} from '../style/types'
import { Workbook } from '../workbook'

/**
 * 导入（Phase 5）：hucre（XLSX / CSV）→ 模型。
 *
 * 映射约定（与 export.ts 对称）：
 * - 值：数字/字符串/布尔按类型推断写入；错误字符串（t='e'）原样存 v
 * - 公式：cell.formula（不带 '='）→ CellData.f；计算缓存由本地引擎重算填充
 *   （一次 setCells 批量 = 单命令 = 单次重算编排 + 单 undo 单元）
 * - 日期：hucre 读回 Date 对象 → 转 1900 系统序列数存 t='d'（round-trip 保真）
 * - 样式：hucre CellStyle → 模型 { fill, border, font, align }，经 StylePool.intern 内容去重
 *   （同样式只 intern 一次；fill 只取 solid/条纹 fgColor 与渐变首色，border 线型收敛到
 *   模型 5 种，颜色缺省黑，theme 色经工作簿主题调色板解析；font/alignment 映射见
 *   hucreStyleToModel）
 * - 合并：MergeRange（0-based 闭区间）→ mergeCells（相交自动包围盒）
 * - 冻结：freezePane → setFrozen；行高：points → 像素（×4/3 取整）
 * - CSV：parseCsv（typeInference 开，前导零保留）→ 从 A1 覆盖写入既有活动表
 */

/** hucre 边框线型 → 模型 5 种线型（收敛映射） */
const HUCRE_BORDER_STYLE_MAP: Record<string, BorderLineStyle> = {
  thin: 'thin',
  medium: 'medium',
  thick: 'thick',
  dotted: 'dotted',
  dashed: 'dashed',
  double: 'medium',
  hair: 'thin',
  mediumDashed: 'dashed',
  dashDot: 'dashed',
  mediumDashDot: 'dashed',
  dashDotDot: 'dotted',
  mediumDashDotDot: 'dotted',
  slantDashDot: 'dashed'
}

/** hucre 颜色 → CSS 颜色（'#' + rgb；theme 经主题调色板解析）；无法解析返回 undefined */
function resolveColor(
  color: { rgb?: string; theme?: number } | undefined,
  themeColors?: readonly string[]
): string | undefined {
  if (color?.rgb) return color.rgb.length === 6 ? `#${color.rgb}` : color.rgb
  if (color?.theme != null && themeColors) {
    const theme = themeColors[color.theme]
    if (theme) return theme.startsWith('#') ? theme : `#${theme}`
  }
  return undefined
}

/** hucre 水平对齐 → 模型（仅 left/center/right；其余不设置） */
const HUCRE_HORIZONTAL_MAP: Partial<
  Record<NonNullable<HucreAlignment['horizontal']>, HorizontalAlign>
> = { left: 'left', center: 'center', right: 'right' }

/** hucre 垂直对齐 → 模型（center ↔ middle） */
const HUCRE_VERTICAL_MAP: Partial<Record<NonNullable<HucreAlignment['vertical']>, VerticalAlign>> =
  { top: 'top', center: 'middle', bottom: 'bottom' }

/** hucre FontStyle → 模型 font（name/vertAlign/family/charset/scheme 本期不取） */
function hucreFontToModel(font: HucreFont, themeColors?: readonly string[]): CellFont | undefined {
  const model: CellFont = {}
  const color = resolveColor(font.color, themeColors)
  if (color) model.color = color
  if (font.bold === true) model.bold = true
  if (font.italic === true) model.italic = true
  // underline 非 false 即视为 true（含 "single" / "double" 等）
  if (font.underline !== undefined && font.underline !== false) model.underline = true
  if (font.strikethrough === true) model.strikethrough = true
  if (typeof font.size === 'number' && font.size > 0) model.size = font.size
  return Object.keys(model).length > 0 ? model : undefined
}

/** hucre AlignmentStyle → 模型 align */
function hucreAlignToModel(alignment: HucreAlignment): CellAlign | undefined {
  const model: CellAlign = {}
  if (alignment.horizontal) {
    const h = HUCRE_HORIZONTAL_MAP[alignment.horizontal]
    if (h) model.horizontal = h
  }
  if (alignment.vertical) {
    const v = HUCRE_VERTICAL_MAP[alignment.vertical]
    if (v) model.vertical = v
  }
  if (alignment.wrapText === true) model.wrap = true
  return Object.keys(model).length > 0 ? model : undefined
}

/** hucre 单元格样式 → 模型样式（fill + border + font + align；numFmt 本期忽略） */
export function hucreStyleToModel(
  style: HucreCellStyle,
  themeColors?: readonly string[]
): CellStyle | undefined {
  const model: CellStyle = {}
  const fill = style.fill
  if (fill) {
    let rgb: string | undefined
    if (fill.type === 'pattern') {
      // solid 与带前景色的条纹 pattern 都取 fgColor；none/gray125 为 Excel 默认占位无视觉
      if (fill.pattern !== 'none' && fill.pattern !== 'gray125') {
        rgb = resolveColor(fill.fgColor, themeColors)
      }
    } else if (fill.stops.length > 0) {
      rgb = resolveColor(fill.stops[0]!.color, themeColors)
    }
    if (rgb) model.fill = { color: rgb }
  }
  const border: NonNullable<CellStyle['border']> = {}
  for (const side of BORDER_SIDES) {
    const edge = style.border?.[side]
    if (!edge?.style) continue
    const lineStyle = HUCRE_BORDER_STYLE_MAP[edge.style] ?? 'thin'
    border[side] = {
      style: lineStyle,
      width: BORDER_STYLE_WIDTH[lineStyle],
      // Excel 未指定颜色时默认黑色边框
      color: resolveColor(edge.color, themeColors) ?? '#000000'
    }
  }
  if (Object.keys(border).length > 0) model.border = border
  if (style.font) {
    const font = hucreFontToModel(style.font, themeColors)
    if (font) model.font = font
  }
  if (style.alignment) {
    const align = hucreAlignToModel(style.alignment)
    if (align) model.align = align
  }
  return Object.keys(model).length > 0 ? model : undefined
}

/** Date（hucre 读回的 UTC 午夜）→ 1900 系统 Excel 序列数（含 Lotus 伪闰日修正） */
export function dateToSerial1900(date: Date): number {
  const days = (date.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000
  // serial 60 = 伪 1900-02-29：1900-03-01（days=61）起的日期序列 = 天数差本身
  return days >= 61 ? days : days - 1
}

/**
 * hucre 样式 memo（导入性能关键）：Excel 样式表全局共享——同一 styleIndex 的格
 * 解析出相同的 font/fill/border/alignment **子对象引用**（hucre 的 styles 池），
 * 而 resolveStyle 每次新建外层对象。按四个子对象引用的分配 id 组合做 key：
 * 命中直接复用 StyleId，跳过 hucreStyleToModel 解析 + StylePool.intern
 * （normalize + 稳定序列化）——样式密集文件（几十万样式格）收益显著。
 */
type StyleMemo = {
  /** 子对象 → 全局递增 id（WeakMap 不持有引用，随解析生命周期回收） */
  objIds: WeakMap<object, number>
  nextObjId: number
  /** 组合 key → StyleId（内容经 hucreStyleToModel + intern 后记录） */
  ids: Map<string, number>
}

function createStyleMemo(): StyleMemo {
  return { objIds: new WeakMap(), nextObjId: 1, ids: new Map() }
}

function styleIdOf(memo: StyleMemo, obj: object | undefined): number {
  if (!obj) return 0
  let id = memo.objIds.get(obj)
  if (id === undefined) {
    id = memo.nextObjId++
    memo.objIds.set(obj, id)
  }
  return id
}

/** 样式经 memo 内部化：命中返回既有 StyleId；未命中解析 + intern 后记录 */
function internStyleMemoized(
  style: HucreCellStyle,
  sheet: Sheet,
  themeColors: readonly string[] | undefined,
  memo: StyleMemo
): number | undefined {
  // key 只由影响 hucreStyleToModel 输出的四个共享子对象决定（numFmt 被忽略）
  const key = `${styleIdOf(memo, style.font)}|${styleIdOf(memo, style.fill)}|${styleIdOf(
    memo,
    style.border
  )}|${styleIdOf(memo, style.alignment)}`
  const hit = memo.ids.get(key)
  if (hit !== undefined) return hit
  const model = hucreStyleToModel(style, themeColors)
  if (!model) return undefined
  const id = sheet.stylePool.intern(model)
  memo.ids.set(key, id)
  return id
}

/** hucre 单元格 + 行网格值 → 模型 CellData（样式经目标池 intern；空值且无样式 → undefined） */
function hucreCellToData(
  cell: HucreCell | undefined,
  value: HucreCellValue | undefined,
  sheet: Sheet,
  themeColors: readonly string[] | undefined,
  styleMemo: StyleMemo
): CellData | undefined {
  let styleId: number | undefined
  if (cell?.style) {
    styleId = internStyleMemoized(cell.style, sheet, themeColors, styleMemo)
  }
  if (cell?.formula) {
    // 只写公式原文（f）；计算缓存由命令后重算填充
    return styleId != null ? { f: cell.formula, s: styleId } : { f: cell.formula }
  }
  if (value instanceof Date) {
    const data: CellData = { v: dateToSerial1900(value), t: 'd' }
    if (styleId != null) data.s = styleId
    return data
  }
  if (cell?.type === 'error') {
    // 错误格：t='e'（值 = 错误码字符串）
    const data: CellData = { v: typeof value === 'string' ? value : String(value ?? ''), t: 'e' }
    if (styleId != null) data.s = styleId
    return data
  }
  if (value == null || value === '') {
    return styleId != null ? { s: styleId } : undefined
  }
  const t = inferCellType(value)
  const data: CellData = { v: value, ...(t ? { t } : {}) }
  if (styleId != null) data.s = styleId
  return data
}

/** 源合并区域 → 模型闭区间 */
function hucreMergeToRange(m: {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}): { start: { row: number; col: number }; end: { row: number; col: number } } {
  return { start: { row: m.startRow, col: m.startCol }, end: { row: m.endRow, col: m.endCol } }
}

/**
 * 把一个 hucre Sheet 写入模型 Sheet：
 * 清空既有内容 + 批量写入（值/公式/样式）→ 合并 → 冻结 → 行高。
 * 清空与写入同在一个事务 = 单 undo 单元（undo 恢复导入前状态）。
 */
function applyHucreSheet(
  target: Sheet,
  source: HucreSheet,
  themeColors: readonly string[] | undefined,
  styleMemo: StyleMemo
): void {
  // 实际使用范围（有值格 ∪ 合并 ∪ 行高定义）：渲染尺寸据此收敛，避免稠密
  // 行数组几何（Excel 最大 16384 列 → VTable 构造 16384 列实测 ~15s 卡死）
  let maxUsedRow = 0
  let maxUsedCol = 0
  target.beginTransaction()
  try {
    // 清空：先解除既有合并（结构），再批量清除数据（空数据删除整格，样式一并移除）
    for (const range of target.merges.getMerges()) target.unmergeCells(range)
    const clearItems: SetCellValueItem[] = []
    for (const [addr] of target.store.entries()) clearItems.push({ addr, data: undefined })
    if (clearItems.length > 0) target.setCells(clearItems)

    // 合并区域内的非锚点格：模型不支持覆盖格数据（锚点语义），跳过不写。
    // 整数 key（行 × 2^20 + 列）替代字符串拼接（主循环每格一次，75 万格量级）
    const COVERED_STRIDE = 1048576
    const covered = new Set<number>()
    for (const m of source.merges ?? []) {
      for (let r = m.startRow; r <= m.endRow; r++) {
        for (let c = m.startCol; c <= m.endCol; c++) {
          if (r !== m.startRow || c !== m.startCol) covered.add(r * COVERED_STRIDE + c)
        }
      }
    }

    // 批量写入（一次 setCells = 单命令 = 单次重算编排）
    // 性能关键：hucre 的 rows 是稠密数组（Excel 最大列 16384），空槽占绝大多数
    // （实测 2.18 亿次迭代中 99.97% 为 null）——必须先跳过空槽再做
    // covered/cells.get/样式转换，否则单文件导入可达分钟级。
    const items: SetCellValueItem[] = []
    const cells = source.cells ?? new Map<string, HucreCell>()
    for (let r = 0; r < source.rows.length; r++) {
      const row = source.rows[r]
      if (!row) continue
      for (let c = 0; c < row.length; c++) {
        const value = row[c]
        if (value == null) continue
        if (covered.has(r * COVERED_STRIDE + c)) continue
        const data = hucreCellToData(cells.get(`${r},${c}`), value, target, themeColors, styleMemo)
        if (data === undefined && value == null) continue
        items.push({ addr: { row: r, col: c }, data })
        if (r > maxUsedRow) maxUsedRow = r
        if (c > maxUsedCol) maxUsedCol = c
      }
    }
    // 补漏：值 null/空但 cell 有详情（纯样式格 / 公式缓存空）的格——主循环的空槽
    // 快速跳过会漏掉它们。
    // 保留策略：有值范围外扩 100 行/列的「紧邻带」内的样式格保留（表头/边框
    // 等紧邻格式），带外丢弃——预算套表常有「全选设边框」残留（整表 13327 行 ×
    // 16384 列 16~20 万个空白格式格），写入它们会把 rowCount/colCount 高水位撑到
    // Excel 极限 → VTable 构造 16384 列实测 ~15-30s（切表卡死）。带外的格式格
    // 渲染区外不可见（用户也滚动不到），丢弃无感知损失。
    const KEEP_MARGIN = 100
    for (const [key, cell] of cells) {
      // 先解析行号：带外行（占绝大多数）直接跳过，省列解析（slice 分配是
      // 主成本，76 万格量级收益可观）
      const comma = key.indexOf(',')
      const r = Number(key.slice(0, comma))
      // 公式格是真实内容：保留并计入尺寸（即使值缓存为空）
      const isFormula = Boolean(cell?.formula)
      if (!isFormula && r > maxUsedRow + KEEP_MARGIN) continue
      const c = Number(key.slice(comma + 1))
      if (!isFormula && c > maxUsedCol + KEEP_MARGIN) continue
      if (isFormula) {
        if (r > maxUsedRow) maxUsedRow = r
        if (c > maxUsedCol) maxUsedCol = c
      }
      const value = source.rows[r]?.[c]
      if (value != null) continue
      if (covered.has(r * COVERED_STRIDE + c)) continue
      const data = hucreCellToData(cell, value, target, themeColors, styleMemo)
      if (data === undefined) continue
      items.push({ addr: { row: r, col: c }, data })
    }
    if (items.length > 0) target.setCells(items)

    // 合并（相交自动包围盒；锚点值保留规则对空覆盖格无副作用）；合并区计入尺寸。
    // 批量一次命令 = 单 undo 单元（1016 个合并区域避免 1016 次命令/重算编排）
    const sourceMerges = source.merges ?? []
    if (sourceMerges.length > 0) {
      target.mergeCellsBatch(sourceMerges.map((m) => hucreMergeToRange(m)))
    }
    for (const m of sourceMerges) {
      if (m.endRow > maxUsedRow) maxUsedRow = m.endRow
      if (m.endCol > maxUsedCol) maxUsedCol = m.endCol
    }
    target.commit()
  } catch (error) {
    // 失败回滚：还原事务缓冲中的变更并放弃事务（不留半导入状态）
    target.rollback()
    throw error
  }
  // 冻结与行高：模型状态，不进 undo（行高定义的行计入尺寸）
  target.setFrozen(source.freezePane?.rows ?? 0, source.freezePane?.columns ?? 0)
  if (source.rowDefs) {
    for (const [row, def] of source.rowDefs) {
      if (def?.height) target.setRowHeight(row, Math.round((def.height * 4) / 3))
      if (row > maxUsedRow) maxUsedRow = row
    }
  }
  // 渲染尺寸 = 实际使用范围（有值格 ∪ 合并 ∪ 行高定义），不进 undo。
  // 不做「稠密行数组几何扩张」：XML 里空格式行/列（如 16384 列宽行）会让
  // VTable 构造超大表格（实测附表33-2 16384 列 × 13328 行重建 ~15s）。
  target.ensureTableSize(Math.max(1, maxUsedRow + 1), Math.max(1, maxUsedCol + 1))
}

/** 唯一化 sheet 名（大小写不敏感；冲突追加序号） */
function uniqueName(name: string, used: Set<string>): string {
  if (name.trim() !== '' && !used.has(name.toLowerCase())) return name
  for (let n = 2; ; n++) {
    const candidate = `${name.trim() === '' ? 'Sheet' : name} ${n}`
    if (!used.has(candidate.toLowerCase())) return candidate
  }
}

/**
 * 从 XLSX 字节导入为新工作簿（多 sheet：值 / 公式 / 合并 / 样式（样式池去重）/ 冻结 / 行高）。
 * 每个 sheet 的数据写入 = 单 undo 单元（在其自身历史栈上）。
 */
export async function importXlsx(buffer: ArrayBuffer | Uint8Array): Promise<Workbook> {
  const hucreWb: HucreWorkbook = await readXlsx(buffer, { readStyles: true })
  return buildWorkbookFromHucre(hucreWb)
}

/**
 * hucre 解析结果 → 新工作簿（importXlsx 与 worker 分片构建共用）。
 * @internal onProgress：每完成一个 sheet 回调（worker 导入进度反馈；
 * 无头调用不传——回调为同步调用，不影响模型语义）
 */
export function buildWorkbookFromHucre(
  hucreWb: HucreWorkbook,
  onProgress?: (done: number, total: number) => void
): Workbook {
  const workbook = new Workbook()
  const themeColors = hucreWb.themeColors
  const used = new Set<string>()
  // 样式 memo 跨 sheet 共享（Excel 工作簿样式表全局共享，同 styleIndex 子对象引用一致）
  const styleMemo = createStyleMemo()

  const sheets = hucreWb.sheets
  const total = sheets.length
  const first = workbook.activeSheet
  if (sheets.length > 0) {
    const name = sheets[0]!.name
    if (name.trim() !== '' && workbook.renameSheet('Sheet1', name)) {
      used.add(name.toLowerCase())
    } else {
      used.add('sheet1')
    }
    applyHucreSheet(first, sheets[0]!, themeColors, styleMemo)
    onProgress?.(1, total)
  }
  for (let i = 1; i < sheets.length; i++) {
    const name = uniqueName(sheets[i]!.name, used)
    used.add(name.toLowerCase())
    workbook.addSheet(name)
    applyHucreSheet(workbook.getSheet(name)!, sheets[i]!, themeColors, styleMemo)
    onProgress?.(i + 1, total)
  }
  const active = hucreWb.activeSheet ?? 0
  const target = workbook.getSheets()[active]
  if (target && target !== workbook.activeSheet) workbook.activateSheet(target.name)
  return workbook
}

/**
 * CSV 文本 → 写入既有活动表（事务包裹 = 单 undo 单元；从 A1 覆盖写入，粘贴语义：
 * 空格不覆盖既有格，空串清除目标格）。
 */
export function importCsv(text: string, sheet: Sheet): void {
  const rows = parseCsv(text, { typeInference: true })
  sheet.beginTransaction()
  try {
    const items: SetCellValueItem[] = []
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]
      if (!row) continue
      for (let c = 0; c < row.length; c++) {
        const value = row[c]
        if (value == null) continue // 空格不覆盖既有格
        if (value === '') {
          items.push({ addr: { row: r, col: c }, data: undefined })
          continue
        }
        if (value instanceof Date) {
          items.push({ addr: { row: r, col: c }, data: { v: dateToSerial1900(value), t: 'd' } })
          continue
        }
        const t = inferCellType(value)
        items.push({ addr: { row: r, col: c }, data: { v: value, ...(t ? { t } : {}) } })
      }
    }
    if (items.length > 0) sheet.setCells(items)
    sheet.commit()
  } catch (error) {
    sheet.rollback()
    throw error
  }
  // 按解析结果扩张渲染尺寸（空行/宽行也算进列数；不进 undo）
  let maxCols = 0
  for (const row of rows) {
    if (row) maxCols = Math.max(maxCols, row.length)
  }
  sheet.ensureTableSize(rows.length, maxCols)
}

/**
 * 把源工作簿内容整体替换到目标工作簿（导入 UI 的「替换当前工作簿」策略）。
 * 结构变更（sheet 增删）不走 undo（Phase 3 门面边界结论）；每个 sheet 的
 * 内容替换 = 单 undo 单元（RestoreSheetCommand 整表快照替换，undo 恢复该
 * sheet 导入前数据）。
 *
 * 快照整表替换（P0 优化）：不逐格 setCells——导入执行期间不发逐格
 * cell-change（避免主线程十万级视图同步白干）；数据只搬一次（源快照直接
 * restore 进目标，不再经「restore 重建 → copySheetContent 逐格拷贝」三拷贝）。
 * 行高不在快照字段内，单独随条目传输（快照数组路径不传 → 保持现状行为）。
 */
export function replaceWorkbook(target: Workbook, source: Workbook): void {
  replaceWorkbookWithSnapshots(
    target,
    source
      .getSheets()
      .map((s) => ({ name: s.name, snapshot: s.snapshot(), rowHeights: s.getRowHeights() })),
    source.activeSheetIndex
  )
}

/** 快照替换条目（行高不在 SheetSnapshot 字段内，单独随条目传输） */
export interface SheetReplaceItem {
  name: string
  snapshot: SheetSnapshot
  /** 行高（不进 undo；快照数组路径不传 → 目标行高保持现状） */
  rowHeights?: ReadonlyMap<number, number>
}

/**
 * 以快照数组替换目标工作簿内容（worker 导入链路：主线程不再 restore 重建临时
 * Workbook，worker 返回的快照直接替换进目标）。
 * 结构变更（删多余 / 改名 / 新增）不走 undo；每个 sheet 内容替换 = 单 undo 单元。
 */
export function replaceWorkbookWithSnapshots(
  target: Workbook,
  snapshots: readonly SheetReplaceItem[],
  activeIndex: number
): void {
  // 批量结构变更：196 sheet 的删表/加表/改名事件合并为一次补发（避免 vue 层
  // 反复重渲染 tabs / pruneCache / bump 的事件风暴）
  target.beginBatch()
  try {
    // 1. 结构：删除多余 sheet（从后往前，至少保留一个）
    const existing = target.getSheets()
    for (let i = existing.length - 1; i > 0; i--) target.removeSheet(existing[i]!.name)

    // 2. 第一个 sheet：改名（失败保持原名）+ 内容替换
    const first = target.activeSheet
    const sourceFirst = snapshots[0]
    if (sourceFirst) {
      if (first.name !== sourceFirst.name && sourceFirst.name.trim() !== '') {
        target.renameSheet(first.name, sourceFirst.name)
      }
      replaceSheetFromSnapshot(first, sourceFirst)
    } else {
      // 防御：空快照数组 → 清空第一个 sheet（等价于替换为空表）
      replaceSheetFromSnapshot(first, { name: 'Sheet1', snapshot: EMPTY_SHEET_SNAPSHOT })
    }

    // 3. 其余 sheet：新增 + 内容替换
    const used = new Set(target.getSheets().map((s) => s.name.toLowerCase()))
    for (let i = 1; i < snapshots.length; i++) {
      const src = snapshots[i]!
      const name = uniqueName(src.name, used)
      used.add(name.toLowerCase())
      replaceSheetFromSnapshot(target.addSheet(name), src)
    }

    // 4. 激活项对齐源工作簿
    const targetActive = target.getSheets()[Math.min(activeIndex, target.sheetCount - 1)]!
    if (targetActive !== target.activeSheet) target.activateSheet(targetActive.name)
  } finally {
    target.endBatch()
  }
}

/** 空表快照（空快照数组替换时清空第一个 sheet 用） */
const EMPTY_SHEET_SNAPSHOT: SheetSnapshot = {
  cells: [],
  styles: [],
  merges: [],
  frozen: { rows: 0, cols: 0 },
  rows: 0,
  cols: 0
}

/**
 * 单个 sheet 的快照整表替换（RestoreSheetCommand，事务保护 = 单 undo 单元）。
 * 替换 cells/styles/merges（+ 公式图重建）；行高随条目应用（不进 undo）；
 * 选区对齐快照（导入默认 A1——hucre 不解析 OOXML selection；不复制则替换后
 * 残留目标旧选区，与「导入默认 A1」不符）。选区写入不进 undo（同
 * copySheetContent 先例）。
 */
function replaceSheetFromSnapshot(sheet: Sheet, item: SheetReplaceItem): void {
  const { snapshot } = item
  sheet.beginTransaction()
  try {
    sheet.executeCommand(RestoreSheetCommand.id, { snapshot })
    sheet.commit()
  } catch (error) {
    // 失败回滚：还原事务缓冲中的变更并放弃事务（不留半替换状态）
    sheet.rollback()
    throw error
  }
  if (item.rowHeights) {
    for (const [row, height] of item.rowHeights) sheet.setRowHeight(row, height)
  }
  // 选区静默对齐快照（导入默认 A1——hucre 不解析 OOXML selection；不复制则替换后
  // 残留目标旧选区）。用 selection.restoreState 而非 selectCell/selectRange：
  // 不发 selection-change——批量替换 196 sheet 时避免 196 次事件 + vue bump +
  // grid 回驱（视图刷新由调用方重建 grid 时经模型选区回驱接管）。选区不进 undo。
  const sel = snapshot.selection
  if (sel?.activeCell) {
    const active = sheet.merges.resolveAnchor(sel.activeCell)
    sheet.selection.restoreState({
      activeCell: active,
      ranges: sel.ranges?.length
        ? sel.ranges.map((r) => ({ start: { ...r.start }, end: { ...r.end } }))
        : [{ start: { ...active }, end: { ...active } }]
    })
  } else {
    sheet.selection.restoreState({
      activeCell: { row: 0, col: 0 },
      ranges: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }]
    })
  }
}

/**
 * 把源 sheet 内容拷贝进目标 sheet（样式按内容重新 intern 到目标样式池）。
 * 事务包裹 = 单 undo 单元（undo 恢复目标 sheet 拷贝前状态）。
 */
export function copySheetContent(target: Sheet, source: Sheet): void {
  target.beginTransaction()
  try {
    // 清空目标：先解除既有合并，再批量清除数据
    for (const range of target.merges.getMerges()) target.unmergeCells(range)
    const clearItems: SetCellValueItem[] = []
    for (const [addr] of target.store.entries()) clearItems.push({ addr, data: undefined })
    if (clearItems.length > 0) target.setCells(clearItems)

    // 拷贝源数据（跨 sheet 样式 id 无效：重新 intern）
    const items: SetCellValueItem[] = []
    for (const [addr, data] of source.store.entries()) {
      const copy: CellData = { ...data }
      if (copy.s != null) {
        const style = source.stylePool.get(copy.s)
        copy.s = style ? target.stylePool.intern(style) : undefined
      }
      if (copy.s === undefined) delete copy.s
      items.push({ addr: { row: addr.row, col: addr.col }, data: copy })
    }
    if (items.length > 0) target.setCells(items)

    for (const range of source.merges.getMerges()) target.mergeCells({ ...range })
    target.commit()
  } catch (error) {
    target.rollback()
    throw error
  }
  target.setFrozen(source.frozen.rows, source.frozen.cols)
  for (const [row, height] of source.getRowHeights()) target.setRowHeight(row, height)
  // 按源表声明尺寸与数据高水位扩张（不进 undo）
  target.ensureTableSize(
    Math.max(source.rows, source.rowCount),
    Math.max(source.cols, source.colCount)
  )
  // 选区对齐源表（hucre 不解析 OOXML selection → importXlsx 源表恒为 A1；
  // 不复制则 replaceWorkbook 会残留目标表导入前选区，与「导入默认 A1」不符）
  const srcSel = source.getSelection()
  if (srcSel.activeCell && srcSel.ranges[0]) {
    target.selectRange(srcSel.ranges[0], srcSel.activeCell)
  } else {
    target.selectCell({ row: 0, col: 0 })
  }
}
