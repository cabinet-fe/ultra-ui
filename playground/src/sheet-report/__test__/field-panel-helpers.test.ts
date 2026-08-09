import { describe, expect, it } from 'vitest'

import { ORDERS_DATASET } from '../dataset-hub'
import { filterDatasetsByQuery, fieldTypeGlyph } from '../designer/field-panel-helpers'

describe('field-panel helpers', () => {
  it('fieldTypeGlyph 按字段类型返回短标识', () => {
    expect(fieldTypeGlyph('string')).toBe('文')
    expect(fieldTypeGlyph('number')).toBe('#')
    expect(fieldTypeGlyph('date')).toBe('日')
  })

  it('filterDatasetsByQuery 按中文名或英文字段名过滤', () => {
    const datasets = [
      ORDERS_DATASET,
      {
        id: 'inventory',
        label: '库存',
        fields: [
          { name: 'sku', label: 'SKU', type: 'string' as const },
          { name: 'qty', label: '数量', type: 'number' as const }
        ]
      }
    ]

    expect(filterDatasetsByQuery(datasets, '客户')).toEqual([
      {
        ...ORDERS_DATASET,
        fields: ORDERS_DATASET.fields.filter((field) => field.name === 'customer')
      }
    ])

    expect(filterDatasetsByQuery(datasets, 'qty')).toEqual([
      { id: 'inventory', label: '库存', fields: [{ name: 'qty', label: '数量', type: 'number' }] }
    ])

    expect(filterDatasetsByQuery(datasets, '  ')).toEqual(datasets)
    expect(filterDatasetsByQuery(datasets, '不存在')).toEqual([])
  })
})
