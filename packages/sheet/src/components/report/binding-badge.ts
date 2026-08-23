import type { CellAddress, CellAlign } from '@veltra/sheet-core'
import {
  CustomLayout,
  type ResolveCellRenderer,
  type ResolveCellStyleHook
} from '@veltra/sheet-core/grid'

import { formatBindingPlaceholderParts, inferReportPreset } from '../../report/binding'
import type { ReportBinding, ReportPreset } from '../../report/types'

/**
 * 绑定徽章预设配色（设计态富渲染徽章；canvas 绘制需具体色值，无法消费 CSS 变量）。
 * `cell` 为整格极浅底色，`fg` 为强调色（聚合标签徽章底色）。
 */
export interface ReportBadgeColors {
  cell: string
  fg: string
}

export const REPORT_PRESET_BADGE_COLORS: Record<ReportPreset, ReportBadgeColors> = {
  groupHeader: { cell: '#eef4ff', fg: '#2f54eb' },
  detail: { cell: '#effaf3', fg: '#1f9254' },
  subtotal: { cell: '#fff7e6', fg: '#d46b08' },
  grandTotal: { cell: '#fff1f0', fg: '#cf1322' },
  cross: { cell: '#f8f5ff', fg: '#5f3dc4' }
}

const CUSTOM_PRESET_BADGE_COLOR: ReportBadgeColors = { cell: '#f7f8fa', fg: '#495057' }

/** 徽章字段标签文字色（中性深灰，与强调色形成层次） */
const BADGE_LABEL_COLOR = '#343a40'

/** @deprecated 05 将更名 */
export const REPORT_ROLE_BADGE_COLORS = REPORT_PRESET_BADGE_COLORS

function resolveBadgeColor(binding: ReportBinding): ReportBadgeColors {
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

    const { cell } = resolveBadgeColor(binding)
    return { ...base, fill: { color: cell } }
  }
}

/** 徽章容器 flex 布局属性（`flexDirection: 'row'` 下主轴 = 水平） */
interface BadgeLayoutProps {
  justifyContent: 'flex-start' | 'center' | 'flex-end'
  alignItems: 'flex-start' | 'center' | 'flex-end'
}

/**
 * 单元格对齐 → 徽章容器 flex 布局映射（纯函数，便于单测）：
 * `horizontal` left / 缺省 → 主轴起点；`vertical` middle / 缺省 → 交叉轴居中。
 */
export function badgeLayoutProps(align: CellAlign | undefined): BadgeLayoutProps {
  const justifyContent =
    align?.horizontal === 'center'
      ? 'center'
      : align?.horizontal === 'right'
        ? 'flex-end'
        : 'flex-start'
  const alignItems =
    align?.vertical === 'top' ? 'flex-start' : align?.vertical === 'bottom' ? 'flex-end' : 'center'
  return { justifyContent, alignItems }
}

/**
 * 绑定格富渲染徽章（ADR-0004 `resolveCellRenderer` 首个消费者）：
 * 绑定单元格渲染为徽章布局（强调色聚合标签 + 中性色字段标签），
 * 布局跟随单元格水平 / 垂直对齐（经 `resolveAlign` 读有效样式）；
 * 未绑定格返回 `undefined` 回落默认渲染。
 */
export function createBindingBadgeRenderer(
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined,
  resolveLabel?: (datasetId: string, fieldName: string) => string,
  resolveAlign?: (addr: CellAddress) => CellAlign | undefined
): ResolveCellRenderer {
  return (addr) => {
    const binding = getBindingAt(addr)
    if (!binding) return undefined

    const { fg } = resolveBadgeColor(binding)
    const { tag, label } = formatBindingPlaceholderParts(binding, resolveLabel)
    const { justifyContent, alignItems } = badgeLayoutProps(resolveAlign?.(addr))

    const rootContainer = new CustomLayout.Container({
      display: 'flex',
      flexDirection: 'row',
      justifyContent,
      alignItems
    })
    // VTable 布局层 Tag 组件（vrender-components）与其 INode 声明存在结构性类型偏差，
    // 运行时完全兼容（VTable 官方 customLayout 徽章用法即如此），此处仅收敛类型
    const tagEl = new CustomLayout.Tag({
      text: tag,
      textStyle: { fontSize: 10, fontWeight: 600, fill: '#ffffff' },
      panel: { visible: true, fill: fg, cornerRadius: 3 },
      padding: [1, 4, 1, 4],
      marginLeft: 6,
      marginRight: 5
    })
    rootContainer.add(tagEl as unknown as Parameters<typeof rootContainer.add>[0])
    rootContainer.add(
      new CustomLayout.Text({ text: label, fontSize: 11, fontWeight: 500, fill: BADGE_LABEL_COLOR })
    )
    if (binding.drill) {
      rootContainer.add(
        new CustomLayout.Text({ text: ' ↗', fontSize: 11, fontWeight: 700, fill: fg })
      )
    }
    return { rootContainer, renderDefault: false }
  }
}
