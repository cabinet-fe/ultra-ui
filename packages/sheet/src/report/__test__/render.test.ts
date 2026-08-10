import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE, createReportBinding } from '../binding'
import { renderReport } from '../render'
import type { DatasetCatalogItem, DatasetRecords } from '../types'

// ---- 内联 fixtures（单一事实源在测试自身，不依赖 playground mock hub）----

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

const CUSTOMERS_DATASET: DatasetCatalogItem = {
  id: 'customers',
  label: '客户',
  fields: [
    { name: 'id', label: '客户ID', type: 'string' },
    { name: 'region', label: '地区', type: 'string' }
  ]
}

const SALES_MATRIX_DATASET: DatasetCatalogItem = {
  id: 'sales-matrix',
  label: '销售矩阵',
  fields: [
    { name: 'region', label: '地区', type: 'string' },
    { name: 'category', label: '品类', type: 'string' },
    { name: 'amount', label: '销售额', type: 'number' }
  ]
}

/** 4 客户 × 14 订单（与模板断言严格对应） */
const ORDER_ROWS: Record<string, unknown>[] = [
  { customer: '甲公司', region: '华东', orderNo: 'O-1001', amount: 100, orderDate: '2024-01-05' },
  { customer: '甲公司', region: '华东', orderNo: 'O-1002', amount: 200, orderDate: '2024-01-12' },
  { customer: '甲公司', region: '华东', orderNo: 'O-1003', amount: 150, orderDate: '2024-01-20' },
  { customer: '甲公司', region: '华东', orderNo: 'O-1004', amount: 180, orderDate: '2024-01-28' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2001', amount: 300, orderDate: '2024-02-01' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2002', amount: 250, orderDate: '2024-02-08' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2003', amount: 220, orderDate: '2024-02-15' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2004', amount: 280, orderDate: '2024-02-22' },
  { customer: '丙公司', region: '华北', orderNo: 'O-3001', amount: 400, orderDate: '2024-03-01' },
  { customer: '丙公司', region: '华北', orderNo: 'O-3002', amount: 350, orderDate: '2024-03-10' },
  { customer: '丙公司', region: '华北', orderNo: 'O-3003', amount: 320, orderDate: '2024-03-18' },
  { customer: '丁公司', region: '西部', orderNo: 'O-4001', amount: 500, orderDate: '2024-04-02' },
  { customer: '丁公司', region: '西部', orderNo: 'O-4002', amount: 450, orderDate: '2024-04-11' },
  { customer: '丁公司', region: '西部', orderNo: 'O-4003', amount: 480, orderDate: '2024-04-20' }
]

const CUSTOMER_ROWS: Record<string, unknown>[] = [
  { id: 'C-01', name: '甲公司', region: '华东' },
  { id: 'C-02', name: '乙公司', region: '华南' },
  { id: 'C-03', name: '丙公司', region: '华北' },
  { id: 'C-04', name: '丁公司', region: '西部' },
  { id: 'C-05', name: '戊公司', region: '华东' },
  { id: 'C-06', name: '己公司', region: '华南' },
  { id: 'C-07', name: '庚公司', region: '华北' },
  { id: 'C-08', name: '辛公司', region: '西部' }
]

/** 地区 × 品类矩阵交叉数据（4 地区 × 5 品类 = 20 行） */
const SALES_MATRIX_ROWS: Record<string, unknown>[] = [
  { region: '华东', category: '办公设备', qty: 42, amount: 50400, month: '2024-Q1' },
  { region: '华东', category: '耗材', qty: 128, amount: 8640, month: '2024-Q1' },
  { region: '华东', category: '家具', qty: 18, amount: 46440, month: '2024-Q1' },
  { region: '华东', category: '外设', qty: 35, amount: 73465, month: '2024-Q1' },
  { region: '华东', category: '网络', qty: 12, amount: 8640, month: '2024-Q1' },
  { region: '华南', category: '办公设备', qty: 28, amount: 33600, month: '2024-Q1' },
  { region: '华南', category: '耗材', qty: 96, amount: 6480, month: '2024-Q1' },
  { region: '华南', category: '家具', qty: 22, amount: 56760, month: '2024-Q1' },
  { region: '华南', category: '外设', qty: 30, amount: 62970, month: '2024-Q1' },
  { region: '华南', category: '网络', qty: 8, amount: 5760, month: '2024-Q1' },
  { region: '华北', category: '办公设备', qty: 20, amount: 24000, month: '2024-Q1' },
  { region: '华北', category: '耗材', qty: 72, amount: 4860, month: '2024-Q1' },
  { region: '华北', category: '家具', qty: 14, amount: 36120, month: '2024-Q1' },
  { region: '华北', category: '外设', qty: 18, amount: 37782, month: '2024-Q1' },
  { region: '华北', category: '网络', qty: 10, amount: 7200, month: '2024-Q1' },
  { region: '西部', category: '办公设备', qty: 16, amount: 19200, month: '2024-Q1' },
  { region: '西部', category: '耗材', qty: 54, amount: 3645, month: '2024-Q1' },
  { region: '西部', category: '家具', qty: 12, amount: 30960, month: '2024-Q1' },
  { region: '西部', category: '外设', qty: 14, amount: 29386, month: '2024-Q1' },
  { region: '西部', category: '网络', qty: 6, amount: 4320, month: '2024-Q1' }
]

const MOCK_DATA_RECORDS: DatasetRecords = { orders: ORDER_ROWS, customers: CUSTOMER_ROWS }

// ---- 内联模板种子 ----

/** 预置 Report Template：表头（5 列）+ 同一扩展带（分组 + 明细）+ 合计行 */
function seedGroupDetailTemplate(sheet: Sheet): void {
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '订单号' } },
    { addr: { row: 0, col: 2 }, data: { v: '地区' } },
    { addr: { row: 0, col: 3 }, data: { v: '金额' } },
    { addr: { row: 0, col: 4 }, data: { v: '下单日期' } },
    { addr: { row: 2, col: 1 }, data: { v: '合计' } }
  ])

  sheet.setCellStyle(
    { start: { row: 0, col: 0 }, end: { row: 0, col: 4 } },
    { font: { bold: true }, fill: { color: '#E8EEF7' } }
  )
  sheet.setCellStyle(
    { start: { row: 2, col: 0 }, end: { row: 2, col: 4 } },
    { font: { bold: true } }
  )

  const groupParent = { row: 1, col: 0 }

  const customerGroup = createReportBinding(ORDERS_DATASET, 'customer')
  customerGroup.role = 'group'
  customerGroup.aggregate = 'group'
  customerGroup.leftParent = 'none'
  sheet.setCellMeta(groupParent, REPORT_META_NAMESPACE, customerGroup)

  const orderNo = createReportBinding(ORDERS_DATASET, 'orderNo')
  orderNo.leftParent = groupParent
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, orderNo)

  const region = createReportBinding(ORDERS_DATASET, 'region')
  region.leftParent = groupParent
  sheet.setCellMeta({ row: 1, col: 2 }, REPORT_META_NAMESPACE, region)

  const amount = createReportBinding(ORDERS_DATASET, 'amount')
  amount.leftParent = groupParent
  sheet.setCellMeta({ row: 1, col: 3 }, REPORT_META_NAMESPACE, amount)

  const orderDate = createReportBinding(ORDERS_DATASET, 'orderDate')
  orderDate.leftParent = groupParent
  sheet.setCellMeta({ row: 1, col: 4 }, REPORT_META_NAMESPACE, orderDate)

  const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
  subtotal.role = 'subtotal'
  subtotal.aggregate = 'sum'
  subtotal.expand = 'none'
  subtotal.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, subtotal)
}

/** 预置二维矩阵模板：地区（行）× 品类（列）销售额交叉表 */
function seedMatrixTemplate(sheet: Sheet): void {
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '地区 \\ 品类' } },
    { addr: { row: 2, col: 0 }, data: { v: '合计' } }
  ])

  sheet.setCellStyle(
    { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
    { font: { bold: true }, fill: { color: '#E8EEF7' } }
  )
  sheet.setCellStyle(
    { start: { row: 2, col: 0 }, end: { row: 2, col: 0 } },
    { font: { bold: true } }
  )

  const categoryGroup = createReportBinding(SALES_MATRIX_DATASET, 'category')
  categoryGroup.role = 'group'
  categoryGroup.aggregate = 'group'
  categoryGroup.leftParent = 'none'
  sheet.setCellMeta({ row: 0, col: 1 }, REPORT_META_NAMESPACE, categoryGroup)

  const regionGroup = createReportBinding(SALES_MATRIX_DATASET, 'region')
  regionGroup.role = 'group'
  regionGroup.aggregate = 'group'
  regionGroup.leftParent = 'none'
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, regionGroup)

  const cross = createReportBinding(SALES_MATRIX_DATASET, 'amount')
  cross.role = 'matrix'
  cross.aggregate = 'sum'
  cross.expand = 'none'
  cross.leftParent = 'none'
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, cross)

  const colSubtotal = createReportBinding(SALES_MATRIX_DATASET, 'amount')
  colSubtotal.role = 'subtotal'
  colSubtotal.aggregate = 'sum'
  colSubtotal.expand = 'none'
  colSubtotal.leftParent = 'none'
  sheet.setCellMeta({ row: 2, col: 1 }, REPORT_META_NAMESPACE, colSubtotal)

  const grandTotal = createReportBinding(SALES_MATRIX_DATASET, 'amount')
  grandTotal.role = 'grandTotal'
  grandTotal.aggregate = 'sum'
  grandTotal.expand = 'none'
  grandTotal.leftParent = 'none'
  sheet.setCellMeta({ row: 2, col: 6 }, REPORT_META_NAMESPACE, grandTotal)
}

function buildGroupDetailTemplate() {
  const sheet = new Sheet()
  seedGroupDetailTemplate(sheet)
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

function buildMatrixTemplate() {
  const sheet = new Sheet()
  seedMatrixTemplate(sheet)
  return sheet.snapshot()
}

describe('renderReport', () => {
  it('4 客户 14 订单：行数、分组值、明细 zip、地区列与组小计', () => {
    const template = buildGroupDetailTemplate()
    const filled = renderReport(template, MOCK_DATA_RECORDS)

    // 表头 1 + 甲(4+1) + 乙(4+1) + 丙(3+1) + 丁(3+1) = 19 行
    expect(filled.rows).toBe(19)
    expect(filled.meta).toBeUndefined()

    // 表头保留（含地区列）
    expect(cellValue(filled, 0, 0)).toBe('客户')
    expect(cellValue(filled, 0, 1)).toBe('订单号')
    expect(cellValue(filled, 0, 2)).toBe('地区')
    expect(cellValue(filled, 0, 3)).toBe('金额')
    expect(cellValue(filled, 0, 4)).toBe('下单日期')

    // 甲公司：4 明细 + 小计 630（金额在 col 3）
    expect(cellValue(filled, 1, 0)).toBe('甲公司')
    expect(cellValue(filled, 1, 1)).toBe('O-1001')
    expect(cellValue(filled, 1, 2)).toBe('华东')
    expect(cellValue(filled, 1, 3)).toBe(100)
    expect(cellValue(filled, 2, 1)).toBe('O-1002')
    expect(cellValue(filled, 3, 1)).toBe('O-1003')
    expect(cellValue(filled, 4, 1)).toBe('O-1004')
    expect(cellValue(filled, 5, 1)).toBe('合计')
    expect(cellValue(filled, 5, 3)).toBe(630)

    // 乙公司：4 明细 + 小计 1050
    expect(cellValue(filled, 6, 0)).toBe('乙公司')
    expect(cellValue(filled, 6, 1)).toBe('O-2001')
    expect(cellValue(filled, 6, 2)).toBe('华南')
    expect(cellValue(filled, 9, 1)).toBe('O-2004')
    expect(cellValue(filled, 10, 1)).toBe('合计')
    expect(cellValue(filled, 10, 3)).toBe(1050)

    // 丙公司：3 明细 + 小计 1070
    expect(cellValue(filled, 11, 0)).toBe('丙公司')
    expect(cellValue(filled, 11, 2)).toBe('华北')
    expect(cellValue(filled, 14, 1)).toBe('合计')
    expect(cellValue(filled, 14, 3)).toBe(1070)

    // 丁公司：3 明细 + 小计 1430
    expect(cellValue(filled, 15, 0)).toBe('丁公司')
    expect(cellValue(filled, 15, 2)).toBe('西部')
    expect(cellValue(filled, 18, 1)).toBe('合计')
    expect(cellValue(filled, 18, 3)).toBe(1430)

    // 分组格纵向 merge 覆盖明细行（不含小计行）
    expect(hasMerge(filled, { row: 1, col: 0 }, { row: 4, col: 0 })).toBe(true)
    expect(hasMerge(filled, { row: 6, col: 0 }, { row: 9, col: 0 })).toBe(true)
    expect(hasMerge(filled, { row: 11, col: 0 }, { row: 13, col: 0 })).toBe(true)
    expect(hasMerge(filled, { row: 15, col: 0 }, { row: 17, col: 0 })).toBe(true)
  })

  it('分组格被误设为 list 时按明细全量展开（无分组锚点）', () => {
    const template = buildGroupDetailTemplate()
    const broken = JSON.parse(JSON.stringify(template)) as ReturnType<
      typeof buildGroupDetailTemplate
    >
    const groupMeta = broken.meta!.find((m) => m.row === 1 && m.col === 0)!
    ;(groupMeta.payload as { aggregate: string }).aggregate = 'select'

    const filled = renderReport(broken, MOCK_DATA_RECORDS)
    // 无分组锚点时走 expandListBlock：全量订单明细 + 小计
    expect(filled.rows).toBe(1 + ORDER_ROWS.length + 1)
    expect(cellValue(filled, 1, 1)).toBe('O-1001')
  })

  it('Filled Report 不携带 Binding meta', () => {
    const template = buildGroupDetailTemplate()
    const filled = renderReport(template, MOCK_DATA_RECORDS)
    expect(filled.meta?.length ?? 0).toBe(0)
  })

  it('模板样式 id 随扩展实例复制', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    // 金额列在 col 3
    sheet.setCellStyle(
      { start: { row: 1, col: 3 }, end: { row: 1, col: 3 } },
      { font: { bold: true } }
    )
    const styleId = sheet.getCellData({ row: 1, col: 3 })?.s
    expect(styleId).toBeDefined()

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const firstAmount = filled.cells.find((c) => c.row === 1 && c.col === 3)
    expect(firstAmount?.s).toBe(styleId)
  })

  it('subtotal 支持 avg / count 聚合', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      role: 'subtotal',
      aggregate: 'avg',
      expand: 'none',
      leftParent: { row: 1, col: 0 }
    })
    const avgFilled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    // 甲公司 4 单金额均值 (100+200+150+180)/4 = 157.5
    expect(avgFilled.cells.find((c) => c.row === 5 && c.col === 3)?.v).toBe(157.5)

    const sheet2 = new Sheet()
    seedGroupDetailTemplate(sheet2)
    sheet2.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'orderNo',
      role: 'subtotal',
      aggregate: 'count',
      expand: 'none',
      leftParent: { row: 1, col: 0 }
    })
    const countFilled = renderReport(sheet2.snapshot(), MOCK_DATA_RECORDS)
    expect(countFilled.cells.find((c) => c.row === 5 && c.col === 3)?.v).toBe(4)
  })

  it('grandTotal 行对全量数据汇总', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCells([{ addr: { row: 3, col: 1 }, data: { v: '总计' } }])
    sheet.setCellMeta({ row: 3, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      role: 'grandTotal',
      aggregate: 'sum',
      expand: 'none',
      leftParent: 'none'
    })
    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    // 全量金额 4180
    expect(filled.cells.find((c) => c.v === 4180 && c.col === 3)?.v).toBe(4180)
  })

  it('条件样式规则固化到 Filled Report 样式表', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCellMeta({ row: 1, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      role: 'detail',
      aggregate: 'select',
      expand: 'down',
      leftParent: { row: 1, col: 0 },
      conditionalRules: [{ operator: 'gt', value: 100, style: { fill: { color: '#FFCCCC' } } }]
    })

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const hotCell = filled.cells.find((c) => c.col === 3 && c.v === 150)
    expect(hotCell?.s).toBeDefined()
    expect(filled.styles[(hotCell!.s ?? 1) - 1]?.fill?.color).toBe('#FFCCCC')

    const coldCell = filled.cells.find((c) => c.col === 3 && c.v === 100)
    expect(filled.styles[(coldCell!.s ?? 1) - 1]?.fill?.color).not.toBe('#FFCCCC')
  })

  it('二维矩阵：地区 × 品类销售额交叉扩展', () => {
    const filled = renderReport(buildMatrixTemplate(), { 'sales-matrix': SALES_MATRIX_ROWS })

    // 表头 1 + 4 地区 + 1 合计 = 6 行
    expect(filled.rows).toBe(6)
    expect(cellValue(filled, 0, 0)).toBe('地区 \\ 品类')
    expect(cellValue(filled, 0, 1)).toBe('办公设备')
    expect(cellValue(filled, 0, 5)).toBe('网络')

    // 华东 × 办公设备 = 50400
    expect(cellValue(filled, 1, 0)).toBe('华东')
    expect(cellValue(filled, 1, 1)).toBe(50400)

    // 列合计：办公设备四地区之和
    const officeTotal = SALES_MATRIX_ROWS.filter((r) => r.category === '办公设备').reduce(
      (sum, row) => sum + (row.amount as number),
      0
    )
    expect(cellValue(filled, 5, 1)).toBe(officeTotal)

    // 总计
    const grandTotal = SALES_MATRIX_ROWS.reduce((sum, row) => sum + (row.amount as number), 0)
    expect(cellValue(filled, 5, 6)).toBe(grandTotal)
  })

  it('同扩展带追加明细列：预览行数与值正确', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCells([{ addr: { row: 0, col: 5 }, data: { v: '备注' } }])
    const remark = createReportBinding(ORDERS_DATASET, 'orderNo')
    remark.leftParent = { row: 1, col: 0 }
    sheet.setCellMeta({ row: 1, col: 5 }, REPORT_META_NAMESPACE, remark)

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    expect(filled.rows).toBe(19)
    expect(cellValue(filled, 1, 0)).toBe('甲公司')
    expect(cellValue(filled, 1, 1)).toBe('O-1001')
    expect(cellValue(filled, 1, 5)).toBe('O-1001')
  })

  it('独立扩展带：第二数据源 customers 明细正确渲染', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCells([{ addr: { row: 0, col: 5 }, data: { v: '客户ID' } }])
    const customerId = createReportBinding(CUSTOMERS_DATASET, 'id')
    customerId.leftParent = 'none'
    sheet.setCellMeta({ row: 4, col: 5 }, REPORT_META_NAMESPACE, customerId)

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const customers = CUSTOMER_ROWS

    // 订单扩展 19 行（含表头）+ 客户列表
    expect(filled.rows).toBe(19 + customers.length)
    expect(cellValue(filled, 0, 5)).toBe('客户ID')
    expect(cellValue(filled, 19, 5)).toBe(customers[0]!.id)
    expect(cellValue(filled, 19 + customers.length - 1, 5)).toBe(
      customers[customers.length - 1]!.id
    )
  })

  it('多行扩展带合并明细输出：分组列与首行明细不丢失', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.clearCellMeta({ row: 1, col: 3 }, REPORT_META_NAMESPACE)
    sheet.clearCellMeta({ row: 1, col: 4 }, REPORT_META_NAMESPACE)
    sheet.clearCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE)
    const snap = sheet.snapshot()
    snap.cells = snap.cells.filter((cell) => !(cell.row === 2 && cell.col === 1))
    sheet.restore(snap)
    sheet.restoreContent(snap)

    const amount = createReportBinding(ORDERS_DATASET, 'amount')
    amount.leftParent = { row: 1, col: 0 }
    sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, amount)

    const orderDate = createReportBinding(ORDERS_DATASET, 'orderDate')
    orderDate.leftParent = { row: 1, col: 0 }
    sheet.setCellMeta({ row: 2, col: 4 }, REPORT_META_NAMESPACE, orderDate)

    const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
    subtotal.role = 'subtotal'
    subtotal.aggregate = 'sum'
    subtotal.expand = 'none'
    subtotal.leftParent = { row: 1, col: 0 }
    sheet.setCellMeta({ row: 3, col: 3 }, REPORT_META_NAMESPACE, subtotal)
    sheet.setCells([{ addr: { row: 3, col: 1 }, data: { v: '合计' } }])

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    expect(filled.rows).toBe(19)
    expect(cellValue(filled, 1, 0)).toBe('甲公司')
    expect(cellValue(filled, 1, 1)).toBe('O-1001')
    expect(cellValue(filled, 1, 3)).toBe(100)
    expect(cellValue(filled, 1, 4)).toBe('2024-01-05')
    expect(cellValue(filled, 5, 3)).toBe(630)
  })
})
