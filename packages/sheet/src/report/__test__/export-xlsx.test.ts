import { Sheet } from '@veltra/sheet-core'
import { buildWorkbookFromHucre } from '@veltra/sheet-core/core/io/import'
import { readXlsx } from 'hucre/xlsx'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE, createReportBinding } from '../binding'
import { buildColumnDefs, exportFilledReportXlsx, pxToExcelColWidth } from '../export-xlsx'
import { renderReport } from '../render'
import type { DatasetCatalogItem } from '../types'

// ---- 内联 fixtures ----

const ORDERS_DATASET: DatasetCatalogItem = {
  id: 'orders',
  label: '销售明细',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' }
  ]
}

const ORDER_ROWS: Record<string, unknown>[] = [
  { customer: '甲公司', amount: 100 },
  { customer: '乙公司', amount: 400 }
]

/** 金额 > 300 标红（条件样式打平进快照后随导出保真） */
const RED_RULE = { operator: 'gt' as const, value: 300, style: { font: { color: '#DC2626' } } }

/** 分组（客户）+ 明细（金额，带条件规则）模板 */
function buildFilledSheet(): Sheet {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '金额' } }
  ])
  sheet.setCellStyle(
    { start: { row: 0, col: 0 }, end: { row: 0, col: 1 } },
    { font: { bold: true }, fill: { color: '#E8EEF7' } }
  )

  const groupAddr = { row: 1, col: 0 }
  const group = createReportBinding(ORDERS_DATASET, 'customer')
  group.preset = 'groupHeader'
  group.aggregate = 'group'
  group.expand = 'down'
  sheet.setCellMeta(groupAddr, REPORT_META_NAMESPACE, group)

  const amount = createReportBinding(ORDERS_DATASET, 'amount')
  amount.rowParent = groupAddr
  amount.conditionalRules = [RED_RULE]
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, amount)

  const filled = renderReport(sheet.snapshot(), { orders: ORDER_ROWS })
  const filledSheet = new Sheet()
  filledSheet.restore(filled)
  filledSheet.restoreContent(filled)
  return filledSheet
}

describe('exportFilledReportXlsx', () => {
  it('导出保真 XLSX：值 / 表头样式 / 条件样式打平后随快照导出', async () => {
    const filled = buildFilledSheet()
    filled.setColWidth(0, 120)
    filled.setColWidth(1, 140)
    const buffer = await exportFilledReportXlsx(filled)

    // 合法 ZIP（xlsx）字节
    expect(buffer[0]).toBe(0x50)
    expect(buffer[1]).toBe(0x4b)

    const hucreWb = await readXlsx(buffer, { readStyles: true })
    const workbook = buildWorkbookFromHucre(hucreWb)
    const sheet = workbook.getSheets()[0]!

    // 展开值保真（分组头 + 明细值）
    const values: unknown[] = []
    for (const [, data] of sheet.store.entries()) values.push(data.v)
    expect(values).toContain('甲公司')
    expect(values).toContain('乙公司')
    expect(values).toContain(400)

    // 条件样式打平：amount=400（>300）的明细格带红字
    let redFound = false
    for (const [, data] of sheet.store.entries()) {
      if (data.v !== 400 || data.s == null) continue
      const style = sheet.stylePool.get(data.s)
      if (style?.font?.color === '#DC2626') redFound = true
    }
    expect(redFound).toBe(true)

    // 表头静态样式保真（加粗 + 底色）
    const header = sheet.getCellData({ row: 0, col: 0 })
    const headerStyle = header?.s != null ? sheet.stylePool.get(header.s) : undefined
    expect(headerStyle?.font?.bold).toBe(true)
    expect(headerStyle?.fill?.color).toBe('#E8EEF7')
  })
})

describe('buildColumnDefs / pxToExcelColWidth', () => {
  it('像素列宽换算为 Excel 字符宽度并写入对应列', () => {
    expect(pxToExcelColWidth(120)).toBe(16)
    expect(pxToExcelColWidth(0)).toBe(1)

    const columns = buildColumnDefs([
      [0, 120],
      [2, 145]
    ])
    expect(columns).toHaveLength(3)
    expect(columns[0]).toEqual({ width: 16 })
    expect(columns[1]).toEqual({})
    expect(columns[2]).toEqual({ width: 20 })
  })

  it('空列宽不产生 columns 定义', () => {
    expect(buildColumnDefs([])).toEqual([])
  })
})
