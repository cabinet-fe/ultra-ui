import { Sheet } from '@veltra/sheet-core'
import type { CellAddress } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE, createReportBinding } from '../../../report/binding'
import type { DatasetCatalogItem, ReportBinding } from '../../../report/types'
import { badgeLayoutProps, createBindingBadgeRenderer } from '../binding-badge'

// ---- 内联 fixtures ----

const ORDERS_DATASET: DatasetCatalogItem = {
  id: 'orders',
  label: '销售明细',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' }
  ]
}

const ADDR = { row: 1, col: 3 }

function bindingMap(entries: Array<{ addr: CellAddress; binding: ReportBinding }>) {
  const map = new Map<string, ReportBinding>()
  for (const { addr, binding } of entries) map.set(`${addr.row},${addr.col}`, binding)
  return (addr: CellAddress) => map.get(`${addr.row},${addr.col}`)
}

describe('badgeLayoutProps（单元格对齐 → 徽章容器 flex 映射）', () => {
  it('缺省对齐 → 主轴起点 + 交叉轴居中（向后兼容）', () => {
    expect(badgeLayoutProps(undefined)).toEqual({
      justifyContent: 'flex-start',
      alignItems: 'center'
    })
    expect(badgeLayoutProps({})).toEqual({ justifyContent: 'flex-start', alignItems: 'center' })
  })

  it('horizontal center / right / left → justifyContent', () => {
    expect(badgeLayoutProps({ horizontal: 'center' }).justifyContent).toBe('center')
    expect(badgeLayoutProps({ horizontal: 'right' }).justifyContent).toBe('flex-end')
    expect(badgeLayoutProps({ horizontal: 'left' }).justifyContent).toBe('flex-start')
  })

  it('vertical bottom / top / middle → alignItems', () => {
    expect(badgeLayoutProps({ vertical: 'bottom' }).alignItems).toBe('flex-end')
    expect(badgeLayoutProps({ vertical: 'top' }).alignItems).toBe('flex-start')
    expect(badgeLayoutProps({ vertical: 'middle' }).alignItems).toBe('center')
  })
})

describe('createBindingBadgeRenderer', () => {
  it('未绑定格返回 undefined 回落默认渲染', () => {
    const renderer = createBindingBadgeRenderer(bindingMap([]))
    expect(renderer(ADDR, undefined)).toBeUndefined()
  })

  it('绑定格不传 resolveAlign 保持左对齐徽章（向后兼容）', () => {
    const binding = createReportBinding(ORDERS_DATASET, 'amount')
    const renderer = createBindingBadgeRenderer(bindingMap([{ addr: ADDR, binding }]))
    const layout = renderer(ADDR, undefined)
    expect(layout?.renderDefault).toBe(false)
    expect(layout?.rootContainer.attribute.justifyContent).toBe('flex-start')
    expect(layout?.rootContainer.attribute.alignItems).toBe('center')
  })

  it('绑定格容器跟随 resolveAlign 的水平 / 垂直对齐', () => {
    const binding = createReportBinding(ORDERS_DATASET, 'amount')
    const renderer = createBindingBadgeRenderer(
      bindingMap([{ addr: ADDR, binding }]),
      undefined,
      () => ({ horizontal: 'center', vertical: 'bottom' })
    )
    const layout = renderer(ADDR, undefined)
    expect(layout?.rootContainer.attribute.justifyContent).toBe('center')
    expect(layout?.rootContainer.attribute.alignItems).toBe('flex-end')
  })

  it('接线冒烟：经 Sheet.getEffectiveStyle 读取有效样式对齐（含行默认样式叠加）', () => {
    const sheet = new Sheet()
    sheet.setCellMeta(ADDR, REPORT_META_NAMESPACE, createReportBinding(ORDERS_DATASET, 'amount'))
    sheet.setCellStyle({ start: ADDR, end: ADDR }, { align: { horizontal: 'center' } })
    sheet.setRowStyle(ADDR.row, { align: { vertical: 'bottom' } })

    const renderer = createBindingBadgeRenderer(
      (addr) => sheet.getCellMeta<ReportBinding>(addr, REPORT_META_NAMESPACE),
      undefined,
      (addr) => sheet.getEffectiveStyle(addr)?.align
    )
    const layout = renderer(ADDR, undefined)
    expect(layout?.rootContainer.attribute.justifyContent).toBe('center')
    expect(layout?.rootContainer.attribute.alignItems).toBe('flex-end')
  })
})
