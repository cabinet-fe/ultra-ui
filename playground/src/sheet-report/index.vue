<template>
  <div class="sheet-report-demo">
    <div class="sheet-report-demo__hint">
      <strong>UReportDesigner</strong> 报表演示：连接与 SQL 数据集持久化在本地 SQLite（
      <code>GET|PUT /report-api/workspace</code>），取数经
      <code>POST /datasets/:id/query</code> 只传参数值；模板入库时剥离凭据与
      SQL，打开时由工作区回填。 请用 <code>bun run dev</code> 同时启动契约服务。
    </div>

    <div class="sheet-report-demo__toolbar">
      <template v-if="!standaloneViewer">
        <u-input
          v-model="templateName"
          size="small"
          :class="toolbarCls.e('name')"
          placeholder="模板名称"
        />
        <u-button size="small" type="primary" :loading="savingTemplate" @click="saveTemplate">
          保存模板
        </u-button>
        <u-button size="small" plain @click="libraryVisible = true">打开模板</u-button>
        <u-button size="small" plain @click="createNewTemplate">新建模板</u-button>
        <u-button size="small" plain @click="openStandaloneViewer">在独立查看器中打开</u-button>
      </template>
      <template v-else>
        <u-button size="small" plain @click="standaloneViewer = false">返回设计器</u-button>
      </template>
      <span v-if="statusText" class="sheet-report-demo__toolbar-hint">{{ statusText }}</span>
    </div>

    <u-report-designer
      v-if="workspaceReady"
      v-show="!standaloneViewer"
      :key="designerSessionKey"
      ref="designerRef"
      class="sheet-report-demo__designer"
      :connector="connector"
      :template="loadedTemplate"
      v-model:connections="connections"
      @datasets-change="onDesignerDatasetsChange"
    />

    <sheet-report-template-library
      v-model:visible="libraryVisible"
      :active-template-id="activeTemplateId"
      @open="openTemplate"
      @deleted="onTemplateDeleted"
    />

    <u-report-viewer
      v-if="standaloneViewer && viewerTemplate"
      class="sheet-report-demo__viewer"
      :connector="connector"
      :template="viewerTemplate"
    />
  </div>
</template>

<script lang="ts" setup>
import { UButton, UInput, messageConfirm } from '@veltra/desktop'
import {
  type DataConnection,
  type ReportDesignerExposed,
  type ReportDatasetDef,
  type ReportTemplate,
  createReportTemplate
} from '@veltra/sheet'
import { Sheet } from '@veltra/sheet-core'
import { bem } from '@veltra/utils'
import '@veltra/sheet/components/report/style'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import {
  createHubConnector,
  createReportTemplateRecord,
  extractWorkspaceDatasets,
  fetchReportTemplate,
  fetchWorkspace,
  mergeConnectionsFromTemplate,
  saveWorkspace,
  serializeTemplateDocument,
  updateReportTemplateRecord,
  type WorkspaceData,
  type WorkspaceDataset
} from './report-api'
import { readLastTemplateId, resolveStartupTemplate, writeLastTemplateId } from './startup'
import SheetReportTemplateLibrary from './template-library.vue'

const toolbarCls = bem('sheet-report-demo-toolbar')

const connections = ref<DataConnection[]>([])
const workspaceDatasets = ref<WorkspaceDataset[]>([])
const savedConnectionIds = ref(new Set<string>())
const loadedTemplate = ref<ReportTemplate>()
const designerSessionKey = ref(0)
const activeTemplateId = ref<string | null>(null)
const templateName = ref('未命名模板')
const designerRef = useTemplateRef<ReportDesignerExposed>('designerRef')
const standaloneViewer = ref(false)
const viewerTemplate = ref<ReportTemplate>()
const libraryVisible = ref(false)
const workspaceReady = ref(false)
const savingTemplate = ref(false)
const isDirty = ref(false)
const statusText = ref('')

const connector = createHubConnector({
  isConnectionSaved: (connectionId) => savedConnectionIds.value.has(connectionId),
  findDatasetId: (connectionId, sql) =>
    workspaceDatasets.value.find((item) => item.connectionId === connectionId && item.sql === sql)
      ?.id
})

let savedDocument = ''
let workspacePayload = ''
let workspaceSaveTimer: ReturnType<typeof setTimeout> | undefined
let dirtyPollTimer: ReturnType<typeof setInterval> | undefined

const currentDocument = computed(() =>
  serializeTemplateDocument(
    activeTemplateId.value,
    templateName.value.trim(),
    designerRef.value?.getTemplate()
  )
)

/** 与 UReportDesigner 设计网格尺寸一致 */
const DESIGN_ROWS = 24
const DESIGN_COLS = 10

function buildWorkspaceSeedTemplate(workspace: WorkspaceData): ReportTemplate | undefined {
  if (workspace.datasets.length === 0) return undefined
  const datasets: ReportDatasetDef[] = workspace.datasets.flatMap((dataset) => {
    const connection = workspace.connections.find((item) => item.id === dataset.connectionId)
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
  if (datasets.length === 0) return undefined
  const sheet = new Sheet({ rows: DESIGN_ROWS, cols: DESIGN_COLS })
  return createReportTemplate(sheet.snapshot(), datasets)
}

function buildWorkspaceSnapshot(): WorkspaceData {
  return {
    connections: connections.value,
    datasets: extractWorkspaceDatasets(designerRef.value?.getTemplate())
  }
}

function refreshStatus(): void {
  const parts: string[] = []
  if (activeTemplateId.value) {
    parts.push('已打开模板')
  } else {
    parts.push('新建模板')
  }
  parts.push(isDirty.value ? '有未保存更改' : '已保存')
  if (connections.value.length > 0) {
    parts.push(`${connections.value.length} 个连接`)
  }
  if (workspaceDatasets.value.length > 0) {
    parts.push(`${workspaceDatasets.value.length} 个数据集`)
  }
  statusText.value = parts.join(' · ')
}

function markDocumentSaved(): void {
  savedDocument = currentDocument.value
  isDirty.value = false
  refreshStatus()
}

function updateDirtyState(): void {
  isDirty.value = currentDocument.value !== savedDocument
  refreshStatus()
}

async function loadWorkspace(): Promise<void> {
  statusText.value = '正在加载工作区…'
  try {
    const workspace = await fetchWorkspace()
    connections.value = workspace.connections
    workspaceDatasets.value = workspace.datasets
    savedConnectionIds.value = new Set(workspace.connections.map((item) => item.id))
    workspacePayload = JSON.stringify(workspace)

    const lastTemplateId = readLastTemplateId(localStorage)
    let namedTemplate: { id: string; name: string; template: ReportTemplate } | null = null
    if (lastTemplateId) {
      try {
        const record = await fetchReportTemplate(lastTemplateId)
        namedTemplate = { id: record.id, name: record.name, template: record.template }
      } catch {
        writeLastTemplateId(localStorage, null)
      }
    }

    const startup = resolveStartupTemplate({
      lastTemplateId,
      namedTemplate,
      seedTemplate: buildWorkspaceSeedTemplate(workspace)
    })
    applyStartupTemplate(startup, workspace)
    designerSessionKey.value += 1
    statusText.value = describeStartupStatus(startup, workspace)
  } catch (error) {
    statusText.value = `工作区加载失败：${error instanceof Error ? error.message : String(error)}`
  } finally {
    workspaceReady.value = true
  }
}

function applyStartupTemplate(
  startup: ReturnType<typeof resolveStartupTemplate>,
  workspace: WorkspaceData
): void {
  if (startup.source === 'named' && startup.template) {
    connections.value = mergeConnectionsFromTemplate(startup.template, connections.value)
    workspaceDatasets.value = extractWorkspaceDatasets(startup.template)
    activeTemplateId.value = startup.activeTemplateId
    templateName.value = startup.templateName
    loadedTemplate.value = startup.template
    writeLastTemplateId(localStorage, startup.activeTemplateId)
    return
  }
  activeTemplateId.value = null
  templateName.value = startup.templateName
  loadedTemplate.value = startup.template ?? buildWorkspaceSeedTemplate(workspace)
}

function describeStartupStatus(
  startup: ReturnType<typeof resolveStartupTemplate>,
  workspace: WorkspaceData
): string {
  if (startup.source === 'named') {
    return `已恢复模板「${startup.templateName}」`
  }
  if (workspace.connections.length > 0 || workspace.datasets.length > 0) {
    return `已恢复 ${workspace.connections.length} 个连接、${workspace.datasets.length} 个数据集`
  }
  return '工作区为空，可在数据中枢新建'
}

function scheduleWorkspaceSave(): void {
  if (!workspaceReady.value) return
  if (workspaceSaveTimer) clearTimeout(workspaceSaveTimer)
  workspaceSaveTimer = setTimeout(() => {
    void saveWorkspaceState()
  }, 600)
}

async function saveWorkspaceState(): Promise<void> {
  const next = JSON.stringify(buildWorkspaceSnapshot())
  if (next === workspacePayload) return
  try {
    const data = JSON.parse(next) as WorkspaceData
    await saveWorkspace(data)
    workspacePayload = next
    workspaceDatasets.value = data.datasets
    savedConnectionIds.value = new Set(data.connections.map((item) => item.id))
  } catch (error) {
    statusText.value = `工作区保存失败：${error instanceof Error ? error.message : String(error)}`
  }
}

async function saveTemplate(): Promise<void> {
  const name = templateName.value.trim()
  if (!name) {
    statusText.value = '请先填写模板名称'
    return
  }
  const template = designerRef.value?.getTemplate()
  if (!template) {
    statusText.value = '设计器尚未就绪'
    return
  }

  savingTemplate.value = true
  statusText.value = '正在保存模板…'
  try {
    await saveWorkspaceState()
    const record = activeTemplateId.value
      ? await updateReportTemplateRecord(activeTemplateId.value, { name, template })
      : await createReportTemplateRecord(name, template)
    activeTemplateId.value = record.id
    templateName.value = record.name
    markDocumentSaved()
    writeLastTemplateId(localStorage, record.id)
    statusText.value = `模板「${record.name}」已保存`
  } catch (error) {
    statusText.value = `模板保存失败：${error instanceof Error ? error.message : String(error)}`
  } finally {
    savingTemplate.value = false
  }
}

async function confirmDiscardIfDirty(): Promise<boolean> {
  if (!isDirty.value) return true
  const result = messageConfirm.warning('当前模板有未保存更改，确定继续？', {
    title: '未保存模板更改',
    confirmButtonText: '继续',
    cancelButtonText: '取消'
  })
  return (await result.onClosed) === 'confirm'
}

function onDesignerDatasetsChange(): void {
  if (!workspaceReady.value) return
  void saveWorkspaceState()
}

function resetToNewTemplate(): void {
  activeTemplateId.value = null
  templateName.value = '未命名模板'
  loadedTemplate.value = buildWorkspaceSeedTemplate({
    connections: connections.value,
    datasets: workspaceDatasets.value
  })
  designerSessionKey.value += 1
  writeLastTemplateId(localStorage, null)
}

async function createNewTemplate(): Promise<void> {
  if (!(await confirmDiscardIfDirty())) return
  resetToNewTemplate()
}

async function openTemplate(id: string): Promise<void> {
  if (!(await confirmDiscardIfDirty())) return
  statusText.value = '正在打开模板…'
  try {
    const record = await fetchReportTemplate(id)
    connections.value = mergeConnectionsFromTemplate(record.template, connections.value)
    workspaceDatasets.value = extractWorkspaceDatasets(record.template)
    await saveWorkspaceState()
    activeTemplateId.value = record.id
    templateName.value = record.name
    loadedTemplate.value = record.template
    designerSessionKey.value += 1
    libraryVisible.value = false
    writeLastTemplateId(localStorage, record.id)
    statusText.value = `已打开模板「${record.name}」`
  } catch (error) {
    statusText.value = `打开模板失败：${error instanceof Error ? error.message : String(error)}`
  }
}

function onTemplateDeleted(id: string): void {
  if (activeTemplateId.value !== id) return
  resetToNewTemplate()
  statusText.value = '当前模板已删除，已切换为新建模板'
}

async function openStandaloneViewer(): Promise<void> {
  if (!(await confirmDiscardIfDirty())) return
  const template = designerRef.value?.getTemplate()
  if (!template?.datasets?.length) {
    statusText.value = '请先配置数据集并保存绑定'
    return
  }
  viewerTemplate.value = template
  standaloneViewer.value = true
}

watch(
  connections,
  () => {
    scheduleWorkspaceSave()
    refreshStatus()
  },
  { deep: true }
)

watch(templateName, () => {
  updateDirtyState()
})

watch(
  [designerSessionKey, () => designerRef.value],
  async () => {
    await nextTick()
    if (!designerRef.value) return
    markDocumentSaved()
  },
  { flush: 'post' }
)

onMounted(() => {
  void loadWorkspace()
  dirtyPollTimer = setInterval(() => {
    if (!workspaceReady.value || !designerRef.value) return
    updateDirtyState()
    scheduleWorkspaceSave()
  }, 1200)
})

onBeforeUnmount(() => {
  if (workspaceSaveTimer) clearTimeout(workspaceSaveTimer)
  if (dirtyPollTimer) clearInterval(dirtyPollTimer)
})
</script>

<style scoped lang="scss">
.sheet-report-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 640px;
  height: calc(100vh - 180px);
}

.sheet-report-demo__hint {
  font-size: 13px;
  line-height: 1.7;
  color: var(--u-text-color-secondary);
}

.sheet-report-demo__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sheet-report-demo-toolbar__name {
  width: 220px;
}

.sheet-report-demo__toolbar-hint {
  font-size: 12px;
  color: var(--u-text-color-secondary);
}

.sheet-report-demo__designer,
.sheet-report-demo__viewer {
  flex: 1;
  min-height: 0;
}
</style>
