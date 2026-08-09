import { describe, expect, it } from 'vitest'

import {
  DATASET_CATALOG,
  QUERY_PARAMS,
  createDataHub,
  createDefaultParamValues,
  executeSql,
  extractParamIds,
  parseSql
} from '../dataset-hub'
import { createMockDatabase } from '../dataset-hub/database'
import { buildParamDefs } from '../dataset-hub/sql'

describe('dataset-hub sql parser', () => {
  it('解析 SELECT 列与 FROM 表', () => {
    const parsed = parseSql(
      'SELECT customer, order_no AS orderNo FROM orders WHERE region = ${region}'
    )
    expect('error' in parsed).toBe(false)
    if ('error' in parsed) return
    expect(parsed.table).toBe('orders')
    expect(parsed.selectItems).toHaveLength(2)
    expect(parsed.selectItems[1]?.alias).toBe('orderNo')
  })

  it('从 SQL 提取 ${param} 占位符', () => {
    expect(
      extractParamIds(
        'SELECT * FROM orders WHERE order_date >= ${dateFrom} AND order_date <= ${dateTo}'
      )
    ).toEqual(['dateFrom', 'dateTo'])
  })

  it('空参数值跳过 WHERE 谓词（等价全部）', () => {
    const db = createMockDatabase()
    const all = executeSql('SELECT customer FROM orders', db, {})
    const filtered = executeSql('SELECT customer FROM orders WHERE region = ${region}', db, {
      region: ''
    })
    expect('error' in all).toBe(false)
    expect('error' in filtered).toBe(false)
    if ('error' in all || 'error' in filtered) return
    expect(filtered).toHaveLength(all.length)
  })

  it('BETWEEN 日期范围筛选订单', () => {
    const db = createMockDatabase()
    const result = executeSql(
      'SELECT order_no AS orderNo FROM orders WHERE order_date >= ${dateFrom} AND order_date <= ${dateTo}',
      db,
      { dateFrom: '2024-01-01', dateTo: '2024-01-31' }
    )
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.length).toBeLessThan(14)
  })

  it('SELECT * 展开表全部列', () => {
    const db = createMockDatabase()
    const result = executeSql('SELECT * FROM orders', db, {})
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result[0]).toHaveProperty('customer')
    expect(result[0]).toHaveProperty('order_no')
    expect(result).toHaveLength(14)
  })

  it('BETWEEN ${param} 单参数推断 date-range 类型', () => {
    const sql = 'SELECT customer FROM orders WHERE order_date BETWEEN ${dateRange}'
    const params = buildParamDefs(sql)
    expect(params).toHaveLength(1)
    expect(params[0]?.id).toBe('dateRange')
    expect(params[0]?.type).toBe('date-range')
  })

  it('IN 与 LIKE 谓词筛选', () => {
    const db = createMockDatabase()
    const inResult = executeSql(
      'SELECT customer, region FROM orders WHERE region IN (${region})',
      db,
      { region: ['华东', '华南'] }
    )
    expect('error' in inResult).toBe(false)
    if ('error' in inResult) return
    expect(inResult.every((row) => row.region === '华东' || row.region === '华南')).toBe(true)

    const likeResult = executeSql(
      'SELECT customer FROM orders WHERE customer LIKE ${keyword}',
      db,
      { keyword: '%甲%' }
    )
    expect('error' in likeResult).toBe(false)
    if ('error' in likeResult) return
    expect(likeResult.length).toBeGreaterThan(0)
    expect(likeResult.every((row) => row.customer === '甲公司')).toBe(true)
  })

  it('括号与 OR 组合条件', () => {
    const db = createMockDatabase()
    const result = executeSql(
      'SELECT customer, region, amount FROM orders WHERE (region = ${region} OR region = ${altRegion}) AND amount > ${minAmount}',
      db,
      { region: '华东', altRegion: '华南', minAmount: 150 }
    )
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every(
        (row) => (row.region === '华东' || row.region === '华南') && Number(row.amount) > 150
      )
    ).toBe(true)
  })
})

describe('dataset-hub', () => {
  it('catalog 包含销售明细、库存预警与销售矩阵', () => {
    const hub = createDataHub()
    const ids = hub.getCatalog().map((item) => item.id)
    expect(ids).toContain('orders')
    expect(ids).toContain('inventory-alerts')
    expect(ids).toContain('sales-matrix')
    expect(ids).toHaveLength(7)
    expect(DATASET_CATALOG).toHaveLength(7)
  })

  it('默认参数生成 14 条订单记录', () => {
    const hub = createDataHub()
    const records = hub.getRecords()
    expect(records.orders).toHaveLength(14)
    expect(records['inventory-alerts']!.length).toBeGreaterThan(0)
    expect(records['sales-matrix']).toHaveLength(20)
  })

  it('日期范围筛选减少订单数', () => {
    const hub = createDataHub()
    hub.setParamValues({ dateFrom: '2024-01-01', dateTo: '2024-01-31' })
    const records = hub.getRecords()
    expect(records.orders!.length).toBeLessThan(14)
    expect(records.orders!.every((row) => String(row.orderDate).startsWith('2024-01'))).toBe(true)
  })

  it('地区筛选仅保留对应地区订单与客户', () => {
    const hub = createDataHub()
    hub.setParamValues({ region: '华东' })
    const records = hub.getRecords()
    expect(records.orders!.every((row) => row.region === '华东')).toBe(true)
    expect(records.customers!.every((row) => row.region === '华东')).toBe(true)
    expect(records['sales-matrix']!.every((row) => row.region === '华东')).toBe(true)
  })

  it('库存预警阈值筛选低库存产品', () => {
    const hub = createDataHub()
    hub.setParamValues({ alertThreshold: 50 })
    const records = hub.getRecords()
    expect(records['inventory-alerts']!.every((row) => Number(row.stock) <= 50)).toBe(true)
    expect(records['inventory-alerts']!.length).toBeLessThan(8)
  })

  it('DataHub 支持读写参数并重新生成 records', () => {
    const hub = createDataHub()
    expect(hub.getRecords().orders).toHaveLength(14)

    hub.setParamValues({ region: '华北' })
    expect(hub.getRecords().orders!.every((row) => row.region === '华北')).toBe(true)

    hub.resetParamValues()
    expect(hub.getParamValues().region).toBe('')
    expect(hub.getRecords().orders).toHaveLength(14)
  })

  it('预置参数定义日期、地区与预警阈值默认值', () => {
    const defaults = createDefaultParamValues(QUERY_PARAMS)
    expect(defaults.dateFrom).toBe('2024-01-01')
    expect(defaults.dateTo).toBe('2024-12-31')
    expect(defaults.region).toBe('')
    expect(defaults.alertThreshold).toBe(80)
  })

  it('describe 从 SQL 解析字段 schema', () => {
    const hub = createDataHub()
    const dataset = hub.getDataset('orders')
    expect(dataset).toBeDefined()
    const described = hub.describe(dataset!.sql, dataset!.paramOverrides)
    expect(described.error).toBeUndefined()
    expect(described.fields.map((f) => f.name)).toContain('orderNo')
    expect(described.params.map((p) => p.id)).toEqual(
      expect.arrayContaining(['dateFrom', 'dateTo', 'region'])
    )
  })

  it('fieldOverrides 覆盖字段中文名', () => {
    const hub = createDataHub()
    const described = hub.describe('SELECT customer, amount FROM orders', undefined, {
      customer: { label: '客户简称' }
    })
    expect(described.error).toBeUndefined()
    const customer = described.fields.find((f) => f.name === 'customer')
    expect(customer?.label).toBe('客户简称')
  })

  it('连接 CRUD 与模拟测试连接', async () => {
    const hub = createDataHub()
    hub.addConnection({
      id: 'test',
      label: '测试库',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'test',
      username: 'u',
      password: 'p'
    })
    expect(hub.getConnection('test')?.label).toBe('测试库')
    hub.updateConnection('test', { label: '新测试库' })
    expect(hub.getConnection('test')?.label).toBe('新测试库')
    const result = await hub.testConnection('test')
    expect(result.ok).toBe(true)
    hub.removeConnection('test')
    expect(hub.getConnection('test')).toBeUndefined()
  })

  it('数据集 CRUD 与 subscribe 通知', () => {
    const hub = createDataHub()
    let notifyCount = 0
    const unsub = hub.subscribe(() => {
      notifyCount++
    })

    hub.addDataset({
      id: 'custom',
      label: '自定义',
      connectionId: 'demo',
      sql: 'SELECT id, name, category FROM products WHERE category = ${category}',
      paramOverrides: { category: { label: '品类', type: 'text', defaultValue: '' } }
    })
    expect(hub.getDataset('custom')?.label).toBe('自定义')
    expect(notifyCount).toBe(1)

    hub.updateDataset('custom', { label: '自定义产品' })
    expect(hub.getDataset('custom')?.label).toBe('自定义产品')

    const rows = hub.query('custom', { category: '办公设备' })
    expect('error' in rows).toBe(false)
    if ('error' in rows) return
    expect(rows.every((row) => row.category === '办公设备')).toBe(true)

    hub.removeDataset('custom')
    expect(hub.getDataset('custom')).toBeUndefined()
    unsub()
  })
})
