import type { CellAddress } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import {
  createReportBinding,
  findDefaultLeftParent,
  formatBindingPlaceholder,
  formatCellAddress,
  parseCellAddress,
  resolveLeftParent,
  resolveReportRole,
  setBindingCatalog
} from '../binding'
import type { DatasetCatalogItem, ReportBinding } from '../types'

/** 内联 catalog fixture（单一事实源在测试自身，不依赖 playground mock） */
const ORDERS_DATASET: DatasetCatalogItem = {
  id: 'orders',
  label: '销售明细',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'orderNo', label: '订单号', type: 'string' },
    { name: 'region', label: '地区', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' },
    { name: 'orderDate', label: '下单日期', type: 'date' }
  ]
}

setBindingCatalog([ORDERS_DATASET])

function bindingMap(cells: Array<{ addr: CellAddress; binding: ReportBinding }>) {
  const map = new Map<string, ReportBinding>()
  for (const { addr, binding } of cells) {
    map.set(`${addr.row},${addr.col}`, binding)
  }
  return (addr: CellAddress) => map.get(`${addr.row},${addr.col}`)
}

describe('report binding', () => {
  it('createReportBinding 默认 list + 纵向扩展 + 默认左父格', () => {
    const binding = createReportBinding(ORDERS_DATASET, 'amount')
    expect(binding).toEqual({
      dataset: 'orders',
      field: 'amount',
      role: 'detail',
      aggregate: 'select',
      expand: 'down',
      leftParent: 'default',
      sort: 'none',
      conditionalRules: []
    })
  })

  it('formatBindingPlaceholder 中文标签', () => {
    expect(formatBindingPlaceholder(createReportBinding(ORDERS_DATASET, 'amount'))).toBe(
      '明细 · 金额'
    )

    const group = createReportBinding(ORDERS_DATASET, 'customer')
    group.aggregate = 'group'
    expect(formatBindingPlaceholder(group)).toBe('分组 · 客户')

    const sum = createReportBinding(ORDERS_DATASET, 'amount')
    sum.aggregate = 'sum'
    sum.expand = 'none'
    expect(formatBindingPlaceholder(sum)).toBe('求和 · 金额')

    const detail = createReportBinding(ORDERS_DATASET, 'orderNo')
    expect(formatBindingPlaceholder(detail)).toBe('明细 · 订单号')
  })

  it('findDefaultLeftParent 同行向左取最近可扩展绑定', () => {
    const parent = createReportBinding(ORDERS_DATASET, 'customer')
    parent.aggregate = 'group'

    const child = createReportBinding(ORDERS_DATASET, 'orderNo')
    const getBindingAt = bindingMap([
      { addr: { row: 2, col: 0 }, binding: parent },
      { addr: { row: 2, col: 2 }, binding: child }
    ])

    expect(findDefaultLeftParent({ row: 2, col: 2 }, getBindingAt)).toEqual({ row: 2, col: 0 })
    expect(findDefaultLeftParent({ row: 2, col: 0 }, getBindingAt)).toBeNull()
  })

  it('findDefaultLeftParent 跳过不扩展的绑定', () => {
    const sum = createReportBinding(ORDERS_DATASET, 'amount')
    sum.aggregate = 'sum'
    sum.expand = 'none'

    const group = createReportBinding(ORDERS_DATASET, 'customer')
    group.aggregate = 'group'

    const getBindingAt = bindingMap([
      { addr: { row: 3, col: 0 }, binding: sum },
      { addr: { row: 3, col: 1 }, binding: group }
    ])

    expect(findDefaultLeftParent({ row: 3, col: 2 }, getBindingAt)).toEqual({ row: 3, col: 1 })
  })

  it('resolveLeftParent 支持 none / default / 指定地址', () => {
    const parentAddr = { row: 1, col: 0 }
    const parent = createReportBinding(ORDERS_DATASET, 'customer')
    parent.aggregate = 'group'
    parent.leftParent = 'none'

    const detail = createReportBinding(ORDERS_DATASET, 'orderNo')
    detail.leftParent = { row: 1, col: 0 }

    const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
    subtotal.aggregate = 'sum'
    subtotal.expand = 'none'
    subtotal.leftParent = 'none'

    const getBindingAt = bindingMap([{ addr: parentAddr, binding: parent }])

    expect(resolveLeftParent(subtotal, { row: 3, col: 2 }, getBindingAt)).toBeNull()
    expect(resolveLeftParent(detail, { row: 2, col: 1 }, getBindingAt)).toEqual(parentAddr)

    const defaultChild = createReportBinding(ORDERS_DATASET, 'orderNo')
    defaultChild.leftParent = 'default'
    const bandGetBindingAt = bindingMap([
      { addr: { row: 2, col: 0 }, binding: parent },
      { addr: { row: 2, col: 1 }, binding: defaultChild }
    ])
    expect(resolveLeftParent(defaultChild, { row: 2, col: 1 }, bandGetBindingAt)).toEqual({
      row: 2,
      col: 0
    })
  })

  it('formatCellAddress / parseCellAddress 互逆', () => {
    const addr = { row: 2, col: 1 }
    expect(formatCellAddress(addr)).toBe('B3')
    expect(parseCellAddress('B3')).toEqual(addr)
    expect(parseCellAddress('bad')).toBeNull()
  })

  it('分组锚点 aggregate 不可降为明细', () => {
    const anchor = createReportBinding(ORDERS_DATASET, 'customer')
    anchor.role = 'group'
    anchor.aggregate = 'group'
    anchor.leftParent = 'none'

    const patched = { ...anchor, aggregate: 'select' as const, role: 'detail' as const }
    expect(resolveReportRole(anchor)).toBe('group')
    expect(resolveReportRole(patched)).toBe('detail')

    const wouldReject =
      resolveReportRole(anchor) === 'group' &&
      anchor.leftParent === 'none' &&
      (patched.role === 'detail' || patched.aggregate === 'select')
    expect(wouldReject).toBe(true)
  })
})
