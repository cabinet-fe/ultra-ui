import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE, createReportBinding } from '../binding'
import { renderReport, resolveFilledColWidths } from '../render'
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
  customerGroup.preset = 'groupHeader'
  customerGroup.aggregate = 'group'
  customerGroup.expand = 'down'
  sheet.setCellMeta(groupParent, REPORT_META_NAMESPACE, customerGroup)

  const orderNo = createReportBinding(ORDERS_DATASET, 'orderNo')
  orderNo.rowParent = groupParent
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, orderNo)

  const region = createReportBinding(ORDERS_DATASET, 'region')
  region.rowParent = groupParent
  sheet.setCellMeta({ row: 1, col: 2 }, REPORT_META_NAMESPACE, region)

  const amount = createReportBinding(ORDERS_DATASET, 'amount')
  amount.rowParent = groupParent
  sheet.setCellMeta({ row: 1, col: 3 }, REPORT_META_NAMESPACE, amount)

  const orderDate = createReportBinding(ORDERS_DATASET, 'orderDate')
  orderDate.rowParent = groupParent
  sheet.setCellMeta({ row: 1, col: 4 }, REPORT_META_NAMESPACE, orderDate)

  const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
  subtotal.preset = 'subtotal'
  subtotal.aggregate = 'sum'
  subtotal.expand = 'none'
  subtotal.rowParent = groupParent
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

  const colGroupAddr = { row: 0, col: 1 }
  const rowGroupAddr = { row: 1, col: 0 }
  const crossAddr = { row: 1, col: 1 }

  const categoryGroup = createReportBinding(SALES_MATRIX_DATASET, 'category')
  categoryGroup.preset = 'groupHeader'
  categoryGroup.aggregate = 'group'
  categoryGroup.expand = 'right'
  sheet.setCellMeta(colGroupAddr, REPORT_META_NAMESPACE, categoryGroup)

  const regionGroup = createReportBinding(SALES_MATRIX_DATASET, 'region')
  regionGroup.preset = 'groupHeader'
  regionGroup.aggregate = 'group'
  regionGroup.expand = 'down'
  sheet.setCellMeta(rowGroupAddr, REPORT_META_NAMESPACE, regionGroup)

  const cross = createReportBinding(SALES_MATRIX_DATASET, 'amount')
  cross.preset = 'cross'
  cross.aggregate = 'sum'
  cross.expand = 'none'
  cross.rowParent = rowGroupAddr
  cross.colParent = colGroupAddr
  sheet.setCellMeta(crossAddr, REPORT_META_NAMESPACE, cross)

  const colSubtotal = createReportBinding(SALES_MATRIX_DATASET, 'amount')
  colSubtotal.preset = 'subtotal'
  colSubtotal.aggregate = 'sum'
  colSubtotal.expand = 'none'
  colSubtotal.colParent = colGroupAddr
  sheet.setCellMeta({ row: 2, col: 1 }, REPORT_META_NAMESPACE, colSubtotal)

  const grandTotal = createReportBinding(SALES_MATRIX_DATASET, 'amount')
  grandTotal.preset = 'grandTotal'
  grandTotal.aggregate = 'sum'
  grandTotal.expand = 'none'
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
    ;(groupMeta.payload as { aggregate: string }).aggregate = 'list'

    const filled = renderReport(broken, MOCK_DATA_RECORDS)
    // 分组格误设为 list 时按全量明细展开 + 小计
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

  it('模板格对齐样式直通 Filled Report 快照（静态格与绑定扩展格）', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    // 静态表头格（resolveStatic 路径）
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
      { align: { horizontal: 'right' } }
    )
    // 绑定明细格（resolveCell 路径，样式随扩展实例复制）
    sheet.setCellStyle(
      { start: { row: 1, col: 3 }, end: { row: 1, col: 3 } },
      { align: { horizontal: 'center' } }
    )

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const header = filled.cells.find((c) => c.row === 0 && c.col === 0)
    expect(filled.styles[(header!.s ?? 1) - 1]?.align?.horizontal).toBe('right')

    const firstAmount = filled.cells.find((c) => c.row === 1 && c.col === 3)
    expect(firstAmount?.s).toBeDefined()
    expect(filled.styles[(firstAmount!.s ?? 1) - 1]?.align?.horizontal).toBe('center')
    // 展开带后续实例同样携带对齐
    const secondAmount = filled.cells.find((c) => c.row === 2 && c.col === 3)
    expect(filled.styles[(secondAmount!.s ?? 1) - 1]?.align?.horizontal).toBe('center')
  })

  it('subtotal 支持 avg / count 聚合', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      preset: 'subtotal',
      aggregate: 'avg',
      expand: 'none',
      rowParent: { row: 1, col: 0 }
    })
    const avgFilled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    // 甲公司 4 单金额均值 (100+200+150+180)/4 = 157.5
    expect(avgFilled.cells.find((c) => c.row === 5 && c.col === 3)?.v).toBe(157.5)

    const sheet2 = new Sheet()
    seedGroupDetailTemplate(sheet2)
    sheet2.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'orderNo',
      preset: 'subtotal',
      aggregate: 'count',
      expand: 'none',
      rowParent: { row: 1, col: 0 }
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
      preset: 'grandTotal',
      aggregate: 'sum',
      expand: 'none'
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
      preset: 'detail',
      aggregate: 'list',
      expand: 'down',
      rowParent: { row: 1, col: 0 },
      conditionalRules: [{ operator: 'gt', value: 100, style: { fill: { color: '#FFCCCC' } } }]
    })

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const hotCell = filled.cells.find((c) => c.col === 3 && c.v === 150)
    expect(hotCell?.s).toBeDefined()
    expect(filled.styles[(hotCell!.s ?? 1) - 1]?.fill?.color).toBe('#FFCCCC')

    const coldCell = filled.cells.find((c) => c.col === 3 && c.v === 100)
    expect(filled.styles[(coldCell!.s ?? 1) - 1]?.fill?.color).not.toBe('#FFCCCC')
  })

  it('条件样式按另一字段求值', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCellMeta({ row: 1, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      preset: 'detail',
      aggregate: 'list',
      expand: 'down',
      rowParent: { row: 1, col: 0 },
      conditionalRules: [
        { operator: 'eq', value: '华东', field: 'region', style: { fill: { color: '#FFCCCC' } } }
      ]
    })

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const eastCell = filled.cells.find((c) => c.col === 3 && c.v === 150)
    expect(filled.styles[(eastCell!.s ?? 1) - 1]?.fill?.color).toBe('#FFCCCC')

    const southCell = filled.cells.find((c) => c.col === 3 && c.v === 300)
    expect(filled.styles[(southCell!.s ?? 1) - 1]?.fill?.color).not.toBe('#FFCCCC')
  })

  it('scope: row 染满整行含静态格与横向展开列', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCellMeta({ row: 1, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      preset: 'detail',
      aggregate: 'list',
      expand: 'down',
      rowParent: { row: 1, col: 0 },
      conditionalRules: [
        { operator: 'gt', value: 100, scope: 'row', style: { fill: { color: '#FFCCCC' } } }
      ]
    })

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    const hotRow = filled.cells.find((c) => c.col === 3 && c.v === 150)!.row
    const hotStyle =
      filled.styles[(filled.cells.find((c) => c.col === 3 && c.v === 150)!.s ?? 1) - 1]
    expect(hotStyle?.fill?.color).toBe('#FFCCCC')

    const staticOrderNo = filled.cells.find(
      (c) => c.row === hotRow && c.col === 1 && c.v === 'O-1003'
    )
    expect(filled.styles[(staticOrderNo!.s ?? 1) - 1]?.fill?.color).toBe('#FFCCCC')

    const coldRow = filled.cells.find((c) => c.col === 3 && c.v === 100)!.row
    const coldAmount = filled.cells.find((c) => c.row === coldRow && c.col === 3)
    expect(filled.styles[(coldAmount!.s ?? 1) - 1]?.fill?.color).not.toBe('#FFCCCC')
  })

  it('横向展开明细列同行继承 scope: row 行级样式', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '备注' } }])
    const amount = createReportBinding(ORDERS_DATASET, 'amount')
    amount.aggregate = 'list'
    amount.expand = 'right'
    amount.conditionalRules = [
      { operator: 'gt', value: 100, scope: 'row', style: { fill: { color: '#FFCCCC' } } }
    ]
    sheet.setCellMeta({ row: 0, col: 1 }, REPORT_META_NAMESPACE, amount)

    const filled = renderReport(sheet.snapshot(), { orders: [ORDER_ROWS[2]!] })
    const amountCell = filled.cells.find((c) => c.row === 0 && c.v === 150)
    const staticNote = filled.cells.find((c) => c.row === 0 && c.col === 0)
    expect(filled.styles[(amountCell!.s ?? 1) - 1]?.fill?.color).toBe('#FFCCCC')
    expect(filled.styles[(staticNote!.s ?? 1) - 1]?.fill?.color).toBe('#FFCCCC')

    const coldFilled = renderReport(sheet.snapshot(), { orders: [ORDER_ROWS[0]!] })
    const coldAmount = coldFilled.cells.find((c) => c.row === 0 && c.v === 100)
    expect(coldFilled.styles[(coldAmount!.s ?? 1) - 1]?.fill?.color).not.toBe('#FFCCCC')
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
    remark.rowParent = { row: 1, col: 0 }
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
    customerId.expand = 'down'
    customerId.aggregate = 'list'
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
    amount.rowParent = { row: 1, col: 0 }
    sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, amount)

    const orderDate = createReportBinding(ORDERS_DATASET, 'orderDate')
    orderDate.rowParent = { row: 1, col: 0 }
    sheet.setCellMeta({ row: 2, col: 4 }, REPORT_META_NAMESPACE, orderDate)

    const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
    subtotal.preset = 'subtotal'
    subtotal.aggregate = 'sum'
    subtotal.expand = 'none'
    subtotal.rowParent = { row: 1, col: 0 }
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

  it('横向展开 right + group：列头向右延展', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '品类' } }])
    const category = createReportBinding(SALES_MATRIX_DATASET, 'category')
    category.aggregate = 'group'
    category.expand = 'right'
    sheet.setCellMeta({ row: 0, col: 1 }, REPORT_META_NAMESPACE, category)

    const filled = renderReport(sheet.snapshot(), { 'sales-matrix': SALES_MATRIX_ROWS })
    expect(cellValue(filled, 0, 1)).toBe('办公设备')
    expect(cellValue(filled, 0, 5)).toBe('网络')
  })

  it('转置明细 right + list：一条记录一列', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '订单号' } }])
    const orderNo = createReportBinding(ORDERS_DATASET, 'orderNo')
    orderNo.aggregate = 'list'
    orderNo.expand = 'right'
    sheet.setCellMeta({ row: 0, col: 1 }, REPORT_META_NAMESPACE, orderNo)

    const filled = renderReport(sheet.snapshot(), { orders: ORDER_ROWS.slice(0, 3) })
    expect(cellValue(filled, 0, 1)).toBe('O-1001')
    expect(cellValue(filled, 0, 2)).toBe('O-1002')
    expect(cellValue(filled, 0, 3)).toBe('O-1003')
  })

  it('多级列头：年 → 季度列头值正确', () => {
    const sheet = new Sheet()
    const data = [
      { year: '2024', quarter: 'Q1', amount: 10 },
      { year: '2024', quarter: 'Q2', amount: 20 },
      { year: '2025', quarter: 'Q1', amount: 30 }
    ]
    const year = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'year')
    year.aggregate = 'group'
    year.expand = 'right'
    sheet.setCellMeta({ row: 0, col: 0 }, REPORT_META_NAMESPACE, year)

    const quarter = createReportBinding({ id: 'sales', label: 's', fields: [] }, 'quarter')
    quarter.aggregate = 'group'
    quarter.expand = 'right'
    quarter.colParent = { row: 0, col: 0 }
    sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, quarter)

    const filled = renderReport(sheet.snapshot(), { sales: data })
    expect(cellValue(filled, 0, 0)).toBe('2024')
    expect(cellValue(filled, 0, 2)).toBe('2025')
    expect(cellValue(filled, 1, 0)).toBe('Q1')
    expect(cellValue(filled, 1, 1)).toBe('Q2')
    expect(cellValue(filled, 1, 2)).toBe('Q1')
  })

  it('顶部标题行的交叉表照常展开', () => {
    const sheet = new Sheet()
    sheet.setCells([
      { addr: { row: 0, col: 0 }, data: { v: '销售交叉表' } },
      { addr: { row: 2, col: 0 }, data: { v: '合计' } }
    ])

    const category = createReportBinding(SALES_MATRIX_DATASET, 'category')
    category.aggregate = 'group'
    category.expand = 'right'
    sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, category)

    const region = createReportBinding(SALES_MATRIX_DATASET, 'region')
    region.aggregate = 'group'
    region.expand = 'down'
    sheet.setCellMeta({ row: 2, col: 0 }, REPORT_META_NAMESPACE, region)

    const cross = createReportBinding(SALES_MATRIX_DATASET, 'amount')
    cross.aggregate = 'sum'
    cross.expand = 'none'
    cross.rowParent = { row: 2, col: 0 }
    cross.colParent = { row: 1, col: 1 }
    sheet.setCellMeta({ row: 2, col: 1 }, REPORT_META_NAMESPACE, cross)

    const filled = renderReport(sheet.snapshot(), { 'sales-matrix': SALES_MATRIX_ROWS })
    expect(cellValue(filled, 0, 0)).toBe('销售交叉表')
    expect(cellValue(filled, 1, 1)).toBe('办公设备')
    expect(cellValue(filled, 2, 0)).toBe('华东')
    expect(cellValue(filled, 2, 1)).toBe(50400)
  })

  it('空数据集：展开块为 0，表头仍输出', () => {
    const filled = renderReport(buildGroupDetailTemplate(), { orders: [], customers: [] })
    expect(filled.rows).toBe(1)
    expect(cellValue(filled, 0, 0)).toBe('客户')
  })

  it('max / min 聚合', () => {
    const sheet = new Sheet()
    seedGroupDetailTemplate(sheet)
    sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      preset: 'subtotal',
      aggregate: 'max',
      expand: 'none',
      rowParent: { row: 1, col: 0 }
    })
    const maxFilled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    expect(maxFilled.cells.find((c) => c.row === 5 && c.col === 3)?.v).toBe(200)

    const sheet2 = new Sheet()
    seedGroupDetailTemplate(sheet2)
    sheet2.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, {
      dataset: 'orders',
      field: 'amount',
      preset: 'subtotal',
      aggregate: 'min',
      expand: 'none',
      rowParent: { row: 1, col: 0 }
    })
    const minFilled = renderReport(sheet2.snapshot(), MOCK_DATA_RECORDS)
    expect(minFilled.cells.find((c) => c.row === 5 && c.col === 3)?.v).toBe(100)
  })

  it('mergeSpan: false 时扩展格不合并', () => {
    const sheet = new Sheet()
    const group = createReportBinding(ORDERS_DATASET, 'customer')
    group.aggregate = 'group'
    group.expand = 'down'
    group.mergeSpan = false
    sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, group)

    const detail = createReportBinding(ORDERS_DATASET, 'orderNo')
    detail.aggregate = 'list'
    detail.expand = 'down'
    detail.rowParent = { row: 1, col: 0 }
    sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, detail)

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    expect(hasMerge(filled, { row: 1, col: 0 }, { row: 4, col: 0 })).toBe(false)
    expect(cellValue(filled, 1, 0)).toBe('甲公司')
    expect(cellValue(filled, 2, 0)).toBe('甲公司')
  })

  it('横向展开列继承列方向父格的模板列宽', () => {
    const template = buildMatrixTemplate()
    const templateWidths: Array<[number, number]> = [
      [0, 80],
      [1, 120]
    ]
    const filledWidths = resolveFilledColWidths(
      template,
      { 'sales-matrix': SALES_MATRIX_ROWS },
      templateWidths
    )
    expect(filledWidths).toEqual(
      expect.arrayContaining([
        [0, 80],
        [1, 120],
        [2, 120],
        [3, 120],
        [4, 120],
        [5, 120]
      ])
    )
  })

  it('跨列行小计按组求和，不是全表合计', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '客户' } }])
    const groupParent = { row: 1, col: 0 }

    const customerGroup = createReportBinding(ORDERS_DATASET, 'customer')
    customerGroup.preset = 'groupHeader'
    customerGroup.aggregate = 'group'
    customerGroup.expand = 'down'
    sheet.setCellMeta(groupParent, REPORT_META_NAMESPACE, customerGroup)

    const orderNo = createReportBinding(ORDERS_DATASET, 'orderNo')
    orderNo.rowParent = groupParent
    sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, orderNo)

    const amount = createReportBinding(ORDERS_DATASET, 'amount')
    amount.rowParent = groupParent
    sheet.setCellMeta({ row: 1, col: 2 }, REPORT_META_NAMESPACE, amount)

    const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
    subtotal.preset = 'subtotal'
    subtotal.aggregate = 'sum'
    subtotal.expand = 'none'
    subtotal.rowParent = groupParent
    sheet.setCellMeta({ row: 2, col: 2 }, REPORT_META_NAMESPACE, subtotal)

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    expect(cellValue(filled, 5, 2)).toBe(630)
    expect(cellValue(filled, 10, 2)).toBe(1050)
    expect(cellValue(filled, 5, 2)).not.toBe(4180)
  })

  it('跨列行小计误挂明细时仍按分组祖先过滤', () => {
    const sheet = new Sheet()
    sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '客户' } }])
    const groupParent = { row: 1, col: 0 }
    const listAddr = { row: 1, col: 2 }

    const customerGroup = createReportBinding(ORDERS_DATASET, 'customer')
    customerGroup.preset = 'groupHeader'
    customerGroup.aggregate = 'group'
    customerGroup.expand = 'down'
    sheet.setCellMeta(groupParent, REPORT_META_NAMESPACE, customerGroup)

    const amount = createReportBinding(ORDERS_DATASET, 'amount')
    amount.rowParent = groupParent
    sheet.setCellMeta(listAddr, REPORT_META_NAMESPACE, amount)

    const subtotal = createReportBinding(ORDERS_DATASET, 'amount')
    subtotal.preset = 'subtotal'
    subtotal.aggregate = 'sum'
    subtotal.expand = 'none'
    subtotal.rowParent = listAddr
    sheet.setCellMeta({ row: 2, col: 2 }, REPORT_META_NAMESPACE, subtotal)

    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)
    expect(cellValue(filled, 5, 2)).toBe(630)
    expect(cellValue(filled, 10, 2)).toBe(1050)
  })

  it('交叉列小计仅 colParent 时按列分组求和，不是全表合计', () => {
    const sheet = new Sheet()
    const colGroupAddr = { row: 0, col: 1 }
    const rowGroupAddr = { row: 1, col: 0 }

    const categoryGroup = createReportBinding(SALES_MATRIX_DATASET, 'category')
    categoryGroup.preset = 'groupHeader'
    categoryGroup.aggregate = 'group'
    categoryGroup.expand = 'right'
    sheet.setCellMeta(colGroupAddr, REPORT_META_NAMESPACE, categoryGroup)

    const regionGroup = createReportBinding(SALES_MATRIX_DATASET, 'region')
    regionGroup.preset = 'groupHeader'
    regionGroup.aggregate = 'group'
    regionGroup.expand = 'down'
    sheet.setCellMeta(rowGroupAddr, REPORT_META_NAMESPACE, regionGroup)

    const cross = createReportBinding(SALES_MATRIX_DATASET, 'amount')
    cross.preset = 'cross'
    cross.aggregate = 'sum'
    cross.expand = 'none'
    cross.rowParent = rowGroupAddr
    cross.colParent = colGroupAddr
    sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, cross)

    const colSubtotal = createReportBinding(SALES_MATRIX_DATASET, 'amount')
    colSubtotal.preset = 'subtotal'
    colSubtotal.aggregate = 'sum'
    colSubtotal.expand = 'none'
    colSubtotal.colParent = colGroupAddr
    sheet.setCellMeta({ row: 2, col: 1 }, REPORT_META_NAMESPACE, colSubtotal)

    const filled = renderReport(sheet.snapshot(), { 'sales-matrix': SALES_MATRIX_ROWS })
    const officeTotal = SALES_MATRIX_ROWS.filter((row) => row.category === '办公设备').reduce(
      (sum, row) => sum + (row.amount as number),
      0
    )
    const grandTotal = SALES_MATRIX_ROWS.reduce((sum, row) => sum + (row.amount as number), 0)
    expect(cellValue(filled, 5, 1)).toBe(officeTotal)
    expect(cellValue(filled, 5, 1)).not.toBe(grandTotal)
  })
})
