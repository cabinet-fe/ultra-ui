import { Workbook } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'
import { effectScope, ref, type EffectScope, type Ref } from 'vue'

import { REPORT_META_NAMESPACE } from '../../../report/binding'
import type { DataConnection, DataConnector } from '../../../report/connector'
import type { DatasetField, ParamValues, ReportBinding } from '../../../report/types'
import { useReportDesigner, type UseReportDesignerReturn } from '../use-report-designer'

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

const PG: DataConnection = {
  id: 'c2',
  label: 'stub PG',
  type: 'postgresql',
  host: '127.0.0.1',
  port: 5432,
  database: 'demo',
  username: 'postgres',
  password: ''
}

const ORDER_FIELDS: DatasetField[] = [
  { name: 'customer', label: '客户', type: 'string' },
  { name: 'amount', label: '金额', type: 'number' }
]

interface StubCalls {
  test: DataConnection[]
  describe: Array<{ connection: DataConnection; sql: string }>
  query: Array<{ connection: DataConnection; sql: string; values: ParamValues }>
}

function createStubConnector() {
  const calls: StubCalls = { test: [], describe: [], query: [] }
  const connector: DataConnector = {
    test: (connection) => {
      calls.test.push(connection)
      return Promise.resolve({ ok: true, data: undefined })
    },
    describe: (connection, sql) => {
      calls.describe.push({ connection, sql })
      if (sql.includes('BAD')) {
        return Promise.resolve({
          ok: false,
          error: { code: 'SQL_ERROR', message: 'syntax error near BAD' }
        })
      }
      return Promise.resolve({ ok: true, data: ORDER_FIELDS })
    },
    query: (connection, sql, values) => {
      calls.query.push({ connection, sql, values })
      return Promise.resolve({
        ok: true,
        data: { fields: ORDER_FIELDS, rows: [{ customer: '甲公司', amount: 100 }] }
      })
    }
  }
  return { connector, calls }
}

interface DesignerFixture {
  scope: EffectScope
  designer: UseReportDesignerReturn
  connections: Ref<DataConnection[]>
  workbook: Workbook
  calls: StubCalls
}

function createDesigner(initial: DataConnection[] = [MYSQL]): DesignerFixture {
  const { connector, calls } = createStubConnector()
  const connections = ref<DataConnection[]>(initial)
  const workbook = new Workbook()
  const scope = effectScope()
  const designer = scope.run(() =>
    useReportDesigner({ props: { connector, workbook }, connections })
  )!
  return { scope, designer, connections, workbook, calls }
}

describe('useReportDesigner：连接 / 数据集 CRUD 与连接器调用', () => {
  it('连接 CRUD 全走 v-model 代理；删除连接级联删除其数据集', () => {
    const { designer, connections } = createDesigner()

    designer.addConnection(PG)
    expect(connections.value).toEqual([MYSQL, PG])

    designer.updateConnection({ ...PG, label: 'renamed' })
    expect(connections.value[1]).toEqual({ ...PG, label: 'renamed' })

    const dataset = designer.addDataset('c2')
    designer.removeConnection('c2')
    expect(connections.value).toEqual([MYSQL])
    expect(designer.datasets.value.find((item) => item.id === dataset.id)).toBeUndefined()
  })

  it('测试连接透传 connector.test（新建草稿同样可测）', async () => {
    const { designer, calls } = createDesigner()
    const draft: DataConnection = { ...MYSQL, id: 'draft', host: '10.0.0.1' }
    const result = await designer.testConnection(draft)
    expect(result).toEqual({ ok: true, data: undefined })
    expect(calls.test).toEqual([draft])
  })

  it('describeDataset 经连接器解析字段并写入数据集字段缓存；fieldOverrides 在 catalog 层应用', async () => {
    const { designer } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, {
      sql: 'SELECT customer, amount FROM orders',
      fieldOverrides: { customer: { label: '客户名称' } }
    })

    const result = await designer.describeDataset(dataset.id)
    expect(result).toEqual({ ok: true, data: ORDER_FIELDS })
    expect(designer.datasets.value[0]!.fields).toEqual(ORDER_FIELDS)

    const catalog = designer.catalog.value
    expect(catalog).toHaveLength(1)
    expect(catalog[0]!.fields.map((field) => field.label)).toEqual(['客户名称', '金额'])
  })

  it('describeDataset 业务错误整体透传且不写字段缓存', async () => {
    const { designer } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, { sql: 'SELECT BAD' })

    const result = await designer.describeDataset(dataset.id)
    expect(result).toEqual({
      ok: false,
      error: { code: 'SQL_ERROR', message: 'syntax error near BAD' }
    })
    expect(designer.datasets.value[0]!.fields).toBeUndefined()
  })

  it('previewDataset 按参数默认值（含元数据覆盖）经连接器取数', async () => {
    const { designer, calls } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, {
      sql: 'SELECT customer FROM orders WHERE customer LIKE ${keyword} AND amount >= ${minAmount}',
      paramOverrides: { minAmount: { defaultValue: 50 } }
    })

    await designer.previewDataset(dataset.id)
    expect(calls.query).toHaveLength(1)
    expect(calls.query[0]!.connection).toEqual(MYSQL)
    expect(calls.query[0]!.values).toEqual({ keyword: '', minAmount: 50 })
  })
})

describe('useReportDesigner：拖拽落格写 Cell Meta', () => {
  async function seedDataset(designer: UseReportDesignerReturn, connectionId = 'c1') {
    const dataset = designer.addDataset(connectionId)
    designer.updateDataset(dataset.id, { sql: 'SELECT customer, amount FROM orders' })
    await designer.describeDataset(dataset.id)
    return dataset
  }

  it('落格写入 createReportBinding 默认绑定（detail/select/down/default）', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedDataset(designer)

    designer.bindField(dataset.id, 'customer', { row: 0, col: 0 })

    const binding = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 0, col: 0 },
      REPORT_META_NAMESPACE
    )
    expect(binding).toEqual({
      dataset: dataset.id,
      field: 'customer',
      role: 'detail',
      aggregate: 'select',
      expand: 'down',
      leftParent: 'default',
      sort: 'none',
      conditionalRules: []
    })
    expect(designer.boundKeys.value.has(`${dataset.id}:customer`)).toBe(true)
  })

  it('分组锚点（首列第二行）落格推导为 group 角色；同行右侧落格继承分组数据集', async () => {
    const { designer, workbook } = createDesigner([MYSQL, PG])
    const orders = await seedDataset(designer, 'c1')
    const inventory = await seedDataset(designer, 'c2')

    // 分组锚点：B2（row 1, col 0）
    designer.bindField(orders.id, 'customer', { row: 1, col: 0 })
    const group = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 1, col: 0 },
      REPORT_META_NAMESPACE
    )
    expect(group).toMatchObject({ role: 'group', aggregate: 'group', leftParent: 'none' })

    // 同行右侧落格（另一数据集的字段）继承分组数据集
    designer.bindField(inventory.id, 'amount', { row: 1, col: 1 })
    const detail = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 1, col: 1 },
      REPORT_META_NAMESPACE
    )
    expect(detail).toMatchObject({ dataset: orders.id, field: 'amount', role: 'detail' })
  })

  it('未给落点地址时回退到当前选区', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedDataset(designer)
    workbook.activeSheet.selectCell({ row: 3, col: 2 })

    designer.bindField(dataset.id, 'amount')
    expect(workbook.activeSheet.getCellMeta({ row: 3, col: 2 }, REPORT_META_NAMESPACE)).toBeTruthy()
  })
})

describe('useReportDesigner：角色徽章渲染 hook（ADR-0004 首个消费者）', () => {
  it('绑定格返回徽章布局（renderDefault: false），未绑定格回落默认渲染', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, { sql: 'SELECT customer FROM orders' })
    await designer.describeDataset(dataset.id)
    designer.bindField(dataset.id, 'customer', { row: 0, col: 0 })

    expect(designer.resolveCellRenderer({ row: 0, col: 1 }, undefined)).toBeUndefined()

    const layout = designer.resolveCellRenderer({ row: 0, col: 0 }, undefined)
    expect(layout).toBeTruthy()
    expect(layout!.renderDefault).toBe(false)
    expect(layout!.rootContainer).toBeTruthy()

    // 模型与快照无 renderer 残留
    expect(workbook.activeSheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
  })
})

describe('useReportDesigner：getTemplate', () => {
  it('返回含 meta 绑定与内嵌数据集定义的 Report Template', async () => {
    const { designer } = createDesigner([MYSQL, PG])
    const orders = designer.addDataset('c1')
    designer.updateDataset(orders.id, {
      label: '销售明细',
      sql: 'SELECT customer FROM orders WHERE customer LIKE ${keyword}',
      paramOverrides: { keyword: { label: '客户关键词' } },
      fieldOverrides: { customer: { label: '客户名称' } }
    })
    await designer.describeDataset(orders.id)
    designer.bindField(orders.id, 'customer', { row: 1, col: 0 })

    const template = designer.getTemplate()

    // meta 绑定随快照吐出
    const meta = template.meta ?? []
    expect(meta).toHaveLength(1)
    expect(meta[0]).toMatchObject({ row: 1, col: 0, namespace: 'report' })
    expect((meta[0]!.payload as ReportBinding).field).toBe('customer')

    // 数据集内嵌连接对象（无 connectionId / fields 缓存泄漏）
    expect(template.datasets).toHaveLength(1)
    const dataset = template.datasets![0]!
    expect(dataset).toEqual({
      id: orders.id,
      label: '销售明细',
      connection: MYSQL,
      sql: 'SELECT customer FROM orders WHERE customer LIKE ${keyword}',
      paramOverrides: { keyword: { label: '客户关键词' } },
      fieldOverrides: { customer: { label: '客户名称' } }
    })
    expect(dataset.connection).not.toBe(MYSQL)
  })

  it('无匹配连接的数据集不吐出（凭据不悬空）', () => {
    const { designer } = createDesigner([MYSQL])
    const orphan = designer.addDataset('c-missing')
    designer.updateDataset(orphan.id, { sql: 'SELECT 1' })

    expect(designer.getTemplate().datasets).toEqual([])
  })
})
