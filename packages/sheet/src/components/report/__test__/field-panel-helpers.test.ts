import { describe, expect, it } from 'vitest'

import type { DatasetCatalogItem } from '../../../report/types'
import {
  fieldTypeGlyph,
  filterDatasetsByQuery,
  formatFieldDragPayload,
  parseFieldDragPayload
} from '../field-panel-helpers'

// ---- 内联 fixtures ----

const ORDERS: DatasetCatalogItem = {
  id: 'orders',
  label: '销售明细',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' }
  ]
}

const INVENTORY: DatasetCatalogItem = {
  id: 'inventory',
  label: '库存',
  fields: [
    { name: 'sku', label: 'SKU', type: 'string' },
    { name: 'qty', label: '数量', type: 'number' }
  ]
}

describe('field-panel helpers', () => {
  it('fieldTypeGlyph 按字段类型返回短标识', () => {
    expect(fieldTypeGlyph('string')).toBe('文')
    expect(fieldTypeGlyph('number')).toBe('#')
    expect(fieldTypeGlyph('date')).toBe('日')
  })

  it('filterDatasetsByQuery 按中文名或英文字段名过滤', () => {
    const datasets = [ORDERS, INVENTORY]

    expect(filterDatasetsByQuery(datasets, '客户')).toEqual([
      { ...ORDERS, fields: [ORDERS.fields[0]!] }
    ])

    expect(filterDatasetsByQuery(datasets, 'qty')).toEqual([
      { ...INVENTORY, fields: [INVENTORY.fields[1]!] }
    ])

    expect(filterDatasetsByQuery(datasets, '  ')).toEqual(datasets)
    expect(filterDatasetsByQuery(datasets, '不存在')).toEqual([])
  })

  it('字段拖拽负载编解码往返；非法负载返回 null', () => {
    const payload = formatFieldDragPayload('orders', 'customer')
    expect(payload).toBe('orders:customer')
    expect(parseFieldDragPayload(payload)).toEqual({ datasetId: 'orders', fieldName: 'customer' })

    // 字段名含冒号时按首个分隔符切分
    expect(parseFieldDragPayload('orders:a:b')).toEqual({ datasetId: 'orders', fieldName: 'a:b' })

    expect(parseFieldDragPayload('')).toBeNull()
    expect(parseFieldDragPayload(':customer')).toBeNull()
    expect(parseFieldDragPayload('orders:')).toBeNull()
  })
})
