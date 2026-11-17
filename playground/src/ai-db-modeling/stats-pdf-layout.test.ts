import { describe, expect, it } from 'vite-plus/test'

import type { ChartSpec, RenderStatsInput } from './render-stats-input'
import type { ImageOp, PdfDrawOp, TextOp } from './stats-pdf-layout'
import {
  CHART_TITLE_FONT_SIZE_PT,
  CHART_TITLE_LINE_HEIGHT_PT,
  PDF_CONTENT_HEIGHT_PT,
  PDF_CONTENT_WIDTH_PT,
  PDF_MARGIN_PT,
  SUMMARY_FONT_SIZE_PT,
  SUMMARY_LINE_HEIGHT_PT,
  TITLE_IMAGE_GAP_PT,
  planStatsPdf
} from './stats-pdf-layout'

/** 等宽度量 stub：每字符宽 fontSize / 2 pt（CJK 与拉丁同宽） */
const measure = (text: string, fontSize: number) => text.length * fontSize * 0.5

const CONTENT_BOTTOM = PDF_MARGIN_PT + PDF_CONTENT_HEIGHT_PT
const EPSILON = 1e-6

function textOps(pages: PdfDrawOp[][]): TextOp[] {
  return pages.flat().filter((op): op is TextOp => op.type === 'text')
}

function imageOps(pages: PdfDrawOp[][]): ImageOp[] {
  return pages.flat().filter((op): op is ImageOp => op.type === 'image')
}

/** 去全部空白后比较：折行在换行点丢弃的空格不算丢字 */
const squeeze = (text: string) => text.replace(/\s+/g, '')

function makeInput(summary: string, charts: ChartSpec[]): RenderStatsInput {
  return { summary, charts }
}

/** 最小合法图表（布局只消费 title，数据形状对齐 ChartSpec） */
function chart(partial: { title?: string } = {}): ChartSpec {
  return {
    type: 'bar',
    ...partial,
    data: { labels: ['甲'], series: [{ name: '系列', values: [1] }] }
  }
}

describe('planStatsPdf 折行', () => {
  it('中英混排长摘要逐行不超内容宽、不丢字，换行符硬分断保留', () => {
    const sentence = '2026 年 Q3 各会员等级 total revenue 增长 62.5%，黄金会员贡献 480 万元。'
    const summary = `${sentence.repeat(8)}\n尾行结论`
    const lines = textOps(planStatsPdf(makeInput(summary, []), { measure }))
    expect(lines.length).toBeGreaterThanOrEqual(5)
    for (const line of lines) {
      expect(line.fontSize).toBe(SUMMARY_FONT_SIZE_PT)
      expect(measure(line.text, SUMMARY_FONT_SIZE_PT)).toBeLessThanOrEqual(
        PDF_CONTENT_WIDTH_PT + EPSILON
      )
    }
    expect(squeeze(lines.map((line) => line.text).join(''))).toBe(squeeze(summary))
    expect(lines.at(-1)?.text).toBe('尾行结论')
    expect(lines[0]).toMatchObject({ x: PDF_MARGIN_PT, y: PDF_MARGIN_PT })
  })

  it('超长拉丁串整词超宽时按字符硬拆，仍不超宽不丢字', () => {
    const summary = `前置说明 revenue${'0'.repeat(200)} 结束`
    const lines = textOps(planStatsPdf(makeInput(summary, []), { measure }))
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(measure(line.text, SUMMARY_FONT_SIZE_PT)).toBeLessThanOrEqual(
        PDF_CONTENT_WIDTH_PT + EPSILON
      )
    }
    expect(squeeze(lines.map((line) => line.text).join(''))).toBe(squeeze(summary))
  })

  it('超长摘要行级流式跨页：每页从页边距顶格续排、行不越出内容区且不丢字', () => {
    const summary = '甲'.repeat(5000)
    const plan = planStatsPdf(makeInput(summary, []), { measure })
    expect(plan.length).toBeGreaterThanOrEqual(2)
    for (const page of plan) {
      expect(page[0]).toMatchObject({ type: 'text', x: PDF_MARGIN_PT, y: PDF_MARGIN_PT })
    }
    const lines = textOps(plan)
    expect(squeeze(lines.map((line) => line.text).join(''))).toBe(summary)
    for (const line of lines) {
      expect(measure(line.text, SUMMARY_FONT_SIZE_PT)).toBeLessThanOrEqual(
        PDF_CONTENT_WIDTH_PT + EPSILON
      )
      expect(line.y + SUMMARY_LINE_HEIGHT_PT).toBeLessThanOrEqual(CONTENT_BOTTOM + EPSILON)
    }
  })
})

describe('planStatsPdf 分页', () => {
  it('图表为原子块：放不下整体移入下一页，图不跨页切割', () => {
    const plan = planStatsPdf(
      makeInput('订单概览', [
        chart(), // 无 title，宽高比缺省按正方形
        chart({ title: '各等级订单金额与订单数对比（单位：万元 / 单）' }),
        chart() // 宽高比 2.5 的宽图，仍能放入第 2 页剩余空间
      ]),
      { measure, chartAspectRatios: [undefined, 1, 2.5] }
    )
    expect(plan).toHaveLength(2)
    // 第 1 页：摘要行 + 图 0；第 2 页：图 1（图题 + 图）+ 图 2
    const chartIndexes = (page: PdfDrawOp[]) =>
      page.flatMap((op) => (op.type === 'image' ? [op.chartIndex] : []))
    expect(chartIndexes(plan[0])).toEqual([0])
    expect(chartIndexes(plan[1])).toEqual([1, 2])
    const images = imageOps(plan)
    expect(images).toHaveLength(3) // 每图一个占位，不切片
    for (const image of images) {
      expect(image.height).toBeLessThanOrEqual(PDF_CONTENT_HEIGHT_PT + EPSILON)
      expect(image.y + image.height).toBeLessThanOrEqual(CONTENT_BOTTOM + EPSILON)
    }
    // 缺省宽高比：正方形，高等于内容宽
    expect(images[0].height).toBeCloseTo(PDF_CONTENT_WIDTH_PT, 6)
    // 图 1 图题（唯一的 11pt 文本行）在第 2 页、位于图上方
    const titles = textOps(plan).filter((op) => op.fontSize === CHART_TITLE_FONT_SIZE_PT)
    expect(titles).toHaveLength(1)
    const image1 = images.find((image) => image.chartIndex === 1)
    expect(titles[0].text).toContain('各等级订单金额')
    expect(titles[0].y).toBeLessThan(image1!.y)
  })

  it('无 title 与空 title 图表不产生图题文本行；非法宽高比回退正方形', () => {
    const plan = planStatsPdf(makeInput('概览', [chart(), chart({ title: '' })]), {
      measure,
      chartAspectRatios: [0, -3]
    })
    expect(textOps(plan).filter((op) => op.fontSize === CHART_TITLE_FONT_SIZE_PT)).toHaveLength(0)
    expect(imageOps(plan)).toHaveLength(2)
    for (const image of imageOps(plan)) {
      expect(image.height).toBeCloseTo(PDF_CONTENT_WIDTH_PT, 6)
    }
  })

  it('图高超单页内容高时等比缩到页容高并水平居中', () => {
    const plan = planStatsPdf(makeInput('概览', [chart()]), { measure, chartAspectRatios: [0.2] })
    // 摘要占首页首行，整块放不下移入第 2 页顶格
    expect(plan).toHaveLength(2)
    const [image] = imageOps(plan)
    expect(image.height).toBeCloseTo(PDF_CONTENT_HEIGHT_PT, 6)
    expect(image.width / image.height).toBeCloseTo(0.2, 6)
    expect(image.y).toBeCloseTo(PDF_MARGIN_PT, 6)
    expect(image.x).toBeCloseTo(PDF_MARGIN_PT + (PDF_CONTENT_WIDTH_PT - image.width) / 2, 6)
  })

  it('带图题的超高图等比缩小并预留图题高度', () => {
    const plan = planStatsPdf(makeInput('概览', [chart({ title: '超高图' })]), {
      measure,
      chartAspectRatios: [0.5]
    })
    const [image] = imageOps(plan)
    const expectedHeight = PDF_CONTENT_HEIGHT_PT - CHART_TITLE_LINE_HEIGHT_PT - TITLE_IMAGE_GAP_PT
    expect(image.height).toBeCloseTo(expectedHeight, 6)
    expect(image.width / image.height).toBeCloseTo(0.5, 6)
  })

  it('超长图题同样折行：逐行不超宽不丢字，图题与图片间距衔接', () => {
    const title = '甲'.repeat(300)
    const plan = planStatsPdf(makeInput('见下图', [chart({ title })]), { measure })
    const titles = textOps(plan).filter((op) => op.fontSize === CHART_TITLE_FONT_SIZE_PT)
    expect(titles).toHaveLength(
      Math.ceil(measure(title, CHART_TITLE_FONT_SIZE_PT) / PDF_CONTENT_WIDTH_PT)
    )
    for (const op of titles) {
      expect(measure(op.text, CHART_TITLE_FONT_SIZE_PT)).toBeLessThanOrEqual(
        PDF_CONTENT_WIDTH_PT + EPSILON
      )
    }
    expect(squeeze(titles.map((op) => op.text).join(''))).toBe(title)
    for (const [index, op] of titles.entries()) {
      if (index > 0) expect(op.y - titles[index - 1].y).toBeCloseTo(CHART_TITLE_LINE_HEIGHT_PT, 6)
    }
    const [image] = imageOps(plan)
    expect(image.y).toBeCloseTo(
      titles[0].y + titles.length * CHART_TITLE_LINE_HEIGHT_PT + TITLE_IMAGE_GAP_PT,
      6
    )
  })

  it('空 charts：单页仅一条摘要文本操作', () => {
    const plan = planStatsPdf(makeInput('只有摘要', []), { measure })
    expect(plan).toHaveLength(1)
    expect(plan[0]).toHaveLength(1)
    expect(plan[0][0]).toMatchObject({ type: 'text', text: '只有摘要' })
  })

  it('混排完整报告：所有绘制操作均落在内容区内', () => {
    const sentence = '各会员等级 revenue 与订单数 Q3 环比上升 12.5%，详见下图。'
    const plan = planStatsPdf(
      makeInput(sentence.repeat(6), [
        chart({ title: '等级金额对比' }),
        chart({ title: '月度趋势' }),
        chart()
      ]),
      { measure, chartAspectRatios: [1.6, 1, 0.9] }
    )
    expect(plan.length).toBeGreaterThanOrEqual(2)
    for (const op of plan.flat()) {
      expect(op.y).toBeGreaterThanOrEqual(PDF_MARGIN_PT - EPSILON)
      if (op.type === 'text') {
        expect(op.x).toBeCloseTo(PDF_MARGIN_PT, 6)
        expect(measure(op.text, op.fontSize)).toBeLessThanOrEqual(PDF_CONTENT_WIDTH_PT + EPSILON)
        expect(op.y + op.fontSize).toBeLessThanOrEqual(CONTENT_BOTTOM + EPSILON)
      } else {
        expect(op.x).toBeGreaterThanOrEqual(PDF_MARGIN_PT - EPSILON)
        expect(op.x + op.width).toBeLessThanOrEqual(PDF_MARGIN_PT + PDF_CONTENT_WIDTH_PT + EPSILON)
        expect(op.y + op.height).toBeLessThanOrEqual(CONTENT_BOTTOM + EPSILON)
      }
    }
  })
})
