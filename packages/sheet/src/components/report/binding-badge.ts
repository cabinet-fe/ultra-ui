import type { CellAddress } from '@veltra/sheet-core'
import {
  CustomLayout,
  type ResolveCellRenderer,
  type ResolveCellStyleHook
} from '@veltra/sheet-core'

import { formatBindingPlaceholder, inferReportPreset } from '../../report/binding'
import type { ReportBinding, ReportPreset } from '../../report/types'

/** 绑定徽章预设配色（设计态富渲染徽章；canvas 绘制需具体色值，无法消费 CSS 变量） */
export const REPORT_PRESET_BADGE_COLORS: Record<ReportPreset, { bg: string; fg: string }> = {
  groupHeader: { bg: '#dbeafe', fg: '#1d4ed8' },
  detail: { bg: '#d1fae5', fg: '#047857' },
  subtotal: { bg: '#fef3c7', fg: '#b45309' },
  grandTotal: { bg: '#ffe4e6', fg: '#be123c' },
  cross: { bg: '#ede9fe', fg: '#6d28d9' }
}

const CUSTOM_PRESET_BADGE_COLOR = { bg: '#f3f4f6', fg: '#374151' }

/** @deprecated 05 将更名 */
export const REPORT_ROLE_BADGE_COLORS = REPORT_PRESET_BADGE_COLORS

function resolveBadgeColor(binding: ReportBinding): { bg: string; fg: string } {
  const preset = inferReportPreset(binding)
  return preset ? REPORT_PRESET_BADGE_COLORS[preset] : CUSTOM_PRESET_BADGE_COLOR
}

/** 绑定格角色底色（走 resolveCellStyle，保留 VTable 默认边框绘制） */
export function createBindingBadgeStyleResolver(
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): ResolveCellStyleHook {
  return (addr, base) => {
    const binding = getBindingAt(addr)
    if (!binding) return base

    const { bg } = resolveBadgeColor(binding)
    return { ...base, fill: { color: bg } }
  }
}

/**
 * 绑定格富渲染徽章（ADR-0004 `resolveCellRenderer` 首个消费者）：
 * 绑定单元格由纯文本占位符升级为带预设色彩的徽章（底色 + 占位文案），
 * 未绑定格返回 `undefined` 回落默认渲染。
 */
export function createBindingBadgeRenderer(
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): ResolveCellRenderer {
  return (addr) => {
    const binding = getBindingAt(addr)
    if (!binding) return undefined

    const { fg } = resolveBadgeColor(binding)
    const rootContainer = new CustomLayout.Container({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    })
    rootContainer.add(
      new CustomLayout.Text({
        text: formatBindingPlaceholder(binding, resolveLabel),
        fontSize: 11,
        fontWeight: 600,
        fill: fg
      })
    )
    return { rootContainer, renderDefault: false }
  }
}
