import { describe, expect, it } from 'vitest'

import {
  DATASET_CATALOG,
  QUERY_PARAMS,
  createDefaultParamValues,
  createMockDataHub,
  generateRecords
} from '../dataset-hub'

describe('dataset-hub', () => {
  it('catalog 包含销售明细、库存预警与销售矩阵', () => {
    const ids = DATASET_CATALOG.map((item) => item.id)
    expect(ids).toContain('orders')
    expect(ids).toContain('inventory-alerts')
    expect(ids).toContain('sales-matrix')
    expect(ids).toHaveLength(7)
  })

  it('默认参数生成 14 条订单记录', () => {
    const defaults = createDefaultParamValues(QUERY_PARAMS)
    const records = generateRecords(defaults)
    expect(records.orders).toHaveLength(14)
    expect(records['inventory-alerts']!.length).toBeGreaterThan(0)
    expect(records['sales-matrix']).toHaveLength(20)
  })

  it('日期范围筛选减少订单数', () => {
    const records = generateRecords({
      ...createDefaultParamValues(QUERY_PARAMS),
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31'
    })
    expect(records.orders!.length).toBeLessThan(14)
    expect(records.orders!.every((row) => String(row.orderDate).startsWith('2024-01'))).toBe(true)
  })

  it('地区筛选仅保留对应地区订单与客户', () => {
    const records = generateRecords({ ...createDefaultParamValues(QUERY_PARAMS), region: '华东' })
    expect(records.orders!.every((row) => row.region === '华东')).toBe(true)
    expect(records.customers!.every((row) => row.region === '华东')).toBe(true)
    expect(records['sales-matrix']!.every((row) => row.region === '华东')).toBe(true)
  })

  it('库存预警阈值筛选低库存产品', () => {
    const records = generateRecords({
      ...createDefaultParamValues(QUERY_PARAMS),
      alertThreshold: 50
    })
    expect(records['inventory-alerts']!.every((row) => Number(row.stock) <= 50)).toBe(true)
    expect(records['inventory-alerts']!.length).toBeLessThan(8)
  })

  it('createMockDataHub 支持读写参数并重新生成 records', () => {
    const hub = createMockDataHub()
    expect(hub.getRecords().orders).toHaveLength(14)

    hub.setParamValues({ region: '华北' })
    expect(hub.getRecords().orders!.every((row) => row.region === '华北')).toBe(true)

    hub.resetParamValues()
    expect(hub.getParamValues().region).toBe('')
    expect(hub.getRecords().orders).toHaveLength(14)
  })

  it('QUERY_PARAMS 定义日期、地区与预警阈值默认值', () => {
    const defaults = createDefaultParamValues(QUERY_PARAMS)
    expect(defaults.dateFrom).toBe('2024-01-01')
    expect(defaults.dateTo).toBe('2024-12-31')
    expect(defaults.region).toBe('')
    expect(defaults.alertThreshold).toBe(80)
  })
})
