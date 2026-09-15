/**
 * Page.xml 内容对象模型：图层内的文本 / 图片 / 路径 / 复合对象。
 *
 * 与 P1 的 OfdPage（图层声明）分离：渲染按页懒执行，这里在渲染前按需解析，
 * 使页与页相互独立、未渲染页不产生解析开销。
 */

import { parseOfdColor } from './color'
import {
  parseBoundary,
  parseMatrix,
  parseNumberList,
  type OfdBoundary,
  type OfdMatrix
} from './ctm'
import type { OfdLayerType, OfdTemplateRef } from './types'
import {
  childElements,
  childrenNamed,
  firstChildNamed,
  localNameOf,
  parseLayerType,
  parseXml,
  rootElementOf
} from './xml'

/** 页面内容文件根元素：普通页为 Page，模板页内容也有产出写作 TemplatePage */
const PAGE_ROOT_NAMES = ['Page', 'TemplatePage'] as const

/** Page.xml 内容层：图层类型 + 图元对象（按声明顺序） */
export interface OfdContentLayer {
  type: OfdLayerType | null
  /** 图层级 DrawParam ID，图层内未声明 DrawParam 的对象沿此继承 */
  drawParamId: string | null
  objects: OfdPageObject[]
}

/** 页面全部内容对象，附带 ID 索引供复合对象引用 */
export interface OfdPageContent {
  layers: OfdContentLayer[]
  objectsById: ReadonlyMap<string, OfdPageObject>
  /** 模板页引用（Template），按声明顺序；与页面内容的叠放由 ZOrder 决定 */
  templateRefs: OfdTemplateRef[]
}

export type OfdPageObject = OfdTextObject | OfdImageObject | OfdPathObject | OfdCompositeObject

interface OfdObjectBase {
  id: string | null
  boundary: OfdBoundary | null
  ctm: OfdMatrix | null
  /** 引用的 DrawParam ID；自身未写明的填充/描边/线宽沿声明继承 */
  drawParamId: string | null
}

/** TextCode：文本编码及字距 */
export interface OfdTextCode {
  /** 首字符原点坐标（原点在基线上），相对 Boundary 左上角 */
  x: number | null
  y: number | null
  /** 第 n 个字符相对前一个字符的位移，与 SVG dx/dy 语义一致 */
  deltaX: number[]
  deltaY: number[]
  /** 含 CustomTag 内字符的完整文本 */
  text: string
}

/**
 * CGTransform 字形替换：TextCode 文本流中 [CodePosition, CodePosition+CodeCount)
 * 区间的字符按 Glyphs 给出的字形序号从内嵌字体取轮廓。数电票内嵌子集字体
 * 的字形顺序被打乱且无 cmap（防直接按码点取字），只有该映射可用。
 */
export interface OfdGlyphSubstitution {
  /** 替换区间起点（字符在 TextObject 全部 TextCode 拼接流中的序号） */
  codePosition: number
  /** 区间字符数 */
  codeCount: number
  /** 替换字形序号列表（合字时可少于字符数） */
  glyphIds: number[]
}

export interface OfdTextObject extends OfdObjectBase {
  kind: 'text'
  fontId: string | null
  fontSize: number | null
  fillColor: string | null
  codes: OfdTextCode[]
  /** 字形替换声明（CGTransform），按声明顺序 */
  glyphSubstitutions: OfdGlyphSubstitution[]
}

export interface OfdImageObject extends OfdObjectBase {
  kind: 'image'
  /** DocumentRes MultiMedia 声明的资源 ID */
  resourceId: string | null
}

/** 路径指令：M/L 2 值、C 三次贝塞尔 6 值、B/Q 二次贝塞尔 4 值、Z 闭合；坐标相对 Boundary 原点 */
export interface OfdPathCommand {
  type: 'M' | 'L' | 'C' | 'B' | 'Q' | 'Z'
  points: number[]
}

export interface OfdPathObject extends OfdObjectBase {
  kind: 'path'
  /** Fill 属性：无颜色声明时也按默认色填充（缺省 false） */
  fill: boolean
  fillColor: string | null
  strokeColor: string | null
  lineWidth: number | null
  dashPattern: number[]
  commands: OfdPathCommand[]
}

export interface OfdCompositeObject extends OfdObjectBase {
  kind: 'composite'
  /** 被引用页面对象的 ID */
  referenceId: string | null
}

/** 解析页 / 模板页内容的图元对象；未知对象类型跳过 */
export function parsePageContent(xml: string, source: string): OfdPageContent {
  const root = rootElementOf(parseXml(xml, source), PAGE_ROOT_NAMES, source)
  // 声明上 Layer 挂在 Content 下；个别产出直接挂在 Page 下，与 parsePageXml 保持一致
  const layerParent = firstChildNamed(root, 'Content') ?? root
  const layers: OfdContentLayer[] = []
  const objectsById = new Map<string, OfdPageObject>()
  for (const layer of childrenNamed(layerParent, 'Layer')) {
    const objects: OfdPageObject[] = []
    collectLayerObjects(layer, objects, objectsById)
    layers.push({
      type: parseLayerType(layer.getAttribute('Type')),
      drawParamId: layer.getAttribute('DrawParam'),
      objects
    })
  }
  return {
    layers,
    objectsById,
    templateRefs: childrenNamed(root, 'Template').map(parseTemplateRef)
  }
}

/**
 * 图层内对象收集：PageBlock 是纯分组容器（新版数电票正文层实证，自身无
 * Boundary/CTM），递归扁平化不改变成员对象坐标。
 */
function collectLayerObjects(
  container: Element,
  out: OfdPageObject[],
  objectsById: Map<string, OfdPageObject>
): void {
  for (const element of childElements(container)) {
    if (localNameOf(element) === 'PageBlock') {
      collectLayerObjects(element, out, objectsById)
      continue
    }
    const object = parsePageObject(element)
    if (!object) continue
    if (object.id) objectsById.set(object.id, object)
    out.push(object)
  }
}

/** 解析 Template 引用：TemplateID 取声明 ID，ZOrder 缺省按背景叠加 */
function parseTemplateRef(element: Element): OfdTemplateRef {
  const zOrder = element.getAttribute('ZOrder')?.toLowerCase()
  const stackedForeground = zOrder === 'foreground'
  return {
    templateId: element.getAttribute('TemplateID'),
    zOrder: stackedForeground ? 'foreground' : 'background'
  }
}

function parsePageObject(element: Element): OfdPageObject | null {
  const base = {
    id: element.getAttribute('ID'),
    boundary: parseBoundary(element.getAttribute('Boundary')),
    ctm: parseMatrix(element.getAttribute('CTM')),
    drawParamId: element.getAttribute('DrawParam')
  }
  switch (localNameOf(element)) {
    case 'TextObject':
      return {
        ...base,
        kind: 'text',
        // 部分产出用 Font / Size 简写（数电发票实证），与 FontID / FontSize 同义
        fontId: element.getAttribute('FontID') ?? element.getAttribute('Font'),
        fontSize: parseNumber(element.getAttribute('FontSize') ?? element.getAttribute('Size')),
        fillColor: objectColor(element, 'FillColor'),
        codes: childrenNamed(element, 'TextCode').map(parseTextCode),
        glyphSubstitutions: childrenNamed(element, 'CGTransform').map(parseGlyphSubstitution)
      }
    case 'ImageObject':
      return { ...base, kind: 'image', resourceId: element.getAttribute('ResourceID') }
    case 'PathObject':
      return {
        ...base,
        kind: 'path',
        fill: element.getAttribute('Fill') === 'true',
        fillColor: objectColor(element, 'FillColor'),
        strokeColor: objectColor(element, 'StrokeColor'),
        lineWidth: parseNumber(element.getAttribute('LineWidth')),
        dashPattern: parseNumberList(element.getAttribute('DashPattern')),
        commands: parsePathCommands(
          firstChildNamed(element, 'AbbreviatedData')?.textContent ?? null
        )
      }
    case 'CompositeObject':
      return { ...base, kind: 'composite', referenceId: element.getAttribute('ReferenceID') }
    default:
      return null
  }
}

/**
 * 对象颜色声明兼容两种形式：属性 `FillColor="128 0 0"` 与子元素
 * `<FillColor Value="128 0 0"/>`（新版数电票实证为子元素形式）。
 */
function objectColor(element: Element, name: 'FillColor' | 'StrokeColor'): string | null {
  return parseOfdColor(
    element.getAttribute(name) ?? firstChildNamed(element, name)?.getAttribute('Value') ?? null
  )
}

/** 解析 CGTransform：Glyphs 支持 ST_Array 的 `g n v` 压缩写法 */
function parseGlyphSubstitution(element: Element): OfdGlyphSubstitution {
  return {
    codePosition: parseNumber(element.getAttribute('CodePosition')) ?? 0,
    codeCount: parseNumber(element.getAttribute('CodeCount')) ?? 0,
    glyphIds: parseDeltaList(firstChildNamed(element, 'Glyphs')?.textContent ?? null)
  }
}

function parseTextCode(code: Element): OfdTextCode {
  return {
    x: parseNumber(code.getAttribute('X')),
    y: parseNumber(code.getAttribute('Y')),
    deltaX: parseDeltaList(code.getAttribute('DeltaX')),
    deltaY: parseDeltaList(code.getAttribute('DeltaY')),
    text: code.textContent ?? ''
  }
}

/**
 * 解析 TextCode 位移数组：数值按序对应相邻字符位移；`g n v` 是 ST_Array 的
 * 压缩写法（数电发票实证），表示 n 个连续位移均为 v。
 */
function parseDeltaList(value: string | null): number[] {
  const tokens =
    value
      ?.trim()
      .split(/[\s,]+/)
      .filter((token) => token !== '') ?? []
  const deltas: number[] = []
  for (let index = 0; index < tokens.length;) {
    if (tokens[index] === 'g') {
      const count = Number(tokens[index + 1])
      const repeated = Number(tokens[index + 2])
      if (Number.isInteger(count) && count > 0 && Number.isFinite(repeated)) {
        for (let repeat = 0; repeat < count; repeat++) deltas.push(repeated)
        index += 3
        continue
      }
      index += 1 // 畸形压缩段：跳过标记按普通数值继续
      continue
    }
    const delta = Number(tokens[index])
    if (Number.isFinite(delta)) deltas.push(delta)
    index += 1
  }
  return deltas
}

const PATH_ARITY: Record<OfdPathCommand['type'], number> = { M: 2, L: 2, C: 6, B: 4, Q: 4, Z: 0 }

function parsePathCommands(data: string | null): OfdPathCommand[] {
  const tokens =
    data
      ?.trim()
      .split(/[\s,]+/)
      .filter((token) => token !== '') ?? []
  const commands: OfdPathCommand[] = []
  for (let index = 0; index < tokens.length;) {
    const type = tokens[index]!.toUpperCase() as OfdPathCommand['type']
    const arity = PATH_ARITY[type]
    if (arity === undefined) {
      index += 1
      continue
    }
    const points = tokens.slice(index + 1, index + 1 + arity).map(Number)
    if (points.length === arity && points.every((point) => Number.isFinite(point))) {
      commands.push({ type, points })
    }
    index += 1 + arity
  }
  return commands
}

function parseNumber(value: string | null): number | null {
  const numbers = parseNumberList(value)
  return numbers.length > 0 ? numbers[0]! : null
}
