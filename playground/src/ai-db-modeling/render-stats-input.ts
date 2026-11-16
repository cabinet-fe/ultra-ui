/**
 * `renderStats` 入参校验纯函数（无 Vue / fetch 依赖，供工具 execute 与测试使用）。
 * 入参由 AI 按查询结果组装，校验失败抛中文错误回灌模型自行修正。
 */

/** 图表类型全集 */
export const CHART_TYPES = ['bar', 'line', 'pie'] as const
export type ChartType = (typeof CHART_TYPES)[number]

/** 图表数据系列 */
export interface ChartSeries {
  name: string
  values: number[]
}

/** 单个图表：类型 + 可选标题 + 分类标签与多系列数值 */
export interface ChartSpec {
  type: ChartType
  title?: string
  data: { labels: string[]; series: ChartSeries[] }
}

/** renderStats 入参契约：摘要 + 明细行 + 多图表 */
export interface RenderStatsInput {
  summary: string
  rawData: Record<string, unknown>[]
  charts: ChartSpec[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

/** 校验单个图表；返回 null 表示通过 */
function checkChart(input: unknown, at: string): string | null {
  if (!isRecord(input)) return `${at} 必须是 JSON 对象`
  if (typeof input.type !== 'string' || !CHART_TYPES.includes(input.type as ChartType)) {
    return `${at}.type 必须是 ${CHART_TYPES.join(' / ')} 之一`
  }
  if (input.title !== undefined && typeof input.title !== 'string') {
    return `${at}.title 必须是字符串`
  }
  const data = input.data
  if (!isRecord(data)) return `${at}.data 必须是 JSON 对象`
  if (!isStringArray(data.labels)) return `${at}.data.labels 必须是字符串数组`
  if (!Array.isArray(data.series) || data.series.length === 0) {
    return `${at}.data.series 必须是非空数组`
  }
  for (const [index, series] of data.series.entries()) {
    const seriesAt = `${at}.data.series[${index}]`
    if (!isRecord(series)) return `${seriesAt} 必须是 JSON 对象`
    if (typeof series.name !== 'string') return `${seriesAt}.name 必须是字符串`
    if (!isNumberArray(series.values)) return `${seriesAt}.values 必须是数字数组`
    if (series.values.length !== data.labels.length) {
      return `${seriesAt}.values 长度必须与 ${at}.data.labels 一致（${series.values.length} ≠ ${data.labels.length}）`
    }
  }
  return null
}

/**
 * 校验 renderStats 入参：summary 必填非空字符串；rawData 为对象数组；
 * charts 为数组且每项 type 受限、labels 为字符串数组、series 非空且 values 与 labels 等长。
 */
export function validateRenderStatsInput(
  input: unknown
): { ok: true; value: RenderStatsInput } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: '入参必须是 JSON 对象' }
  if (typeof input.summary !== 'string' || input.summary.trim() === '') {
    return { ok: false, error: 'summary 必须是非空字符串' }
  }
  if (!Array.isArray(input.rawData) || !input.rawData.every((row) => isRecord(row))) {
    return { ok: false, error: 'rawData 必须是对象数组' }
  }
  if (!Array.isArray(input.charts)) return { ok: false, error: 'charts 必须是数组' }
  for (const [index, chart] of input.charts.entries()) {
    const problem = checkChart(chart, `charts[${index}]`)
    if (problem) return { ok: false, error: problem }
  }
  return { ok: true, value: input as unknown as RenderStatsInput }
}
