import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE, createReportBinding } from '../../binding'
import type { DatasetRecords, ReportBinding } from '../../types'
import {
  computeExpansionLayout,
  enumerateExpansionInstances,
  physicalColSpan,
  physicalRowSpan,
  placementsAt
} from '../coordinate'
import { TemplateStructureError, buildTemplateIndex } from '../template-index'

// ---- fixtures ----

const ORDERS: DatasetRecords = {
  orders: [
    { customer: '甲', region: '华东', orderNo: 'O-1', amount: 100 },
    { customer: '甲', region: '华东', orderNo: 'O-2', amount: 200 },
    { customer: '乙', region: '华南', orderNo: 'O-3', amount: 300 },
    { customer: '丙', region: '华北', orderNo: 'O-4', amount: 400 }
  ]
}

const MATRIX: DatasetRecords = {
  sales: [
    { region: '华东', category: 'A', amount: 10 },
    { region: '华东', category: 'B', amount: 20 },
    { region: '华南', category: 'A', amount: 30 },
    { region: '华南', category: 'B', amount: 40 }
  ]
}

const MULTI_DS: DatasetRecords = { orders: ORDERS.orders!, customers: [{ id: 'C1' }, { id: 'C2' }] }

function bind(sheet: Sheet, addr: { row: number; col: number }, binding: ReportBinding): void {
  sheet.setCellMeta(addr, REPORT_META_NAMESPACE, binding)
}

function snapshot(sheet: Sheet) {
  return sheet.snapshot()
}

function layoutOf(sheet: Sheet, data: DatasetRecords = ORDERS) {
  const index = buildTemplateIndex(snapshot(sheet))
  return computeExpansionLayout(index, data)
}

function placementRange(
  layout: ReturnType<typeof layoutOf>,
  row: number,
  col: number,
  listIndex = 0
) {
  const items = placementsAt(layout, { row, col })
  const hit = items[listIndex] ?? items[0]
  expect(hit, `逻辑格 R${row}C${col} 无映射`).toBeDefined()
  return hit!.physical
}

// ---- template-index ----

describe('buildTemplateIndex', () => {
  it('父格不存在时抛可读错误', () => {
    const sheet = new Sheet()
    const binding = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    binding.rowParent = { row: 0, col: 9 }
    bind(sheet, { row: 1, col: 0 }, binding)

    expect(() => buildTemplateIndex(snapshot(sheet))).toThrow(TemplateStructureError)
    expect(() => buildTemplateIndex(snapshot(sheet))).toThrow(/J1/)
  })

  it('父链成环时抛可读错误', () => {
    const sheet = new Sheet()
    const a = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    const b = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'region')
    a.rowParent = { row: 2, col: 0 }
    b.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 1, col: 0 }, a)
    bind(sheet, { row: 2, col: 0 }, b)

    expect(() => buildTemplateIndex(snapshot(sheet))).toThrow(/父链存在环/)
  })
})

// ---- enumerateExpansionInstances ----

describe('enumerateExpansionInstances', () => {
  const groupBinding: ReportBinding = {
    dataset: 'orders',
    field: 'customer',
    expand: 'down',
    aggregate: 'group'
  }

  it('group 取去重值数', () => {
    const instances = enumerateExpansionInstances(groupBinding, ORDERS, {})
    expect(instances).toHaveLength(3)
    expect(instances.map((i) => i.value)).toEqual(['甲', '乙', '丙'])
  })

  it('list 取记录数', () => {
    const listBinding: ReportBinding = {
      dataset: 'orders',
      field: 'orderNo',
      expand: 'down',
      aggregate: 'list'
    }
    expect(enumerateExpansionInstances(listBinding, ORDERS, {})).toHaveLength(4)
  })

  it('expand none 恒为 1 个实例', () => {
    const noneBinding: ReportBinding = {
      dataset: 'orders',
      field: 'amount',
      expand: 'none',
      aggregate: 'sum'
    }
    expect(enumerateExpansionInstances(noneBinding, ORDERS, {})).toHaveLength(1)
  })

  it('空数据集 group 产出 0 实例', () => {
    expect(enumerateExpansionInstances(groupBinding, { orders: [] }, {})).toHaveLength(0)
  })
})

// ---- coordinate geometry ----

describe('computeExpansionLayout', () => {
  it('单级纵向：分组头 merge 跨度 = 明细行数，静态表头不被推移', () => {
    const sheet = new Sheet()
    sheet.setCells([
      { addr: { row: 0, col: 0 }, data: { v: '客户' } },
      { addr: { row: 0, col: 1 }, data: { v: '订单号' } }
    ])
    const group = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    bind(sheet, { row: 1, col: 0 }, group)

    const detail = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 1, col: 1 }, detail)

    const layout = layoutOf(sheet)
    // 表头 1 + 甲2 + 乙1 + 丙1 = 5 行
    expect(layout.rowCount).toBe(5)

    const header = placementRange(layout, 0, 0)
    expect(header.start).toEqual({ row: 0, col: 0 })

    const groupA = placementsAt(layout, { row: 1, col: 0 }).find((p) => p.rowPath[0] === 0)!
    expect(physicalRowSpan(groupA)).toBe(2)
    expect(groupA.physical.start.row).toBe(1)

    const groupB = placementsAt(layout, { row: 1, col: 0 }).find((p) => p.rowPath[0] === 1)!
    expect(physicalRowSpan(groupB)).toBe(1)
    expect(groupB.physical.start.row).toBe(3)
  })

  it('多级纵向嵌套：子分组在父实例内展开', () => {
    const sheet = new Sheet()
    const data: DatasetRecords = {
      orders: [
        { region: '华东', customer: '甲', orderNo: '1' },
        { region: '华东', customer: '甲', orderNo: '2' },
        { region: '华东', customer: '乙', orderNo: '3' },
        { region: '华南', customer: '丙', orderNo: '4' }
      ]
    }

    const region = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'region')
    region.aggregate = 'group'
    region.expand = 'down'
    bind(sheet, { row: 1, col: 0 }, region)

    const customer = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    customer.aggregate = 'group'
    customer.expand = 'down'
    customer.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 2, col: 0 }, customer)

    const detail = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 2, col: 0 }
    bind(sheet, { row: 2, col: 1 }, detail)

    const layout = layoutOf(sheet, data)
    // 华东(甲2+乙1) + 华南(丙1) = 3 组块 × 各自明细 = 4 明细行
    expect(layout.rowCount).toBe(4)

    const eastCustomer = placementsAt(layout, { row: 2, col: 0 }).find(
      (p) => p.rowPath[0] === 0 && p.rowPath[1] === 0
    )!
    expect(physicalRowSpan(eastCustomer)).toBe(2)
  })

  it('单级横向：列分组向右延展', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '品类' } }])

    const category = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'category')
    category.aggregate = 'group'
    category.expand = 'right'
    bind(sheet, { row: 0, col: 1 }, category)

    const layout = layoutOf(sheet, MATRIX)
    expect(layout.colCount).toBe(3) // 标题 + A/B 两列
    const headers = placementsAt(layout, { row: 0, col: 1 })
    expect(headers).toHaveLength(2)
    expect(headers[0]!.physical.start.col).toBe(1)
    expect(headers[1]!.physical.start.col).toBe(2)
    expect(physicalColSpan(headers[0]!)).toBe(1)
  })

  it('多级列头：colParent 链逐级向右嵌套', () => {
    const sheet = new Sheet()
    const data: DatasetRecords = {
      sales: [
        { year: '2024', quarter: 'Q1', amount: 1 },
        { year: '2024', quarter: 'Q2', amount: 2 },
        { year: '2025', quarter: 'Q1', amount: 3 }
      ]
    }

    const year = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'year')
    year.aggregate = 'group'
    year.expand = 'right'
    bind(sheet, { row: 0, col: 0 }, year)

    const quarter = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'quarter')
    quarter.aggregate = 'group'
    quarter.expand = 'right'
    quarter.colParent = { row: 0, col: 0 }
    bind(sheet, { row: 1, col: 0 }, quarter)

    const layout = layoutOf(sheet, data)
    const yearPlacements = placementsAt(layout, { row: 0, col: 0 })
    expect(yearPlacements).toHaveLength(2)
    expect(physicalColSpan(yearPlacements[0]!)).toBe(2)
    expect(physicalColSpan(yearPlacements[1]!)).toBe(1)

    const quarterPlacements = placementsAt(layout, { row: 1, col: 0 })
    expect(quarterPlacements).toHaveLength(3)
  })

  it('行列同时展开：交叉格按双父实例落位', () => {
    const sheet = new Sheet()
    sheet.setCells([
      { addr: { row: 0, col: 0 }, data: { v: '标题' } },
      { addr: { row: 2, col: 0 }, data: { v: '合计' } }
    ])

    const category = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'category')
    category.aggregate = 'group'
    category.expand = 'right'
    bind(sheet, { row: 0, col: 1 }, category)

    const region = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'region')
    region.aggregate = 'group'
    region.expand = 'down'
    bind(sheet, { row: 1, col: 0 }, region)

    const cross = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'amount')
    cross.aggregate = 'sum'
    cross.expand = 'none'
    cross.rowParent = { row: 1, col: 0 }
    cross.colParent = { row: 0, col: 1 }
    bind(sheet, { row: 1, col: 1 }, cross)

    const layout = layoutOf(sheet, MATRIX)
    expect(layout.rowCount).toBe(4) // 表头 + 2 地区 + 合计
    expect(layout.colCount).toBe(3) // 角 + 2 品类

    const crossCells = placementsAt(layout, { row: 1, col: 1 })
    expect(crossCells).toHaveLength(4)
    expect(crossCells.map((p) => p.physical.start)).toEqual(
      expect.arrayContaining([
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 2, col: 1 },
        { row: 2, col: 2 }
      ])
    )
  })

  it('mergeSpan: false 时扩展格不合并，逐格占位', () => {
    const sheet = new Sheet()
    const group = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    group.mergeSpan = false
    bind(sheet, { row: 1, col: 0 }, group)

    const detail = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 1, col: 1 }, detail)

    const layout = layoutOf(sheet)
    const groupCells = placementsAt(layout, { row: 1, col: 0 })
    expect(groupCells.every((p) => !p.mergeSpan)).toBe(true)
    expect(groupCells.every((p) => physicalRowSpan(p) === 1)).toBe(true)
    expect(groupCells).toHaveLength(4)
  })

  it('静态格在扩展带内随明细重复占位', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 1, col: 2 }, data: { v: '备注' } }])

    const group = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    bind(sheet, { row: 1, col: 0 }, group)

    const detail = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 1, col: 1 }, detail)

    const layout = layoutOf(sheet)
    const notes = placementsAt(layout, { row: 1, col: 2 })
    expect(notes).toHaveLength(4)
    expect(notes.map((p) => p.physical.start.row)).toEqual([0, 1, 2, 3])
  })

  it('空展开：扩展格 0 跨度，子树不占位，静态表头仍映射', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '客户' } }])

    const group = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    bind(sheet, { row: 1, col: 0 }, group)

    const detail = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 1, col: 1 }, detail)

    const layout = layoutOf(sheet, { orders: [] })
    expect(layout.rowCount).toBe(1)
    expect(placementsAt(layout, { row: 0, col: 0 })).toHaveLength(1)
    expect(placementsAt(layout, { row: 1, col: 0 })).toHaveLength(0)
  })

  it('跨数据集：父格过滤不同数据集时不串联', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 5 }, data: { v: '客户ID' } }])

    const group = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    bind(sheet, { row: 1, col: 0 }, group)

    const detail = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 1, col: 1 }, detail)

    const customers = createReportBinding({ id: 'customers', label: 'c', fields: [] }, 'id')
    customers.aggregate = 'list'
    customers.expand = 'down'
    bind(sheet, { row: 4, col: 5 }, customers)

    const layout = layoutOf(sheet, MULTI_DS)
    // 订单 4 明细行 + 表头 1 + 客户列表 2 行
    expect(layout.rowCount).toBe(4 + 1 + 2)
    const customerIds = placementsAt(layout, { row: 4, col: 5 })
    expect(customerIds).toHaveLength(2)
    expect(customerIds[0]!.physical.start.row).toBe(5)
  })

  it('模板合并区域映射到物理表头行', () => {
    const sheet = new Sheet()
    sheet.setCells([
      { addr: { row: 0, col: 0 }, data: { v: '客户' } },
      { addr: { row: 0, col: 1 }, data: { v: '订单号' } }
    ])
    sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 0, col: 1 } })

    const group = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    bind(sheet, { row: 1, col: 0 }, group)

    const detail = createReportBinding({ id: 'orders', label: 'o', fields: [] }, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 1, col: 0 }
    bind(sheet, { row: 1, col: 1 }, detail)

    const layout = layoutOf(sheet)
    expect(layout.mappedMerges).toEqual([{ start: { row: 0, col: 0 }, end: { row: 0, col: 1 } }])
  })
})
