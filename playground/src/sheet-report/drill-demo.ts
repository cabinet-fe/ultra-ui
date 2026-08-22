import {
  REPORT_META_NAMESPACE,
  createReportTemplate,
  type DataConnection,
  type ReportBinding,
  type ReportDatasetDef,
  type ReportTemplate,
  type ReportTemplateListItem
} from '@veltra/sheet'
import { Sheet } from '@veltra/sheet-core'

import {
  createReportTemplateRecord,
  listReportTemplates,
  saveWorkspace,
  type ReportTemplateSummary,
  type WorkspaceData,
  type WorkspaceDataset
} from './report-api'

/** 演示模板名称（按名幂等创建，已存在则不覆盖） */
export const DRILL_DEMO_SUMMARY_NAME = '【演示】地区汇总'
export const DRILL_DEMO_DETAIL_NAME = '【演示】订单明细'
export const DRILL_DEMO_CUSTOMER_NAME = '【演示】客户订单'

const SUMMARY_DS = 'drill-demo-region-summary'
const ORDERS_DS = 'drill-demo-orders-by-region'
const CUSTOMER_DS = 'drill-demo-orders-by-customer'

const SUMMARY_SQL = 'SELECT region, SUM(amount) AS total FROM orders GROUP BY region'
const ORDERS_SQL = `SELECT customer, order_no AS orderNo, region, amount, order_date AS orderDate
FROM orders
WHERE \${p_region} = '' OR region = \${p_region}`
const CUSTOMER_SQL = `SELECT customer, order_no AS orderNo, region, amount, order_date AS orderDate
FROM orders
WHERE \${p_customer} = '' OR customer = \${p_customer}`

export interface DrillDemoRefs {
  detailRef: string
  customerRef: string
}

function datasetDef(
  connection: DataConnection,
  id: string,
  label: string,
  sql: string,
  paramOverrides?: ReportDatasetDef['paramOverrides']
): ReportDatasetDef {
  return {
    id,
    label,
    connection: { ...connection },
    sql,
    ...(paramOverrides ? { paramOverrides } : {})
  }
}

function bind(partial: ReportBinding): ReportBinding {
  return { sort: 'none', conditionalRules: [], ...partial }
}

function snapshotTemplate(sheet: Sheet, datasets: ReportDatasetDef[]): ReportTemplate {
  sheet.ensureTableSize(24, 10)
  return createReportTemplate(sheet.snapshot(), datasets)
}

/** 地区汇总：地区格页内切换下钻，总额格弹框下钻，均指向订单明细 */
export function buildRegionSummaryTemplate(
  connection: DataConnection,
  refs: Pick<DrillDemoRefs, 'detailRef'>
): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '地区' } },
    { addr: { row: 0, col: 1 }, data: { v: '总额' } }
  ])
  sheet.setCellMeta(
    { row: 1, col: 0 },
    REPORT_META_NAMESPACE,
    bind({
      dataset: SUMMARY_DS,
      field: 'region',
      aggregate: 'group',
      expand: 'down',
      preset: 'groupHeader',
      drill: { target: refs.detailRef, mapping: { region: 'p_region' }, openMode: 'switch' }
    })
  )
  sheet.setCellMeta(
    { row: 1, col: 1 },
    REPORT_META_NAMESPACE,
    bind({
      dataset: SUMMARY_DS,
      field: 'total',
      aggregate: 'sum',
      expand: 'none',
      preset: 'subtotal',
      rowParent: { row: 1, col: 0 },
      drill: { target: refs.detailRef, mapping: { region: 'p_region' }, openMode: 'dialog' }
    })
  )
  return snapshotTemplate(sheet, [datasetDef(connection, SUMMARY_DS, '地区汇总', SUMMARY_SQL)])
}

/** 订单明细：按地区过滤；客户列继续下钻到客户订单（页内切换） */
export function buildOrderDetailTemplate(
  connection: DataConnection,
  refs: Pick<DrillDemoRefs, 'customerRef'>
): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '订单号' } },
    { addr: { row: 0, col: 2 }, data: { v: '金额' } }
  ])
  sheet.setCellMeta(
    { row: 1, col: 0 },
    REPORT_META_NAMESPACE,
    bind({
      dataset: ORDERS_DS,
      field: 'customer',
      aggregate: 'list',
      expand: 'down',
      preset: 'detail',
      drill: { target: refs.customerRef, mapping: { customer: 'p_customer' }, openMode: 'switch' }
    })
  )
  sheet.setCellMeta(
    { row: 1, col: 1 },
    REPORT_META_NAMESPACE,
    bind({
      dataset: ORDERS_DS,
      field: 'orderNo',
      aggregate: 'list',
      expand: 'down',
      preset: 'detail'
    })
  )
  sheet.setCellMeta(
    { row: 1, col: 2 },
    REPORT_META_NAMESPACE,
    bind({
      dataset: ORDERS_DS,
      field: 'amount',
      aggregate: 'list',
      expand: 'down',
      preset: 'detail'
    })
  )
  return snapshotTemplate(sheet, [
    datasetDef(connection, ORDERS_DS, '订单明细', ORDERS_SQL, {
      p_region: { label: '地区', defaultValue: '' }
    })
  ])
}

/** 客户订单：按客户过滤，不再下钻 */
export function buildCustomerOrderTemplate(connection: DataConnection): ReportTemplate {
  const sheet = new Sheet()
  sheet.setCells([
    { addr: { row: 0, col: 0 }, data: { v: '客户' } },
    { addr: { row: 0, col: 1 }, data: { v: '订单号' } },
    { addr: { row: 0, col: 2 }, data: { v: '金额' } }
  ])
  const detail = (field: string): ReportBinding =>
    bind({ dataset: CUSTOMER_DS, field, aggregate: 'list', expand: 'down', preset: 'detail' })
  sheet.setCellMeta({ row: 1, col: 0 }, REPORT_META_NAMESPACE, detail('customer'))
  sheet.setCellMeta({ row: 1, col: 1 }, REPORT_META_NAMESPACE, detail('orderNo'))
  sheet.setCellMeta({ row: 1, col: 2 }, REPORT_META_NAMESPACE, detail('amount'))
  return snapshotTemplate(sheet, [
    datasetDef(connection, CUSTOMER_DS, '客户订单', CUSTOMER_SQL, {
      p_customer: { label: '客户', defaultValue: '' }
    })
  ])
}

function demoDatasets(connectionId: string): WorkspaceDataset[] {
  return [
    { id: SUMMARY_DS, connectionId, label: '地区汇总', sql: SUMMARY_SQL },
    {
      id: ORDERS_DS,
      connectionId,
      label: '订单明细',
      sql: ORDERS_SQL,
      paramOverrides: { p_region: { label: '地区', defaultValue: '' } }
    },
    {
      id: CUSTOMER_DS,
      connectionId,
      label: '客户订单',
      sql: CUSTOMER_SQL,
      paramOverrides: { p_customer: { label: '客户', defaultValue: '' } }
    }
  ]
}

/** 把演示数据集并入工作区（已有同 id 则保留） */
export function mergeDemoDatasets(
  workspace: WorkspaceData,
  connectionId: string
): { workspace: WorkspaceData; changed: boolean } {
  const byId = new Map(workspace.datasets.map((item) => [item.id, item]))
  let changed = false
  for (const dataset of demoDatasets(connectionId)) {
    if (byId.has(dataset.id)) continue
    byId.set(dataset.id, dataset)
    changed = true
  }
  if (!changed) return { workspace, changed: false }
  return { workspace: { ...workspace, datasets: [...byId.values()] }, changed: true }
}

export interface EnsureDrillDemoResult {
  workspace: WorkspaceData
  createdNames: string[]
}

/**
 * 工作区已有连接时，幂等准备主表 / 详情 / 客户订单三份演示模板。
 * 已存在同名模板不覆盖（避免冲掉用户改过的演示稿）。
 */
export async function ensureDrillDemoTemplates(
  workspace: WorkspaceData,
  templates: ReportTemplateSummary[] = []
): Promise<EnsureDrillDemoResult> {
  const connection = workspace.connections[0]
  if (!connection) return { workspace, createdNames: [] }

  const merged = mergeDemoDatasets(workspace, connection.id)
  if (merged.changed) await saveWorkspace(merged.workspace)

  const byName = new Map(templates.map((item) => [item.name, item]))
  const createdNames: string[] = []

  async function ensure(name: string, build: () => ReportTemplate): Promise<ReportTemplateSummary> {
    const existing = byName.get(name)
    if (existing) return existing
    const record = await createReportTemplateRecord(name, build())
    const summary: ReportTemplateSummary = {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
    byName.set(name, summary)
    createdNames.push(name)
    return summary
  }

  const customer = await ensure(DRILL_DEMO_CUSTOMER_NAME, () =>
    buildCustomerOrderTemplate(connection)
  )
  const detail = await ensure(DRILL_DEMO_DETAIL_NAME, () =>
    buildOrderDetailTemplate(connection, { customerRef: customer.id })
  )
  await ensure(DRILL_DEMO_SUMMARY_NAME, () =>
    buildRegionSummaryTemplate(connection, { detailRef: detail.id })
  )

  return { workspace: merged.workspace, createdNames }
}

/** 有连接时把演示数据集并入工作区（不写库） */
export function withDemoDatasets(workspace: WorkspaceData): WorkspaceData {
  const connectionId = workspace.connections[0]?.id
  if (!connectionId) return workspace
  return mergeDemoDatasets(workspace, connectionId).workspace
}

/** 有连接时把演示数据集并入工作区；有新增则写回 `/workspace` */
export async function syncDemoWorkspace(workspace: WorkspaceData): Promise<WorkspaceData> {
  const connectionId = workspace.connections[0]?.id
  if (!connectionId) return workspace
  const merged = mergeDemoDatasets(workspace, connectionId)
  if (merged.changed) await saveWorkspace(merged.workspace)
  return merged.workspace
}

export function toDrillTemplates(items: ReportTemplateSummary[]): ReportTemplateListItem[] {
  return items.map((item) => ({ ref: item.id, label: item.name }))
}

/** 启动时准备演示模板 + 模板列表（失败不抛，保留当前工作区） */
export async function prepareDrillHost(
  workspace: WorkspaceData
): Promise<{ workspace: WorkspaceData; drillTemplates: ReportTemplateListItem[] }> {
  const listed = await listReportTemplates().catch(() => [] as ReportTemplateSummary[])
  let next = workspace
  try {
    next = (await ensureDrillDemoTemplates(workspace, listed)).workspace
  } catch {
    next = withDemoDatasets(workspace)
  }
  const items = await listReportTemplates().catch(() => listed)
  return { workspace: next, drillTemplates: toDrillTemplates(items) }
}
