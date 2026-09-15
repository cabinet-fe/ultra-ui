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
  type OfdContentLayer,
  type OfdGlyphSubstitution,
  type OfdImageObject,
  type OfdPageContent,
  type OfdPageObject,
  type OfdPathCommand,
  type OfdPathObject,
  type OfdTextCode,
  type OfdTextObject
} from './page-objects'
import { joinZipPath, resolveContentLocation } from './parse'
import type { OfdContainer, OfdDoc, OfdDrawParamDecl, OfdTemplateRef } from './types'
import type { OfdZip } from './zip'

/** CSS 约定 96px = 1in = 25.4mm */
const PX_PER_MM = 96 / 25.4

/** 对象未声明填充色时的默认色（GB/T 33190 未声明时文字按黑色呈现，Fill 路径同） */
const DEFAULT_FILL = '#000'

/** 复合对象引用查找域：越靠前优先（当前内容域先于外层，模板域先于页面域） */
type ReferenceFrames = ReadonlyArray<ReadonlyMap<string, OfdPageObject>>

/** 渲染作用域：引用查找域 + 图层继承的绘制参数 */
interface RenderScope {
  frames: ReferenceFrames
  drawParamId: string | null
}

/** 一次 pageToSvg 调用的共享上下文 */
interface RenderContext {
  zip: OfdZip
  doc: OfdDoc
  /** 内嵌字体解析缓存：null 表示未内嵌或解析失败（回退系统字体） */
  fonts: Map<string, OfdEmbeddedFont | null>
  /** 模板页内容解析缓存，同页多次引用或递归引用复用 */
  templateContents: Map<string, OfdPageContent>
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
  const context: RenderContext = { zip, doc, fonts: new Map(), templateContents: new Map() }

  // 模板页：背景组叠在页面内容之下、前景组在其上，组内保持引用声明顺序
  const renderedTemplates = await Promise.all(
    content.templateRefs.map((ref) =>
      renderTemplateRef(ref, context, [content.objectsById], new Set())
    )
  )
  const background: string[] = []
  const foreground: string[] = []
  const templateFrames: ReferenceFrames[] = []
  for (const rendered of renderedTemplates) {
    if (rendered.background !== '') background.push(rendered.background)
    if (rendered.foreground !== '') foreground.push(rendered.foreground)
    templateFrames.push(rendered.frames)
  }

  // 签章/注释层对象与正文层同一通道渲染，按图层声明顺序叠加；只呈现图片，不验签
  const pageFrames: ReferenceFrames = [content.objectsById, ...templateFrames.flat()]
  const layers = await Promise.all(
    content.layers.map((layer) => renderLayer(layer, context, pageFrames))
  )

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ` +
    `width="${formatNumber(roundTo(size.width * PX_PER_MM, 2))}px" ` +
    `height="${formatNumber(roundTo(size.height * PX_PER_MM, 2))}px" ` +
    `viewBox="0 0 ${formatNumber(size.width)} ${formatNumber(size.height)}">` +
    `${background.join('')}${layers.join('')}${foreground.join('')}</svg>`
  )
}

/** 渲染单个图层：对象按声明顺序叠加，空图层不输出外壳 */
async function renderLayer(
  layer: OfdContentLayer,
  context: RenderContext,
  frames: ReferenceFrames
): Promise<string> {
  const objects = await Promise.all(
    layer.objects.map((object) =>
      renderObject(object, IDENTITY_MATRIX, null, context, new Set(), {
        frames,
        drawParamId: layer.drawParamId
      })
    )
  )
  const rendered = objects.join('')
  if (rendered === '') return ''
  const typeAttribute = layer.type === null ? '' : ` data-ofd-layer="${layer.type}"`
  return `<g${typeAttribute}>${rendered}</g>`
}

/** 模板页渲染结果：两组内容与内容域对象索引（供页面级复合对象跨域兜底） */
interface RenderedTemplate {
  background: string
  foreground: string
  frames: ReferenceFrames
}

/**
 * 按引用渲染一个模板页：自身引用的模板先于其内容（背景）或后于其内容（前景）
 * 展开，与页面同规则；以内容文件路径判环，递归引用直接断开。
 */
async function renderTemplateRef(
  ref: OfdTemplateRef,
  context: RenderContext,
  outerFrames: ReferenceFrames,
  visiting: ReadonlySet<string>
): Promise<RenderedTemplate> {
  const declaration =
    ref.templateId === null
      ? undefined
      : context.doc.templates.find((template) => template.id === ref.templateId)
  const baseLocation = declaration?.location ?? null
  if (baseLocation === null) return { background: '', foreground: '', frames: [] }
  const location = resolveContentLocation(context.doc.dir, baseLocation)
  if (visiting.has(location)) return { background: '', foreground: '', frames: [] }
  const content = await loadTemplateContent(context, location)
  const frames: ReferenceFrames = [content.objectsById, ...outerFrames]
  const nextVisiting = new Set(visiting).add(location)

  // 同层引用并行渲染，Promise.all 保持声明顺序
  const innerRendered = await Promise.all(
    content.templateRefs.map((innerRef) =>
      renderTemplateRef(innerRef, context, frames, nextVisiting)
    )
  )
  const innerBackground: string[] = []
  const innerForeground: string[] = []
  for (const rendered of innerRendered) {
    innerBackground.push(rendered.background)
    innerForeground.push(rendered.foreground)
  }
  const ownLayers = (
    await Promise.all(content.layers.map((layer) => renderLayer(layer, context, frames)))
  ).join('')
  // 引用处 ZOrder 决定本模板整体叠放在页面内容之下还是之上
  const bundle = innerBackground.join('') + ownLayers + innerForeground.join('')
  return ref.zOrder === 'foreground'
    ? { background: '', foreground: bundle, frames }
    : { background: bundle, foreground: '', frames }
}

/** 加载并解析模板页内容；同一页内重复或递归引用复用解析结果 */
async function loadTemplateContent(
  context: RenderContext,
  location: string
): Promise<OfdPageContent> {
  const cached = context.templateContents.get(location)
  if (cached) return cached
  const content = parsePageContent(await context.zip.text(location), location)
  context.templateContents.set(location, content)
  return content
}

/** 渲染单个对象：CTM 链 + Boundary 定位外壳，内容坐标相对 Boundary 原点 */
async function renderObject(
  object: OfdPageObject,
  parentCtm: OfdMatrix,
  boundaryOverride: OfdBoundary | null,
  context: RenderContext,
  visiting: ReadonlySet<string>,
  scope: RenderScope
): Promise<string> {
  if (object.id && visiting.has(object.id)) return ''
  const ctm = object.ctm ? multiplyMatrix(parentCtm, object.ctm) : parentCtm
  // 复合对象自身没有内容，不包外壳，直接递归被引用对象（其外壳即复合的呈现）
  if (object.kind === 'composite') {
    return renderComposite(object, ctm, context, visiting, scope)
  }

  const boundary = boundaryOverride ?? object.boundary
  const inner = await renderContent(object, boundary, ctm, context, scope)
  if (inner === '') return ''
  const transform = groupTransform(ctm, boundary)
  return `<g${transform ? ` transform="${transform}"` : ''}>${inner}</g>`
}

async function renderContent(
  object: Exclude<OfdPageObject, OfdCompositeObject>,
  boundary: OfdBoundary | null,
  ctm: OfdMatrix,
  context: RenderContext,
  scope: RenderScope
): Promise<string> {
  switch (object.kind) {
    case 'text':
      return renderText(object, context, scope)
    case 'image':
      return renderImage(object, boundary, ctm, context)
    case 'path':
      return renderPath(object, context, scope)
  }
}

/** 复合对象：递归渲染被引用对象，CTM 链向下继承，循环引用直接断开 */
async function renderComposite(
  object: OfdCompositeObject,
  parentCtm: OfdMatrix,
  context: RenderContext,
  visiting: ReadonlySet<string>,
  scope: RenderScope
): Promise<string> {
  const referenced = findReferencedObject(object, scope)
  if (!referenced) return ''
  const nextVisiting = new Set(visiting)
  if (object.id) nextVisiting.add(object.id)
  // 被引用对象沿用自身声明，复合对象声明的 Boundary 覆盖之
  return renderObject(referenced, parentCtm, object.boundary, context, nextVisiting, scope)
}

/** 复合对象引用查找：当前内容域优先，未命中再沿外层内容域兜底 */
function findReferencedObject(
  object: OfdCompositeObject,
  scope: RenderScope
): OfdPageObject | undefined {
  if (object.referenceId === null) return undefined
  for (const frame of scope.frames) {
    const referenced = frame.get(object.referenceId)
    if (referenced) return referenced
  }
  return undefined
}

/** 文本渲染：声明内嵌字体（Font@FontFile）时按 glyph 轮廓输出 path，否则回退系统字体 text */
async function renderText(
  object: OfdTextObject,
  context: RenderContext,
  scope: RenderScope
): Promise<string> {
  const draw = resolveDrawAttributes(object.drawParamId ?? scope.drawParamId, context)
  const fill = object.fillColor ?? draw.fillColor ?? DEFAULT_FILL
  const font = await loadEmbeddedFont(object.fontId, context)
  if (!font || object.fontSize === null) return renderSystemFontText(object, fill, context)
  const fontSize = object.fontSize
  const parts: string[] = []
  let baseIndex = 0
  for (const code of object.codes) {
    const part = textCodePathD(font, code, fontSize, object.glyphSubstitutions, baseIndex)
    if (part !== '') parts.push(part)
    baseIndex += code.text.length
  }
  const d = parts.join(' ')
  // 全部字符都取不到字形（如无 cmap 且无字形替换的子集字体）时回退系统字体
  if (d === '') {
    return object.codes.some((code) => code.text.length > 0)
      ? renderSystemFontText(object, fill, context)
      : ''
  }
  return `<path d="${d}" fill="${fill}"/>`
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
 * 字形来源优先取 CGTransform 替换序号（子集字体无 cmap 时的唯一映射），
 * 其次 cmap 码点映射；两者都未命中时跳过该字符的轮廓、仅按位移推进。
 */
function textCodePathD(
  font: OfdEmbeddedFont,
  code: OfdTextCode,
  fontSize: number,
  substitutions: readonly OfdGlyphSubstitution[],
  baseIndex: number
): string {
  const scale = fontSize / font.unitsPerEm
  const parts: string[] = []
  let penX = code.x ?? 0
  let penY = code.y ?? 0
  let dxIndex = 0
  let dyIndex = 0
  let charIndex = 0
  for (const char of code.text) {
    const gid =
      substitutedGlyphId(substitutions, baseIndex + charIndex) ??
      font.glyphIndexOf(char.codePointAt(0)!)
    if (gid !== null) {
      const d = glyphPathD(font, gid, fontSize, penX, penY)
      if (d !== '') parts.push(d)
    }
    const deltaX = dxIndex < code.deltaX.length ? code.deltaX[dxIndex++] : null
    penX += deltaX ?? (gid !== null ? font.advanceWidth(gid) * scale : 0)
    const deltaY = dyIndex < code.deltaY.length ? code.deltaY[dyIndex++] : null
    penY += deltaY ?? 0
    charIndex++
  }
  return parts.join(' ')
}

/** 字形替换查找：字符落在声明区间时取 Glyphs 中对应序号，合字耗尽或未覆盖返回 null */
function substitutedGlyphId(
  substitutions: readonly OfdGlyphSubstitution[],
  charIndex: number
): number | null {
  for (const substitution of substitutions) {
    if (
      charIndex >= substitution.codePosition &&
      charIndex < substitution.codePosition + substitution.codeCount
    ) {
      const offset = charIndex - substitution.codePosition
      return offset < substitution.glyphIds.length ? substitution.glyphIds[offset]! : null
    }
  }
  return null
}

/** 无内嵌字体可用时的系统字体回退：保留 P2 的 text 输出与文字内容 */
function renderSystemFontText(object: OfdTextObject, fill: string, context: RenderContext): string {
  const fontFamily = resolveFontFamily(object.fontId, context)
  return object.codes
    .map((code) => {
      const attributes = [
        'xml:space="preserve"',
        codePositionAttr('x', code.x, code.text.length, code.deltaX),
        codePositionAttr('y', code.y, code.text.length, code.deltaY),
        attr('font-size', object.fontSize),
        fontFamily === null ? null : `font-family="${escapeXml(fontFamily)}"`,
        `fill="${fill}"`
      ].filter((value) => value !== null)
      return `<text ${attributes.join(' ')}>${escapeXml(code.text)}</text>`
    })
    .join('')
}

/**
 * TextCode 位移转 SVG 逐字符坐标：DeltaX/DeltaY 是相邻字符间的绝对步长
 * （替代字形自然步进），而 SVG 的 dx/dy 是在自然步进上的附加量，语义不同，
 * 这里换算成绝对坐标列表；位移未覆盖的字符交由自然排布。
 */
function codePositionAttr(
  name: 'x' | 'y',
  start: number | null,
  charCount: number,
  deltas: number[]
): string | null {
  if (start === null && deltas.length === 0) return null
  const positions = [start ?? 0]
  const covered = Math.min(charCount - 1, deltas.length)
  for (let index = 0; index < covered; index++) {
    positions.push(positions[index]! + deltas[index]!)
  }
  return positions.length === 1
    ? `${name}="${formatNumber(positions[0]!)}"`
    : `${name}="${positions.map(formatNumber).join(' ')}"`
}

function resolveFontFamily(fontId: string | null, context: RenderContext): string | null {
  if (!fontId) return null
  return context.doc.resources.fonts.find((font) => font.id === fontId)?.fontName ?? null
}

/**
 * 图片：解析 MultiMedia 声明并读资源字节，缺资源或不可识别的媒体类型跳过（不阻断整页）。
 * Type 兼容标准单字母 'g' 与主流产出的 'Image' 拼写。
 */
async function renderImage(
  object: OfdImageObject,
  boundary: OfdBoundary | null,
  ctm: OfdMatrix,
  context: RenderContext
): Promise<string> {
  const media =
    object.resourceId === null
      ? undefined
      : context.doc.resources.medias.find((item) => item.id === object.resourceId)
  const location = media?.location
  const type = media?.type?.toLowerCase()
  if (!location || (type !== undefined && type !== 'g' && type !== 'image')) return ''

  let bytes: Uint8Array
  try {
    bytes = await context.zip.read(joinZipPath(context.doc.dir, location))
  } catch {
    return ''
  }
  const mime = sniffImageMime(bytes)
  if (!mime) return ''
  const content = boundary === null ? null : imageContentSize(boundary, ctm)
  const size =
    content === null
      ? ''
      : ` width="${formatNumber(content.width)}" height="${formatNumber(content.height)}"`
  return `<image${size} href="data:${mime};base64,${toBase64(bytes)}"/>`
}

/**
 * 图片内容盒尺寸：无缩放 CTM 时 Boundary 即内容盒；带缩放 CTM 的产出
 * （WPS / 新版数电发票实证）图片内容为 [0,1] 单位盒，尺寸与定位由 CTM 给出，
 * Boundary 只提供平移原点（WPS 写最终包围盒、数电票二维码写整页盒，均不参与定尺寸）。
 */
function imageContentSize(
  boundary: OfdBoundary,
  ctm: OfdMatrix
): { width: number; height: number } {
  if (!hasScaleComponent(ctm)) return { width: boundary.width, height: boundary.height }
  return { width: 1, height: 1 }
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

/** 对象生效绘制参数：自身 FillColor/StrokeColor/LineWidth 声明优先于 DrawParam 继承链 */
function resolveDrawAttributes(
  drawParamId: string | null,
  context: RenderContext
): { fillColor: string | null; strokeColor: string | null; lineWidth: number | null } {
  const chain: OfdDrawParamDecl[] = []
  const visited = new Set<string>()
  let current = drawParamId === null ? undefined : findDrawParam(drawParamId, context)
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    // 从叶到根收集，随后按根到叶合并，叶声明覆盖父级
    chain.unshift(current)
    current = current.relative === null ? undefined : findDrawParam(current.relative, context)
  }
  let fillColor: string | null = null
  let strokeColor: string | null = null
  let lineWidth: number | null = null
  for (const declaration of chain) {
    fillColor ??= declaration.fillColor
    strokeColor ??= declaration.strokeColor
    lineWidth ??= declaration.lineWidth
  }
  return { fillColor, strokeColor, lineWidth }
}

function findDrawParam(id: string, context: RenderContext): OfdDrawParamDecl | undefined {
  return context.doc.resources.drawParams.find((param) => param.id === id)
}

function renderPath(object: OfdPathObject, context: RenderContext, scope: RenderScope): string {
  const d = pathD(object.commands)
  if (d === '') return ''
  const draw = resolveDrawAttributes(object.drawParamId ?? scope.drawParamId, context)
  const strokeColor = object.strokeColor ?? draw.strokeColor
  // Fill="true" 的路径未声明颜色时按默认黑色填充（数电发票票面标记实证）
  const fill = object.fillColor ?? draw.fillColor ?? (object.fill ? DEFAULT_FILL : 'none')
  const attributes = [
    `d="${d}"`,
    `fill="${fill}"`,
    strokeColor === null ? null : `stroke="${strokeColor}"`,
    attr('stroke-width', object.lineWidth ?? draw.lineWidth),
    listAttr('stroke-dasharray', object.dashPattern)
  ].filter((value) => value !== null)
  return `<path ${attributes.join(' ')}/>`
}

function pathD(commands: OfdPathCommand[]): string {
  return commands
    .map((command) =>
      command.type === 'Z'
        ? 'Z'
        : `${command.type === 'B' ? 'Q' : command.type} ${command.points.map(formatNumber).join(' ')}`
    )
    .join(' ')
}

/** 对象外壳 transform：CTM 矩阵 + 平移到 Boundary 原点，单位矩阵不输出 */
function groupTransform(ctm: OfdMatrix, boundary: OfdBoundary | null): string {
  const matrix = isIdentityMatrix(ctm) ? null : `matrix(${ctm.map(formatNumber).join(' ')})`
  if (!boundary) return matrix ?? ''
  const translate = `translate(${formatNumber(boundary.x)} ${formatNumber(boundary.y)})`
  // 带缩放分量的 CTM（WPS 产出形态）：Boundary 声明的是变换后的最终包围盒，
  // 平移置于外层，CTM 只负责内容形状；旋转/平移 CTM 仍整体变换对象
  if (hasScaleComponent(ctm)) return matrix ? `${translate} ${matrix}` : translate
  return matrix ? `${matrix} ${translate}` : translate
}

/** CTM 是否带缩放分量（旋转/切变的轴长为 1，缩放会偏离 1） */
function hasScaleComponent(ctm: OfdMatrix): boolean {
  return (
    Math.abs(Math.hypot(ctm[0], ctm[1]) - 1) > 1e-6 ||
    Math.abs(Math.hypot(ctm[2], ctm[3]) - 1) > 1e-6
  )
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
