import { describe, expect, it } from 'vitest'

import { createReportBinding } from '../../../report/binding'
import type { DatasetCatalogItem, ReportBinding } from '../../../report/types'
import {
  buildTopologyArcPath,
  collectTopologyLinks,
  findCellsWithColParent,
  findCellsWithRowParent
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
  it('collectTopologyLinks 沿 rowParent 链上行并包含直接子格', () => {
    const parentAddr = { row: 1, col: 0 }
    const parent = createReportBinding(ORDERS_DATASET, 'customer')
    parent.aggregate = 'group'
    parent.preset = 'groupHeader'

    const mid = createReportBinding(ORDERS_DATASET, 'orderNo')
    mid.rowParent = parentAddr

    const detail = createReportBinding(ORDERS_DATASET, 'region')
    detail.rowParent = { row: 1, col: 1 }

    const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
    subtotal.aggregate = 'sum'
    subtotal.expand = 'none'
    subtotal.rowParent = parentAddr

    const entries = [
      { addr: parentAddr, binding: parent },
      { addr: { row: 1, col: 1 }, binding: mid },
      { addr: { row: 1, col: 2 }, binding: detail },
      { addr: { row: 2, col: 3 }, binding: subtotal }
    ]
    const getBindingAt = bindingMap(entries)

    expect(collectTopologyLinks({ row: 1, col: 2 }, detail, entries, getBindingAt)).toEqual([
      { from: { row: 1, col: 2 }, to: { row: 1, col: 1 }, direction: 'row' },
      { from: { row: 1, col: 1 }, to: parentAddr, direction: 'row' }
    ])

    expect(collectTopologyLinks(parentAddr, parent, entries, getBindingAt)).toEqual([
      { from: { row: 1, col: 1 }, to: parentAddr, direction: 'row' },
      { from: { row: 2, col: 3 }, to: parentAddr, direction: 'row' }
    ])
  })

  it('collectTopologyLinks 沿 colParent 链上行并包含列方向子格', () => {
    const rowParentAddr = { row: 1, col: 0 }
    const colParentAddr = { row: 0, col: 1 }

    const rowGroup = createReportBinding(ORDERS_DATASET, 'customer')
    rowGroup.aggregate = 'group'
    rowGroup.expand = 'down'

    const colGroup = createReportBinding(ORDERS_DATASET, 'region')
    colGroup.aggregate = 'group'
    colGroup.expand = 'right'

    const cross = createReportBinding(ORDERS_DATASET, 'amount')
    cross.aggregate = 'sum'
    cross.expand = 'none'
    cross.rowParent = rowParentAddr
    cross.colParent = colParentAddr

    const entries = [
      { addr: rowParentAddr, binding: rowGroup },
      { addr: colParentAddr, binding: colGroup },
      { addr: { row: 1, col: 2 }, binding: cross }
    ]
    const getBindingAt = bindingMap(entries)

    expect(collectTopologyLinks({ row: 1, col: 2 }, cross, entries, getBindingAt)).toEqual([
      { from: { row: 1, col: 2 }, to: rowParentAddr, direction: 'row' },
      { from: { row: 1, col: 2 }, to: colParentAddr, direction: 'col' }
    ])
  })

  it('findCellsWithColParent 仅返回 colParent 指向目标父格的子格', () => {
    const parentAddr = { row: 0, col: 1 }
    const parent = createReportBinding(ORDERS_DATASET, 'region')
    parent.aggregate = 'group'
    parent.expand = 'right'

    const child = createReportBinding(ORDERS_DATASET, 'amount')
    child.colParent = parentAddr

    const entries = [
      { addr: parentAddr, binding: parent },
      { addr: { row: 1, col: 2 }, binding: child }
    ]

    expect(findCellsWithColParent(parentAddr, entries)).toEqual([{ row: 1, col: 2 }])
  })

  it('findCellsWithRowParent 仅返回 rowParent 指向目标父格的子格', () => {
    const parentAddr = { row: 1, col: 0 }
    const parent = createReportBinding(ORDERS_DATASET, 'customer')
    parent.aggregate = 'group'
    parent.preset = 'groupHeader'

    const child = createReportBinding(ORDERS_DATASET, 'orderNo')
    child.rowParent = parentAddr

    const other = createReportBinding(ORDERS_DATASET, 'region')

    const entries = [
      { addr: parentAddr, binding: parent },
      { addr: { row: 1, col: 1 }, binding: child },
      { addr: { row: 1, col: 2 }, binding: other }
    ]

    expect(findCellsWithRowParent(parentAddr, entries)).toEqual([{ row: 1, col: 1 }])
  })

  it('buildTopologyArcPath 输出合法 SVG 路径', () => {
    const path = buildTopologyArcPath({ x: 10, y: 20 }, { x: 100, y: 40 })
    expect(path.startsWith('M 10 20 Q')).toBe(true)
    expect(path.endsWith('100 40')).toBe(true)
  })
})
