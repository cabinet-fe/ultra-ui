import type { Sheet } from '@veltra/sheet-core'

import { REPORT_META_NAMESPACE, createReportBinding } from './binding'
import { ORDERS_DATASET } from './mock-dataset'

/**
 * 演示列宽初始种子（模型列索引 → px）。
 * sheet-core 列宽未进 SheetSnapshot，只能经 VTable 运行时 set/getColWidth；
 * 模式切换重建网格后需重新写入——应写入「当前设计态列宽」，而非每次覆盖为 DEMO。
 */
export const DEMO_COL_WIDTHS: ReadonlyArray<readonly [number, number]> = [
  [0, 120], // 客户
  [1, 110], // 订单号
  [2, 80], // 地区
  [3, 90], // 金额
  [4, 120] // 下单日期
]

/** VTable 列 = 模型列 + 行号列偏移 */
const TABLE_COL_OFFSET = 1

/** 列宽读写目标：SheetGrid.getTable() 的最小接口，避免 playground 深导入 sheet-core/grid */
export type DemoColWidthTarget = {
  getTable: () => {
    setColWidth: (col: number, width: number) => void
    getColWidth: (col: number) => number
  }
}

export type DemoColWidthEntry = readonly [number, number]

/** 经 SheetGrid → VTable 写入指定列宽 */
export function applyColWidths(
  grid: DemoColWidthTarget | undefined | null,
  widths: ReadonlyArray<DemoColWidthEntry>
): void {
  if (!grid) return
  const table = grid.getTable()
  for (const [sheetCol, width] of widths) {
    table.setColWidth(sheetCol + TABLE_COL_OFFSET, width)
  }
}

/** 仅初始种子：写入 DEMO_COL_WIDTHS */
export function applyDemoColWidths(grid: DemoColWidthTarget | undefined | null): void {
  applyColWidths(grid, DEMO_COL_WIDTHS)
}

/**
 * 从当前网格读取演示列（默认 DEMO 覆盖的 5 列）宽度。
 * 网格未就绪时返回 null。
 */
export function readDemoColWidths(
  grid: DemoColWidthTarget | undefined | null,
  cols: ReadonlyArray<number> = DEMO_COL_WIDTHS.map(([col]) => col)
): Array<[number, number]> | null {
  if (!grid) return null
  const table = grid.getTable()
  return cols.map((sheetCol) => [sheetCol, table.getColWidth(sheetCol + TABLE_COL_OFFSET)])
}

/**
 * 预置 Report Template：表头（5 列）+ 同一扩展带（分组 + 明细）+ 合计行。
 * 行 2（A2:E2）为扩展带；行 3 为 Subtotal Row。含表头底色加粗与合计行加粗。
 */
export function seedGroupDetailTemplate(sheet: Sheet): void {
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '订单号' } },
    { addr: { row: 0, col: 2 }, data: { v: '地区' } },
    { addr: { row: 0, col: 3 }, data: { v: '金额' } },
    { addr: { row: 0, col: 4 }, data: { v: '下单日期' } },
    { addr: { row: 2, col: 1 }, data: { v: '合计' } }
  ])

  // 表头：加粗 + 浅底色
  sheet.setCellStyle(
    { start: { row: 0, col: 0 }, end: { row: 0, col: 4 } },
    { font: { bold: true }, fill: { color: '#E8EEF7' } }
  )
  // 合计行：加粗（样式随扩展复制到各组小计）
  sheet.setCellStyle(
    { start: { row: 2, col: 0 }, end: { row: 2, col: 4 } },
    { font: { bold: true } }
  )

  const groupParent = { row: 1, col: 0 }

  const customerGroup = createReportBinding(ORDERS_DATASET, 'customer')
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
  subtotal.aggregate = 'sum'
  subtotal.expand = 'none'
  subtotal.leftParent = groupParent
  sheet.setCellMeta({ row: 2, col: 3 }, REPORT_META_NAMESPACE, subtotal)
}
