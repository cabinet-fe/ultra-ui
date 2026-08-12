import { Sheet, Workbook } from '@veltra/sheet-core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'

import { UReportViewer } from '../../../index'
import { REPORT_META_NAMESPACE } from '../../../report/binding'
import type { DataConnection, DataConnector } from '../../../report/connector'
import { createReportTemplate } from '../../../report/template'
import type { ReportDatasetDef, ReportTemplate } from '../../../report/template'
import type { ParamValues, ReportBinding } from '../../../report/types'
import type { ReportViewerExposed } from '../../../types'

// ---- 内联 fixtures：stub connector（实现 DataConnector 接口的内存测试夹具）----

const MYSQL: DataConnection = {
  id: 'c1',
  label: 'stub MySQL',
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  database: 'demo',
  username: 'root',
  password: ''
}

// 覆盖全部 5 种参数控件类型：LIKE→text、>=→number、覆盖→select、
// BETWEEN ${a} AND ${b} 首参→date、BETWEEN 单参（SQL 末尾）→date-range
const ORDERS_SQL =
  'SELECT customer, amount FROM orders ' +
  'WHERE customer LIKE ${keyword} AND amount >= ${minAmount} AND region = ${region} ' +
  'AND orderDate BETWEEN ${dateFrom} AND ${dateTo} AND createdAt BETWEEN ${dateRange}'

const ORDERS_DATASET: ReportDatasetDef = {
  id: 'orders',
  label: '销售明细',
  connection: MYSQL,
  sql: ORDERS_SQL,
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

/** 参数默认值（keyword/dateFrom/dateTo 文本 ''、minAmount 数值 0、region 覆盖默认、dateRange 元组） */
const DEFAULT_VALUES: ParamValues = {
  keyword: '',
  minAmount: 0,
  region: '华东',
  dateFrom: '',
  dateTo: '',
  dateRange: ['', '']
}

const ORDER_ROWS: Record<string, unknown>[] = [
  { customer: '甲公司', amount: 100 },
  { customer: '甲公司', amount: 200 },
  { customer: '乙公司', amount: 300 }
]

/** 带绑定的模板：表头 + 同一扩展带（客户分组 + 金额明细） */
function createViewerTemplate(datasets: ReportDatasetDef[] = [ORDERS_DATASET]): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '金额' } }
  ])

  const group: ReportBinding = {
    dataset: 'orders',
    field: 'customer',
    preset: 'groupHeader',
    aggregate: 'group',
    expand: 'down'
  }
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, group)

  const amount: ReportBinding = {
    dataset: 'orders',
    field: 'amount',
    preset: 'detail',
    aggregate: 'list',
    expand: 'down',
    rowParent: { row: 1, col: 0 }
  }
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, amount)

  return createReportTemplate(sheet.snapshot(), datasets)
}

interface QueryCall {
  connection: DataConnection
  sql: string
  values: ParamValues
}

type QueryOutcome =
  | { rows: Record<string, unknown>[] }
  | { error: { code: string; message: string } }

/** stub connector：记录 query 调用；outcome 可为立即值或手动闸门（loading 测试） */
function createStubConnector(outcome: QueryOutcome | (() => Promise<QueryOutcome>)) {
  const calls: QueryCall[] = []
  const connector: DataConnector = {
    test: () => Promise.resolve({ ok: true, data: undefined }),
    describe: () => Promise.resolve({ ok: true, data: [] }),
    query: async (connection, sql, values) => {
      calls.push({ connection, sql, values })
      const resolved = typeof outcome === 'function' ? await outcome() : outcome
      if ('error' in resolved) return { ok: false, error: resolved.error }
      return { ok: true, data: { fields: [], rows: resolved.rows } }
    }
  }
  return { connector, calls }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

// ---- 挂载与等待 ----

const apps: App[] = []
const containers: HTMLElement[] = []

function mountViewer(props: {
  connector: DataConnector
  template: ReportTemplate
  workbook?: Workbook
}) {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  containers.push(el)
  const exposedRef = { value: undefined as ReportViewerExposed | undefined }
  const app = createApp({
    render: () =>
      h(UReportViewer, {
        ...props,
        ref: (value: unknown) => {
          exposedRef.value = value as ReportViewerExposed | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { app, el, exposedRef }
}

/** 等待取数（宏/微任务）+ 填充快照应用（watch + nextTick）落定 */
async function flushViewer(): Promise<void> {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
  await nextTick()
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

describe('UReportViewer', () => {
  it('全流程：带绑定的模板 + stub connector → 参数提取 → Filter Bar → 取数 → 展开渲染', async () => {
    const { connector, calls } = createStubConnector({ rows: ORDER_ROWS })
    const workbook = new Workbook()
    const { el } = mountViewer({ connector, template: createViewerTemplate(), workbook })
    await flushViewer()

    // 经连接器取数：连接对象 / SQL / 参数默认值原样透传
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual({ connection: MYSQL, sql: ORDERS_SQL, values: DEFAULT_VALUES })

    // Filter Bar 按参数类型映射控件（text/number/select/date/date-range）
    const filterBar = el.querySelector('.u-report-filter-bar')!
    expect(filterBar).toBeTruthy()
    expect(filterBar.querySelector('.u-input')).toBeTruthy()
    expect(filterBar.querySelector('.u-number-input')).toBeTruthy()
    expect(filterBar.querySelector('.u-select')).toBeTruthy()
    expect(filterBar.querySelector('.u-date-picker')).toBeTruthy()
    expect(filterBar.querySelector('.u-date-range-picker')).toBeTruthy()
    // 覆盖元数据的 label 生效
    expect(filterBar.textContent).toContain('地区')

    // 展开结果落到只读网格（模型断言）：表头 + 甲(2 明细) + 乙(1 明细)
    const sheet = workbook.activeSheet
    expect(sheet.getDisplayValue({ row: 0, col: 0 })).toBe('客户')
    expect(sheet.getDisplayValue({ row: 1, col: 0 })).toBe('甲公司')
    expect(sheet.getCellData({ row: 1, col: 1 })?.v).toBe(100)
    expect(sheet.getCellData({ row: 2, col: 1 })?.v).toBe(200)
    expect(sheet.getDisplayValue({ row: 3, col: 0 })).toBe('乙公司')
    expect(sheet.getCellData({ row: 3, col: 1 })?.v).toBe(300)
  })

  it('Filter Bar 改值重新取数，其余参数值保留', async () => {
    const { connector, calls } = createStubConnector({ rows: ORDER_ROWS })
    const workbook = new Workbook()
    const { el } = mountViewer({ connector, template: createViewerTemplate(), workbook })
    await flushViewer()
    expect(calls).toHaveLength(1)

    // keyword（text 控件）输入新值
    const input = el.querySelector<HTMLInputElement>('.u-report-filter-bar .u-input input')!
    input.value = '甲公司'
    input.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: '甲公司', inputType: 'insertText' })
    )
    await flushViewer()

    expect(calls).toHaveLength(2)
    expect(calls[1]!.values).toEqual({ ...DEFAULT_VALUES, keyword: '甲公司' })

    // minAmount（number 控件）输入新值
    const numberInput = el.querySelector<HTMLInputElement>(
      '.u-report-filter-bar .u-number-input input'
    )!
    numberInput.value = '500'
    numberInput.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: '500', inputType: 'insertText' })
    )
    await flushViewer()

    expect(calls).toHaveLength(3)
    expect(calls[2]!.values).toEqual({ ...DEFAULT_VALUES, keyword: '甲公司', minAmount: 500 })
  })

  it('取数中有 loading；业务错误（ok:false）有可读提示；refresh() 触发重新取数', async () => {
    let gate = deferred<QueryOutcome>()
    // 首次取数返回业务错误，refresh 后返回数据
    let outcome: QueryOutcome = { error: { code: 'CONNECTION_FAILED', message: '数据库连接失败' } }
    const { connector, calls } = createStubConnector(() => gate.promise)
    const workbook = new Workbook()
    const { el, exposedRef } = mountViewer({
      connector,
      template: createViewerTemplate(),
      workbook
    })
    await nextTick()

    // 取数中：loading 遮罩可见
    expect(el.querySelector('.u-report-viewer__loading')).toBeTruthy()

    // 业务错误：可读错误提示可见，网格保留模板静态结构
    gate.resolve(outcome)
    await flushViewer()
    expect(el.querySelector('.u-report-viewer__loading')).toBeNull()
    const errorBanner = el.querySelector('.u-report-viewer__error')!
    expect(errorBanner.textContent).toContain('数据库连接失败')
    expect(workbook.activeSheet.getDisplayValue({ row: 0, col: 0 })).toBe('客户')
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBeUndefined()

    // refresh() 重新取数：成功后错误消失、展开结果渲染
    outcome = { rows: ORDER_ROWS }
    gate = deferred<QueryOutcome>()
    const refreshed = exposedRef.value!.refresh()
    expect(calls).toHaveLength(2)
    await nextTick()
    expect(el.querySelector('.u-report-viewer__loading')).toBeTruthy()
    gate.resolve(outcome)
    await refreshed
    await flushViewer()
    expect(el.querySelector('.u-report-viewer__error')).toBeNull()
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBe('甲公司')
    expect(workbook.activeSheet.getCellData({ row: 3, col: 1 })?.v).toBe(300)
  })

  it('模板无查询参数时不渲染 Filter Bar', async () => {
    const dataset: ReportDatasetDef = {
      id: 'orders',
      label: '销售明细',
      connection: MYSQL,
      sql: 'SELECT customer, amount FROM orders'
    }
    const { connector } = createStubConnector({ rows: ORDER_ROWS })
    const { el } = mountViewer({
      connector,
      template: createViewerTemplate([dataset]),
      workbook: new Workbook()
    })
    await flushViewer()
    expect(el.querySelector('.u-report-filter-bar')).toBeNull()
  })
})
