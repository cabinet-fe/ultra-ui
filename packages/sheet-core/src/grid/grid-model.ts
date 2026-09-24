import type { CellStyle as EngineCellStyle, TableModel } from '@infinite-table/core'

import type { CellAddress } from '../core/address'
import type { CellValue } from '../core/cell-store'
import { formatByNumFmt } from '../core/format'
import type { Sheet } from '../core/sheet'
import type { CellStyle as SheetCellStyle } from '../core/style/types'
import { sheetStyleToEngineStyle } from './grid-style-map'

/** 显示值覆盖 hook（facade 门面形态）：base 为 numFmt 格式化后的显示值，返回 undefined 回落 base */
export type ResolveDisplayValue = (
  addr: CellAddress,
  base: CellValue | undefined
) => CellValue | undefined

/** 动态单元格样式 hook（facade 门面形态）：叠加条件样式补丁，不写模型、不进快照 */
export type ResolveCellStyleHook = (
  addr: CellAddress,
  baseStyle?: SheetCellStyle
) => SheetCellStyle | undefined

/** 引擎数据面 hooks（SheetGrid 构造时从门面 options 收集） */
export interface SheetGridModelHooks {
  resolveDisplayValue?: ResolveDisplayValue
  resolveCellStyle?: ResolveCellStyleHook
}

/**
 * Sheet → 引擎 TableModel 适配：
 * - `getCellValue` 返回模型基础值口径——公式格返回 `'=' + f` 原文（编辑初值所见即所编，
 *   等价旧 resolveEditText），其余格返回存储值 `v`（被覆盖格无存储 → undefined）；
 * - `setCellValue` 委托 Sheet（`=` 前缀自动走公式命令、空串清格，天然进 undo）；
 * - `onCellChange` 转发 Sheet 的 cell-change（引擎 ModelBinding 据此局部刷新，
 *   引擎回写路径的 echo 由 ModelBinding 吞掉防回环）。
 */
export function createSheetTableModel(sheet: Sheet): TableModel {
  return {
    rowCount: sheet.rows,
    getCellValue(col: number, row: number): unknown {
      const data = sheet.getCellData({ row, col })
      if (data?.f) return `=${data.f}`
      return data?.v ?? undefined
    },
    setCellValue(col: number, row: number, value: unknown): void {
      sheet.setCellValue({ row, col }, value as CellValue)
    },
    onCellChange(listener): () => void {
      return sheet.on('cell-change', ({ addr }) =>
        listener({ col: addr.col, row: addr.row, oldValue: undefined, newValue: undefined })
      )
    }
  }
}

/**
 * 单格显示值（门面口径，等价旧 getTableCellValue）：
 * 公式格取锚点解析后的计算缓存值（`getDisplayValue`），其余取基础值；
 * 数字值按有效样式 numFmt 格式化（仅显示，模型恒存原始值）；
 * 宿主 resolveDisplayValue hook 最后叠加（返回 undefined 回落 base）。
 */
export function getSheetDisplayValue(
  sheet: Sheet,
  col: number,
  row: number,
  hooks?: SheetGridModelHooks
): CellValue | undefined {
  const addr: CellAddress = { row, col }
  const stored = sheet.getCellData(addr)
  const raw: CellValue | undefined =
    stored?.f != null ? sheet.getDisplayValue(addr) : (stored?.v ?? undefined)
  const numFmt = typeof raw === 'number' ? sheet.getEffectiveStyle(addr)?.numFmt : undefined
  const base = numFmt ? formatByNumFmt(raw as number, numFmt) : raw
  if (!hooks?.resolveDisplayValue) return base
  const resolved = hooks.resolveDisplayValue(addr, base)
  return resolved !== undefined ? resolved : base
}

/**
 * 引擎 resolveDisplayValue hook：显示文本经 getSheetDisplayValue 求值
 * （引擎文本管线末端统一走此 hook，公式/numFmt/宿主覆盖同链生效）。
 */
export function createEngineDisplayValue(
  sheet: Sheet,
  hooks?: SheetGridModelHooks
): (col: number, row: number, value: unknown) => string {
  return (col, row) => {
    const display = getSheetDisplayValue(sheet, col, row, hooks)
    return display == null ? '' : String(display)
  }
}

/**
 * 引擎 resolveCellStyle hook：格生效样式（列 → 行 → 格，锚点解析）
 * → 宿主 resolveCellStyle hook 叠加 → 引擎 CellStyle 映射。
 * 每次格渲染拉取（pull 式），模型样式变更无需向引擎推送。
 */
export function createEngineCellStyle(
  sheet: Sheet,
  hooks?: SheetGridModelHooks
): (col: number, row: number) => EngineCellStyle | null {
  return (col, row) => {
    const addr: CellAddress = { row, col }
    const baseStyle = sheet.getEffectiveStyle(addr)
    const styled = hooks?.resolveCellStyle
      ? (hooks.resolveCellStyle(addr, baseStyle) ?? baseStyle)
      : baseStyle
    return sheetStyleToEngineStyle(styled)
  }
}
