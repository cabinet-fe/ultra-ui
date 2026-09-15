/**
 * 逐页 SVG 输出（P2 渲染内核出口）。
 *
 * 页面物理尺寸按 OFD 毫米 → CSS 像素换算（96dpi），内容坐标系保持 OFD 原始
 * 毫米单位（通过 viewBox 缩放），坐标与文档声明一一对应，便于断言与调试。
 * 页与页相互独立、可单独调用，供上层做懒渲染 / 虚拟滚动。
 */

import { IDENTITY_MATRIX, multiplyMatrix, type OfdBoundary, type OfdMatrix } from './ctm'
import { OfdParseError } from './error'
import { glyphPathD, parseEmbeddedFont, type OfdEmbeddedFont } from './font'
import { formatNumber, roundTo } from './number'
import {
  parsePageContent,
  type OfdCompositeObject,
  type OfdImageObject,
  type OfdPageObject,
  type OfdPathCommand,
  type OfdPathObject,
  type OfdTextCode,
  type OfdTextObject
} from './page-objects'
import { joinZipPath } from './parse'
import type { OfdContainer, OfdDoc } from './types'
import type { OfdZip } from './zip'

/** CSS 约定 96px = 1in = 25.4mm */
const PX_PER_MM = 96 / 25.4

/** 文本默认填充色（GB/T 33190 未声明时文字按黑色呈现） */
const DEFAULT_TEXT_FILL = '#000'

/** 一次 pageToSvg 调用的共享上下文 */
interface RenderContext {
  zip: OfdZip
  doc: OfdDoc
  objectsById: ReadonlyMap<string, OfdPageObject>
  /** 内嵌字体解析缓存：null 表示未内嵌或解析失败（回退系统字体） */
  fonts: Map<string, OfdEmbeddedFont | null>
}

/** 输出指定文档指定页的完整 SVG 字符串 */
export async function pageToSvg(
  zip: OfdZip,
  container: OfdContainer,
  documentIndex: number,
  pageIndex: number
): Promise<string> {
  const doc = container.docs[documentIndex]
  if (!doc) {
    throw new OfdParseError(
      'out-of-range',
      `文档序号 ${documentIndex} 超出范围（容器共 ${container.docs.length} 个文档）`
    )
  }
  const page = doc.pages[pageIndex]
  if (!page) {
    throw new OfdParseError(
      'out-of-range',
      `页序号 ${pageIndex} 超出范围（文档 ${documentIndex} 共 ${doc.pages.length} 页）`
    )
  }

  const content = parsePageContent(await zip.text(page.location), page.location)
  // 页级 CommonData 覆盖文档默认尺寸；两者都未声明时按 A4 兜底
  const size = page.size ?? doc.pageSize ?? { width: 210, height: 297 }
  const context: RenderContext = { zip, doc, objectsById: content.objectsById, fonts: new Map() }

  // 签章/注释层对象与正文层同一通道渲染，按图层声明顺序叠加；只呈现图片，不验签
  const layers = await Promise.all(
    content.layers.map(async (layer) => {
      const objects = await Promise.all(
        layer.objects.map((object) =>
          renderObject(object, IDENTITY_MATRIX, null, context, new Set())
        )
      )
      const rendered = objects.join('')
      if (rendered === '') return ''
      const typeAttribute = layer.type === null ? '' : ` data-ofd-layer="${layer.type}"`
      return `<g${typeAttribute}>${rendered}</g>`
    })
  )

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ` +
    `width="${formatNumber(roundTo(size.width * PX_PER_MM, 2))}px" ` +
    `height="${formatNumber(roundTo(size.height * PX_PER_MM, 2))}px" ` +
    `viewBox="0 0 ${formatNumber(size.width)} ${formatNumber(size.height)}">${layers.join('')}</svg>`
  )
}

/** 渲染单个对象：CTM 链 + Boundary 定位外壳，内容坐标相对 Boundary 原点 */
async function renderObject(
  object: OfdPageObject,
  parentCtm: OfdMatrix,
  boundaryOverride: OfdBoundary | null,
  context: RenderContext,
  visiting: ReadonlySet<string>
): Promise<string> {
  if (object.id && visiting.has(object.id)) return ''
  const ctm = object.ctm ? multiplyMatrix(parentCtm, object.ctm) : parentCtm
  // 复合对象自身没有内容，不包外壳，直接递归被引用对象（其外壳即复合的呈现）
  if (object.kind === 'composite') return renderComposite(object, ctm, context, visiting)

  const boundary = boundaryOverride ?? object.boundary
  const inner = await renderContent(object, boundary, context)
  if (inner === '') return ''
  const transform = groupTransform(ctm, boundary)
  return `<g${transform ? ` transform="${transform}"` : ''}>${inner}</g>`
}

async function renderContent(
  object: Exclude<OfdPageObject, OfdCompositeObject>,
  boundary: OfdBoundary | null,
  context: RenderContext
): Promise<string> {
  switch (object.kind) {
    case 'text':
      return renderText(object, context)
    case 'image':
      return renderImage(object, boundary, context)
    case 'path':
      return renderPath(object)
  }
}

/** 复合对象：递归渲染被引用对象，CTM 链向下继承，循环引用直接断开 */
async function renderComposite(
  object: OfdCompositeObject,
  parentCtm: OfdMatrix,
  context: RenderContext,
  visiting: ReadonlySet<string>
): Promise<string> {
  const referenced = object.referenceId ? context.objectsById.get(object.referenceId) : undefined
  if (!referenced) return ''
  const nextVisiting = new Set(visiting)
  if (object.id) nextVisiting.add(object.id)
  // 被引用对象沿用自身声明，复合对象声明的 Boundary 覆盖之
  return renderObject(referenced, parentCtm, object.boundary, context, nextVisiting)
}

/** 文本渲染：声明内嵌字体（Font@FontFile）时按 glyph 轮廓输出 path，否则回退系统字体 text */
async function renderText(object: OfdTextObject, context: RenderContext): Promise<string> {
  const font = await loadEmbeddedFont(object.fontId, context)
  if (!font || object.fontSize === null) return renderSystemFontText(object, context)
  const fontSize = object.fontSize
  const d = object.codes
    .map((code) => textCodePathD(font, code, fontSize))
    .filter((part) => part !== '')
    .join(' ')
  if (d === '') return ''
  return `<path d="${d}" fill="${object.fillColor ?? DEFAULT_TEXT_FILL}"/>`
}

/** 加载 TextObject@FontID 声明的内嵌 TTF；缺失或损坏返回 null（不阻断整页渲染） */
async function loadEmbeddedFont(
  fontId: string | null,
  context: RenderContext
): Promise<OfdEmbeddedFont | null> {
  if (fontId === null) return null
  const cached = context.fonts.get(fontId)
  if (cached !== undefined) return cached
  const decl = context.doc.resources.fonts.find((font) => font.id === fontId)
  let font: OfdEmbeddedFont | null = null
  if (decl?.fontFile) {
    try {
      font = parseEmbeddedFont(
        await context.zip.read(joinZipPath(context.doc.dir, decl.fontFile)),
        decl.fontFile
      )
    } catch {
      font = null // 内嵌字体不可用：回退系统字体
    }
  }
  context.fonts.set(fontId, font)
  return font
}

/**
 * 单个 TextCode 的 glyph 路径：从 X/Y 基线原点起笔逐字排布。
 * DeltaX/DeltaY 按标准是「相对前一个字符的位移」，声明时替代字形步进宽度。
 */
function textCodePathD(font: OfdEmbeddedFont, code: OfdTextCode, fontSize: number): string {
  const scale = fontSize / font.unitsPerEm
  const parts: string[] = []
  let penX = code.x ?? 0
  let penY = code.y ?? 0
  let dxIndex = 0
  let dyIndex = 0
  for (const char of code.text) {
    const gid = font.glyphIndexOf(char.codePointAt(0)!) ?? 0
    const d = glyphPathD(font, gid, fontSize, penX, penY)
    if (d !== '') parts.push(d)
    const deltaX = dxIndex < code.deltaX.length ? code.deltaX[dxIndex++] : null
    penX += deltaX ?? font.advanceWidth(gid) * scale
    const deltaY = dyIndex < code.deltaY.length ? code.deltaY[dyIndex++] : null
    penY += deltaY ?? 0
  }
  return parts.join(' ')
}

/** 无内嵌字体可用时的系统字体回退：保留 P2 的 text 输出与文字内容 */
function renderSystemFontText(object: OfdTextObject, context: RenderContext): string {
  const fontFamily = resolveFontFamily(object.fontId, context)
  return object.codes
    .map((code) => {
      const attributes = [
        attr('x', code.x ?? 0),
        attr('y', code.y ?? 0),
        listAttr('dx', code.deltaX),
        listAttr('dy', code.deltaY),
        attr('font-size', object.fontSize),
        fontFamily === null ? null : `font-family="${escapeXml(fontFamily)}"`,
        `fill="${object.fillColor ?? DEFAULT_TEXT_FILL}"`
      ].filter((value) => value !== null)
      return `<text ${attributes.join(' ')}>${escapeXml(code.text)}</text>`
    })
    .join('')
}

function resolveFontFamily(fontId: string | null, context: RenderContext): string | null {
  if (!fontId) return null
  return context.doc.resources.fonts.find((font) => font.id === fontId)?.fontName ?? null
}

/** 图片：解析 MultiMedia 声明并读资源字节，缺资源或不可识别的媒体类型跳过（不阻断整页） */
async function renderImage(
  object: OfdImageObject,
  boundary: OfdBoundary | null,
  context: RenderContext
): Promise<string> {
  const media =
    object.resourceId === null
      ? undefined
      : context.doc.resources.medias.find((item) => item.id === object.resourceId)
  const location = media?.location
  if (!location || (media.type !== null && media.type !== 'g')) return ''

  let bytes: Uint8Array
  try {
    bytes = await context.zip.read(joinZipPath(context.doc.dir, location))
  } catch {
    return ''
  }
  const mime = sniffImageMime(bytes)
  if (!mime) return ''
  const size =
    boundary === null
      ? ''
      : ` width="${formatNumber(boundary.width)}" height="${formatNumber(boundary.height)}"`
  return `<image${size} href="data:${mime};base64,${toBase64(bytes)}"/>`
}

/** 按魔数识别可渲染的图片媒体类型；多帧格式（GIF/APNG）由展示端取首帧 */
function sniffImageMime(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif'
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp'
  }
  if (
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function renderPath(object: OfdPathObject): string {
  const d = pathD(object.commands)
  if (d === '') return ''
  const attributes = [
    `d="${d}"`,
    `fill="${object.fillColor ?? 'none'}"`,
    object.strokeColor === null ? null : `stroke="${object.strokeColor}"`,
    attr('stroke-width', object.lineWidth),
    listAttr('stroke-dasharray', object.dashPattern)
  ].filter((value) => value !== null)
  return `<path ${attributes.join(' ')}/>`
}

function pathD(commands: OfdPathCommand[]): string {
  return commands
    .map((command) =>
      command.type === 'Z' ? 'Z' : `${command.type} ${command.points.map(formatNumber).join(' ')}`
    )
    .join(' ')
}

/** 对象外壳 transform：CTM 矩阵 + 平移到 Boundary 原点，单位矩阵不输出 */
function groupTransform(ctm: OfdMatrix, boundary: OfdBoundary | null): string {
  const parts: string[] = []
  if (!isIdentityMatrix(ctm)) parts.push(`matrix(${ctm.map(formatNumber).join(' ')})`)
  if (boundary) parts.push(`translate(${formatNumber(boundary.x)} ${formatNumber(boundary.y)})`)
  return parts.join(' ')
}

function isIdentityMatrix(matrix: OfdMatrix): boolean {
  return (
    matrix[0] === 1 &&
    matrix[1] === 0 &&
    matrix[2] === 0 &&
    matrix[3] === 1 &&
    matrix[4] === 0 &&
    matrix[5] === 0
  )
}

function attr(name: string, value: number | string | null): string | null {
  if (value === null) return null
  return `${name}="${typeof value === 'number' ? formatNumber(value) : escapeXml(value)}"`
}

function listAttr(name: string, values: number[]): string | null {
  return values.length === 0 ? null : `${name}="${values.map(formatNumber).join(' ')}"`
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
