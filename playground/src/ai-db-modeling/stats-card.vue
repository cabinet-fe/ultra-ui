<template>
  <div class="stats-card">
    <template v-if="result">
      <div class="stats-card__meta">
        <span>表 {{ query.table }}</span>
        <span v-if="dimensionLabel">{{ dimensionLabel }}</span>
        <span>{{ result.groups.length }} 组 / {{ result.rows.length }} 行明细</span>
      </div>

      <div v-if="result.groups.length" class="stats-card__chart">
        <canvas ref="canvasEl"></canvas>
      </div>
      <div v-else class="stats-card__tip">过滤条件下无命中数据</div>

      <div v-if="columns.length" class="stats-card__table-wrap">
        <table class="stats-card__table">
          <thead>
            <tr>
              <th v-for="column in columns" :key="column">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in displayRows" :key="index">
              <td v-for="column in columns" :key="column">{{ formatValue(row[column]) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="result.rows.length > displayRows.length" class="stats-card__more">
          仅展示前 {{ displayRows.length }} 行，共 {{ result.rows.length }} 行
        </div>
      </div>
    </template>

    <div v-else-if="toolCall.status === 'error'" class="stats-card__tip">
      统计失败：{{ toolCall.error }}
    </div>
    <div v-else class="stats-card__tip">正在统计分析…</div>
  </div>
</template>

<script lang="ts" setup>
import type { ChatToolCall } from '@veltra/ai'
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js/auto'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import type { AggregationSpec, RowValue, StatsQuery, StatsResult } from './api'

defineOptions({ name: 'StatsCard' })

/** 明细表最多展示行数（超出折叠提示，避免长表撑爆卡片） */
const MAX_ROWS = 50

const props = defineProps<{ toolCall: ChatToolCall }>()

/** 工具入参 / 结果都是序列化 JSON；解析失败按无数据处理（展示加载/错误态） */
const query = computed<StatsQuery | null>(() => {
  try {
    return JSON.parse(props.toolCall.arguments || '{}') as StatsQuery
  } catch {
    return null
  }
})

const result = computed<StatsResult | null>(() => {
  if (!props.toolCall.result) return null
  try {
    return JSON.parse(props.toolCall.result) as StatsResult
  } catch {
    return null
  }
})

/** 分组维度标签（无分组时为空） */
const dimensionLabel = computed(() => query.value?.groupBy?.join(' / ') ?? '')

/** 明细列：按首个出现的顺序取全量行的键并集 */
const columns = computed(() => {
  const ordered: string[] = []
  for (const row of result.value?.rows ?? []) {
    for (const key of Object.keys(row)) {
      if (!ordered.includes(key)) ordered.push(key)
    }
  }
  return ordered
})

const displayRows = computed(() => result.value?.rows.slice(0, MAX_ROWS) ?? [])

function formatValue(value: RowValue | undefined): string {
  if (value === null || value === undefined) return '空'
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

/** 聚合的 values 键（契约：count 或 `${func}__${column}`） */
function aggregationKey({ func, column }: AggregationSpec): string {
  return column ? `${func}__${column}` : 'count'
}

function aggregationLabel({ func, column }: AggregationSpec): string {
  return column ? `${func}(${column})` : func
}

/** 单维度且值全为日期（YYYY-MM-DD）时用折线看趋势，否则柱状对比 */
const chartType = computed<'bar' | 'line'>(() => {
  const [dimension] = query.value?.groupBy ?? []
  const groups = result.value?.groups ?? []
  if (!dimension || groups.length === 0) return 'bar'
  return groups.every((group) => /^\d{4}-\d{2}-\d{2}$/.test(String(group.key[dimension] ?? '')))
    ? 'line'
    : 'bar'
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
const chart = shallowRef<Chart | null>(null)

function renderChart() {
  const groups = result.value?.groups
  const aggregations = query.value?.aggregations
  if (!canvasEl.value || !groups?.length || !aggregations?.length) return

  chart.value?.destroy()
  // 坐标轴 / 图例文字跟随主题文字色（图表不随主题热切换，重建即刷新）
  const color = getComputedStyle(canvasEl.value).color
  // 多组聚合量纲常悬殊（如 count 与 sum）：第二个系列起挂右侧副轴，避免小值柱不可见
  const secondary = aggregations.length > 1
  const config: ChartConfiguration = {
    type: chartType.value,
    data: {
      labels: groups.map(
        (group) =>
          Object.values(group.key)
            .map((value) => formatValue(value))
            .join(' / ') || '全部'
      ),
      datasets: aggregations.map((aggregation, index) => {
        const dataset = {
          label: aggregationLabel(aggregation),
          data: groups.map((group) => group.values[aggregationKey(aggregation)] ?? 0),
          borderWidth: 2
        }
        if (secondary && index > 0) Object.assign(dataset, { yAxisID: 'y1' })
        if (chartType.value === 'line') Object.assign(dataset, { pointRadius: 3, tension: 0.25 })
        return dataset
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color } } },
      scales: {
        x: { ticks: { color } },
        y: { ticks: { color }, grid: { color: 'rgb(128 128 128 / 20%)' } },
        ...(secondary
          ? { y1: { position: 'right', ticks: { color }, grid: { drawOnChartArea: false } } }
          : {})
      }
    }
  }
  chart.value = new Chart(canvasEl.value, config)
}

onMounted(renderChart)
watch(
  () => props.toolCall.result,
  () => nextTick(renderChart)
)
onBeforeUnmount(() => chart.value?.destroy())
</script>

<style scoped lang="scss">
.stats-card {
  overflow: hidden;
  border-radius: var(--u-radius-large);
  border: 1px solid var(--u-border-color);
  padding: 12px 14px;
  background: var(--u-bg-color-top);
}

.stats-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.stats-card__chart {
  height: 240px;
}

.stats-card__tip {
  font-size: 13px;
}

.stats-card__table-wrap {
  margin-top: 10px;
  overflow-x: auto;
}

.stats-card__table {
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

.stats-card__more {
  margin-top: 6px;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
