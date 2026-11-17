/**
 * 统计报告 PDF 排版计划纯函数（无 pdf-lib / DOM / Vue 依赖）：
 * 输入 `RenderStatsInput` + 注入的文本宽度度量，输出逐页绘制操作列表（文本行 / 图片占位），
 * 供导出层（stats-pdf-export）消费；折行与分页的单测都在本层覆盖。
 * 坐标口径：pt，原点在页面左上角、y 向下；导出层自行换算 pdf-lib 的左下角原点与文字基线。
 */

import type { RenderStatsInput } from './render-stats-input'

/** mm → pt 换算（1mm = 72 / 25.4 pt） */
export const PT_PER_MM = 72 / 25.4

/** A4 纵向页面尺寸（pt） */
export const PDF_PAGE_WIDTH_PT = 595.28
export const PDF_PAGE_HEIGHT_PT = 841.89

/** 四周页边距 15mm；内容区宽 180mm，高 = 页高减上下边距 */
export const PDF_MARGIN_PT = 15 * PT_PER_MM
export const PDF_CONTENT_WIDTH_PT = 180 * PT_PER_MM
export const PDF_CONTENT_HEIGHT_PT = PDF_PAGE_HEIGHT_PT - PDF_MARGIN_PT * 2
const CONTENT_BOTTOM_PT = PDF_MARGIN_PT + PDF_CONTENT_HEIGHT_PT

/** 摘要文字：约 10.5pt、行距约 1.6 */
export const SUMMARY_FONT_SIZE_PT = 10.5
export const SUMMARY_LINE_HEIGHT_PT = SUMMARY_FONT_SIZE_PT * 1.6

/** 图题文字：约 11pt 常规体 */
export const CHART_TITLE_FONT_SIZE_PT = 11
export const CHART_TITLE_LINE_HEIGHT_PT = CHART_TITLE_FONT_SIZE_PT * 1.5

/** 元素间距：摘要与图表、图表与图表之间；图题与图片之间 */
export const ELEMENT_GAP_PT = 9
export const TITLE_IMAGE_GAP_PT = 4.5

/** 文本宽度度量（pt）：导出层注入字体度量，测试注入等宽 stub */
export type MeasureTextWidth = (text: string, fontSize: number) => number

/** 文本行绘制操作：x/y 为行盒左上角，基线由导出层按字体度量换算 */
export interface TextOp {
  type: 'text'
  text: string
  x: number
  y: number
  fontSize: number
}

/** 图片占位绘制操作：矩形 + 指回 `input.charts` 的索引 */
export interface ImageOp {
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  chartIndex: number
}

export type PdfDrawOp = TextOp | ImageOp

/** 排版计划：逐页绘制操作，页序即数组序 */
export type StatsPdfPlan = PdfDrawOp[][]

export interface PlanStatsPdfOptions {
  measure: MeasureTextWidth
  /** 与 charts 平行的图表源位图宽高比（width / height）；缺省或非法按 1（正方形） */
  chartAspectRatios?: number[]
}

/** 折行 token 化：拉丁字母 / 数字连续串为一个 token（整词不断开），其余（CJK、标点、空格）每字一个 */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  let latin = ''
  const flush = () => {
    if (latin) {
      tokens.push(latin)
      latin = ''
    }
  }
  for (const char of text) {
    if (/[A-Za-z0-9]/.test(char)) latin += char
    else {
      flush()
      tokens.push(char)
    }
  }
  flush()
  return tokens
}

/** 单段折行：按度量宽度贪心填充；换行点的空格由换行替代（剔行尾 / 行首空白），超宽单 token 按字符硬拆 */
function wrapSegment(
  segment: string,
  fontSize: number,
  maxWidth: number,
  measure: MeasureTextWidth
): string[] {
  const tokens = tokenize(segment)
  const lines: string[] = []
  let line = ''
  let lineWidth = 0
  for (const token of tokens) {
    const tokenWidth = measure(token, fontSize)
    if (line && lineWidth + tokenWidth > maxWidth) {
      lines.push(line.replace(/\s+$/, ''))
      line = token.replace(/^\s+/, '')
      lineWidth = measure(line, fontSize)
    } else {
      line += token
      lineWidth += tokenWidth
    }
    while (lineWidth > maxWidth && line.length > 1) {
      let keep = line.length - 1
      while (keep > 1 && measure(line.slice(0, keep), fontSize) > maxWidth) keep--
      lines.push(line.slice(0, keep))
      line = line.slice(keep)
      lineWidth = measure(line, fontSize)
    }
  }
  if (line) lines.push(line.replace(/\s+$/, ''))
  return lines
}

/** 文本折行：先按换行符硬分断（空段保留为空行占位），再逐段贪心折行 */
function wrapText(
  text: string,
  fontSize: number,
  maxWidth: number,
  measure: MeasureTextWidth
): string[] {
  return text
    .split('\n')
    .flatMap((segment) =>
      segment === '' ? [''] : wrapSegment(segment, fontSize, maxWidth, measure)
    )
}

/** 宽高比归一：非有限正数按 1（正方形） */
function normalizeAspectRatio(ratio: number | undefined): number {
  return typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0 ? ratio : 1
}

/**
 * 生成统计报告 PDF 排版计划：
 * 摘要行级流式分页（文字行放不下换页）；各图表（图题 + 图片占位）为原子块，
 * 整块放不下移入下一页、图不跨页切割；图高超单页可容高度时等比缩小（预留图题高度）后水平居中。
 */
export function planStatsPdf(input: RenderStatsInput, options: PlanStatsPdfOptions): StatsPdfPlan {
  const { measure } = options
  const pages: StatsPdfPlan = []
  let page: PdfDrawOp[] = []
  let cursor = PDF_MARGIN_PT

  const startPage = () => {
    pages.push(page)
    page = []
    cursor = PDF_MARGIN_PT
  }

  for (const line of wrapText(input.summary, SUMMARY_FONT_SIZE_PT, PDF_CONTENT_WIDTH_PT, measure)) {
    if (page.length > 0 && cursor + SUMMARY_LINE_HEIGHT_PT > CONTENT_BOTTOM_PT) startPage()
    if (line) {
      page.push({
        type: 'text',
        text: line,
        x: PDF_MARGIN_PT,
        y: cursor,
        fontSize: SUMMARY_FONT_SIZE_PT
      })
    }
    cursor += SUMMARY_LINE_HEIGHT_PT
  }

  for (const [index, chart] of input.charts.entries()) {
    const titleLines = chart.title
      ? wrapText(chart.title, CHART_TITLE_FONT_SIZE_PT, PDF_CONTENT_WIDTH_PT, measure)
      : []
    const titleHeight = titleLines.length * CHART_TITLE_LINE_HEIGHT_PT
    const titleGap = titleLines.length > 0 ? TITLE_IMAGE_GAP_PT : 0
    // 单页可容图高：预留图题后的剩余内容高（图题长到挤没图片属病态输入，钳到 0）
    const maxImageHeight = Math.max(0, PDF_CONTENT_HEIGHT_PT - titleHeight - titleGap)
    const aspectRatio = normalizeAspectRatio(options.chartAspectRatios?.[index])
    let imageWidth = PDF_CONTENT_WIDTH_PT
    let imageHeight = imageWidth / aspectRatio
    if (imageHeight > maxImageHeight) {
      imageHeight = maxImageHeight
      imageWidth = imageHeight * aspectRatio
    }
    const blockHeight = titleHeight + titleGap + imageHeight
    // 元素间距只在页内已有内容时生效；整块放不下换页（块高已 ≤ 内容高，新页必能容纳）
    if (cursor > PDF_MARGIN_PT) {
      if (cursor + ELEMENT_GAP_PT + blockHeight > CONTENT_BOTTOM_PT) startPage()
      else cursor += ELEMENT_GAP_PT
    }
    for (const [lineIndex, line] of titleLines.entries()) {
      page.push({
        type: 'text',
        text: line,
        x: PDF_MARGIN_PT,
        y: cursor + lineIndex * CHART_TITLE_LINE_HEIGHT_PT,
        fontSize: CHART_TITLE_FONT_SIZE_PT
      })
    }
    const imageTop = cursor + titleHeight + titleGap
    page.push({
      type: 'image',
      x: PDF_MARGIN_PT + (PDF_CONTENT_WIDTH_PT - imageWidth) / 2,
      y: imageTop,
      width: imageWidth,
      height: imageHeight,
      chartIndex: index
    })
    cursor = imageTop + imageHeight
  }

  pages.push(page)
  return pages
}
