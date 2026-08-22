import { Sheet, Workbook } from '@veltra/sheet-core'
import type { CellAddress } from '@veltra/sheet-core'
import { SheetGrid } from '@veltra/sheet-core/grid'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'

import { UReportViewer } from '../../../index'
import { REPORT_META_NAMESPACE } from '../../../report/binding'
import type { DataConnection, DataConnector } from '../../../report/connector'
import { createReportTemplate } from '../../../report/template'
import type { ReportDatasetDef, ReportTemplate } from '../../../report/template'
import type { ParamValues, ReportBinding } from '../../../report/types'
import type { ReportViewerExposed, SheetExposed } from '../../../types'

// ---- 内联 fixtures：stub connector（按 SQL 路由行记录）+ 三级下钻模板 ----

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

const SUMMARY_SQL = 'SELECT region, total FROM summary WHERE region LIKE ${keyword}'
const ORDERS_SQL = 'SELECT customer, amount FROM orders WHERE region LIKE ${p_region}'
const ITEMS_SQL = 'SELECT item, qty FROM items WHERE customer LIKE ${p_customer}'
const SELF_SQL = 'SELECT region FROM t WHERE region LIKE ${p_region}'

const SUMMARY_DATASET: ReportDatasetDef = {
  id: 'summary',
  label: '地区汇总',
  connection: MYSQL,
  sql: SUMMARY_SQL
}
const ORDERS_DATASET: ReportDatasetDef = {
  id: 'orders',
  label: '销售明细',
  connection: MYSQL,
  sql: ORDERS_SQL
}
const ITEMS_DATASET: ReportDatasetDef = {
  id: 'items',
  label: '项目明细',
  connection: MYSQL,
  sql: ITEMS_SQL
}
const SELF_DATASET: ReportDatasetDef = {
  id: 'self',
  label: '自指报表',
  connection: MYSQL,
  sql: SELF_SQL
}

const SUMMARY_ROWS: Record<string, unknown>[] = [
  { region: '华东', total: 300 },
  { region: '华南', total: 100 }
]
const ORDER_ROWS: Record<string, unknown>[] = [
  { customer: '甲公司', amount: 100 },
  { customer: '乙公司', amount: 200 }
]
const ITEM_ROWS: Record<string, unknown>[] = [{ item: 'X 项目', qty: 1 }]

/** 主表：地区分组格配下钻（→ tpl-detail，region → p_region）；总额汇总格不配下钻 */
function createSummaryTemplate(): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '地区' } },
    { addr: { row: 0, col: 1 }, data: { v: '总额' } }
  ])
  const group: ReportBinding = {
    dataset: 'summary',
    field: 'region',
    aggregate: 'group',
    expand: 'down',
    drill: { target: 'tpl-detail', mapping: { region: 'p_region' }, openMode: 'switch' }
  }
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, group)
  const total: ReportBinding = {
    dataset: 'summary',
    field: 'total',
    aggregate: 'sum',
    expand: 'none',
    rowParent: { row: 1, col: 0 }
  }
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, total)
  sheet.ensureTableSize(50, 10)
  return createReportTemplate(sheet.snapshot(), [SUMMARY_DATASET])
}

/** 明细表：客户明细格配下钻（→ tpl-third，customer → p_customer） */
function createDetailTemplate(): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '金额' } }
  ])
  const customer: ReportBinding = {
    dataset: 'orders',
    field: 'customer',
    aggregate: 'list',
    expand: 'down',
    drill: { target: 'tpl-third', mapping: { customer: 'p_customer' }, openMode: 'switch' }
  }
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, customer)
  const amount: ReportBinding = {
    dataset: 'orders',
    field: 'amount',
    aggregate: 'list',
    expand: 'down'
  }
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, amount)
  sheet.ensureTableSize(50, 10)
  return createReportTemplate(sheet.snapshot(), [ORDERS_DATASET])
}

/** 第三级：无下钻的明细表 */
function createThirdTemplate(): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '项目' } }])
  const item: ReportBinding = { dataset: 'items', field: 'item', aggregate: 'list', expand: 'down' }
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, item)
  sheet.ensureTableSize(50, 10)
  return createReportTemplate(sheet.snapshot(), [ITEMS_DATASET])
}

/** 自指表：地区分组格下钻指向自身（region → p_region） */
function createSelfTemplate(): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([{ addr: { row: 0, col: 0 }, data: { v: '地区' } }])
  const region: ReportBinding = {
    dataset: 'self',
    field: 'region',
    aggregate: 'group',
    expand: 'down',
    drill: { target: 'tpl-self', mapping: { region: 'p_region' }, openMode: 'switch' }
  }
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, region)
  sheet.ensureTableSize(50, 10)
  return createReportTemplate(sheet.snapshot(), [SELF_DATASET])
}

interface QueryCall {
  connection: DataConnection
  sql: string
  values: ParamValues
}

/** stub connector：记录 query 调用，按 SQL 路由到对应行记录 */
function createStubConnector(rowsBySql: Record<string, Record<string, unknown>[]>) {
  const calls: QueryCall[] = []
  const connector: DataConnector = {
    test: () => Promise.resolve({ ok: true, data: undefined }),
    describe: () => Promise.resolve({ ok: true, data: [] }),
    query: (connection, sql, values) => {
      calls.push({ connection, sql, values })
      return Promise.resolve({ ok: true, data: { fields: [], rows: rowsBySql[sql] ?? [] } })
    }
  }
  return { connector, calls }
}

/** stub 宿主契约：按 ref 从模板表解析（异步形态） */
function createTemplateResolver(map: Record<string, ReportTemplate>) {
  return vi.fn((ref: string) => Promise.resolve(map[ref]))
}

// ---- 挂载与等待 ----

const apps: App[] = []
const containers: HTMLElement[] = []

function mountViewer(props: {
  connector: DataConnector
  template: ReportTemplate
  workbook?: Workbook
  resolveTemplate?: (ref: string) => Promise<ReportTemplate | undefined>
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

/** 内嵌 USheet 的 SheetGrid */
function nestedSheetGrid(el: HTMLElement) {
  const sheetEl = el.querySelector('.u-sheet') as
    | (HTMLElement & { __vueParentComponent?: { exposed?: SheetExposed } })
    | null
  return sheetEl?.__vueParentComponent?.exposed?.getGrid()
}

/** 等待取数 / 下钻解析（宏/微任务）+ 填充快照应用（watch + nextTick）落定 */
async function flushViewer(): Promise<void> {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
  await nextTick()
}

/** 网格命中测试 mock：网格随内容尺寸重建，按原型 mock 一次，逐次改返回值 */
let hitSpy: ReturnType<typeof vi.spyOn> | null = null

function mockHitAddr(addr: CellAddress | null): void {
  if (!hitSpy) {
    hitSpy = vi.spyOn(SheetGrid.prototype, 'hitTestSheetAddr')
  }
  hitSpy.mockReturnValue(addr)
}

/** 在网格上模拟一次单击（pointerdown + click 同坐标） */
function dispatchGridClick(el: HTMLElement, x = 10, y = 10): void {
  const gridEl = el.querySelector('.u-sheet__grid-instance')!
  gridEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y }))
  gridEl.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }))
}

function dispatchGridPointerMove(el: HTMLElement, x = 10, y = 10): void {
  const gridEl = el.querySelector('.u-sheet__grid-instance')!
  gridEl.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }))
}

async function clickButton(button: HTMLElement): Promise<void> {
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flushViewer()
}

afterEach(() => {
  hitSpy?.mockRestore()
  hitSpy = null
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
})

const SHEET_CLS = 'u-report-viewer__sheet'
const DRILL_HOVER_CLS = 'u-report-viewer__sheet--drill-hover'
const DRILL_BAR_CLS = '.u-report-viewer__drill-bar'

describe('UReportViewer 下钻（查看器内切换）', () => {
  it('单击配了下钻的分组格：解析目标模板、映射参数带入 Filter Bar 并取数渲染', async () => {
    const { connector, calls } = createStubConnector({
      [SUMMARY_SQL]: SUMMARY_ROWS,
      [ORDERS_SQL]: ORDER_ROWS
    })
    const resolveTemplate = createTemplateResolver({ 'tpl-detail': createDetailTemplate() })
    const workbook = new Workbook()
    const { el } = mountViewer({
      connector,
      template: createSummaryTemplate(),
      workbook,
      resolveTemplate
    })
    await flushViewer()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ sql: SUMMARY_SQL, values: { keyword: '' } })

    // 单击 (1,0) 华东分组格
    mockHitAddr({ row: 1, col: 0 })
    dispatchGridClick(el)
    await flushViewer()

    // 宿主契约按 target 引用解析
    expect(resolveTemplate).toHaveBeenCalledWith('tpl-detail')
    // 映射参数带入详情报取数
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({ sql: ORDERS_SQL, values: { p_region: '华东' } })
    // Filter Bar 自动填入映射值
    const input = el.querySelector<HTMLInputElement>('.u-report-filter-bar .u-input input')!
    expect(input.value).toBe('华东')
    // 详情报渲染：当前可见层替换为明细数据
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBe('甲公司')
    // 栈深 1：出现回退入口
    expect(el.querySelector(DRILL_BAR_CLS)).toBeTruthy()
  })

  it('未配置下钻的格子（静态格 / 无 drill 绑定格）单击不跳转', async () => {
    const { connector, calls } = createStubConnector({ [SUMMARY_SQL]: SUMMARY_ROWS })
    const resolveTemplate = createTemplateResolver({ 'tpl-detail': createDetailTemplate() })
    const { el } = mountViewer({
      connector,
      template: createSummaryTemplate(),
      workbook: new Workbook(),
      resolveTemplate
    })
    await flushViewer()
    expect(calls).toHaveLength(1)

    // 静态表头格
    mockHitAddr({ row: 0, col: 0 })
    dispatchGridClick(el)
    await flushViewer()
    // 无 drill 的汇总绑定格
    mockHitAddr({ row: 1, col: 1 })
    dispatchGridClick(el)
    await flushViewer()

    expect(resolveTemplate).not.toHaveBeenCalled()
    expect(calls).toHaveLength(1)
    expect(el.querySelector(DRILL_BAR_CLS)).toBeNull()
  })

  it('拖拽框选（位移超阈值）不触发下钻，同点位单击触发', async () => {
    const { connector } = createStubConnector({
      [SUMMARY_SQL]: SUMMARY_ROWS,
      [ORDERS_SQL]: ORDER_ROWS
    })
    const resolveTemplate = createTemplateResolver({ 'tpl-detail': createDetailTemplate() })
    const { el } = mountViewer({
      connector,
      template: createSummaryTemplate(),
      workbook: new Workbook(),
      resolveTemplate
    })
    await flushViewer()

    const gridEl = el.querySelector('.u-sheet__grid-instance')!
    mockHitAddr({ row: 1, col: 0 })
    // 拖拽框选：pointerdown 与 click 位移 80px
    gridEl.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 })
    )
    gridEl.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 90, clientY: 10 }))
    await flushViewer()
    expect(resolveTemplate).not.toHaveBeenCalled()

    // 同点位单击：正常触发
    dispatchGridClick(el)
    await flushViewer()
    expect(resolveTemplate).toHaveBeenCalledWith('tpl-detail')
  })

  it('多层下钻逐级回退：回退后该层 Filter Bar 为当时值并重新取数渲染', async () => {
    const { connector, calls } = createStubConnector({
      [SUMMARY_SQL]: SUMMARY_ROWS,
      [ORDERS_SQL]: ORDER_ROWS,
      [ITEMS_SQL]: ITEM_ROWS
    })
    const resolveTemplate = createTemplateResolver({
      'tpl-detail': createDetailTemplate(),
      'tpl-third': createThirdTemplate()
    })
    const workbook = new Workbook()
    const { el } = mountViewer({
      connector,
      template: createSummaryTemplate(),
      workbook,
      resolveTemplate
    })
    await flushViewer()

    // 主表 Filter Bar 改值为「华东」（离开时的当时值）
    const rootInput = el.querySelector<HTMLInputElement>('.u-report-filter-bar .u-input input')!
    rootInput.value = '华东'
    rootInput.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: '华东', inputType: 'insertText' })
    )
    await flushViewer()
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({ sql: SUMMARY_SQL, values: { keyword: '华东' } })

    // 第一层：主表 → 明细表（region=华东 → p_region）
    mockHitAddr({ row: 1, col: 0 })
    dispatchGridClick(el)
    await flushViewer()
    expect(calls[2]).toMatchObject({ sql: ORDERS_SQL, values: { p_region: '华东' } })

    // 第二层：明细表 → 项目表（customer=甲公司 → p_customer）
    mockHitAddr({ row: 1, col: 0 })
    dispatchGridClick(el)
    await flushViewer()
    expect(calls[3]).toMatchObject({ sql: ITEMS_SQL, values: { p_customer: '甲公司' } })
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBe('X 项目')

    // 回退到明细表：当时值 p_region=华东，重新取数渲染
    await clickButton(el.querySelector<HTMLElement>(`${DRILL_BAR_CLS} button`)!)
    expect(calls[4]).toMatchObject({ sql: ORDERS_SQL, values: { p_region: '华东' } })
    expect(el.querySelector<HTMLInputElement>('.u-report-filter-bar .u-input input')!.value).toBe(
      '华东'
    )
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBe('甲公司')
    expect(el.querySelector(DRILL_BAR_CLS)).toBeTruthy()

    // 回退到主表：当时值 keyword=华东（离开前的改值），重新取数渲染
    await clickButton(el.querySelector<HTMLElement>(`${DRILL_BAR_CLS} button`)!)
    expect(calls[5]).toMatchObject({ sql: SUMMARY_SQL, values: { keyword: '华东' } })
    expect(el.querySelector<HTMLInputElement>('.u-report-filter-bar .u-input input')!.value).toBe(
      '华东'
    )
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBe('华东')
    expect(el.querySelector(DRILL_BAR_CLS)).toBeNull()
  })

  it('resolveTemplate 抛错：可读错误提示，停留当前报表，下钻栈不变', async () => {
    const { connector, calls } = createStubConnector({ [SUMMARY_SQL]: SUMMARY_ROWS })
    const resolveTemplate = vi.fn(() => Promise.reject(new Error('模板服务不可用')))
    const workbook = new Workbook()
    const { el } = mountViewer({
      connector,
      template: createSummaryTemplate(),
      workbook,
      resolveTemplate
    })
    await flushViewer()
    expect(calls).toHaveLength(1)

    mockHitAddr({ row: 1, col: 0 })
    dispatchGridClick(el)
    await flushViewer()

    const errorBanner = el.querySelector('.u-report-viewer__error')!
    expect(errorBanner.textContent).toContain('模板服务不可用')
    // 停留当前报：填充内容不变，不再取数，无回退入口
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBe('华东')
    expect(calls).toHaveLength(1)
    expect(el.querySelector(DRILL_BAR_CLS)).toBeNull()
  })

  it('resolveTemplate 返回空结果：可读错误提示，停留当前报表', async () => {
    const { connector, calls } = createStubConnector({ [SUMMARY_SQL]: SUMMARY_ROWS })
    const resolveTemplate = createTemplateResolver({})
    const workbook = new Workbook()
    const { el } = mountViewer({
      connector,
      template: createSummaryTemplate(),
      workbook,
      resolveTemplate
    })
    await flushViewer()

    mockHitAddr({ row: 1, col: 0 })
    dispatchGridClick(el)
    await flushViewer()

    expect(resolveTemplate).toHaveBeenCalledWith('tpl-detail')
    const errorBanner = el.querySelector('.u-report-viewer__error')!
    expect(errorBanner.textContent).toContain('tpl-detail')
    expect(workbook.activeSheet.getDisplayValue({ row: 1, col: 0 })).toBe('华东')
    expect(calls).toHaveLength(1)
    expect(el.querySelector(DRILL_BAR_CLS)).toBeNull()
  })

  it('下钻指向自身：正常压栈并逐级回退', async () => {
    const { connector, calls } = createStubConnector({ [SELF_SQL]: SUMMARY_ROWS })
    const selfTemplate = createSelfTemplate()
    const resolveTemplate = createTemplateResolver({ 'tpl-self': selfTemplate })
    const { el } = mountViewer({
      connector,
      template: selfTemplate,
      workbook: new Workbook(),
      resolveTemplate
    })
    await flushViewer()
    expect(calls[0]).toMatchObject({ sql: SELF_SQL, values: { p_region: '' } })

    // 第一次自指：(1,0) 华东 → p_region=华东
    mockHitAddr({ row: 1, col: 0 })
    dispatchGridClick(el)
    await flushViewer()
    expect(calls[1]).toMatchObject({ sql: SELF_SQL, values: { p_region: '华东' } })

    // 第二次自指：(2,0) 华南 → p_region=华南
    mockHitAddr({ row: 2, col: 0 })
    dispatchGridClick(el)
    await flushViewer()
    expect(calls[2]).toMatchObject({ sql: SELF_SQL, values: { p_region: '华南' } })

    // 逐级回退：恢复各层当时参数并重新取数
    await clickButton(el.querySelector<HTMLElement>(`${DRILL_BAR_CLS} button`)!)
    expect(calls[3]).toMatchObject({ sql: SELF_SQL, values: { p_region: '华东' } })
    await clickButton(el.querySelector<HTMLElement>(`${DRILL_BAR_CLS} button`)!)
    expect(calls[4]).toMatchObject({ sql: SELF_SQL, values: { p_region: '' } })
    expect(el.querySelector(DRILL_BAR_CLS)).toBeNull()
  })

  it('悬停配了下钻的格子时出现可点光标提示，移出后消失', async () => {
    const { connector } = createStubConnector({ [SUMMARY_SQL]: SUMMARY_ROWS })
    const resolveTemplate = createTemplateResolver({ 'tpl-detail': createDetailTemplate() })
    const { el } = mountViewer({
      connector,
      template: createSummaryTemplate(),
      workbook: new Workbook(),
      resolveTemplate
    })
    await flushViewer()

    const sheetEl = el.querySelector(`.${SHEET_CLS}`)!
    mockHitAddr({ row: 1, col: 0 })
    dispatchGridPointerMove(el)
    await nextTick()
    expect(sheetEl.classList.contains(DRILL_HOVER_CLS)).toBe(true)

    mockHitAddr({ row: 0, col: 0 })
    dispatchGridPointerMove(el)
    await nextTick()
    expect(sheetEl.classList.contains(DRILL_HOVER_CLS)).toBe(false)
  })
})
