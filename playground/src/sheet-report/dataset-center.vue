<template>
  <u-dialog
    v-model="visible"
    title="数据源中心"
    :modal="false"
    class="dataset-center-dialog"
    style="width: min(960px, 92vw); max-height: 85vh"
    :show-close="true"
  >
    <div class="dataset-center">
      <connection-sidebar
        :hub="hub"
        :revision="revision"
        :active-connection-id="activeConnectionId"
        :active-dataset-id="activeDatasetId"
        @add-connection="startNewConnection"
        @add-dataset="addDataset"
        @select-connection="selectConnection"
        @select-dataset="selectDataset"
      />

      <div class="dataset-center__main">
        <dataset-editor
          v-if="activeDatasetId"
          :hub="hub"
          :dataset-id="activeDatasetId"
          :revision="revision"
          :param-values="paramValues"
          @remove="removeActiveDataset"
        />
        <connection-form
          v-else-if="connectionDraft"
          :hub="hub"
          :connection="connectionDraft"
          :is-new="creatingConnection"
          @save="saveConnection"
          @remove="removeActiveConnection"
        />
        <div v-else class="dataset-center__empty">
          <p>选择左侧连接或数据集开始配置；数据集保存后即可在字段面板使用。</p>
        </div>
      </div>
    </div>

    <template #footer>
      <u-button type="primary" @click="visible = false">完成</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

import ConnectionForm from './dataset-center/connection-form.vue'
import ConnectionSidebar from './dataset-center/connection-sidebar.vue'
import DatasetEditor from './dataset-center/dataset-editor.vue'
import type { DataConnection, DataHub } from './dataset-hub'

defineOptions({ name: 'SheetReportDatasetCenter' })

const props = defineProps<{
  hub: DataHub
  revision: number
  paramValues: Record<string, unknown>
}>()

const visible = defineModel<boolean>({ default: false })

const activeConnectionId = ref<string>()
const activeDatasetId = ref<string>()
const creatingConnection = ref(false)
const connectionDraft = ref<DataConnection | undefined>()

watch(visible, (open) => {
  if (!open) return
  props.revision
  if (!activeConnectionId.value && props.hub.connections[0]) {
    activeConnectionId.value = props.hub.connections[0]!.id
  }
  if (!activeDatasetId.value && props.hub.datasets[0]) {
    activeDatasetId.value = props.hub.datasets[0]!.id
    activeConnectionId.value = props.hub.datasets[0]!.connectionId
  }
  syncConnectionDraft()
})

watch(
  () => props.revision,
  () => syncConnectionDraft()
)

function syncConnectionDraft(): void {
  if (activeDatasetId.value) {
    connectionDraft.value = undefined
    return
  }
  if (creatingConnection.value) return
  const id = activeConnectionId.value
  connectionDraft.value = id ? props.hub.getConnection(id) : undefined
}

function selectConnection(connectionId: string): void {
  activeConnectionId.value = connectionId
  activeDatasetId.value = undefined
  creatingConnection.value = false
  syncConnectionDraft()
}

function selectDataset(datasetId: string): void {
  activeDatasetId.value = datasetId
  const dataset = props.hub.getDataset(datasetId)
  if (dataset) activeConnectionId.value = dataset.connectionId
  connectionDraft.value = undefined
  creatingConnection.value = false
}

function startNewConnection(): void {
  creatingConnection.value = true
  activeDatasetId.value = undefined
  connectionDraft.value = {
    id: `conn-${Date.now()}`,
    label: '新连接',
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'demo_business',
    username: 'demo',
    password: 'demo'
  }
}

function saveConnection(conn: DataConnection): void {
  if (creatingConnection.value) {
    props.hub.addConnection(conn)
    creatingConnection.value = false
  } else {
    props.hub.updateConnection(conn.id, conn)
  }
  activeConnectionId.value = conn.id
  syncConnectionDraft()
}

function removeActiveConnection(): void {
  const id = activeConnectionId.value
  if (!id) return
  const datasetIds = props.hub.datasets.filter((d) => d.connectionId === id).map((d) => d.id)
  for (const datasetId of datasetIds) {
    props.hub.removeDataset(datasetId)
  }
  props.hub.removeConnection(id)
  activeDatasetId.value = undefined
  activeConnectionId.value = props.hub.connections[0]?.id
  creatingConnection.value = false
  syncConnectionDraft()
}

function addDataset(connectionId: string): void {
  const id = `dataset-${Date.now()}`
  props.hub.addDataset({ id, label: '新数据集', connectionId, sql: 'SELECT * FROM orders' })
  activeConnectionId.value = connectionId
  activeDatasetId.value = id
  creatingConnection.value = false
  connectionDraft.value = undefined
}

function removeActiveDataset(): void {
  const id = activeDatasetId.value
  if (!id) return
  props.hub.removeDataset(id)
  activeDatasetId.value = props.hub.datasets.find(
    (d) => d.connectionId === activeConnectionId.value
  )?.id
  syncConnectionDraft()
}
</script>

<style scoped lang="scss">
.dataset-center {
  display: flex;
  gap: 16px;
  height: min(560px, calc(85vh - 120px));
  min-height: 400px;
  padding: 4px 8px 0;
  box-sizing: border-box;
}

.dataset-center__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.dataset-center__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--u-text-color-secondary, #64748b);
  text-align: center;
  padding: 24px;
}
</style>
