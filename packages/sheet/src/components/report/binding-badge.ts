import type { CellAddress } from '@veltra/sheet-core'
import {
  CustomLayout,
  type ResolveCellRenderer,
  type ResolveCellStyleHook
} from '@veltra/sheet-core'

import { formatBindingPlaceholder, resolveReportRole } from '../../report/binding'
import type { ReportBinding, ReportRole } from '../../report/types'

/** 绑定徽章角色配色（设计态富渲染徽章；canvas 绘制需具体色值，无法消费 CSS 变量） */
export const REPORT_ROLE_BADGE_COLORS: Record<ReportRole, { bg: string; fg: string }> = {
  group: { bg: '#dbeafe', fg: '#1d4ed8' },
  detail: { bg: '#d1fae5', fg: '#047857' },
  subtotal: { bg: '#fef3c7', fg: '#b45309' },
  grandTotal: { bg: '#ffe4e6', fg: '#be123c' },
  matrix: { bg: '#ede9fe', fg: '#6d28d9' }
}

/** 绑定格角色底色（走 resolveCellStyle，保留 VTable 默认边框绘制） */
export function createBindingBadgeStyleResolver(
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
): ResolveCellStyleHook {
  return (addr, base) => {
    const binding = getBindingAt(addr)
    if (!binding) return base

    const { bg } = REPORT_ROLE_BADGE_COLORS[resolveReportRole(binding)]
    return { ...base, fill: { color: bg } }
  }
}

/**
 * 绑定格富渲染徽章（ADR-0004 `resolveCellRenderer` 首个消费者）：
 * 绑定单元格由纯文本占位符升级为带角色色彩的徽章（角色底色 + 占位文案），
 * 未绑定格返回 `undefined` 回落默认渲染。
 *
 * 角色底色经 `createBindingBadgeStyleResolver` 写入 cell style；此处仅居中绘制
 * 占位文案。根容器禁止 percentCalc 宽高——VTable 在 customLayout 根节点上
 * `Math.max(cellSize, root.width)` 时会把 percent 对象算成 NaN，导致格变白并盖住边框。
 *
 * 遵守 cell hook 性能契约：纯函数、同步返回、O(1) 查找（Cell Meta 稀疏 Map），
 * 禁异步与大对象分配（每格仅一个容器 + 一个文本节点）。
 */
export function createBindingBadgeRenderer(
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined,
  resolveLabel?: (datasetId: string, fieldName: string) => string
): ResolveCellRenderer {
  return (addr) => {
    const binding = getBindingAt(addr)
    if (!binding) return undefined

    const { fg } = REPORT_ROLE_BADGE_COLORS[resolveReportRole(binding)]
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
