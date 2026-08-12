import type { SheetSnapshot } from '@veltra/sheet-core'

import type { ReportColWidthEntry } from '../export-xlsx'
import type { DatasetRecords } from '../types'
import { buildFilledReport, mapFilledColWidths } from './builder'
import { computeExpansionLayout } from './coordinate'
import { buildTemplateIndex } from './template-index'

/**
 * 将 Report Template 按 Dataset 渲染为 Filled Report 快照。
 * 基于显式展开方向与父格关系展开，不做坐标推断。
 */
export function renderReport(template: SheetSnapshot, data: DatasetRecords): SheetSnapshot {
  const index = buildTemplateIndex(template)
  const layout = computeExpansionLayout(index, data)
  return buildFilledReport(template, index, layout, data)
}

/** 将设计态模板列宽映射为填充报表物理列宽（横向展开列继承父格列宽） */
export function resolveFilledColWidths(
  template: SheetSnapshot,
  data: DatasetRecords,
  templateColWidths: ReadonlyArray<ReportColWidthEntry>
): ReportColWidthEntry[] {
  const index = buildTemplateIndex(template)
  const layout = computeExpansionLayout(index, data)
  return mapFilledColWidths(templateColWidths, layout, index)
}

export { mapFilledColWidths } from './builder'
