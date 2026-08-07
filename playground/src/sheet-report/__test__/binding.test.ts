import { describe, expect, it } from 'vitest'

import { createReportBinding, formatBindingPlaceholder } from '../binding'
import { ORDERS_DATASET } from '../mock-dataset'

describe('sheet-report binding', () => {
  it('createReportBinding 默认 list + 纵向扩展', () => {
    const binding = createReportBinding(ORDERS_DATASET, 'amount')
    expect(binding).toEqual({
      dataset: 'orders',
      field: 'amount',
      aggregate: 'select',
      expand: 'down'
    })
  })

  it('formatBindingPlaceholder 生成 dataset.field', () => {
    const binding = createReportBinding(ORDERS_DATASET, 'amount')
    expect(formatBindingPlaceholder(binding)).toBe('orders.amount')
  })
})
