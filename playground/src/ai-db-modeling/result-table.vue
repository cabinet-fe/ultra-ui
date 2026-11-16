<template>
  <div class="result-table">
    <table class="result-table__table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.name">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in visibleRows" :key="index">
          <td v-for="column in columns" :key="column.name">
            {{ formatValue(row[column.name]) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="rows.length > visibleRows.length" class="result-table__more">
      仅展示前 {{ visibleRows.length }} 行，共 {{ rows.length }} 行
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { DisplayColumn, RowData, RowValue } from './api'

defineOptions({ name: 'ResultTable' })

/** 明细表最多展示行数（超出折叠提示，避免长表撑爆卡片） */
const MAX_ROWS = 50

const props = defineProps<{
  /** 展示列（label 为用户可见标题；stats-report 传入时 name 与 label 同为中文键） */
  columns: DisplayColumn[]
  rows: RowData[]
}>()

const visibleRows = computed(() => props.rows.slice(0, MAX_ROWS))

function formatValue(value: RowValue | undefined): string {
  if (value === null || value === undefined) return '空'
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}
</script>

<style scoped lang="scss">
.result-table {
  overflow-x: auto;
}

.result-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th,
  td {
    padding: 4px 10px;
    border: 1px solid var(--u-border-color);
    text-align: left;
    white-space: nowrap;
  }

  th {
    color: var(--u-text-color-second);
    font-weight: 500;
  }
}

.result-table__more {
  margin-top: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
