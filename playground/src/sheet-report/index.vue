<template>
  <div class="sheet-report-demo">
    <div class="sheet-report-demo__hint">
      <strong>UReportDesigner</strong> + 内嵌 <strong>UReportViewer</strong>（预览模式）薄消费演示。
      在工具栏打开<strong>数据中枢</strong>，自行输入 MySQL / PostgreSQL
      连接（无内置默认连接），配置 SQL 数据集后拖拽字段绑定；切<strong>预览模式</strong>经
      <code>createHttpConnector({ endpoint: '/report-api' })</code> 取数，Filter Bar
      按绑定数据集参数并集筛选。 dev 时经 vite proxy 访问 hono
      契约参考服务（<code>playground/server</code>）， 请用
      <code>bun run dev</code> 一并启动后端；连接与数据集自动持久化到本地 SQLite。
    </div>

    <div class="sheet-report-demo__toolbar">
      <template v-if="!standaloneViewer">
        <u-button size="small" plain @click="openStandaloneViewer">在独立查看器中打开</u-button>
      </template>
      <template v-else>
        <u-button size="small" plain @click="standaloneViewer = false">返回设计器</u-button>
      </template>
      <span v-if="workspaceStatus" class="sheet-report-demo__toolbar-hint">{{
        workspaceStatus
      }}</span>
      <span v-if="viewerTemplate" class="sheet-report-demo__toolbar-hint">
        已载入模板（{{ viewerTemplate.datasets.length }} 个数据集）
      </span>
    </div>

    <u-report-designer
      v-show="!standaloneViewer"
      ref="designerRef"
      class="sheet-report-demo__designer"
      :connector="connector"
      :template="initialTemplate"
      v-model:connections="connections"
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
import {
  createHttpConnector,
  type DataConnection,
  type ReportDesignerExposed,
  type ReportTemplate
} from '@veltra/sheet'
import { Workbook } from '@veltra/sheet-core'
import '@veltra/sheet/components/report/style'
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

/** 契约参考服务：vite dev 经 /report-api 代理到 hono（playground/server） */
const connector = createHttpConnector({ endpoint: '/report-api' })

interface StoredDataset {
  id: string
  label: string
  connectionId: string
  sql: string
  paramOverrides?: Record<string, unknown>
  fieldOverrides?: Record<string, unknown>
}

interface WorkspaceResponse {
  ok: boolean
  connections?: DataConnection[]
  datasets?: StoredDataset[]
}

const connections = ref<DataConnection[]>([])
const initialTemplate = ref<ReportTemplate>()
const designerRef = useTemplateRef<ReportDesignerExposed>('designerRef')
const standaloneViewer = ref(false)
const viewerTemplate = ref<ReportTemplate | undefined>()
const workspaceStatus = ref('')
const workspaceReady = ref(false)

let saveTimer: ReturnType<typeof setTimeout> | undefined
let saveSeq = 0
let lastPayload = ''
let pollTimer: ReturnType<typeof setInterval> | undefined

function buildTemplate(
  conns: DataConnection[],
  datasets: StoredDataset[]
): ReportTemplate | undefined {
  const connById = new Map(conns.map((item) => [item.id, item]))
  const defs = datasets.flatMap((dataset) => {
    const connection = connById.get(dataset.connectionId)
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
  if (defs.length === 0) return undefined
  const workbook = new Workbook()
  return { ...workbook.activeSheet.snapshot(), datasets: defs }
}

function collectWorkspacePayload(): { connections: DataConnection[]; datasets: StoredDataset[] } {
  const template = designerRef.value?.getTemplate()
  const datasets =
    template?.datasets.map((dataset) => ({
      id: dataset.id,
      label: dataset.label,
      connectionId: dataset.connection.id,
      sql: dataset.sql,
      ...(dataset.paramOverrides ? { paramOverrides: dataset.paramOverrides } : {}),
      ...(dataset.fieldOverrides ? { fieldOverrides: dataset.fieldOverrides } : {})
    })) ?? []
  return { connections: connections.value, datasets }
}

async function loadWorkspace(): Promise<void> {
  workspaceStatus.value = '正在加载工作区…'
  try {
    const response = await fetch('/report-api/workspace')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = (await response.json()) as WorkspaceResponse
    if (!payload.ok) throw new Error('工作区响应异常')

    const loadedConnections = payload.connections ?? []
    const loadedDatasets = payload.datasets ?? []
    connections.value = loadedConnections
    initialTemplate.value = buildTemplate(loadedConnections, loadedDatasets)
    lastPayload = JSON.stringify({ connections: loadedConnections, datasets: loadedDatasets })
    workspaceStatus.value =
      loadedConnections.length > 0
        ? `已恢复 ${loadedConnections.length} 个连接、${loadedDatasets.length} 个数据集`
        : '工作区为空，可新建连接'
  } catch (error) {
    workspaceStatus.value = `工作区加载失败：${error instanceof Error ? error.message : String(error)}`
  } finally {
    workspaceReady.value = true
  }
}

async function saveWorkspace(): Promise<void> {
  if (!workspaceReady.value) return
  const seq = ++saveSeq
  workspaceStatus.value = '正在保存…'
  try {
    const response = await fetch('/report-api/workspace', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectWorkspacePayload())
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = (await response.json()) as { ok: boolean }
    if (!payload.ok) throw new Error('保存被拒绝')
    lastPayload = JSON.stringify(collectWorkspacePayload())
    if (seq === saveSeq) workspaceStatus.value = '已自动保存'
  } catch (error) {
    if (seq === saveSeq) {
      workspaceStatus.value = `保存失败：${error instanceof Error ? error.message : String(error)}`
    }
  }
}

function scheduleSave(): void {
  if (!workspaceReady.value) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void saveWorkspace()
  }, 600)
}

onMounted(() => {
  void loadWorkspace()
  pollTimer = setInterval(() => {
    if (!workspaceReady.value || !designerRef.value) return
    const next = JSON.stringify(collectWorkspacePayload())
    if (next === lastPayload) return
    lastPayload = next
    scheduleSave()
  }, 1500)
})

watch(
  connections,
  () => {
    const next = JSON.stringify(collectWorkspacePayload())
    if (next !== lastPayload) {
      lastPayload = next
      scheduleSave()
    }
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
  if (pollTimer) clearInterval(pollTimer)
})

function openStandaloneViewer() {
  scheduleSave()
  const template = designerRef.value?.getTemplate()
  if (!template?.datasets.length) return
  viewerTemplate.value = template
  standaloneViewer.value = true
}
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
