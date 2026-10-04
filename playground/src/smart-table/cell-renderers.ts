import type { CellRenderer, CellRenderTarget } from '@veltra/sheet-core/grid'

import type { TableField } from './types'

/**
 * 9 种字段类型的网格渲染：checkbox / progress / select / multi-select / member /
 * image 经 `resolveCellRenderer` 接管画布绘制；text / number / date 沿用引擎
 * 默认文本管线（值即显示文本），工厂返回 undefined 即回落。
 * 画布读不到 CSS token，颜色与 sheet-core grid-theme 同理取固定色板。
 */

/** 多值字段（multi-select / member / image）在网格内的存储格式：JSON 字符串 */
export function serializeMultiValue(items: string[]): string | null {
  return items.length > 0 ? JSON.stringify(items) : null
}

/** 还原多值字段存储值；非法输入返回空数组（渲染为空单元格） */
export function parseMultiValue(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw === '') return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : []
  } catch {
    return []
  }
}

/**
 * 引擎声明的 `RenderContext` 是渲染层自用的最小子集；渲染器拿到的是真实
 * CanvasRenderingContext2D（圆弧 / 描边 / 基线等绘制 API 运行时天然可用），
 * 在此集中收口为一次转换。
 */
function canvasOf(target: CellRenderTarget): CanvasRenderingContext2D {
  return target.ctx as CanvasRenderingContext2D
}

/** 选项/头像配色：键（选项文本或成员名）稳定散列到固定色板 */
const PALETTE = [
  { bg: '#e8f1ff', text: '#1b66d6' },
  { bg: '#e6f7f0', text: '#12805c' },
  { bg: '#fdf0e6', text: '#b25e09' },
  { bg: '#f3eefe', text: '#7a4bd1' },
  { bg: '#fdeef1', text: '#cc3d5f' },
  { bg: '#e9f3fb', text: '#1a7ab8' },
  { bg: '#f2f3f5', text: '#5b6472' },
  { bg: '#eaf6ec', text: '#4d8f2f' }
] as const

function paletteOf(key: string): (typeof PALETTE)[number] {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]!
}

/** 标签 / 百分数 / 角标共用小号字体 */
const FONT_SMALL = '11px sans-serif'
const COLOR_MUTED = '#8a919c'
const COLOR_PRIMARY = '#2170e7'
const COLOR_BORDER = '#c4cad2'

const CHIP_HEIGHT = 19
/** 格内容左右留白（对齐引擎正文内边距 6px，另加 1px 取整余量） */
const PAD_X = 7

/** 取整坐标的圆角矩形路径（0.5 偏移让 1px 描边落在像素中心） */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath()
  ctx.roundRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h), r)
}

function textWidth(ctx: CanvasRenderingContext2D, font: string, text: string): number {
  ctx.font = font
  return ctx.measureText(text).width
}

/** 截断到 maxWidth：超宽以省略号收尾 */
function ellipsis(ctx: CanvasRenderingContext2D, font: string, text: string, maxWidth: number) {
  ctx.font = font
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text.length - 1
  while (cut > 0 && ctx.measureText(`${text.slice(0, cut)}…`).width > maxWidth) cut--
  return `${text.slice(0, cut)}…`
}

/** checkbox：居中 15px 方框，勾选态实心 + 白勾（编辑由点击切换，P4 编辑器接入） */
const drawCheckbox: CellRenderer = (target) => {
  const ctx = canvasOf(target)
  const size = 15
  const x = Math.round((target.width - size) / 2)
  const y = Math.round((target.height - size) / 2)
  roundRect(ctx, x, y, size, size, 3)
  if (target.value === true) {
    ctx.fillStyle = COLOR_PRIMARY
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 3.5, y + size / 2)
    ctx.lineTo(x + size / 2 - 1, y + size - 3.5)
    ctx.lineTo(x + size - 3, y + 3.5)
    ctx.stroke()
  } else {
    ctx.strokeStyle = COLOR_BORDER
    ctx.lineWidth = 1.2
    ctx.stroke()
  }
}

/** progress：圆角轨道 + 主色填充 + 右侧百分数 */
const drawProgress: CellRenderer = (target) => {
  const ctx = canvasOf(target)
  const { width, height, value } = target
  const percent =
    typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  const percentText = `${Math.round(percent)}%`
  const y = Math.round(height / 2) - 3
  const barWidth = Math.max(24, width - PAD_X * 2 - textWidth(ctx, FONT_SMALL, percentText) - 6)
  roundRect(ctx, PAD_X + 1, y, barWidth, 6, 3)
  ctx.fillStyle = '#e9edf2'
  ctx.fill()
  if (percent > 0) {
    roundRect(ctx, PAD_X + 1, y, Math.max((barWidth * percent) / 100, 6), 6, 3)
    ctx.fillStyle = COLOR_PRIMARY
    ctx.fill()
  }
  ctx.font = FONT_SMALL
  ctx.fillStyle = COLOR_MUTED
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(percentText, PAD_X + 1 + barWidth + 6, y + 3)
}

/** select：单条选项色标签（浅底 + 同系深字，超宽省略） */
const drawSelectChip: CellRenderer = (target) => {
  const ctx = canvasOf(target)
  const { width, height, text } = target
  if (text === '') return
  const label = ellipsis(ctx, FONT_SMALL, text, width - PAD_X * 2 - 14)
  const w = textWidth(ctx, FONT_SMALL, label) + 14
  const y = Math.round((height - CHIP_HEIGHT) / 2)
  roundRect(ctx, PAD_X, y, w, CHIP_HEIGHT, 4)
  ctx.fillStyle = paletteOf(text).bg
  ctx.fill()
  ctx.font = FONT_SMALL
  ctx.fillStyle = paletteOf(text).text
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(label, PAD_X + 7, y + CHIP_HEIGHT / 2 + 0.5)
}

/** 横排一行标签（multi-select 选项）：整条放不下时截断并以「+N」收尾 */
function drawChipRow(target: CellRenderTarget, items: string[]): void {
  const ctx = canvasOf(target)
  const { width, height } = target
  const y = Math.round((height - CHIP_HEIGHT) / 2)
  const right = width - PAD_X
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  let x = PAD_X
  let drawn = 0
  for (const item of items) {
    const remaining = items.length - drawn - 1
    const overflow = `+${remaining + 1}`
    const reserve = remaining > 0 ? textWidth(ctx, FONT_SMALL, overflow) + 8 : 0
    const budget = right - x - 14 - reserve
    if (budget < 12) break // 剩余空间连一条截断标签都放不下，交给 +N 收尾
    const label = ellipsis(ctx, FONT_SMALL, item, budget)
    const w = textWidth(ctx, FONT_SMALL, label) + 14
    roundRect(ctx, x, y, w, CHIP_HEIGHT, 4)
    ctx.fillStyle = paletteOf(item).bg
    ctx.fill()
    ctx.font = FONT_SMALL
    ctx.fillStyle = paletteOf(item).text
    ctx.fillText(label, x + 7, y + CHIP_HEIGHT / 2 + 0.5)
    x += w + 4
    drawn++
  }
  if (drawn < items.length) {
    const overflow = `+${items.length - drawn}`
    ctx.font = FONT_SMALL
    ctx.fillStyle = COLOR_MUTED
    ctx.fillText(overflow, right - textWidth(ctx, FONT_SMALL, overflow), y + CHIP_HEIGHT / 2 + 0.5)
  }
}

const drawMultiChips: CellRenderer = (target) => {
  const items = parseMultiValue(target.text)
  if (items.length > 0) drawChipRow(target, items)
}

/** member：横排姓名头像（圆形 + 姓氏占位），放不下以「+N」收尾 */
const drawMemberAvatars: CellRenderer = (target) => {
  const ctx = canvasOf(target)
  const { width, height } = target
  const names = parseMultiValue(target.text)
  if (names.length === 0) return
  const size = 19
  const y = Math.round((height - size) / 2)
  const right = width - PAD_X
  let x = PAD_X
  for (let i = 0; i < names.length; i++) {
    const name = names[i]!
    if (x + size > right) {
      const overflow = `+${names.length - i}`
      ctx.font = FONT_SMALL
      ctx.fillStyle = COLOR_MUTED
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(overflow, x + 2, y + size / 2 + 0.5)
      return
    }
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = paletteOf(name).bg
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.font = 'bold 10px sans-serif'
    ctx.fillStyle = paletteOf(name).text
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(name.slice(0, 1), x + size / 2, y + size / 2 + 0.5)
    x += size - 3
  }
}

/** image：占位缩略图（圆角框 + 山形图形占位，不加载远程图），放不下以「+N」收尾 */
const drawImageThumbs: CellRenderer = (target) => {
  const ctx = canvasOf(target)
  const { width, height } = target
  const urls = parseMultiValue(target.text)
  if (urls.length === 0) return
  const w = 28
  const h = 21
  const y = Math.round((height - h) / 2)
  const right = width - PAD_X
  let x = PAD_X
  for (let i = 0; i < urls.length; i++) {
    if (x + w > right) {
      const overflow = `+${urls.length - i}`
      ctx.font = FONT_SMALL
      ctx.fillStyle = COLOR_MUTED
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(overflow, x + 2, y + h / 2 + 0.5)
      return
    }
    roundRect(ctx, x, y, w, h, 3)
    ctx.fillStyle = '#f2f4f7'
    ctx.fill()
    ctx.strokeStyle = COLOR_BORDER
    ctx.lineWidth = 1
    ctx.stroke()
    // 占位图形：左上小圆 + 底部山形折线
    ctx.fillStyle = '#a8b0bc'
    ctx.beginPath()
    ctx.arc(x + 8, y + 7, 2.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#a8b0bc'
    ctx.lineWidth = 1.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 5, y + h - 4.5)
    ctx.lineTo(x + 12, y + 8.5)
    ctx.lineTo(x + 17, y + h - 4.5)
    ctx.lineTo(x + 23, y + 11)
    ctx.stroke()
    x += w + 4
  }
}

/**
 * 分组段头行渲染：顶部细分隔线 + 左侧主色竖条 + 粗体段名
 * （段名与计数文案由视图管线拼好，存于首列值，按行路由到此渲染器）。
 */
export const drawGroupBand: CellRenderer = (target) => {
  const ctx = canvasOf(target)
  const { width, height, text } = target
  if (text === '') return
  ctx.strokeStyle = '#d8dde5'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 0.5)
  ctx.lineTo(width, 0.5)
  ctx.stroke()
  ctx.fillStyle = COLOR_PRIMARY
  ctx.fillRect(6, Math.round(height / 2) - 7, 3, 14)
  const font = 'bold 12px sans-serif'
  ctx.font = font
  ctx.fillStyle = '#3a4150'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(ellipsis(ctx, font, text, width - 22), 14, Math.round(height / 2) + 0.5)
}

/**
 * 字段级渲染器工厂：按字段类型返回接管绘制的 CellRenderer；
 * text / number / date 返回 undefined（默认文本管线即类型化展示）。
 */
export function makeFieldRenderer(field: TableField): CellRenderer | undefined {
  switch (field.type) {
    case 'checkbox':
      return drawCheckbox
    case 'progress':
      return drawProgress
    case 'select':
      return drawSelectChip
    case 'multi-select':
      return drawMultiChips
    case 'member':
      return drawMemberAvatars
    case 'image':
      return drawImageThumbs
    default:
      return undefined
  }
}
