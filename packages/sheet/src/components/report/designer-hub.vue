<template>
  <div :class="cls.b">
    <header :class="cls.e('head')">
      <h3 :class="cls.e('title')">数据中枢</h3>
      <u-button size="small" type="primary" @click="emit('close')">完成</u-button>
    </header>

    <div :class="cls.e('body')">
      <aside :class="cls.e('sidebar')">
        <div :class="cls.e('sidebar-head')">
          <span :class="cls.e('sidebar-title')">连接与数据集</span>
          <u-button size="small" plain @click="startNewConnection">新建连接</u-button>
        </div>

        <div :class="cls.e('tree')">
          <section v-for="conn in connections" :key="conn.id" :class="cls.e('conn-group')">
            <div
              :class="[
                cls.e('conn'),
                bem.is('active', activeConnectionId === conn.id && !activeDatasetId)
              ]"
              @click="selectConnection(conn.id)"
            >
              <span :class="cls.e('conn-label')">{{ conn.label }}</span>
              <u-tag size="small" type="info">{{ conn.type }}</u-tag>
            </div>

            <ul :class="cls.e('dataset-list')">
              <li
                v-for="item in datasetsByConnection(conn.id)"
                :key="item.id"
                :class="[cls.e('dataset-item'), bem.is('active', activeDatasetId === item.id)]"
                @click="selectDataset(item.id)"
              >
                <span>{{ item.label }}</span>
                <span :class="cls.e('dataset-id')">{{ item.id }}</span>
              </li>
            </ul>

            <u-button size="small" text :class="cls.e('add-dataset')" @click="addDataset(conn.id)">
              + 新建数据集
            </u-button>
          </section>

          <p v-if="connections.length === 0" :class="cls.e('sidebar-empty')">
            尚无连接。点「新建连接」配置 MySQL / PostgreSQL 数据连接。
          </p>
        </div>
      </aside>

      <div :class="cls.e('main')">
        <u-report-hub-dataset-editor
          v-if="activeDatasetId"
          :hub="hub"
          :dataset-id="activeDatasetId"
          @remove="removeActiveDataset"
        />
        <u-report-hub-connection-form
          v-else-if="connectionDraft"
          :connection="connectionDraft"
          :is-new="creatingConnection"
          :test="hub.testConnection"
          @save="saveConnection"
          @remove="removeActiveConnection"
        />
        <div v-else :class="cls.e('empty')">
          <p>选择左侧连接或数据集开始配置；数据集字段解析后即可在字段面板拖拽绑定。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UTag } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, ref, watch } from 'vue'

import type { DataConnection } from '../../report/connector'
import { DEFAULT_CONNECTION_PORTS } from '../../report/connector'
import UReportHubConnectionForm from './hub-connection-form.vue'
import UReportHubDatasetEditor from './hub-dataset-editor.vue'
import type { DatasetHubController } from './use-report-designer'

defineOptions({ name: 'UReportDatasetHub' })

const props = defineProps<{ hub: DatasetHubController }>()

const emit = defineEmits<{ close: [] }>()

const cls = bem('report-hub')

const connections = computed(() => props.hub.connections.value)
const datasets = computed(() => props.hub.datasets.value)

function datasetsByConnection(connectionId: string) {
  return datasets.value.filter((item) => item.connectionId === connectionId)
}

const activeConnectionId = ref<string>()
const activeDatasetId = ref<string>()
const creatingConnection = ref(false)
const connectionDraft = ref<DataConnection>()

// 打开时默认选中首个连接 / 数据集
watch(
  connections,
  () => {
    if (!activeConnectionId.value && connections.value[0]) {
      activeConnectionId.value = connections.value[0]!.id
      syncConnectionDraft()
    }
  },
  { immediate: true }
)

function syncConnectionDraft(): void {
  if (activeDatasetId.value) {
    connectionDraft.value = undefined
    return
  }
  if (creatingConnection.value) return
  const id = activeConnectionId.value
  const conn = id ? connections.value.find((item) => item.id === id) : undefined
  connectionDraft.value = conn ? { ...conn } : undefined
}

function selectConnection(connectionId: string): void {
  activeConnectionId.value = connectionId
  activeDatasetId.value = undefined
  creatingConnection.value = false
  syncConnectionDraft()
}

function selectDataset(datasetId: string): void {
  activeDatasetId.value = datasetId
  const dataset = datasets.value.find((item) => item.id === datasetId)
  if (dataset) activeConnectionId.value = dataset.connectionId
  connectionDraft.value = undefined
  creatingConnection.value = false
}

let connectionSeq = 0
function startNewConnection(): void {
  creatingConnection.value = true
  activeDatasetId.value = undefined
  connectionDraft.value = {
    id: `conn-${Date.now()}-${connectionSeq++}`,
    label: '新连接',
    type: 'mysql',
    host: '127.0.0.1',
    port: DEFAULT_CONNECTION_PORTS.mysql,
    database: '',
    username: '',
    password: ''
  }
}

function saveConnection(conn: DataConnection): void {
  if (creatingConnection.value) {
    props.hub.addConnection(conn)
    creatingConnection.value = false
  } else {
    props.hub.updateConnection(conn)
  }
  activeConnectionId.value = conn.id
  syncConnectionDraft()
}

function removeActiveConnection(): void {
  const id = activeConnectionId.value
  if (!id) return
  // removeConnection 级联删除其数据集
  props.hub.removeConnection(id)
  activeDatasetId.value = undefined
  activeConnectionId.value = connections.value[0]?.id
  creatingConnection.value = false
  syncConnectionDraft()
}

function addDataset(connectionId: string): void {
  const dataset = props.hub.addDataset(connectionId)
  activeConnectionId.value = connectionId
  activeDatasetId.value = dataset.id
  creatingConnection.value = false
  connectionDraft.value = undefined
}

function removeActiveDataset(): void {
  const id = activeDatasetId.value
  if (!id) return
  props.hub.removeDataset(id)
  activeDatasetId.value = datasets.value.find(
    (item) => item.connectionId === activeConnectionId.value
  )?.id
  syncConnectionDraft()
}
</script>
