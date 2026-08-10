import type { CellAddress } from '@veltra/sheet-core'
import type { ResolveCellRenderer } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'

import {
  REPORT_META_NAMESPACE,
  createReportBinding,
  formatCellAddress,
  resolveReportRole
} from '../../report/binding'
import type { DataConnection, QueryResult, Result } from '../../report/connector'
import { buildParamDefs } from '../../report/params'
import {
  resolveParamDefaults,
  type ReportDatasetDef,
  type ReportTemplate
} from '../../report/template'
import type { DatasetCatalogItem, DatasetField, ReportBinding } from '../../report/types'
import type { ReportDesignerProps } from '../../types'
import { createBindingBadgeRenderer } from './binding-badge'

/**
 * 设计器内部数据集：以 `connectionId` 引用连接（连接列表经 `v-model:connections`
 * 注入，是单一事实源）；`getTemplate()` 吐出模板时解析为内嵌连接对象（`ReportDatasetDef`）。
 */
export interface DesignerDataset {
  id: string
  label: string
  connectionId: string
  sql: string
  /** 参数元数据覆盖（label / 类型 / 默认值 / 选项） */
  paramOverrides?: ReportDatasetDef['paramOverrides']
  /** 字段中文名覆盖（name → label） */
  fieldOverrides?: ReportDatasetDef['fieldOverrides']
  /** describe 解析的字段缓存（字段面板 catalog 的数据源；fieldOverrides 在 catalog 层应用） */
  fields?: DatasetField[]
}

/** 数据中枢 drawer 的消费面（`UseReportDesignerReturn` 的子集） */
export interface DatasetHubController {
  connections: Ref<DataConnection[]>
  datasets: Ref<DesignerDataset[]>
  addConnection: (connection: DataConnection) => void
  updateConnection: (connection: DataConnection) => void
  /** 删除连接并级联删除其数据集 */
  removeConnection: (connectionId: string) => void
  addDataset: (connectionId: string) => DesignerDataset
  updateDataset: (datasetId: string, patch: Partial<Omit<DesignerDataset, 'id'>>) => void
  removeDataset: (datasetId: string) => void
  /** 真实测试连接（契约无状态，新建草稿同样可测） */
  testConnection: (connection: DataConnection) => Promise<Result<void>>
  /** 经连接器 describe 解析字段并写入数据集字段缓存 */
  describeDataset: (datasetId: string) => Promise<Result<DatasetField[]>>
  /** 按参数默认值经连接器取数（数据集记录预览） */
  previewDataset: (datasetId: string) => Promise<Result<QueryResult>>
}

export interface UseReportDesignerReturn extends DatasetHubController {
  workbook: ComputedRef<Workbook>
  /** 字段面板目录（数据集 + 应用 fieldOverrides 后的字段 label） */
  catalog: ComputedRef<DatasetCatalogItem[]>
  /** 已绑定字段键集合：`${datasetId}:${fieldName}` */
  boundKeys: ComputedRef<Set<string>>
  /** 当前选区地址（跟随模型 selection-change） */
  activeCell: Ref<CellAddress | null>
  /** 当前选区 A1 标签 */
  selectionLabel: ComputedRef<string>
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
  /** 拖拽/点击落格写 Cell Meta 绑定（角色推导与 playground 设计器一致） */
  bindField: (datasetId: string, fieldName: string, addr?: CellAddress) => void
  /** 绑定格角色徽章渲染 hook（ADR-0004） */
  resolveCellRenderer: ResolveCellRenderer
  /** 取回含 meta 绑定与内嵌数据集定义的 Report Template */
  getTemplate: () => ReportTemplate
}

export interface UseReportDesignerOptions {
  props: ReportDesignerProps
  /** `v-model:connections` 可写代理（get 读 props，set 触发 `update:connections`） */
  connections: Ref<DataConnection[]>
}

/**
 * UReportDesigner 的 headless 编排：连接 / 数据集状态、绑定写 Cell Meta、
 * 角色徽章渲染 hook、`getTemplate()` 模板吐出。不持有 DOM / 网格引用。
 */
export function useReportDesigner(options: UseReportDesignerOptions): UseReportDesignerReturn {
  const { props, connections } = options

  /** 设计态工作簿：宿主可注入（USheet / UReportViewer 先例），缺省内部自建 */
  const internalWorkbook = new Workbook()
  const workbook = computed(() => props.workbook ?? internalWorkbook)

  const datasets = ref<DesignerDataset[]>([])

  /** meta 变更计数：boundKeys 等派生状态的响应式触发（绑定经命令系统写入后由模型发 meta-change） */
  const metaTick = ref(0)
  const offMeta = workbook.value.activeSheet.on('meta-change', () => {
    metaTick.value++
  })
  onScopeDispose(offMeta)

  /** 稳定选区地址引用（值未变时不替换对象，避免触发下游 watcher） */
  const activeCell = ref<CellAddress | null>(null)
  function syncActiveCell(): void {
    const next = workbook.value.activeSheet.getSelection().activeCell ?? null
    const prev = activeCell.value
    if (!next) {
      activeCell.value = null
      return
    }
    if (prev && prev.row === next.row && prev.col === next.col) return
    activeCell.value = { row: next.row, col: next.col }
  }
  const offSelection = workbook.value.activeSheet.on('selection-change', syncActiveCell)
  onScopeDispose(offSelection)
  syncActiveCell()

  const selectionLabel = computed(() =>
    activeCell.value ? formatCellAddress(activeCell.value) : '—'
  )

  const catalog = computed((): DatasetCatalogItem[] =>
    datasets.value.map((dataset) => ({
      id: dataset.id,
      label: dataset.label,
      fields: (dataset.fields ?? []).map((field) => ({
        ...field,
        label: dataset.fieldOverrides?.[field.name]?.label ?? field.label
      }))
    }))
  )

  /** 字段 label 的 O(1) 查找表（徽章 hook 性能契约） */
  const fieldLabelMap = computed(() => {
    const map = new Map<string, string>()
    for (const dataset of catalog.value) {
      for (const field of dataset.fields) map.set(`${dataset.id}:${field.name}`, field.label)
    }
    return map
  })

  function resolveFieldLabel(datasetId: string, fieldName: string): string {
    return fieldLabelMap.value.get(`${datasetId}:${fieldName}`) ?? fieldName
  }

  const boundKeys = computed(() => {
    metaTick.value
    const keys = new Set<string>()
    for (const [, namespace, payload] of workbook.value.activeSheet.entriesCellMeta()) {
      if (namespace !== REPORT_META_NAMESPACE) continue
      const binding = payload as ReportBinding
      keys.add(`${binding.dataset}:${binding.field}`)
    }
    return keys
  })

  function getBindingAt(addr: CellAddress): ReportBinding | undefined {
    return workbook.value.activeSheet.getCellMeta<ReportBinding>(addr, REPORT_META_NAMESPACE)
  }

  /**
   * 分组锚点约定（playground 设计器平移，行为不变）：首列第二行始终视为分组锚点；
   * 已持有「分组 + 无左父格」绑定的格保持锚点语义
   */
  function isGroupAnchorCell(addr: CellAddress, binding?: ReportBinding): boolean {
    if (addr.row === 1 && addr.col === 0) return true
    if (!binding) return false
    return resolveReportRole(binding) === 'group' && binding.leftParent === 'none'
  }

  /** 同行向左找最近分组绑定，命中则继承其数据集（同扩展带数据集继承） */
  function resolveParentGroupDataset(addr: CellAddress): string | undefined {
    for (let col = addr.col - 1; col >= 0; col--) {
      const binding = getBindingAt({ row: addr.row, col })
      if (!binding) continue
      if (resolveReportRole(binding) === 'group') return binding.dataset
    }
    return undefined
  }

  function bindField(datasetId: string, fieldName: string, addr?: CellAddress): void {
    const dataset = catalog.value.find((item) => item.id === datasetId)
    if (!dataset) return

    const target = addr ?? workbook.value.activeSheet.getSelection().activeCell
    if (!target) return

    const binding = createReportBinding(dataset, fieldName)
    const existing = getBindingAt(target)
    if (isGroupAnchorCell(target, existing)) {
      binding.aggregate = 'group'
      binding.leftParent = 'none'
      binding.role = 'group'
    }

    const parentDataset = resolveParentGroupDataset(target)
    if (parentDataset) binding.dataset = parentDataset

    workbook.value.activeSheet.setCellMeta(target, REPORT_META_NAMESPACE, binding)
  }

  // ---- 数据中枢：连接 / 数据集 CRUD 与连接器调用 ----

  function addConnection(connection: DataConnection): void {
    connections.value = [...connections.value, connection]
  }

  function updateConnection(connection: DataConnection): void {
    connections.value = connections.value.map((item) =>
      item.id === connection.id ? connection : item
    )
  }

  function removeConnection(connectionId: string): void {
    connections.value = connections.value.filter((item) => item.id !== connectionId)
    // 级联删除其数据集（playground 设计器平移）
    datasets.value = datasets.value.filter((dataset) => dataset.connectionId !== connectionId)
  }

  let datasetSeq = 0
  function addDataset(connectionId: string): DesignerDataset {
    const dataset: DesignerDataset = {
      id: `dataset-${Date.now()}-${datasetSeq++}`,
      label: '新数据集',
      connectionId,
      sql: ''
    }
    datasets.value = [...datasets.value, dataset]
    return dataset
  }

  function updateDataset(datasetId: string, patch: Partial<Omit<DesignerDataset, 'id'>>): void {
    datasets.value = datasets.value.map((item) =>
      item.id === datasetId ? { ...item, ...patch } : item
    )
  }

  function removeDataset(datasetId: string): void {
    datasets.value = datasets.value.filter((item) => item.id !== datasetId)
  }

  function resolveDatasetConnection(dataset: DesignerDataset): DataConnection | undefined {
    return connections.value.find((item) => item.id === dataset.connectionId)
  }

  function datasetNotFound(): Result<never> {
    return { ok: false, error: { code: 'DATASET_NOT_FOUND', message: '数据集不存在' } }
  }

  function connectionNotFound(): Result<never> {
    return { ok: false, error: { code: 'CONNECTION_NOT_FOUND', message: '数据集所属连接不存在' } }
  }

  function testConnection(connection: DataConnection): Promise<Result<void>> {
    return props.connector.test(connection)
  }

  async function describeDataset(datasetId: string): Promise<Result<DatasetField[]>> {
    const dataset = datasets.value.find((item) => item.id === datasetId)
    if (!dataset) return datasetNotFound()
    const connection = resolveDatasetConnection(dataset)
    if (!connection) return connectionNotFound()

    const sql = dataset.sql
    const result = await props.connector.describe(connection, sql)
    // 并发守卫：describe 返回时 SQL 已再变更则丢弃过期结果
    if (result.ok) {
      const current = datasets.value.find((item) => item.id === datasetId)
      if (current && current.sql === sql) updateDataset(datasetId, { fields: result.data })
    }
    return result
  }

  async function previewDataset(datasetId: string): Promise<Result<QueryResult>> {
    const dataset = datasets.value.find((item) => item.id === datasetId)
    if (!dataset) return datasetNotFound()
    const connection = resolveDatasetConnection(dataset)
    if (!connection) return connectionNotFound()

    const values = resolveParamDefaults(buildParamDefs(dataset.sql, dataset.paramOverrides))
    return props.connector.query(connection, dataset.sql, values)
  }

  // ---- 渲染与模板 ----

  const resolveCellRenderer = createBindingBadgeRenderer(getBindingAt, resolveFieldLabel)

  function getTemplate(): ReportTemplate {
    const resolved: ReportDatasetDef[] = datasets.value.flatMap((dataset) => {
      const connection = resolveDatasetConnection(dataset)
      if (!connection) return []
      return [
        {
          id: dataset.id,
          label: dataset.label,
          connection: { ...connection },
          sql: dataset.sql,
          ...(dataset.paramOverrides ? { paramOverrides: dataset.paramOverrides } : {}),
          ...(dataset.fieldOverrides ? { fieldOverrides: dataset.fieldOverrides } : {})
        }
      ]
    })
    // `Sheet.snapshot()` 不产生 datasets 字段（restore 往返会丢失），吐出时附加内嵌数据集定义
    return { ...workbook.value.activeSheet.snapshot(), datasets: resolved }
  }

  return {
    workbook,
    connections,
    datasets,
    catalog,
    boundKeys,
    activeCell,
    selectionLabel,
    getBindingAt,
    bindField,
    resolveCellRenderer,
    getTemplate,
    addConnection,
    updateConnection,
    removeConnection,
    addDataset,
    updateDataset,
    removeDataset,
    testConnection,
    describeDataset,
    previewDataset
  }
}
