import type { CellAddress } from '@veltra/sheet-core'
import type { ResolveCellRenderer, ResolveCellStyleHook } from '@veltra/sheet-core'
import { Workbook } from '@veltra/sheet-core'
import { computed, onScopeDispose, ref, watch, type ComputedRef, type Ref } from 'vue'

import {
  REPORT_META_NAMESPACE,
  applyReportPreset,
  createReportBinding,
  formatCellAddress,
  inferColParentCandidate,
  inferDropPreset,
  inferRowParentCandidate,
  isHorizontalExpandBinding,
  isVerticalExpandBinding,
  listColParentCandidates,
  listRowParentCandidates
} from '../../report/binding'
import type { DataConnection, QueryResult, Result } from '../../report/connector'
import { buildParamDefs } from '../../report/params'
import {
  assertCompatibleTemplateVersion,
  createReportTemplate,
  getTemplateDatasets,
  resolveParamDefaults,
  type ReportDatasetDef,
  type ReportTemplate
} from '../../report/template'
import type { DatasetCatalogItem, DatasetField, ReportBinding } from '../../report/types'
import type { ReportDesignerProps } from '../../types'
import { createBindingBadgeRenderer, createBindingBadgeStyleResolver } from './binding-badge'
import type { TopologyBindingEntry } from './designer/topology'

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

export type ParentPickMode = 'row' | 'col'

export interface ParentPickState {
  mode: ParentPickMode
  source: CellAddress
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
  /** 当前选区绑定（跟随 meta-change） */
  activeBinding: ComputedRef<ReportBinding | undefined>
  /** 当前选区绑定字段的数据类型（条件规则对话框控件映射用；缺省 number） */
  activeFieldType: ComputedRef<DatasetField['type']>
  /** 当前选区绑定的行方向父格 A1 标签（无父格显示 —） */
  resolvedRowParentLabel: ComputedRef<string>
  /** 当前选区绑定的列方向父格 A1 标签（无父格显示 —） */
  resolvedColParentLabel: ComputedRef<string>
  /** 父格点选态（进入后在网格上点目标格写入父格） */
  parentPick: Ref<ParentPickState | null>
  /** 行方向父格下拉候选（同数据集纵向扩展绑定格） */
  rowParentCandidates: ComputedRef<CellAddress[]>
  /** 列方向父格下拉候选（同数据集横向扩展绑定格） */
  colParentCandidates: ComputedRef<CellAddress[]>
  /** 全部绑定条目（拓扑连线数据源；跟随 meta-change） */
  bindingEntries: ComputedRef<TopologyBindingEntry[]>
  /** meta 变更计数（网格覆层组件的同步信号） */
  metaTick: Ref<number>
  getBindingAt: (addr: CellAddress) => ReportBinding | undefined
  /** 字段 label 解析（catalog O(1) 查找；Action Pill 摘要与徽章共用） */
  resolveFieldLabel: (datasetId: string, fieldName: string) => string
  /** 拖拽/点击落格写 Cell Meta 绑定（角色推导与 playground 设计器一致） */
  bindField: (datasetId: string, fieldName: string, addr?: CellAddress) => void
  /** 就地修补当前选区绑定（Action Pill：预设 / 展开方向 / 父格 / 聚合 / 排序 / 条件规则） */
  patchActiveBinding: (patch: Partial<ReportBinding>) => void
  /** 进入父格点选态 */
  startParentPick: (mode: ParentPickMode) => void
  /** 取消父格点选态 */
  cancelParentPick: () => void
  /** 父格点选：将目标格写入当前编辑格的 rowParent / colParent */
  pickParentAt: (target: CellAddress) => void
  /** 清除行 / 列方向父格 */
  clearParent: (mode: ParentPickMode) => void
  /** 清除当前选区绑定 */
  removeActiveBinding: () => void
  /** 绑定格角色底色样式 hook（与徽章 renderer 配套） */
  resolveCellStyle: ResolveCellStyleHook
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
  const parentPick = ref<ParentPickState | null>(null)
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

  function bindField(datasetId: string, fieldName: string, addr?: CellAddress): void {
    const dataset = catalog.value.find((item) => item.id === datasetId)
    if (!dataset) return

    const field = dataset.fields.find((item) => item.name === fieldName)
    const target = addr ?? workbook.value.activeSheet.getSelection().activeCell
    if (!target) return

    const preset = inferDropPreset(target, field?.type ?? 'string', getBindingAt)
    let binding = createReportBinding(dataset, fieldName)
    binding = applyReportPreset(binding, preset)

    const rowParent = inferRowParentCandidate(target, getBindingAt)
    if (rowParent) binding.rowParent = rowParent
    const colParent = inferColParentCandidate(target, getBindingAt)
    if (colParent) binding.colParent = colParent

    workbook.value.activeSheet.setCellMeta(target, REPORT_META_NAMESPACE, binding)
  }

  // ---- Action Pill / 拓扑连线（playground 设计器平移，行为不变） ----

  const activeBinding = computed((): ReportBinding | undefined => {
    metaTick.value
    const cell = activeCell.value
    if (!cell) return undefined
    return getBindingAt(cell)
  })

  const activeFieldType = computed((): DatasetField['type'] => {
    const binding = activeBinding.value
    if (!binding) return 'number'
    const dataset = catalog.value.find((item) => item.id === binding.dataset)
    const field = dataset?.fields.find((item) => item.name === binding.field)
    return field?.type ?? 'number'
  })

  const resolvedRowParentLabel = computed(() => {
    metaTick.value
    const binding = activeBinding.value
    if (!binding?.rowParent) return '—'
    return formatCellAddress(binding.rowParent)
  })

  const resolvedColParentLabel = computed(() => {
    metaTick.value
    const binding = activeBinding.value
    if (!binding?.colParent) return '—'
    return formatCellAddress(binding.colParent)
  })

  const rowParentCandidates = computed((): CellAddress[] => {
    metaTick.value
    const binding = activeBinding.value
    if (!binding) return []
    return listRowParentCandidates(binding, bindingEntries.value)
  })

  const colParentCandidates = computed((): CellAddress[] => {
    metaTick.value
    const binding = activeBinding.value
    if (!binding) return []
    return listColParentCandidates(binding, bindingEntries.value)
  })

  const bindingEntries = computed((): TopologyBindingEntry[] => {
    metaTick.value
    const entries: TopologyBindingEntry[] = []
    for (const [addr, namespace, payload] of workbook.value.activeSheet.entriesCellMeta()) {
      if (namespace !== REPORT_META_NAMESPACE) continue
      entries.push({ addr, binding: payload as ReportBinding })
    }
    return entries
  })

  function patchActiveBinding(patch: Partial<ReportBinding>): void {
    const cell = activeCell.value
    const binding = activeBinding.value
    if (!cell || !binding) return

    const next: ReportBinding = { ...binding, ...patch }
    if ('rowParent' in patch && patch.rowParent === undefined) delete next.rowParent
    if ('colParent' in patch && patch.colParent === undefined) delete next.colParent
    if (('aggregate' in patch || 'expand' in patch) && !('preset' in patch)) delete next.preset

    workbook.value.activeSheet.setCellMeta(cell, REPORT_META_NAMESPACE, next)
  }

  function startParentPick(mode: ParentPickMode): void {
    const cell = activeCell.value
    if (!cell || !activeBinding.value) return
    parentPick.value = { mode, source: { row: cell.row, col: cell.col } }
  }

  function cancelParentPick(): void {
    parentPick.value = null
  }

  function pickParentAt(target: CellAddress): void {
    const pick = parentPick.value
    if (!pick) return
    if (target.row === pick.source.row && target.col === pick.source.col) return

    const sourceBinding = getBindingAt(pick.source)
    const targetBinding = getBindingAt(target)
    if (!sourceBinding || !targetBinding) return
    if (targetBinding.dataset !== sourceBinding.dataset) return
    if (pick.mode === 'row' && !isVerticalExpandBinding(targetBinding)) return
    if (pick.mode === 'col' && !isHorizontalExpandBinding(targetBinding)) return

    const patch = pick.mode === 'row' ? { rowParent: { ...target } } : { colParent: { ...target } }
    const next: ReportBinding = { ...sourceBinding, ...patch }
    workbook.value.activeSheet.setCellMeta(pick.source, REPORT_META_NAMESPACE, next)
    parentPick.value = null
    workbook.value.activeSheet.selectCell(pick.source)
  }

  function clearParent(mode: ParentPickMode): void {
    if (mode === 'row') patchActiveBinding({ rowParent: undefined })
    else patchActiveBinding({ colParent: undefined })
  }

  function removeActiveBinding(): void {
    const cell = activeCell.value
    if (!cell) return
    workbook.value.activeSheet.clearCellMeta(cell, REPORT_META_NAMESPACE)
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

  const resolveCellStyle = createBindingBadgeStyleResolver(getBindingAt)
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
    return createReportTemplate(workbook.value.activeSheet.snapshot(), resolved)
  }

  /**
   * 载入既有 Report Template 继续设计（`template` prop）：
   * 快照恢复网格绑定（restore + restoreContent 与查看器同路径）；
   * 内嵌数据集定义还原为设计态（connectionId 引用），内嵌连接按 id 合并进
   * v-model 连接列表（仅缺省追加，宿主列表是单一事实源）；
   * describe 恢复字段缓存（字段面板数据源），业务错误忽略（字段留空，可在数据中枢重试）。
   */
  function loadTemplate(template: ReportTemplate): void {
    assertCompatibleTemplateVersion(template)
    const sheet = workbook.value.activeSheet
    sheet.restore(template)
    sheet.restoreContent(template)
    sheet.history.clear()
    syncActiveCell()

    const defs = getTemplateDatasets(template)
    datasets.value = defs.map((def) => ({
      id: def.id,
      label: def.label,
      connectionId: def.connection.id,
      sql: def.sql,
      ...(def.paramOverrides ? { paramOverrides: def.paramOverrides } : {}),
      ...(def.fieldOverrides ? { fieldOverrides: def.fieldOverrides } : {})
    }))

    const missing = defs
      .map((def) => def.connection)
      .filter((connection) => !connections.value.some((item) => item.id === connection.id))
    if (missing.length > 0) {
      connections.value = [
        ...connections.value,
        ...missing.map((connection) => ({ ...connection }))
      ]
    }

    for (const dataset of datasets.value) {
      if (dataset.sql.trim()) void describeDataset(dataset.id)
    }
  }

  // 模板更换：重新载入（仅在提供了 template 时；缺省为空白设计态）
  watch(
    () => props.template,
    (template) => {
      if (template) loadTemplate(template)
    },
    { immediate: true }
  )

  return {
    workbook,
    connections,
    datasets,
    catalog,
    boundKeys,
    activeCell,
    selectionLabel,
    activeBinding,
    activeFieldType,
    resolvedRowParentLabel,
    resolvedColParentLabel,
    parentPick,
    rowParentCandidates,
    colParentCandidates,
    bindingEntries,
    metaTick,
    getBindingAt,
    resolveFieldLabel,
    bindField,
    patchActiveBinding,
    startParentPick,
    cancelParentPick,
    pickParentAt,
    clearParent,
    removeActiveBinding,
    resolveCellStyle,
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
