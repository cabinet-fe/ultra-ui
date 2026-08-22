import type {
  BorderLineStyle,
  CellStyle,
  Sheet,
  SheetImage,
  SheetImageType
} from '@veltra/sheet-core'
import { BORDER_SIDES } from '@veltra/sheet-core'

/** 报表打印选项 */
export interface ReportPrintOptions {
  /** 打印文档标题（打印对话框标题 / 另存 PDF 文件名）；缺省取 sheet 名，再回落「报表」 */
  title?: string
  /** 纸张方向（@page size），默认 portrait */
  orientation?: 'portrait' | 'landscape'
}

/**
 * 默认列宽 / 行高（px）：与 grid 层 vtable-theme 的
 * SHEET_DEFAULT_COL_WIDTH / SHEET_DEFAULT_ROW_HEIGHT 对齐；
 * report 内核保持 headless，不引 grid 入口。
 */
const PRINT_DEFAULT_COL_WIDTH = 80
const PRINT_DEFAULT_ROW_HEIGHT = 28

const IMAGE_MIME: Record<SheetImageType, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp'
}

/** 模型边框线型 → CSS 线型（thin/medium/thick 为实线粗细分级，宽度由 edge.width 表达） */
const BORDER_CSS_LINE: Record<BorderLineStyle, string> = {
  thin: 'solid',
  medium: 'solid',
  thick: 'solid',
  dashed: 'dashed',
  dotted: 'dotted'
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;')
}

/** Uint8Array → base64（分块避免栈溢出；btoa 在浏览器 / Node >=16 / Bun / happy-dom 均可用） */
function bytesToBase64(data: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < data.length; i += CHUNK) {
    binary += String.fromCharCode(...data.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/** 模型有效样式 → td 内联 CSS（字号 pt 直出，与屏幕 px ×4/3 物理尺寸一致） */
function styleToCss(style: CellStyle): string {
  const decls: string[] = []
  if (style.fill?.color) decls.push(`background-color:${style.fill.color}`)
  for (const side of BORDER_SIDES) {
    const edge = style.border?.[side]
    if (edge)
      decls.push(`border-${side}:${edge.width}px ${BORDER_CSS_LINE[edge.style]} ${edge.color}`)
  }
  const font = style.font
  if (font) {
    if (font.color) decls.push(`color:${font.color}`)
    if (font.bold) decls.push('font-weight:bold')
    if (font.italic) decls.push('font-style:italic')
    const decoration = [font.underline ? 'underline' : '', font.strikethrough ? 'line-through' : '']
      .filter(Boolean)
      .join(' ')
    if (decoration) decls.push(`text-decoration:${decoration}`)
    if (typeof font.size === 'number') decls.push(`font-size:${font.size}pt`)
  }
  const align = style.align
  if (align) {
    if (align.horizontal) decls.push(`text-align:${align.horizontal}`)
    if (align.vertical) decls.push(`vertical-align:${align.vertical}`)
    if (align.wrap) decls.push('white-space:normal;word-break:break-all')
  }
  return decls.join(';')
}

interface PrintImageRect {
  left: number
  top: number
  width?: number
  height?: number
}

/**
 * 浮动图打印定位（镜像 grid image-layer `computeImageRect`）：
 * left/top = from 格左上 + 格内像素偏移；宽高优先 image.width/height（两者都有才用），
 * 缺失且有 to 时按 from→to 跨度兜底，都缺失则省略尺寸（浏览器取自然尺寸）。
 */
function computePrintImageRect(
  image: SheetImage,
  colWidths: readonly number[],
  rowHeights: readonly number[]
): PrintImageRect {
  const { from, to } = image.anchor
  let left = from.offsetX ?? 0
  for (let c = 0; c < from.col; c++) left += colWidths[c] ?? PRINT_DEFAULT_COL_WIDTH
  let top = from.offsetY ?? 0
  for (let r = 0; r < from.row; r++) top += rowHeights[r] ?? PRINT_DEFAULT_ROW_HEIGHT

  if (image.width != null && image.height != null) {
    return { left, top, width: image.width, height: image.height }
  }
  if (to) {
    let width = 0
    for (let c = from.col; c <= to.col; c++) width += colWidths[c] ?? PRINT_DEFAULT_COL_WIDTH
    let height = 0
    for (let r = from.row; r <= to.row; r++) height += rowHeights[r] ?? PRINT_DEFAULT_ROW_HEIGHT
    return { left, top, width, height }
  }
  return { left, top }
}

/**
 * 将已填充的 Sheet（Filled Report）构建为打印专用 HTML 文档（纯 TS、headless、无 DOM）。
 *
 * 路线说明：网格渲染层是 canvas + 虚拟滚动（视口外不绘制），无法直接 window.print；
 * 这里从模型单一事实源（与 exportFilledReportXlsx 同一读取路径）重建 `<table>`——
 * 矢量文字清晰、浏览器原生分页、合并格天然映射 rowspan/colspan。
 *
 * 保真范围：值 / 合并 / 有效样式（fill + border + font + align/wrap，条件样式已在
 * 展开阶段打平进 StylePool）/ 行高 / 列宽 / 浮动图（data URL 内嵌，跨页被裁剪属预期）。
 * 与 Excel 默认一致：不打印屏幕网格线（仅模型显式边框）。
 */
export function buildFilledReportPrintHtml(sheet: Sheet, options?: ReportPrintOptions): string {
  const title = options?.title ?? sheet.name ?? ''
  const orientation = options?.orientation ?? 'portrait'

  // 打印范围 = 数据 ∪ 行高 ∪ 列宽 ∪ 合并 ∪ 图片锚点 包围盒（与 xlsx 导出收敛逻辑一致 + 合并/图片）
  let maxRow = -1
  let maxCol = -1
  const grow = (row: number, col: number): void => {
    if (row > maxRow) maxRow = row
    if (col > maxCol) maxCol = col
  }
  for (const [addr] of sheet.store.peekEntries()) grow(addr.row, addr.col)
  for (const [row] of sheet.getRowHeights()) grow(row, 0)
  for (const [col] of sheet.getColWidths()) grow(0, col)
  const merges = sheet.merges.getMerges()
  for (const range of merges) grow(range.end.row, range.end.col)
  const images = sheet.getImages()
  for (const image of images) {
    grow(image.anchor.from.row, image.anchor.from.col)
    if (image.anchor.to) grow(image.anchor.to.row, image.anchor.to.col)
  }

  const colWidths: number[] = []
  for (let c = 0; c <= maxCol; c++) colWidths.push(sheet.getColWidth(c) ?? PRINT_DEFAULT_COL_WIDTH)
  const rowHeights: number[] = []
  for (let r = 0; r <= maxRow; r++)
    rowHeights.push(sheet.getRowHeight(r) ?? PRINT_DEFAULT_ROW_HEIGHT)

  // 合并：锚点 → 跨度；被覆盖格集合（跳过客格）
  const spanByAnchor = new Map<string, { rowSpan: number; colSpan: number }>()
  const covered = new Set<string>()
  for (const range of merges) {
    const rowSpan = range.end.row - range.start.row + 1
    const colSpan = range.end.col - range.start.col + 1
    spanByAnchor.set(`${range.start.row},${range.start.col}`, { rowSpan, colSpan })
    for (let r = range.start.row; r <= range.end.row; r++) {
      for (let c = range.start.col; c <= range.end.col; c++) {
        if (r !== range.start.row || c !== range.start.col) covered.add(`${r},${c}`)
      }
    }
  }

  const css = [
    `@page { size: A4 ${orientation}; margin: 12mm; }`,
    'html, body { margin: 0; padding: 0; }',
    "body { font-family: Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; font-size: 12px; color: #1f2329; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    '.sheet-print-root { position: relative; }',
    'table { border-collapse: collapse; table-layout: fixed; }',
    'tr { break-inside: avoid; }',
    'td { box-sizing: border-box; padding: 2px 6px; overflow: hidden; white-space: nowrap; vertical-align: middle; text-align: left; }',
    '.sheet-print-root img { position: absolute; }'
  ].join('\n')

  const parts: string[] = []
  parts.push('<!doctype html><html><head><meta charset="utf-8">')
  parts.push(`<title>${escapeHtml(title || '报表')}</title>`)
  parts.push(`<style>\n${css}\n</style></head><body>`)
  parts.push('<div class="sheet-print-root">')
  parts.push('<table>')
  if (colWidths.length > 0) {
    parts.push('<colgroup>')
    for (const width of colWidths) parts.push(`<col style="width:${width}px">`)
    parts.push('</colgroup>')
  }
  for (let r = 0; r <= maxRow; r++) {
    parts.push(`<tr style="height:${rowHeights[r]}px">`)
    for (let c = 0; c <= maxCol; c++) {
      if (covered.has(`${r},${c}`)) continue
      const attrs: string[] = []
      const span = spanByAnchor.get(`${r},${c}`)
      if (span && span.colSpan > 1) attrs.push(`colspan="${span.colSpan}"`)
      if (span && span.rowSpan > 1) attrs.push(`rowspan="${span.rowSpan}"`)
      const style = sheet.getEffectiveStyle({ row: r, col: c })
      const cellCss = style ? styleToCss(style) : ''
      if (cellCss) attrs.push(`style="${escapeAttr(cellCss)}"`)
      const value = sheet.getDisplayValue({ row: r, col: c })
      const text = value == null ? '' : escapeHtml(String(value))
      parts.push(`<td${attrs.length > 0 ? ` ${attrs.join(' ')}` : ''}>${text}</td>`)
    }
    parts.push('</tr>')
  }
  parts.push('</table>')

  for (const image of images) {
    const rect = computePrintImageRect(image, colWidths, rowHeights)
    const size =
      rect.width != null && rect.height != null
        ? `width:${rect.width}px;height:${rect.height}px;`
        : ''
    const src = `data:${IMAGE_MIME[image.type]};base64,${bytesToBase64(image.data)}`
    parts.push(
      `<img src="${src}" style="left:${rect.left}px;top:${rect.top}px;${size}" alt="${escapeAttr(image.altText ?? '')}">`
    )
  }

  parts.push('</div></body></html>')
  return parts.join('')
}
