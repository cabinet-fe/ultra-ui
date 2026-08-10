import { describe, expect, it } from 'vitest'

import { buildParamDefs, extractParamIds, resolveBoundDatasetParams } from '../params'
import type { QueryParamDef } from '../types'

describe('report params', () => {
  describe('extractParamIds', () => {
    it('从 SQL 提取 ${param} 占位符并去重', () => {
      expect(
        extractParamIds(
          'SELECT * FROM orders WHERE order_date >= ${dateFrom} AND order_date <= ${dateTo}'
        )
      ).toEqual(['dateFrom', 'dateTo'])

      expect(
        extractParamIds("SELECT * FROM orders WHERE region = ${region} AND ${region} != ''")
      ).toEqual(['region'])
      expect(extractParamIds('SELECT * FROM orders')).toEqual([])
    })

    it('忽略空白占位符与未闭合占位符', () => {
      expect(extractParamIds('WHERE a = ${ } AND b = ${ x }')).toEqual(['x'])
      expect(extractParamIds('WHERE a = ${unclosed')).toEqual([])
    })
  })

  describe('buildParamDefs', () => {
    it('等值比较推断 number 类型（旧行为；编辑器通常覆盖为 select/text）', () => {
      expect(buildParamDefs('SELECT customer FROM orders WHERE region = ${region}')).toEqual([
        { id: 'region', label: 'region', type: 'number', defaultValue: 0 }
      ])
    })

    it('BETWEEN 单参数推断 date-range 类型', () => {
      const params = buildParamDefs(
        'SELECT customer FROM orders WHERE order_date BETWEEN ${dateRange}'
      )
      expect(params).toHaveLength(1)
      expect(params[0]?.id).toBe('dateRange')
      expect(params[0]?.type).toBe('date-range')
      expect(params[0]?.defaultValue).toEqual(['', ''])
    })

    it('BETWEEN 双参数：首参推断 date，次参无 AND 后续回落 text（旧行为）', () => {
      const sql = 'SELECT customer FROM orders WHERE order_date BETWEEN ${dateFrom} AND ${dateTo}'
      const params = buildParamDefs(sql)
      const types = Object.fromEntries(params.map((p) => [p.id, p.type]))
      expect(types).toEqual({ dateFrom: 'date', dateTo: 'text' })
    })

    it('LIKE 推断 text、数值比较推断 number', () => {
      expect(
        buildParamDefs('SELECT customer FROM orders WHERE customer LIKE ${keyword}')[0]?.type
      ).toBe('text')
      expect(
        buildParamDefs('SELECT customer FROM orders WHERE amount > ${minAmount}')[0]?.type
      ).toBe('number')
    })

    it('元数据覆盖 label / 类型 / 默认值 / 选项', () => {
      const params = buildParamDefs('SELECT customer FROM orders WHERE region = ${region}', {
        region: {
          label: '地区',
          type: 'select',
          defaultValue: '',
          options: [
            { label: '华东', value: '华东' },
            { label: '华南', value: '华南' }
          ]
        }
      })
      expect(params[0]).toEqual({
        id: 'region',
        label: '地区',
        type: 'select',
        defaultValue: '',
        options: [
          { label: '华东', value: '华东' },
          { label: '华南', value: '华南' }
        ]
      })
    })
  })

  describe('resolveBoundDatasetParams', () => {
    const DATE_FROM: QueryParamDef = {
      id: 'dateFrom',
      label: '开始日期',
      type: 'date',
      defaultValue: '2024-01-01'
    }
    const DATE_TO: QueryParamDef = {
      id: 'dateTo',
      label: '结束日期',
      type: 'date',
      defaultValue: '2024-12-31'
    }
    const REGION: QueryParamDef = {
      id: 'region',
      label: '地区',
      type: 'select',
      defaultValue: '',
      options: [{ label: '华东', value: '华东' }]
    }
    const ALERT_THRESHOLD: QueryParamDef = {
      id: 'alertThreshold',
      label: '库存预警阈值',
      type: 'number',
      defaultValue: 80
    }

    const datasetParams: Record<string, QueryParamDef[]> = {
      orders: [DATE_FROM, DATE_TO, REGION],
      customers: [REGION],
      'sales-matrix': [REGION],
      'inventory-alerts': [ALERT_THRESHOLD]
    }

    it('按绑定数据集合并查询参数并去重', () => {
      const merged = resolveBoundDatasetParams(
        [],
        ['orders', 'customers'],
        (id) => datasetParams[id] ?? []
      )
      expect(merged.map((item) => item.id).sort()).toEqual(['dateFrom', 'dateTo', 'region'])

      const matrix = resolveBoundDatasetParams(
        [],
        ['sales-matrix'],
        (id) => datasetParams[id] ?? []
      )
      expect(matrix.map((item) => item.id)).toEqual(['region'])

      const inventory = resolveBoundDatasetParams(
        [],
        ['inventory-alerts'],
        (id) => datasetParams[id] ?? []
      )
      expect(inventory.map((item) => item.id)).toEqual(['alertThreshold'])
    })

    it('无绑定数据集时回退全局参数', () => {
      const fallback = resolveBoundDatasetParams([REGION], [], () => [])
      expect(fallback.map((item) => item.id)).toEqual(['region'])
    })

    it('同名参数先见为准', () => {
      const overridden: QueryParamDef = { ...REGION, label: '覆盖地区' }
      const merged = resolveBoundDatasetParams([], ['orders', 'customers'], (id) =>
        id === 'orders' ? [REGION] : [overridden]
      )
      expect(merged).toHaveLength(1)
      expect(merged[0]?.label).toBe('地区')
    })
  })
})
