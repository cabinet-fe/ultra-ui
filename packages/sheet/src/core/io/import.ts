import type {
  Cell as HucreCell,
  CellStyle as HucreCellStyle,
  CellValue as HucreCellValue,
  Sheet as HucreSheet,
  Workbook as HucreWorkbook
} from 'hucre'
import { parseCsv } from 'hucre/csv'
import { readXlsx } from 'hucre/xlsx'

import type { CellData } from '../cell-store'
import { inferCellType } from '../cell-store'
import type { SetCellValueItem } from '../command/set-cell-value'
import type { Sheet } from '../sheet'
import {
  BORDER_STYLE_WIDTH,
  BORDER_SIDES,
  type BorderLineStyle,
  type CellStyle
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
 * - 样式：hucre CellStyle → 模型 { fill, border }，经 StylePool.intern 内容去重
 *   （同样式只 intern 一次；fill 只取 solid/条纹 fgColor 与渐变首色，border 线型收敛到
 *   模型 5 种，颜色缺省黑，theme 色经工作簿主题调色板解析）
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

/** hucre 单元格样式 → 模型样式（只取 fill + border；numFmt/font/alignment 等本期不支持，忽略） */
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
  return Object.keys(model).length > 0 ? model : undefined
}

/** Date（hucre 读回的 UTC 午夜）→ 1900 系统 Excel 序列数（含 Lotus 伪闰日修正） */
export function dateToSerial1900(date: Date): number {
  const days = (date.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000
  // serial 60 = 伪 1900-02-29：1900-03-01（days=61）起的日期序列 = 天数差本身
  return days >= 61 ? days : days - 1
}

/** hucre 单元格 + 行网格值 → 模型 CellData（样式经目标池 intern；空值且无样式 → undefined） */
function hucreCellToData(
  cell: HucreCell | undefined,
  value: HucreCellValue | undefined,
  sheet: Sheet,
  themeColors?: readonly string[]
): CellData | undefined {
  let styleId: number | undefined
  if (cell?.style) {
    const style = hucreStyleToModel(cell.style, themeColors)
    if (style) styleId = sheet.stylePool.intern(style)
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
function applyHucreSheet(target: Sheet, source: HucreSheet, themeColors?: readonly string[]): void {
  target.beginTransaction()
  try {
    // 清空：先解除既有合并（结构），再批量清除数据（空数据删除整格，样式一并移除）
    for (const range of target.merges.getMerges()) target.unmergeCells(range)
    const clearItems: SetCellValueItem[] = []
    for (const [addr] of target.store.entries()) clearItems.push({ addr, data: undefined })
    if (clearItems.length > 0) target.setCells(clearItems)

    // 合并区域内的非锚点格：模型不支持覆盖格数据（锚点语义），跳过不写
    const covered = new Set<string>()
    for (const m of source.merges ?? []) {
      for (let r = m.startRow; r <= m.endRow; r++) {
        for (let c = m.startCol; c <= m.endCol; c++) {
          if (r !== m.startRow || c !== m.startCol) covered.add(`${r},${c}`)
        }
      }
    }

    // 批量写入（一次 setCells = 单命令 = 单次重算编排）
    const items: SetCellValueItem[] = []
    const cells = source.cells ?? new Map<string, HucreCell>()
    for (let r = 0; r < source.rows.length; r++) {
      const row = source.rows[r]
      if (!row) continue
      for (let c = 0; c < row.length; c++) {
        const key = `${r},${c}`
        if (covered.has(key)) continue
        const data = hucreCellToData(cells.get(key), row[c], target, themeColors)
        if (data === undefined && row[c] == null) continue
        items.push({ addr: { row: r, col: c }, data })
      }
    }
    if (items.length > 0) target.setCells(items)

    // 合并（相交自动包围盒；锚点值保留规则对空覆盖格无副作用）
    for (const m of source.merges ?? []) target.mergeCells(hucreMergeToRange(m))
    target.commit()
  } catch (error) {
    // 失败回滚：还原事务缓冲中的变更并放弃事务（不留半导入状态）
    target.rollback()
    throw error
  }
  // 冻结与行高：模型状态，不进 undo
  target.setFrozen(source.freezePane?.rows ?? 0, source.freezePane?.columns ?? 0)
  if (source.rowDefs) {
    for (const [row, def] of source.rowDefs) {
      if (def?.height) target.setRowHeight(row, Math.round((def.height * 4) / 3))
    }
  }
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
  const workbook = new Workbook()
  const themeColors = hucreWb.themeColors
  const used = new Set<string>()

  const sheets = hucreWb.sheets
  const first = workbook.activeSheet
  if (sheets.length > 0) {
    const name = sheets[0]!.name
    if (name.trim() !== '' && workbook.renameSheet('Sheet1', name)) {
      used.add(name.toLowerCase())
    } else {
      used.add('sheet1')
    }
    applyHucreSheet(first, sheets[0]!, themeColors)
  }
  for (let i = 1; i < sheets.length; i++) {
    const name = uniqueName(sheets[i]!.name, used)
    used.add(name.toLowerCase())
    workbook.addSheet(name)
    applyHucreSheet(workbook.getSheet(name)!, sheets[i]!, themeColors)
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
}

/**
 * 把源工作簿内容整体替换到目标工作簿（导入 UI 的「替换当前工作簿」策略）。
 * 结构变更（sheet 增删）不走 undo（Phase 3 门面边界结论）；每个 sheet 的数据
 * 写入 = 单 undo 单元，undo 恢复该 sheet 导入前数据。
 */
export function replaceWorkbook(target: Workbook, source: Workbook): void {
  // 1. 结构：删除多余 sheet（从后往前，至少保留一个）
  const existing = target.getSheets()
  for (let i = existing.length - 1; i > 0; i--) target.removeSheet(existing[i]!.name)

  // 2. 第一个 sheet：改名（失败保持原名）+ 内容替换
  const first = target.activeSheet
  const sourceFirst = source.getSheets()[0]!
  if (first.name !== sourceFirst.name && sourceFirst.name.trim() !== '') {
    target.renameSheet(first.name, sourceFirst.name)
  }
  copySheetContent(first, sourceFirst)

  // 3. 其余 sheet：新增 + 内容拷贝
  const used = new Set(target.getSheets().map((s) => s.name.toLowerCase()))
  for (let i = 1; i < source.sheetCount; i++) {
    const src = source.getSheets()[i]!
    const name = uniqueName(src.name, used)
    used.add(name.toLowerCase())
    target.addSheet(name)
    copySheetContent(target.getSheet(name)!, src)
  }

  // 4. 激活项对齐源工作簿
  const targetActive = target.getSheets()[Math.min(source.activeSheetIndex, target.sheetCount - 1)]!
  if (targetActive !== target.activeSheet) target.activateSheet(targetActive.name)
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
}
