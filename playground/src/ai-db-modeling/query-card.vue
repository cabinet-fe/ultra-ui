<template>
  <div class="query-card">
    <template v-if="queryDisplay">
      <div class="query-card__meta">
        <span v-if="table">表 {{ table }}</span>
        <span>共 {{ queryDisplay.rows.length }} 行</span>
      </div>
      <result-table
        v-if="queryDisplay.rows.length"
        :columns="queryDisplay.columns"
        :rows="queryDisplay.rows"
      />
      <div v-else class="query-card__tip">过滤条件下无命中数据</div>
    </template>

    <template v-else-if="statsDisplay">
      <div class="query-card__meta">
        <span v-if="table">表 {{ table }}</span>
        <span v-if="dimensionLabel">{{ dimensionLabel }}</span>
        <span>{{ statsDisplay.groupRows.length }} 组</span>
      </div>
      <result-table
        v-if="groupColumns.length"
        :columns="groupColumns"
        :rows="statsDisplay.groupRows"
      />
      <div v-else class="query-card__tip">过滤条件下无命中数据</div>
    </template>

    <div v-else-if="toolCall.status === 'error'" class="query-card__tip">
      查询失败：{{ toolCall.error }}
    </div>
    <div v-else class="query-card__tip">正在查询数据…</div>
  </div>
</template>

<script lang="ts" setup>
import type { ChatToolCall } from '@veltra/ai'
import { computed } from 'vue'

import type { DisplayColumn, QueryDisplay, RowsResponse, StatsDisplay, StatsResponse } from './api'
import ResultTable from './result-table.vue'

defineOptions({ name: 'QueryCard' })

const props = defineProps<{ toolCall: ChatToolCall }>()

/** 工具入参 / 结果都是序列化 JSON；解析失败按无数据处理（展示加载/错误态） */
const table = computed(() => {
  try {
    return (JSON.parse(props.toolCall.arguments || '{}') as { table?: string }).table ?? ''
  } catch {
    return ''
  }
})

/** 聚合响应（groups）与明细响应按形状分流，各自取 display 展示投影渲染 */
const result = computed<RowsResponse | StatsResponse | null>(() => {
  if (!props.toolCall.result) return null
  try {
    return JSON.parse(props.toolCall.result)
  } catch {
    return null
  }
})

const statsDisplay = computed(() => {
  const value = result.value
  return value && 'groups' in value ? value.display : null
})

const queryDisplay = computed(() => {
  const value = result.value
  return value && !('groups' in value) ? value.display : null
})

/** 聚合维度标签（无分组时为空） */
const dimensionLabel = computed(() =>
  statsDisplay.value ? Object.values(statsDisplay.value.dimensionLabels).join(' / ') : ''
)

/** 分组表列：按首个出现的顺序取 groupRows 的键并集（键已是维度 + 聚合中文标签） */
const groupColumns = computed<DisplayColumn[]>(() => {
  const ordered: string[] = []
  for (const row of statsDisplay.value?.groupRows ?? []) {
    for (const key of Object.keys(row)) {
      if (!ordered.includes(key)) ordered.push(key)
    }
  }
  return ordered.map((key) => ({ name: key, label: key }))
})
</script>

<style scoped lang="scss">
.query-card {
  overflow: hidden;
  border-radius: var(--u-radius-large);
  border: 1px solid var(--u-border-color);
  padding: 12px 14px;
  background: var(--u-bg-color-top);
}

.query-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.query-card__tip {
  font-size: 13px;
}
</style>
