<template>
  <aside class="connection-sidebar">
    <div class="connection-sidebar__head">
      <span class="connection-sidebar__title">连接与数据集</span>
      <u-button size="small" plain @click="emit('add-connection')">新建连接</u-button>
    </div>

    <div class="connection-sidebar__tree">
      <section v-for="conn in connections" :key="conn.id" class="connection-sidebar__group">
        <div
          class="connection-sidebar__conn"
          :class="{ 'is-active': activeConnectionId === conn.id && !activeDatasetId }"
          @click="emit('select-connection', conn.id)"
        >
          <span class="connection-sidebar__conn-label">{{ conn.label }}</span>
          <u-tag size="small" type="info">{{ conn.type }}</u-tag>
        </div>

        <ul class="connection-sidebar__datasets">
          <li
            v-for="item in datasetsByConnection(conn.id)"
            :key="item.id"
            class="connection-sidebar__dataset"
            :class="{ 'is-active': activeDatasetId === item.id }"
            @click="emit('select-dataset', item.id)"
          >
            <span>{{ item.label }}</span>
            <span class="connection-sidebar__dataset-meta">{{ item.id }}</span>
          </li>
        </ul>

        <u-button
          size="small"
          text
          class="connection-sidebar__add-dataset"
          @click="emit('add-dataset', conn.id)"
        >
          + 新建数据集
        </u-button>
      </section>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { DataConnection, DataHub } from '../dataset-hub'

defineOptions({ name: 'SheetReportConnectionSidebar' })

const props = defineProps<{
  hub: DataHub
  revision: number
  activeConnectionId?: string
  activeDatasetId?: string
}>()

const emit = defineEmits<{
  'add-connection': []
  'add-dataset': [connectionId: string]
  'select-connection': [connectionId: string]
  'select-dataset': [datasetId: string]
}>()

const connections = computed((): DataConnection[] => {
  props.revision
  return [...props.hub.connections]
})

function datasetsByConnection(connectionId: string) {
  props.revision
  return props.hub.datasets.filter((item) => item.connectionId === connectionId)
}
</script>

<style scoped lang="scss">
.connection-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 240px;
  flex-shrink: 0;
  min-height: 0;
  padding-right: 12px;
  border-right: 1px solid var(--u-border-color-light, #f1f5f9);
}

.connection-sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.connection-sidebar__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--u-text-color-secondary, #64748b);
}

.connection-sidebar__tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.connection-sidebar__conn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--u-fill-color-light, #f8fafc);
  }

  &.is-active {
    background: var(--u-color-primary-light-9, #eff6ff);
    color: var(--u-color-primary, #2563eb);
  }
}

.connection-sidebar__conn-label {
  font-size: 13px;
  font-weight: 600;
}

.connection-sidebar__datasets {
  margin: 4px 0 0;
  padding: 0 0 0 12px;
  list-style: none;
}

.connection-sidebar__dataset {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  margin-bottom: 2px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: var(--u-fill-color-light, #f8fafc);
  }

  &.is-active {
    background: var(--u-color-primary-light-9, #eff6ff);
    color: var(--u-color-primary, #2563eb);
  }
}

.connection-sidebar__dataset-meta {
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: var(--u-text-color-secondary, #64748b);
}

.connection-sidebar__add-dataset {
  margin-left: 8px;
}
</style>
