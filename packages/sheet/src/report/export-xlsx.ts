import type { Sheet } from '@veltra/sheet-core'
import { exportSheetXlsx } from '@veltra/sheet-core/core/io/export'

/** 列宽条目：模型列索引 → 像素宽（与 SheetSnapshot.colWidths 同构） */
export type ReportColWidthEntry = readonly [number, number]

/**
 * 将已填充的 Sheet（Filled Report）导出为保真 XLSX（合并 / 样式 / 行高 / 列宽 / 浮动图）。
 * 组装与序列化委托 sheet-core `exportSheetXlsx`（与 `exportWorkbookXlsx` 同一套单表逻辑）；
 * 条件样式颜色已在 renderReport 展开阶段打平进 StylePool（ADR-0001 决策 2）。
 * 列宽取自 sheet 模型（`getColWidths`）。
 */
export function exportFilledReportXlsx(sheet: Sheet): Promise<Uint8Array> {
  return exportSheetXlsx(sheet, { fallbackName: '报表' })
}
