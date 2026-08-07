import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE, createReportBinding } from '../binding'
import { MOCK_DATA_RECORDS, ORDERS_DATASET } from '../mock-dataset'
import { renderReport } from '../render'

/** 与 index.vue seedTemplate 一致的客户分组 + 明细 + 合计模板 */
function buildGroupDetailTemplate() {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '订单号' } },
    { addr: { row: 0, col: 2 }, data: { v: '金额' } },
    { addr: { row: 0, col: 3 }, data: { v: '下单日期' } },
    { addr: { row: 3, col: 1 }, data: { v: '合计' } }
  ])

  const customerGroup = createReportBinding(ORDERS_DATASET, 'customer')
  customerGroup.aggregate = 'group'
  customerGroup.leftParent = 'none'
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, customerGroup)

  const groupParent = { row: 1, col: 0 }

  const orderNo = createReportBinding(ORDERS_DATASET, 'orderNo')
  orderNo.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 1 }, REPORT_META_NAMESPACE, orderNo)

  const amount = createReportBinding(ORDERS_DATASET, 'amount')
  amount.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 2 }, REPORT_META_NAMESPACE, amount)

  const orderDate = createReportBinding(ORDERS_DATASET, 'orderDate')
  orderDate.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, orderDate)

  const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
  subtotal.aggregate = 'sum'
  subtotal.expand = 'none'
  subtotal.leftParent = groupParent
  sheet.setCellMeta({ row: 3, col: 2 }, REPORT_META_NAMESPACE, subtotal)

  return sheet.snapshot()
}

function cellValue(
  snapshot: ReturnType<typeof buildGroupDetailTemplate>,
  row: number,
  col: number
): unknown {
  return snapshot.cells.find((c) => c.row === row && c.col === col)?.v
}

function hasMerge(
  snapshot: ReturnType<typeof buildGroupDetailTemplate>,
  start: { row: number; col: number },
  end: { row: number; col: number }
): boolean {
  return snapshot.merges.some(
    (m) =>
      m.start.row === start.row &&
      m.start.col === start.col &&
      m.end.row === end.row &&
      m.end.col === end.col
  )
}

describe('renderReport', () => {
  it('2 客户 5 订单：行数、分组值、明细 zip 与组小计', () => {
    const template = buildGroupDetailTemplate()
    const filled = renderReport(template, MOCK_DATA_RECORDS)

    // 表头 1 + 甲 3 明细 + 1 小计 + 乙 2 明细 + 1 小计 = 8 行
    expect(filled.rows).toBe(8)
    expect(filled.meta).toBeUndefined()

    // 表头保留
    expect(cellValue(filled, 0, 0)).toBe('客户')
    expect(cellValue(filled, 0, 1)).toBe('订单号')

    // 甲公司：3 明细 + 小计 450
    expect(cellValue(filled, 1, 0)).toBe('甲公司')
    expect(cellValue(filled, 1, 1)).toBe('O-1001')
    expect(cellValue(filled, 1, 2)).toBe(100)
    expect(cellValue(filled, 2, 1)).toBe('O-1002')
    expect(cellValue(filled, 2, 2)).toBe(200)
    expect(cellValue(filled, 3, 1)).toBe('O-1003')
    expect(cellValue(filled, 3, 2)).toBe(150)
    expect(cellValue(filled, 4, 1)).toBe('合计')
    expect(cellValue(filled, 4, 2)).toBe(450)

    // 乙公司：2 明细 + 小计 550
    expect(cellValue(filled, 5, 0)).toBe('乙公司')
    expect(cellValue(filled, 5, 1)).toBe('O-2001')
    expect(cellValue(filled, 5, 2)).toBe(300)
    expect(cellValue(filled, 6, 1)).toBe('O-2002')
    expect(cellValue(filled, 6, 2)).toBe(250)
    expect(cellValue(filled, 7, 1)).toBe('合计')
    expect(cellValue(filled, 7, 2)).toBe(550)

    // 分组格纵向 merge 覆盖明细行（不含小计行）
    expect(hasMerge(filled, { row: 1, col: 0 }, { row: 3, col: 0 })).toBe(true)
    expect(hasMerge(filled, { row: 5, col: 0 }, { row: 6, col: 0 })).toBe(true)
  })

  it('Filled Report 不携带 Binding meta', () => {
    const template = buildGroupDetailTemplate()
    const filled = renderReport(template, MOCK_DATA_RECORDS)
    expect(filled.meta?.length ?? 0).toBe(0)
  })

  it('模板样式 id 随扩展实例复制', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(
      { start: { row: 2, col: 2 }, end: { row: 2, col: 2 } },
      { font: { bold: true } }
    )
    const styleId = sheet.getCellData({ row: 2, col: 2 })?.s
    expect(styleId).toBeDefined()

    const customerGroup = createReportBinding(ORDERS_DATASET, 'customer')
    customerGroup.aggregate = 'group'
    customerGroup.leftParent = 'none'
    sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, customerGroup)

    const groupParent = { row: 1, col: 0 }
    const amount = createReportBinding(ORDERS_DATASET, 'amount')
    amount.leftParent = groupParent
    sheet.setCellMeta({ row: 2, col: 2 }, REPORT_META_NAMESPACE, amount)

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const firstAmount = filled.cells.find((c) => c.row === 1 && c.col === 2)
    expect(firstAmount?.s).toBe(styleId)
  })
})
