import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { createDataHub } from '../dataset-hub'
import { buildColumnDefs, pxToExcelColWidth } from '../export-xlsx-helpers'
import { MOCK_DATA_RECORDS } from '../mock-dataset'
import { resolveBoundDatasetParams } from '../params'
import { REPORT_PRESETS } from '../presets'
import { renderReport } from '../render'
import { seedInventoryAlertTemplate } from '../template'

describe('resolveBoundDatasetParams', () => {
  it('按绑定数据集合并查询参数', () => {
    const hub = createDataHub()
    const allParams = hub.getQueryParams()
    const getDatasetParams = (datasetId: string) => hub.getQueryParams([datasetId])

    const salesGroup = resolveBoundDatasetParams(
      allParams,
      ['orders', 'customers'],
      getDatasetParams
    )
    expect(salesGroup.map((item) => item.id).sort()).toEqual(['dateFrom', 'dateTo', 'region'])

    const matrix = resolveBoundDatasetParams(allParams, ['sales-matrix'], getDatasetParams)
    expect(matrix.map((item) => item.id)).toEqual(['region'])

    const inventory = resolveBoundDatasetParams(allParams, ['inventory-alerts'], getDatasetParams)
    expect(inventory.map((item) => item.id)).toEqual(['alertThreshold'])
  })
})

describe('export column width helpers', () => {
  it('px 转 Excel 字符宽度', () => {
    expect(pxToExcelColWidth(120)).toBe(16)
    expect(pxToExcelColWidth(8)).toBe(1)
  })

  it('按列索引生成 ColumnDef', () => {
    const columns = buildColumnDefs([
      [0, 120],
      [2, 90]
    ])
    expect(columns).toHaveLength(3)
    expect(columns[0]?.width).toBe(16)
    expect(columns[1]).toEqual({})
    expect(columns[2]?.width).toBe(12)
  })
})

describe('report presets', () => {
  it('提供 3 套商业模板', () => {
    expect(REPORT_PRESETS).toHaveLength(3)
    expect(REPORT_PRESETS.map((item) => item.id)).toEqual([
      'sales-group',
      'sales-matrix',
      'inventory-alert'
    ])
  })

  it('库存预警模板可渲染并保留条件样式', () => {
    const sheet = new Sheet()
    seedInventoryAlertTemplate(sheet)
    const filled = renderReport(sheet.snapshot(), MOCK_DATA_RECORDS)

    expect(filled.rows).toBeGreaterThan(1)
    const highAlert = filled.cells.find((cell) => cell.v === '高' && cell.col === 6)
    expect(highAlert?.s).toBeDefined()
    expect(filled.styles[(highAlert!.s ?? 1) - 1]?.fill?.color).toBe('#FFCCCC')
  })
})
