<template>
  <div class="stats-report">
    <template v-if="input">
      <p class="stats-report__summary">{{ input.summary }}</p>
      <div v-for="(chart, index) in input.charts" :key="index" class="stats-report__chart">
        <div v-if="chart.title" class="stats-report__chart-title">{{ chart.title }}</div>
        <div class="stats-report__chart-body">
          <canvas :ref="(el) => setCanvas(index, el)"></canvas>
        </div>
      </div>
    </template>

    <div v-else-if="toolCall.status === 'error'" class="stats-report__tip">
      统计报告生成失败：{{ toolCall.error }}
    </div>
    <div v-else class="stats-report__tip">正在生成统计报告…</div>
  </div>
</template>

<script lang="ts" setup>
import type { ChatToolCall } from '@veltra/ai'
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js/auto'
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'

import type { ChartSpec, RenderStatsInput } from './render-stats-input'

defineOptions({ name: 'StatsReport' })

const props = defineProps<{ toolCall: ChatToolCall }>()

/**
 * 渲染载荷在工具入参（非结果）里，由 AI 按查询结果组装；
 * 流式未完成时 JSON 解析失败，按生成中态展示。
 */
const input = computed<RenderStatsInput | null>(() => {
  try {
    return JSON.parse(props.toolCall.arguments || 'null') as RenderStatsInput | null
  } catch {
    return null
  }
})

/** 图表画布：v-for 函数 ref 按 index 收集（更新时重灌、卸载时销毁 Chart 实例） */
const canvases: (HTMLCanvasElement | null)[] = []

function setCanvas(index: number, el: unknown) {
  canvases[index] = (el as HTMLCanvasElement | null) ?? null
}

const charts: Chart[] = []

/** 单图配置：pie 取首个系列；bar / line 多系列，第二系列起挂右侧副轴（沿用 stats 卡片口径） */
function buildChartConfig(chart: ChartSpec, color: string): ChartConfiguration {
  const { labels, series } = chart.data
  if (chart.type === 'pie') {
    return {
      type: 'pie',
      data: { labels, datasets: [{ label: series[0].name, data: series[0].values }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color } } }
      }
    }
  }
  const secondary = series.length > 1
  return {
    type: chart.type,
    data: {
      labels,
      datasets: series.map((item, index) => {
        const dataset = { label: item.name, data: item.values, borderWidth: 2 }
        if (secondary && index > 0) Object.assign(dataset, { yAxisID: 'y1' })
        if (chart.type === 'line') Object.assign(dataset, { pointRadius: 3, tension: 0.25 })
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
}

function destroyCharts() {
  for (const chart of charts) chart.destroy()
  charts.length = 0
}

function renderCharts() {
  destroyCharts()
  const specs = input.value?.charts ?? []
  canvases.length = specs.length
  for (const [index, spec] of specs.entries()) {
    const canvas = canvases[index]
    if (!canvas) continue
    // 坐标轴 / 图例文字跟随主题文字色（图表不随主题热切换，重建即刷新）
    charts.push(new Chart(canvas, buildChartConfig(spec, getComputedStyle(canvas).color)))
  }
}

onMounted(renderCharts)
watch(
  () => props.toolCall.arguments,
  () => nextTick(renderCharts)
)
onBeforeUnmount(destroyCharts)
</script>

<style scoped lang="scss">
.stats-report {
  overflow: hidden;
  border-radius: var(--u-radius-large);
  border: 1px solid var(--u-border-color);
  padding: 12px 14px;
  background: var(--u-bg-color-top);
}

.stats-report__summary {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.6;
}

.stats-report__chart {
  margin-top: 12px;
}

.stats-report__chart-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
}

.stats-report__chart-body {
  height: 240px;
}

.stats-report__tip {
  font-size: 13px;
}
</style>
