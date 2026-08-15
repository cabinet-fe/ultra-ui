import { Workbook } from '@veltra/sheet-core'
import { describe, expect, it } from 'vitest'
import { effectScope, ref, type EffectScope, type Ref } from 'vue'

import { REPORT_META_NAMESPACE } from '../../../report/binding'
import type { DataConnection, DataConnector } from '../../../report/connector'
import { IncompatibleTemplateVersionError, type ReportTemplate } from '../../../report/template'
import type { DatasetField, ParamValues, ReportBinding } from '../../../report/types'
import { roleBindingDefaults } from '../designer/role'
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
  { name: 'orderNo', label: '订单号', type: 'string' },
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

function createDesigner(
  initial: DataConnection[] = [MYSQL],
  options?: { template?: ReportTemplate }
): DesignerFixture {
  const { connector, calls } = createStubConnector()
  const connections = ref<DataConnection[]>(initial)
  const workbook = new Workbook()
  const scope = effectScope()
  const designer = scope.run(() =>
    useReportDesigner({ props: { connector, workbook, template: options?.template }, connections })
  )!
  return { scope, designer, connections, workbook, calls }
}

function bindGroupHeader(
  designer: UseReportDesignerReturn,
  workbook: Workbook,
  datasetId: string,
  addr: { row: number; col: number },
  field = 'customer'
): void {
  designer.bindField(datasetId, field, addr)
  workbook.activeSheet.selectCell(addr)
  designer.patchActiveBinding(roleBindingDefaults('groupHeader'))
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
    expect(catalog[0]!.fields.map((field) => field.label)).toEqual(['客户名称', '订单号', '金额'])
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

  it('落格写入 createReportBinding 默认绑定（detail/list/down）', async () => {
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
      aggregate: 'list',
      expand: 'down',
      preset: 'detail',
      sort: 'none',
      conditionalRules: []
    })
    expect(designer.boundKeys.value.has(`${dataset.id}:customer`)).toBe(true)
  })

  it('同列向上推断 rowParent 候选', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedDataset(designer)

    designer.bindField(dataset.id, 'customer', { row: 1, col: 0 })
    designer.bindField(dataset.id, 'orderNo', { row: 2, col: 0 })

    const detail = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 2, col: 0 },
      REPORT_META_NAMESPACE
    )
    expect(detail).toMatchObject({
      dataset: dataset.id,
      field: 'orderNo',
      preset: 'detail',
      aggregate: 'list',
      expand: 'down',
      rowParent: { row: 1, col: 0 }
    })
  })

  it('跨数据集拖拽保留字段自己的 dataset，不继承分组数据集', async () => {
    const { designer, workbook } = createDesigner([MYSQL, PG])
    const orders = await seedDataset(designer, 'c1')
    const inventory = await seedDataset(designer, 'c2')

    designer.bindField(orders.id, 'customer', { row: 1, col: 0 })
    designer.bindField(inventory.id, 'orderNo', { row: 2, col: 0 })

    const detail = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 2, col: 0 },
      REPORT_META_NAMESPACE
    )
    expect(detail).toMatchObject({
      dataset: inventory.id,
      field: 'orderNo',
      rowParent: { row: 1, col: 0 }
    })
  })

  it('数值字段落至展开带下方相邻行时推断为小计预设', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedDataset(designer)

    bindGroupHeader(designer, workbook, dataset.id, { row: 1, col: 0 })
    designer.bindField(dataset.id, 'amount', { row: 2, col: 0 })

    const subtotal = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 2, col: 0 },
      REPORT_META_NAMESPACE
    )
    expect(subtotal).toMatchObject({
      preset: 'subtotal',
      aggregate: 'sum',
      expand: 'none',
      rowParent: { row: 1, col: 0 }
    })
  })

  it('同行明细落格把 rowParent 推到左侧分组头', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedDataset(designer)

    bindGroupHeader(designer, workbook, dataset.id, { row: 1, col: 0 })
    designer.bindField(dataset.id, 'orderNo', { row: 1, col: 2 })

    const detail = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 1, col: 2 },
      REPORT_META_NAMESPACE
    )
    expect(detail).toMatchObject({
      field: 'orderNo',
      preset: 'detail',
      rowParent: { row: 1, col: 0 }
    })
  })

  it('下方跨列小计落格推到行分组头而不是同列 list', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedDataset(designer)

    bindGroupHeader(designer, workbook, dataset.id, { row: 1, col: 0 })
    designer.bindField(dataset.id, 'orderNo', { row: 1, col: 2 })
    designer.bindField(dataset.id, 'amount', { row: 2, col: 2 })

    const subtotal = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 2, col: 2 },
      REPORT_META_NAMESPACE
    )
    expect(subtotal).toMatchObject({
      preset: 'subtotal',
      aggregate: 'sum',
      expand: 'none',
      rowParent: { row: 1, col: 0 }
    })
    expect(subtotal?.colParent).toBeUndefined()
  })

  it('右侧列小计落格推到列分组头', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedDataset(designer)

    designer.bindField(dataset.id, 'customer', { row: 0, col: 1 })
    workbook.activeSheet.selectCell({ row: 0, col: 1 })
    designer.patchActiveBinding({ preset: 'groupHeader', aggregate: 'group', expand: 'right' })
    designer.bindField(dataset.id, 'amount', { row: 0, col: 2 })

    const subtotal = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 0, col: 2 },
      REPORT_META_NAMESPACE
    )
    expect(subtotal).toMatchObject({
      preset: 'subtotal',
      aggregate: 'sum',
      expand: 'none',
      colParent: { row: 0, col: 1 }
    })
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
    // 根容器不得挂 percentCalc 宽高（VTable 会与 cellSize Math.max 出 NaN）
    expect(layout!.rootContainer.attribute.width).toBeUndefined()
    expect(layout!.rootContainer.attribute.height).toBeUndefined()
    expect(layout!.rootContainer.attribute.fill).toBeUndefined()

    const style = designer.resolveCellStyle({ row: 0, col: 0 }, undefined)
    expect(style?.fill).toEqual({ color: '#d1fae5' })

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

    expect(template.version).toBe(1)

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

describe('useReportDesigner：Action Pill 就地编辑（角色 / 聚合 / 条件规则 / 清除绑定）', () => {
  async function seedAndBind(
    designer: UseReportDesignerReturn,
    addr: { row: number; col: number }
  ) {
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, { sql: 'SELECT customer, amount FROM orders' })
    await designer.describeDataset(dataset.id)
    designer.bindField(dataset.id, 'amount', addr)
    return dataset
  }

  it('预设切换写入 presetBindingDefaults 组合值；同族聚合切换保留预设', async () => {
    const { designer, workbook } = createDesigner()
    await seedAndBind(designer, { row: 0, col: 0 })
    workbook.activeSheet.selectCell({ row: 0, col: 0 })

    designer.patchActiveBinding(roleBindingDefaults('subtotal'))
    let binding = designer.activeBinding.value
    expect(binding).toMatchObject({ preset: 'subtotal', aggregate: 'sum', expand: 'none' })

    designer.patchActiveBinding({ aggregate: 'avg', expand: 'none' })
    binding = designer.activeBinding.value
    expect(binding).toMatchObject({ preset: 'subtotal', aggregate: 'avg', expand: 'none' })
  })

  it('聚合/展开偏离预设族时清除 preset', async () => {
    const { designer, workbook } = createDesigner()
    await seedAndBind(designer, { row: 0, col: 0 })
    workbook.activeSheet.selectCell({ row: 0, col: 0 })

    designer.patchActiveBinding(roleBindingDefaults('subtotal'))
    designer.patchActiveBinding({ aggregate: 'list', expand: 'down' })
    expect(designer.activeBinding.value?.preset).toBeUndefined()
  })

  it('条件规则与排序经 patch 写入绑定；拓扑条目跟随 meta 变更', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = await seedAndBind(designer, { row: 0, col: 0 })
    workbook.activeSheet.selectCell({ row: 0, col: 0 })

    designer.patchActiveBinding({
      sort: 'desc',
      conditionalRules: [{ operator: 'gt', value: 100, style: { font: { color: '#DC2626' } } }]
    })

    const binding = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 0, col: 0 },
      REPORT_META_NAMESPACE
    )
    expect(binding?.sort).toBe('desc')
    expect(binding?.conditionalRules).toHaveLength(1)

    const entries = designer.bindingEntries.value
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ addr: { row: 0, col: 0 }, binding: { dataset: dataset.id } })
  })

  it('点选式父格编辑写入模板存储的 rowParent', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, { sql: 'SELECT customer, amount FROM orders' })
    await designer.describeDataset(dataset.id)

    designer.bindField(dataset.id, 'customer', { row: 1, col: 0 })
    designer.bindField(dataset.id, 'amount', { row: 2, col: 1 })

    workbook.activeSheet.selectCell({ row: 1, col: 0 })
    designer.patchActiveBinding(roleBindingDefaults('groupHeader'))
    workbook.activeSheet.selectCell({ row: 2, col: 1 })
    designer.startParentPick('row')
    designer.pickParentAt({ row: 1, col: 0 })

    const binding = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 2, col: 1 },
      REPORT_META_NAMESPACE
    )
    expect(binding?.rowParent).toEqual({ row: 1, col: 0 })
    expect(designer.parentPick.value).toBeNull()
  })

  it('切换小计行时纠正指向 list 的父格', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, { sql: 'SELECT customer, amount FROM orders' })
    await designer.describeDataset(dataset.id)

    designer.bindField(dataset.id, 'customer', { row: 1, col: 0 })
    workbook.activeSheet.selectCell({ row: 1, col: 0 })
    designer.patchActiveBinding(roleBindingDefaults('groupHeader'))
    designer.bindField(dataset.id, 'orderNo', { row: 1, col: 2 })
    designer.bindField(dataset.id, 'amount', { row: 2, col: 2 })

    workbook.activeSheet.selectCell({ row: 2, col: 2 })
    designer.patchActiveBinding({ rowParent: { row: 1, col: 2 } })
    expect(designer.activeBinding.value?.rowParent).toEqual({ row: 1, col: 2 })

    designer.patchActiveBinding(roleBindingDefaults('subtotal'))
    expect(designer.activeBinding.value).toMatchObject({
      preset: 'subtotal',
      rowParent: { row: 1, col: 0 }
    })
  })

  it('非法点选父格时选区弹回源格且保持拾取态', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, { sql: 'SELECT customer, amount FROM orders' })
    await designer.describeDataset(dataset.id)

    designer.bindField(dataset.id, 'customer', { row: 1, col: 0 })
    workbook.activeSheet.selectCell({ row: 1, col: 0 })
    designer.patchActiveBinding(roleBindingDefaults('groupHeader'))
    designer.bindField(dataset.id, 'amount', { row: 2, col: 2 })

    workbook.activeSheet.selectCell({ row: 2, col: 2 })
    designer.startParentPick('row')
    designer.pickParentAt({ row: 0, col: 3 })

    expect(designer.parentPick.value).toEqual({ mode: 'row', source: { row: 2, col: 2 } })
    expect(workbook.activeSheet.getSelection().activeCell).toEqual({ row: 2, col: 2 })
    expect(
      workbook.activeSheet.getCellMeta<ReportBinding>({ row: 2, col: 2 }, REPORT_META_NAMESPACE)
        ?.rowParent
    ).toEqual({ row: 1, col: 0 })
  })

  it('清除绑定移除 Cell Meta；行 / 列方向父格标签读取绑定存储值', async () => {
    const { designer, workbook } = createDesigner()
    const dataset = designer.addDataset('c1')
    designer.updateDataset(dataset.id, { sql: 'SELECT customer, amount FROM orders' })
    await designer.describeDataset(dataset.id)

    // 同列上方分组头 + 下方小计（rowParent 推断到分组头）
    designer.bindField(dataset.id, 'customer', { row: 1, col: 0 })
    workbook.activeSheet.selectCell({ row: 1, col: 0 })
    designer.patchActiveBinding(roleBindingDefaults('groupHeader'))
    designer.bindField(dataset.id, 'amount', { row: 2, col: 0 })

    workbook.activeSheet.selectCell({ row: 2, col: 0 })
    expect(designer.resolvedRowParentLabel.value).toBe('A2')

    designer.removeActiveBinding()
    expect(
      workbook.activeSheet.getCellMeta({ row: 2, col: 0 }, REPORT_META_NAMESPACE)
    ).toBeUndefined()
    expect(designer.activeBinding.value).toBeUndefined()
    expect(designer.boundKeys.value.has(`${dataset.id}:amount`)).toBe(false)
  })
})

describe('useReportDesigner：template 版本校验', () => {
  it('载入缺少 version 的模板时抛可读错误', () => {
    const { connector } = createStubConnector()
    const connections = ref<DataConnection[]>([MYSQL])
    expect(() =>
      effectScope().run(() =>
        useReportDesigner({
          props: {
            connector,
            template: {
              cells: [],
              styles: [],
              merges: [],
              frozen: { rows: 0, cols: 0 },
              rows: 24,
              cols: 10
            }
          },
          connections
        })
      )
    ).toThrow(IncompatibleTemplateVersionError)
  })

  it('载入高于当前支持 version 的模板时抛可读错误', () => {
    const { connector } = createStubConnector()
    const connections = ref<DataConnection[]>([MYSQL])
    expect(() =>
      effectScope().run(() =>
        useReportDesigner({
          props: {
            connector,
            template: {
              version: 99,
              cells: [],
              styles: [],
              merges: [],
              frozen: { rows: 0, cols: 0 },
              rows: 24,
              cols: 10
            }
          },
          connections
        })
      )
    ).toThrow(/高于当前支持/)
  })
})

describe('useReportDesigner：template prop 载入既有模板', () => {
  function buildTemplate(): ReportTemplate {
    const group = createReportBindingFixture()
    return {
      version: 1,
      cells: [{ row: 0, col: 0, v: '客户' }],
      styles: [],
      merges: [],
      frozen: { rows: 0, cols: 0 },
      rows: 24,
      cols: 10,
      meta: [{ row: 1, col: 0, namespace: REPORT_META_NAMESPACE, payload: group }],
      datasets: [
        {
          id: 'ds-template',
          label: '模板数据集',
          connection: { ...PG, id: 'conn-template' },
          sql: 'SELECT customer, amount FROM orders',
          paramOverrides: { keyword: { label: '客户关键词' } },
          fieldOverrides: { customer: { label: '客户名称' } }
        }
      ]
    }
  }

  function createReportBindingFixture(): ReportBinding {
    return {
      dataset: 'ds-template',
      field: 'customer',
      preset: 'groupHeader',
      aggregate: 'group',
      expand: 'down',
      sort: 'none',
      conditionalRules: [{ operator: 'eq', value: '甲公司', style: { fill: { color: '#FFCCCC' } } }]
    }
  }

  it('恢复网格绑定与设计态数据集；内嵌连接按 id 合并进 v-model 列表；describe 恢复字段缓存', async () => {
    const { designer, connections, workbook, calls } = createDesigner([MYSQL], {
      template: buildTemplate()
    })

    // 绑定随快照恢复（含条件规则）
    const binding = workbook.activeSheet.getCellMeta<ReportBinding>(
      { row: 1, col: 0 },
      REPORT_META_NAMESPACE
    )
    expect(binding).toEqual(createReportBindingFixture())

    // 数据集还原为设计态（connectionId 引用；fields 缓存经 describe 恢复）
    expect(designer.datasets.value).toHaveLength(1)
    expect(designer.datasets.value[0]).toMatchObject({
      id: 'ds-template',
      label: '模板数据集',
      connectionId: 'conn-template',
      sql: 'SELECT customer, amount FROM orders'
    })
    await Promise.resolve()
    expect(calls.describe).toHaveLength(1)
    expect(calls.describe[0]!.connection.id).toBe('conn-template')

    // 内嵌连接按 id 合并（已有连接不重复追加）
    expect(connections.value.map((item) => item.id)).toEqual(['c1', 'conn-template'])

    // catalog 应用 fieldOverrides（字段面板与徽章 label 数据源）
    const catalog = designer.catalog.value
    expect(catalog[0]!.fields.map((field) => field.label)).toEqual(['客户名称', '订单号', '金额'])
  })

  it('载入后 getTemplate 往返保持绑定与数据集定义；宿主已有同 id 连接时不覆盖', async () => {
    const template = buildTemplate()
    const { designer } = createDesigner(
      [MYSQL, { ...PG, id: 'conn-template', label: '宿主连接' }],
      { template }
    )

    // 宿主同 id 连接优先（单一事实源），模板内嵌连接不覆盖
    const roundTrip = designer.getTemplate()
    expect(roundTrip.datasets).toHaveLength(1)
    expect(roundTrip.datasets![0]!.connection.label).toBe('宿主连接')

    // 绑定完整往返
    const meta = roundTrip.meta ?? []
    expect(meta).toHaveLength(1)
    expect(meta[0]!.payload).toEqual(createReportBindingFixture())
  })
})
