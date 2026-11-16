<template>
  <div class="stats-report">
    <template v-if="input">
      <!-- 导出目标：内容区（摘要 + 图表）外加内边距，不含下方导出入口 -->
      <div ref="captureRef" class="stats-report__capture">
        <p class="stats-report__summary">{{ input.summary }}</p>
        <div v-for="(chart, index) in input.charts" :key="index" class="stats-report__chart">
          <div v-if="chart.title" class="stats-report__chart-title">{{ chart.title }}</div>
          <div class="stats-report__chart-body">
            <canvas :ref="(el) => setCanvas(index, el)"></canvas>
          </div>
        </div>
      </div>
      <div class="stats-report__actions">
        <button type="button" class="stats-report__export" :disabled="exporting" @click="exportPng">
          导出 PNG
        </button>
        <button type="button" class="stats-report__export" :disabled="exporting" @click="exportPdf">
          导出 PDF
        </button>
        <span v-if="exportError" class="stats-report__error">{{ exportError }}</span>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

/** 导出目标（带内边距的内容区 ref）；导出中禁用入口防重复触发，失败就地提示不静默 */
const captureRef = ref<HTMLElement | null>(null)
const exporting = ref(false)
const exportError = ref('')

/** 导出采样倍数：3 倍下贴到 A4 内容宽约 300 DPI */
const EXPORT_PIXEL_RATIO = 3

/** 等两个 rAF：Chart 重绘经 animator 在 rAF 调度，确保截图拿到新位图 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
}

/**
 * 以导出采样倍数重灌图表位图并执行截图，导出完还原设备 DPR。
 * devicePixelRatio 必须写入 chart.config.options（原始配置）再 update+resize
 * 重建 backing store——直接写 chart.options 会被 resolved 代理在 update 时丢弃。
 */
async function captureWithChartDensity(capture: () => Promise<string>): Promise<string> {
  for (const chart of charts) {
    if (chart.config.options) chart.config.options.devicePixelRatio = EXPORT_PIXEL_RATIO
  }
  try {
    for (const chart of charts) chart.update()
    for (const chart of charts) chart.resize()
    await nextFrame()
    return await capture()
  } finally {
    for (const chart of charts) {
      if (chart.config.options) chart.config.options.devicePixelRatio = window.devicePixelRatio
    }
    for (const chart of charts) chart.update()
    for (const chart of charts) chart.resize()
  }
}

/** 生成报告快照 PNG dataURL；html-to-image 仅在导出点击时动态 import（不进首屏 chunk） */
async function captureReport(): Promise<string> {
  const { toPng } = await import('html-to-image')
  const capture = captureRef.value
  if (!capture) throw new Error('报告内容尚未渲染')
  const card = capture.parentElement
  return captureWithChartDensity(() =>
    toPng(capture, {
      // 内容区自身无背景，跟随卡片背景色（暗色主题导出同为暗底）
      backgroundColor: card ? getComputedStyle(card).backgroundColor : undefined,
      pixelRatio: EXPORT_PIXEL_RATIO
    })
  )
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function exportPng() {
  exporting.value = true
  exportError.value = ''
  try {
    downloadDataUrl(await captureReport(), '统计报告.png')
  } catch (error) {
    exportError.value = `导出 PNG 失败：${errorMessage(error)}`
  } finally {
    exporting.value = false
  }
}

/** PDF 版式：A4 纵向 + 四周页边距，内容按页宽等比贴图，超出一页纵向切片分页 */
const PDF_PAGE = { widthMm: 210, heightMm: 297, marginMm: 15 }

async function exportPdf() {
  exporting.value = true
  exportError.value = ''
  try {
    const dataUrl = await captureReport()
    // 先解码取图片像素尺寸，再换算毫米贴图坐标（jspdf 仅在导出点击时动态 import）
    const image = new Image()
    image.src = dataUrl
    await image.decode()
    const { widthMm, heightMm, marginMm } = PDF_PAGE
    const contentWidthMm = widthMm - marginMm * 2
    const contentHeightMm = heightMm - marginMm * 2
    // 一页可容纳的源图像素高，超出部分切到后续页
    const pageSourceHeightPx = Math.floor((image.naturalWidth * contentHeightMm) / contentWidthMm)
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    for (let offset = 0; offset < image.naturalHeight; offset += pageSourceHeightPx) {
      const sliceHeightPx = Math.min(pageSourceHeightPx, image.naturalHeight - offset)
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = sliceHeightPx
      canvas.getContext('2d')?.drawImage(image, 0, -offset)
      if (offset > 0) pdf.addPage()
      const sliceHeightMm = (sliceHeightPx / image.naturalWidth) * contentWidthMm
      // jsPDF 直收 canvas 元素，省每页 toDataURL 的内存峰值
      pdf.addImage(canvas, 'PNG', marginMm, marginMm, contentWidthMm, sliceHeightMm)
    }
    pdf.save('统计报告.pdf')
  } catch (error) {
    exportError.value = `导出 PDF 失败：${errorMessage(error)}`
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped lang="scss">
.stats-report {
  overflow: hidden;
  border-radius: var(--u-radius-large);
  border: 1px solid var(--u-border-color);
  padding: 12px 14px;
  background: var(--u-bg-color-top);
}

.stats-report__capture {
  padding: 16px;
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

.stats-report__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.stats-report__export {
  padding: 3px 12px;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-default);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 20px;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--u-color-primary);
    border-color: var(--u-color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.stats-report__error {
  color: var(--u-color-danger);
  font-size: 12px;
}

.stats-report__tip {
  font-size: 13px;
}
</style>
