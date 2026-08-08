import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { MOCK_DATA_RECORDS } from '../mock-dataset'
import { renderReport } from '../render'
import {
  DEMO_COL_WIDTHS,
  applyColWidths,
  applyDemoColWidths,
  readDemoColWidths,
  seedGroupDetailTemplate
} from '../template'

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

  it('分组格被误设为 list 时仅输出表头（回归：预览空白根因）', () => {
    const template = buildGroupDetailTemplate()
    const broken = JSON.parse(JSON.stringify(template)) as ReturnType<
      typeof buildGroupDetailTemplate
    >
    const groupMeta = broken.meta!.find((m) => m.row === 1 && m.col === 0)!
    ;(groupMeta.payload as { aggregate: string }).aggregate = 'select'

    const filled = renderReport(broken, MOCK_DATA_RECORDS)
    expect(filled.cells.filter((c) => c.row > 0)).toHaveLength(0)
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

  it('表头与合计行带有样式', () => {
    const template = buildGroupDetailTemplate()
    const headerStyle = template.cells.find((c) => c.row === 0 && c.col === 0)?.s
    const subtotalLabelStyle = template.cells.find((c) => c.row === 2 && c.col === 1)?.s
    expect(headerStyle).toBeDefined()
    expect(subtotalLabelStyle).toBeDefined()
  })

  it('演示提供 5 个关联数据集且订单仍是默认模板主源', () => {
    expect(Object.keys(MOCK_DATA_RECORDS).sort()).toEqual([
      'customers',
      'employees',
      'orders',
      'payments',
      'products'
    ])
    expect(MOCK_DATA_RECORDS.orders).toHaveLength(14)
    expect(MOCK_DATA_RECORDS.customers!.length).toBeGreaterThanOrEqual(6)
    expect(MOCK_DATA_RECORDS.products!.length).toBeGreaterThanOrEqual(6)
    expect(MOCK_DATA_RECORDS.employees!.length).toBeGreaterThanOrEqual(6)
    expect(MOCK_DATA_RECORDS.payments!.length).toBeGreaterThanOrEqual(10)

    const filled = renderReport(buildGroupDetailTemplate(), MOCK_DATA_RECORDS)
    expect(filled.rows).toBe(19)
  })

  it('演示列宽覆盖模板 5 列且不进快照（sheet-core 未持久化列宽）', () => {
    expect(DEMO_COL_WIDTHS.map(([col]) => col)).toEqual([0, 1, 2, 3, 4])
    expect(DEMO_COL_WIDTHS.every(([, w]) => w > 0)).toBe(true)

    const template = buildGroupDetailTemplate()
    expect(template).not.toHaveProperty('colWidths')
    const filled = renderReport(template, MOCK_DATA_RECORDS)
    expect(filled).not.toHaveProperty('colWidths')
  })

  it('readDemoColWidths / applyColWidths 经 VTable 偏移读写，不强制 DEMO 常量', () => {
    const widths = new Map<number, number>()
    const grid = {
      getTable: () => ({
        setColWidth: (col: number, width: number) => {
          widths.set(col, width)
        },
        getColWidth: (col: number) => widths.get(col) ?? 0
      })
    }

    applyColWidths(grid, [
      [0, 200],
      [1, 150]
    ])
    expect(widths.get(1)).toBe(200) // 模型列 0 → table 列 1
    expect(widths.get(2)).toBe(150)

    const read = readDemoColWidths(grid, [0, 1])
    expect(read).toEqual([
      [0, 200],
      [1, 150]
    ])

    applyDemoColWidths(grid)
    expect(widths.get(1)).toBe(DEMO_COL_WIDTHS[0]![1])
  })
})
