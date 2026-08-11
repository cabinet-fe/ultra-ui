import { describe, expect, it } from 'vitest'

import { createReportBinding } from '../../../report/binding'
import type { DatasetCatalogItem, ReportBinding } from '../../../report/types'
import {
  buildTopologyArcPath,
  collectTopologyLinks,
  findCellsWithLeftParent
} from '../designer/topology'

// ---- 内联 fixtures ----

const ORDERS_DATASET: DatasetCatalogItem = {
  id: 'orders',
  label: '销售明细',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'orderNo', label: '订单号', type: 'string' },
    { name: 'region', label: '地区', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' }
  ]
}

function bindingMap(cells: Array<{ addr: { row: number; col: number }; binding: ReportBinding }>) {
  const map = new Map<string, ReportBinding>()
  for (const { addr, binding } of cells) {
    map.set(`${addr.row},${addr.col}`, binding)
  }
  return (addr: { row: number; col: number }) => map.get(`${addr.row},${addr.col}`)
}

describe('report topology', () => {
  it('collectTopologyLinks 沿父链上行并包含直接子格', () => {
    const parentAddr = { row: 1, col: 0 }
    const parent = createReportBinding(ORDERS_DATASET, 'customer')
    parent.aggregate = 'group'
    parent.leftParent = 'none'

    const mid = createReportBinding(ORDERS_DATASET, 'orderNo')
    mid.leftParent = parentAddr

    const detail = createReportBinding(ORDERS_DATASET, 'region')
    detail.leftParent = { row: 1, col: 1 }

    const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
    subtotal.aggregate = 'sum'
    subtotal.expand = 'none'
    subtotal.leftParent = parentAddr

    const entries = [
      { addr: parentAddr, binding: parent },
      { addr: { row: 1, col: 1 }, binding: mid },
      { addr: { row: 1, col: 2 }, binding: detail },
      { addr: { row: 2, col: 3 }, binding: subtotal }
    ]
    const getBindingAt = bindingMap(entries)

    expect(collectTopologyLinks({ row: 1, col: 2 }, detail, entries, getBindingAt)).toEqual([
      { from: { row: 1, col: 2 }, to: { row: 1, col: 1 } },
      { from: { row: 1, col: 1 }, to: parentAddr }
    ])

    expect(collectTopologyLinks(parentAddr, parent, entries, getBindingAt)).toEqual([
      { from: { row: 1, col: 1 }, to: parentAddr },
      { from: { row: 2, col: 3 }, to: parentAddr }
    ])
  })

  it('findCellsWithLeftParent 仅返回解析到目标父格的子格', () => {
    const parentAddr = { row: 1, col: 0 }
    const parent = createReportBinding(ORDERS_DATASET, 'customer')
    parent.aggregate = 'group'
    parent.leftParent = 'none'

    const child = createReportBinding(ORDERS_DATASET, 'orderNo')
    child.leftParent = parentAddr

    const other = createReportBinding(ORDERS_DATASET, 'region')
    other.leftParent = 'default'

    const entries = [
      { addr: parentAddr, binding: parent },
      { addr: { row: 1, col: 1 }, binding: child },
      { addr: { row: 1, col: 2 }, binding: other }
    ]
    const getBindingAt = bindingMap(entries)

    expect(findCellsWithLeftParent(parentAddr, entries, getBindingAt)).toEqual([{ row: 1, col: 1 }])
  })

  it('buildTopologyArcPath 输出合法 SVG 路径', () => {
    const path = buildTopologyArcPath({ x: 10, y: 20 }, { x: 100, y: 40 })
    expect(path.startsWith('M 10 20 Q')).toBe(true)
    expect(path.endsWith('100 40')).toBe(true)
  })
})
