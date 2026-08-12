import { presetBindingPatch } from '../../../report/binding'
import type { ReportBinding, ReportPreset } from '../../../report/types'

const PRESET_LABELS: Record<ReportPreset, string> = {
  groupHeader: '分组头',
  detail: '明细行',
  subtotal: '小计行',
  grandTotal: '总计行',
  cross: '交叉格'
}

export const REPORT_PRESET_OPTIONS = (
  Object.entries(PRESET_LABELS) as Array<[ReportPreset, string]>
).map(([value, label]) => ({ value, label }))

/** @deprecated 05 将更名；暂保留别名供 float-panel 消费 */
export const REPORT_ROLE_OPTIONS = REPORT_PRESET_OPTIONS

export function presetLabel(preset: ReportPreset): string {
  return PRESET_LABELS[preset]
}

/** @deprecated 05 将更名 */
export const roleLabel = presetLabel

/** 切换预设时写入 expand / aggregate / 父格组合（父格除 grandTotal 外保留既有值） */
export function presetBindingDefaults(preset: ReportPreset): Partial<ReportBinding> {
  return presetBindingPatch(preset)
}

/** @deprecated 05 将更名 */
export const roleBindingDefaults = presetBindingDefaults
