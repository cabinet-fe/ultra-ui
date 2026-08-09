import type { CellAddress } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import {
  createReportBinding,
  findDefaultLeftParent,
  formatBindingPlaceholder,
  formatCellAddress,
  parseCellAddress,
  resolveLeftParent
} from '../binding'
import { ORDERS_DATASET } from '../mock-dataset'
import type { ReportBinding } from '../types'

function bindingMap(cells: Array<{ addr: CellAddress; binding: ReportBinding }>) {
  const map = new Map<string, ReportBinding>()
  for (const { addr, binding } of cells) {
    map.set(`${addr.row},${addr.col}`, binding)
  }
  return (addr: CellAddress) => map.get(`${addr.row},${addr.col}`)
}

describe('sheet-report binding', () => {
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
})
