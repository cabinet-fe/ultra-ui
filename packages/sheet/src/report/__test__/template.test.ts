import { Sheet } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'

import { REPORT_META_NAMESPACE } from '../binding'
import type { DataConnection, DataConnector } from '../connector'
import {
  assertCompatibleTemplateVersion,
  createReportTemplate,
  fetchTemplateRecords,
  getBoundDatasetIds,
  getTemplateDatasets,
  IncompatibleTemplateVersionError,
  REPORT_TEMPLATE_VERSION,
  resolveParamDefaults,
  resolveTemplateParams,
  type ReportDatasetDef,
  type ReportTemplate
} from '../template'
import type { ParamValues, ReportBinding } from '../types'

// ---- 内联 fixtures ----

const MYSQL: DataConnection = {
  id: 'c-mysql',
  label: '本地 MySQL',
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  database: 'demo',
  username: 'root',
  password: 'secret'
}

const PG: DataConnection = {
  ...MYSQL,
  id: 'c-pg',
  label: '本地 PG',
  type: 'postgresql',
  port: 5432
}

// BETWEEN ${dateRange} 置于 SQL 末尾：后随 AND 时不会推断为 date-range（params.ts 既有推断规则）
const ORDERS_SQL =
  'SELECT customer, region, amount, orderDate FROM orders ' +
  'WHERE region = ${region} AND amount >= ${minAmount} ' +
  'AND customer LIKE ${keyword} AND orderDate BETWEEN ${dateRange}'

const CUSTOMERS_SQL = 'SELECT id, region FROM customers WHERE region = ${region}'

const ORDERS_DATASET: ReportDatasetDef = {
  id: 'orders',
  label: '销售明细',
  connection: MYSQL,
  sql: ORDERS_SQL
}

const CUSTOMERS_DATASET: ReportDatasetDef = {
  id: 'customers',
  label: '客户',
  connection: PG,
  sql: CUSTOMERS_SQL,
  paramOverrides: {
    region: {
      label: '地区',
      type: 'select',
      defaultValue: '华东',
      options: [
        { label: '华东', value: '华东' },
        { label: '华南', value: '华南' }
      ]
    }
  }
}

const UNUSED_DATASET: ReportDatasetDef = {
  id: 'unused',
  label: '未绑定',
  connection: MYSQL,
  sql: 'SELECT id FROM t WHERE x = ${unusedParam}'
}

function binding(dataset: string, field: string): ReportBinding {
  return { dataset, field, aggregate: 'list', expand: 'down', preset: 'detail' }
}

/** 构造自包含 Report Template：SheetSnapshot + 内嵌数据集定义 */
function createTemplate(
  datasets: ReportDatasetDef[],
  bindings: Array<{ row: number; col: number; dataset: string; field: string }>
): ReportTemplate {
  const sheet = new Sheet()
  for (const item of bindings) {
    sheet.setCellMeta(
      { row: item.row, col: item.col },
      REPORT_META_NAMESPACE,
      binding(item.dataset, item.field)
    )
  }
  return createReportTemplate(sheet.snapshot(), datasets)
}

describe('ReportTemplate version', () => {
  it('createReportTemplate 写入当前版本', () => {
    const template = createTemplate([ORDERS_DATASET], [])
    expect(template.version).toBe(REPORT_TEMPLATE_VERSION)
  })

  it('version 缺失时 assertCompatibleTemplateVersion 抛可读错误', () => {
    const sheet = new Sheet()
    const template = sheet.snapshot() as ReportTemplate
    expect(() => assertCompatibleTemplateVersion(template)).toThrow(
      IncompatibleTemplateVersionError
    )
    expect(() => assertCompatibleTemplateVersion(template)).toThrow(/缺少 version/)
  })

  it('version 高于当前支持时 assertCompatibleTemplateVersion 抛可读错误', () => {
    const template = createTemplate([ORDERS_DATASET], [])
    template.version = REPORT_TEMPLATE_VERSION + 1
    expect(() => assertCompatibleTemplateVersion(template)).toThrow(
      IncompatibleTemplateVersionError
    )
    expect(() => assertCompatibleTemplateVersion(template)).toThrow(/高于当前支持/)
  })

  it('version 为当前值时通过校验', () => {
    const template = createTemplate([ORDERS_DATASET], [])
    expect(() => assertCompatibleTemplateVersion(template)).not.toThrow()
  })
})

describe('getTemplateDatasets', () => {
  it('返回模板内嵌的数据集定义', () => {
    const template = createTemplate([ORDERS_DATASET], [])
    expect(getTemplateDatasets(template)).toEqual([ORDERS_DATASET])
  })

  it('未内嵌数据集（旧模板）回退为空数组', () => {
    const sheet = new Sheet()
    const template = sheet.snapshot() as ReportTemplate
    expect(getTemplateDatasets(template)).toEqual([])
  })
})

describe('getBoundDatasetIds', () => {
  it('按绑定出现顺序返回去重的数据集 id（绑定即真相）', () => {
    const template = createTemplate(
      [],
      [
        { row: 1, col: 0, dataset: 'orders', field: 'customer' },
        { row: 1, col: 1, dataset: 'orders', field: 'amount' },
        { row: 2, col: 0, dataset: 'customers', field: 'region' }
      ]
    )
    expect(getBoundDatasetIds(template)).toEqual(['orders', 'customers'])
  })

  it('无绑定时返回空数组', () => {
    expect(getBoundDatasetIds(createTemplate([], []))).toEqual([])
  })
})

describe('resolveTemplateParams', () => {
  it('从实际绑定的数据集提取参数并集（未绑定数据集的参数不出现）', () => {
    const template = createTemplate(
      [ORDERS_DATASET, CUSTOMERS_DATASET, UNUSED_DATASET],
      [
        { row: 1, col: 0, dataset: 'orders', field: 'customer' },
        { row: 2, col: 0, dataset: 'customers', field: 'region' }
      ]
    )
    const params = resolveTemplateParams(template)
    expect(params.map((p) => p.id)).toEqual(['region', 'minAmount', 'keyword', 'dateRange'])
  })

  it('按 SQL 上下文推断控件类型（= 数值 / LIKE 文本 / BETWEEN 单参 date-range）', () => {
    const template = createTemplate(
      [ORDERS_DATASET],
      [{ row: 1, col: 0, dataset: 'orders', field: 'customer' }]
    )
    const params = resolveTemplateParams(template)
    const byId = new Map(params.map((p) => [p.id, p]))
    expect(byId.get('region')?.type).toBe('number')
    expect(byId.get('minAmount')?.type).toBe('number')
    expect(byId.get('dateRange')?.type).toBe('date-range')
    expect(byId.get('keyword')?.type).toBe('text')
  })

  it('同名参数合并，先见数据集为准', () => {
    const ordersFirst = createTemplate(
      [ORDERS_DATASET, CUSTOMERS_DATASET],
      [
        { row: 1, col: 0, dataset: 'orders', field: 'customer' },
        { row: 2, col: 0, dataset: 'customers', field: 'region' }
      ]
    )
    const region = resolveTemplateParams(ordersFirst).find((p) => p.id === 'region')
    // orders 先见：无覆盖元数据，label 回退 id、类型按 orders SQL 推断
    expect(region?.label).toBe('region')
    expect(region?.type).toBe('number')
  })

  it('应用数据集参数元数据覆盖（label / 类型 / 默认值 / 选项）', () => {
    const template = createTemplate(
      [CUSTOMERS_DATASET],
      [{ row: 1, col: 0, dataset: 'customers', field: 'region' }]
    )
    const [region] = resolveTemplateParams(template)
    expect(region).toEqual({
      id: 'region',
      label: '地区',
      type: 'select',
      defaultValue: '华东',
      options: [
        { label: '华东', value: '华东' },
        { label: '华南', value: '华南' }
      ]
    })
  })

  it('绑定引用了模板未定义的数据集时跳过该数据集', () => {
    const template = createTemplate(
      [],
      [
        { row: 1, col: 0, dataset: 'ghost', field: 'x' },
        { row: 1, col: 1, dataset: 'orders', field: 'amount' }
      ]
    )
    // orders 未内嵌 → 也无参数；整体为空
    expect(resolveTemplateParams(template)).toEqual([])

    const withOrders = createTemplate(
      [ORDERS_DATASET],
      [
        { row: 1, col: 0, dataset: 'ghost', field: 'x' },
        { row: 1, col: 1, dataset: 'orders', field: 'amount' }
      ]
    )
    expect(resolveTemplateParams(withOrders).map((p) => p.id)).toEqual([
      'region',
      'minAmount',
      'keyword',
      'dateRange'
    ])
  })
})

describe('resolveParamDefaults', () => {
  it('以参数默认值生成初始运行时值', () => {
    const template = createTemplate(
      [ORDERS_DATASET, CUSTOMERS_DATASET],
      [
        { row: 1, col: 0, dataset: 'customers', field: 'region' },
        { row: 2, col: 0, dataset: 'orders', field: 'amount' }
      ]
    )
    const values = resolveParamDefaults(resolveTemplateParams(template))
    expect(values.region).toBe('华东')
    expect(values.minAmount).toBe(0)
    expect(values.dateRange).toEqual(['', ''])
    expect(values.keyword).toBe('')
  })
})

// ---- fetchTemplateRecords（stub connector：实现 DataConnector 接口的内存测试夹具）----

function createStubConnector(handlers: {
  rowsBySql?: Record<string, Record<string, unknown>[]>
  errorBySql?: Record<string, { code: string; message: string }>
}) {
  const calls: Array<{ connection: DataConnection; sql: string; values: ParamValues }> = []
  const connector: DataConnector = {
    test: () => Promise.resolve({ ok: true, data: undefined }),
    describe: () => Promise.resolve({ ok: true, data: [] }),
    query: (connection, sql, values) => {
      calls.push({ connection, sql, values })
      const error = handlers.errorBySql?.[sql]
      if (error) return Promise.resolve({ ok: false, error })
      return Promise.resolve({
        ok: true,
        data: { fields: [], rows: handlers.rowsBySql?.[sql] ?? [] }
      })
    }
  }
  return { connector, calls }
}

describe('fetchTemplateRecords', () => {
  it('按绑定的数据集逐一经连接器取数并按数据集 id 折叠行记录', async () => {
    const template = createTemplate(
      [ORDERS_DATASET, CUSTOMERS_DATASET, UNUSED_DATASET],
      [
        { row: 1, col: 0, dataset: 'orders', field: 'customer' },
        { row: 2, col: 0, dataset: 'customers', field: 'region' }
      ]
    )
    const { connector, calls } = createStubConnector({
      rowsBySql: {
        [ORDERS_SQL]: [{ customer: '甲公司', amount: 100 }],
        [CUSTOMERS_SQL]: [{ id: 'C-01', region: '华东' }]
      }
    })
    const values: ParamValues = { region: '华东' }
    const result = await fetchTemplateRecords(connector, template, values)

    expect(result).toEqual({
      ok: true,
      data: {
        orders: [{ customer: '甲公司', amount: 100 }],
        customers: [{ id: 'C-01', region: '华东' }]
      }
    })
    // 未绑定的数据集不取数；连接对象与参数原样透传
    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ connection: MYSQL, sql: ORDERS_SQL, values })
    expect(calls[1]).toEqual({ connection: PG, sql: CUSTOMERS_SQL, values })
  })

  it('业务错误（ok:false）原样透传', async () => {
    const template = createTemplate(
      [ORDERS_DATASET],
      [{ row: 1, col: 0, dataset: 'orders', field: 'customer' }]
    )
    const { connector } = createStubConnector({
      errorBySql: { [ORDERS_SQL]: { code: 'SQL_ERROR', message: '语法错误 near WHERE' } }
    })
    const result = await fetchTemplateRecords(connector, template, {})
    expect(result).toEqual({
      ok: false,
      error: { code: 'SQL_ERROR', message: '语法错误 near WHERE' }
    })
  })

  it('跳过模板未定义的绑定数据集', async () => {
    const template = createTemplate(
      [ORDERS_DATASET],
      [
        { row: 1, col: 0, dataset: 'ghost', field: 'x' },
        { row: 1, col: 1, dataset: 'orders', field: 'amount' }
      ]
    )
    const { connector, calls } = createStubConnector({ rowsBySql: { [ORDERS_SQL]: [] } })
    const result = await fetchTemplateRecords(connector, template, {})
    expect(result).toEqual({ ok: true, data: { orders: [] } })
    expect(calls).toHaveLength(1)
  })

  it('无绑定数据集时不取数，返回空记录集', async () => {
    const template = createTemplate([ORDERS_DATASET], [])
    const { connector, calls } = createStubConnector({})
    const result = await fetchTemplateRecords(connector, template, {})
    expect(result).toEqual({ ok: true, data: {} })
    expect(calls).toHaveLength(0)
  })
})
