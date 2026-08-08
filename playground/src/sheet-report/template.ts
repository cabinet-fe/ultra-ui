import type { Sheet } from '@veltra/sheet-core'

import { REPORT_META_NAMESPACE, createReportBinding } from './binding'
import { ORDERS_DATASET } from './mock-dataset'

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
