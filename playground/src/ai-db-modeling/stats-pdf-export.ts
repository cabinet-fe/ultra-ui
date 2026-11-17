/**
 * 统计报告 PDF 导出链路（pdf-lib 原生文字 + 图表 JPEG 位图混排）：
 * 图表位图采集（临时提升采样密度 + 主题底色填充转 JPEG）与 P1 排版计划（stats-pdf-layout）的渲染都在本模块；
 * pdf-lib / pdf-fontkit 仅在导出点击时动态 import（不进首屏 chunk），字体运行时 fetch public/（走浏览器 HTTP 缓存）。
 * 任一步失败抛中文 Error，由调用方（stats-report.vue）就地提示。
 */

import type Chart from 'chart.js/auto'

import type { RenderStatsInput } from './render-stats-input'
import {
  CHART_TITLE_FONT_SIZE_PT,
  CHART_TITLE_LINE_HEIGHT_PT,
  PDF_PAGE_HEIGHT_PT,
  PDF_PAGE_WIDTH_PT,
  SUMMARY_FONT_SIZE_PT,
  SUMMARY_LINE_HEIGHT_PT,
  planStatsPdf
} from './stats-pdf-layout'

/** 字体静态资源（public/，构建时原样拷贝，不经打包器进 JS 产物） */
const FONT_URL = '/fonts/NotoSansSC-Regular.otf'

/** 图表位图 JPEG 质量与导出采样密度（不低于 2x 且不劣化设备原生 DPR） */
const JPEG_QUALITY = 0.85
const MIN_CHART_DENSITY = 2

/** 行盒高按字号区分：摘要 1.6 倍、图题 1.5 倍（与排版计划同口径） */
const LINE_HEIGHT_BY_SIZE: ReadonlyMap<number, number> = new Map([
  [SUMMARY_FONT_SIZE_PT, SUMMARY_LINE_HEIGHT_PT],
  [CHART_TITLE_FONT_SIZE_PT, CHART_TITLE_LINE_HEIGHT_PT]
])

export interface ExportStatsPdfOptions {
  input: RenderStatsInput
  /** 渲染中的 Chart 实例，仅用于临时提升 / 恢复位图采样密度 */
  charts: Chart[]
  /** 与 input.charts 平行的画布（v-for 函数 ref 收集），位图采集与宽高比都以此为准 */
  canvases: ReadonlyArray<HTMLCanvasElement | null>
  /** 主题底色（面板 token 解析后的 CSS 色），页面矩形与位图底色共用 */
  backgroundColor: string
  /** 主题文字色（CSS 色） */
  textColor: string
}

/** 解析 computed style 的 rgb()/rgba() 色值为 0~1 分量（JPEG 与 PDF 均无半透明需求，alpha 直接丢弃） */
function parseCssColor(color: string): { r: number; g: number; b: number } {
  const match = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(color)
  if (!match) throw new Error(`无法解析主题颜色：${color}`)
  return { r: Number(match[1]) / 255, g: Number(match[2]) / 255, b: Number(match[3]) / 255 }
}

/** 等两个 rAF：Chart 重绘经 animator 在 rAF 调度，确保位图采集拿到新密度画布 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
}

/** 单图画布 → 底色填充 + 贴图的 JPEG Blob（JPEG 无 alpha，透明底会压成黑，必须先铺底色） */
async function canvasToJpeg(canvas: HTMLCanvasElement, background: string): Promise<Blob> {
  const offscreen = document.createElement('canvas')
  offscreen.width = canvas.width
  offscreen.height = canvas.height
  const context = offscreen.getContext('2d')
  if (!context) throw new Error('创建位图导出画布失败')
  context.fillStyle = background
  context.fillRect(0, 0, offscreen.width, offscreen.height)
  context.drawImage(canvas, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) =>
    offscreen.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  )
  if (!blob) throw new Error('图表位图 JPEG 编码失败')
  return blob
}

/**
 * 以导出采样密度重灌图表并采集 JPEG 位图，导出完恢复设备 DPR。
 * devicePixelRatio 必须写入 chart.config.options（原始配置）再 update+resize
 * 重建 backing store——直接写 chart.options 会被 resolved 代理在 update 时丢弃。
 */
async function captureChartJpegs(
  charts: Chart[],
  canvases: ReadonlyArray<HTMLCanvasElement | null>,
  background: string
): Promise<(Blob | null)[]> {
  const density = Math.max(MIN_CHART_DENSITY, window.devicePixelRatio)
  for (const chart of charts) {
    if (chart.config.options) chart.config.options.devicePixelRatio = density
  }
  try {
    for (const chart of charts) chart.update()
    for (const chart of charts) chart.resize()
    await nextFrame()
    return await Promise.all(
      canvases.map(async (canvas) => (canvas ? canvasToJpeg(canvas, background) : null))
    )
  } finally {
    for (const chart of charts) {
      if (chart.config.options) chart.config.options.devicePixelRatio = window.devicePixelRatio
    }
    for (const chart of charts) chart.update()
    for (const chart of charts) chart.resize()
  }
}

/** fetch 字体为 ArrayBuffer；网络失败 / 非 2xx 都抛中文错误（就地提示，不静默） */
async function loadFontBytes(): Promise<ArrayBuffer> {
  let response: Response
  try {
    response = await fetch(FONT_URL)
  } catch (error) {
    throw new Error(`加载字体失败：${error instanceof Error ? error.message : String(error)}`)
  }
  if (!response.ok) throw new Error(`加载字体失败（HTTP ${response.status}）`)
  return response.arrayBuffer()
}

/**
 * 导出统计报告 PDF：P1 排版计划 + pdf-lib 渲染（每页主题底色矩形、drawText 真文字、embedJpg 图表位图）。
 * 文字可选中 / 复制 / 搜索，CJK 字体按用字子集化嵌入（subset: true）控体积。
 */
export async function exportStatsPdf(options: ExportStatsPdfOptions): Promise<Blob> {
  const { input, charts, canvases, backgroundColor, textColor } = options
  const bg = parseCssColor(backgroundColor)
  const ink = parseCssColor(textColor)
  // 位图底色重写为不透明 rgb()：半透明 token 直接压 JPEG 会混入黑色
  const bitmapBackground = `rgb(${Math.round(bg.r * 255)}, ${Math.round(bg.g * 255)}, ${Math.round(bg.b * 255)})`
  const jpegs = await captureChartJpegs(charts, canvases, bitmapBackground)

  const [{ PDFDocument, rgb }, fontkitModule] = await Promise.all([
    import('pdf-lib'),
    import('pdf-fontkit')
  ])
  // pdf-fontkit 的 d.ts 只声明具名导出，运行时（ES / UMD）均为 default 导出：取 default 兜底命名空间，兼容 CJS interop
  type FontkitModule = typeof import('pdf-fontkit')
  const fontkit =
    (fontkitModule as FontkitModule & { default?: FontkitModule }).default ?? fontkitModule

  const fontBytes = await loadFontBytes()
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  let font: Awaited<ReturnType<typeof pdf.embedFont>>
  try {
    font = await pdf.embedFont(fontBytes, { subset: true })
  } catch (error) {
    throw new Error(`嵌入字体失败：${error instanceof Error ? error.message : String(error)}`)
  }
  // 基线定位用的字体度量：fontkit 惰性解析，只读 hhea 表，代价可忽略
  const metrics = fontkit.create(new Uint8Array(fontBytes))
  const ascentEm = metrics.ascent / metrics.unitsPerEm
  const heightEm = (metrics.ascent - metrics.descent) / metrics.unitsPerEm

  const plan = planStatsPdf(input, {
    measure: (text, size) => font.widthOfTextAtSize(text, size),
    // 画布缺失（理论上只在挂载过渡期）按 1：与排版计划缺省宽高比同口径
    chartAspectRatios: canvases.map((canvas) => (canvas ? canvas.width / canvas.height : 1))
  })

  const images = await Promise.all(
    jpegs.map(async (jpeg) => (jpeg ? pdf.embedJpg(await jpeg.arrayBuffer()) : null))
  )

  for (const ops of plan) {
    const page = pdf.addPage([PDF_PAGE_WIDTH_PT, PDF_PAGE_HEIGHT_PT])
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PDF_PAGE_WIDTH_PT,
      height: PDF_PAGE_HEIGHT_PT,
      color: rgb(bg.r, bg.g, bg.b)
    })
    for (const op of ops) {
      if (op.type === 'text') {
        // 行盒内垂直居中：上下各留半行距，基线 = 盒顶 + 半行距 + ascent；y 轴换算到 pdf-lib 的左下角原点
        const lineHeight = LINE_HEIGHT_BY_SIZE.get(op.fontSize) ?? op.fontSize * 1.5
        const baseline = op.y + (lineHeight - op.fontSize * heightEm) / 2 + op.fontSize * ascentEm
        page.drawText(op.text, {
          x: op.x,
          y: PDF_PAGE_HEIGHT_PT - baseline,
          size: op.fontSize,
          font,
          color: rgb(ink.r, ink.g, ink.b)
        })
      } else {
        const image = images[op.chartIndex]
        if (image) {
          page.drawImage(image, {
            x: op.x,
            y: PDF_PAGE_HEIGHT_PT - op.y - op.height,
            width: op.width,
            height: op.height
          })
        }
      }
    }
  }

  // pdf.save() 的返回是 Uint8Array<ArrayBufferLike>（TS 侧不满足 BlobPart），底层为精确尺寸的整段 buffer
  return new Blob([(await pdf.save()).buffer as ArrayBuffer], { type: 'application/pdf' })
}
