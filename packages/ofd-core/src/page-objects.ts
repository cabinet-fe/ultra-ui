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
import type { OfdLayerType } from './types'
import {
  childElements,
  childrenNamed,
  firstChildNamed,
  localNameOf,
  parseLayerType,
  parseXml,
  rootElementOf
} from './xml'

/** Page.xml 内容层：图层类型 + 图元对象（按声明顺序） */
export interface OfdContentLayer {
  type: OfdLayerType | null
  objects: OfdPageObject[]
}

/** 页面全部内容对象，附带 ID 索引供复合对象引用 */
export interface OfdPageContent {
  layers: OfdContentLayer[]
  objectsById: ReadonlyMap<string, OfdPageObject>
}

export type OfdPageObject = OfdTextObject | OfdImageObject | OfdPathObject | OfdCompositeObject

interface OfdObjectBase {
  id: string | null
  boundary: OfdBoundary | null
  ctm: OfdMatrix | null
}

/** TextCode：文本编码及字距 */
export interface OfdTextCode {
  /** 首字符原点坐标（原点在基线上），相对 Boundary 左上角 */
  x: number | null
  y: number | null
  /** 第 n 个字符相对前一个字符的位移，与 SVG dx/dy 语义一致 */
  deltaX: number[]
  deltaY: number[]
  /** 含 CustomTag 内字符的完整文本（字形替换不在内核层处理，按原字符渲染） */
  text: string
}

export interface OfdTextObject extends OfdObjectBase {
  kind: 'text'
  fontId: string | null
  fontSize: number | null
  fillColor: string | null
  codes: OfdTextCode[]
}

export interface OfdImageObject extends OfdObjectBase {
  kind: 'image'
  /** DocumentRes MultiMedia 声明的资源 ID */
  resourceId: string | null
}

/** 路径指令：M/L 2 值、C 三次贝塞尔 6 值、Q 二次贝塞尔 4 值、Z 闭合；坐标相对 Boundary 原点 */
export interface OfdPathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'Z'
  points: number[]
}

export interface OfdPathObject extends OfdObjectBase {
  kind: 'path'
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

/** 解析 Page.xml 的内容对象；未知对象类型跳过 */
export function parsePageContent(xml: string, source: string): OfdPageContent {
  const root = rootElementOf(parseXml(xml, source), 'Page', source)
  // 声明上 Layer 挂在 Content 下；个别产出直接挂在 Page 下，与 parsePageXml 保持一致
  const layerParent = firstChildNamed(root, 'Content') ?? root
  const layers: OfdContentLayer[] = []
  const objectsById = new Map<string, OfdPageObject>()
  for (const layer of childrenNamed(layerParent, 'Layer')) {
    const objects: OfdPageObject[] = []
    for (const element of childElements(layer)) {
      const object = parsePageObject(element)
      if (!object) continue
      if (object.id) objectsById.set(object.id, object)
      objects.push(object)
    }
    layers.push({ type: parseLayerType(layer.getAttribute('Type')), objects })
  }
  return { layers, objectsById }
}

function parsePageObject(element: Element): OfdPageObject | null {
  const base = {
    id: element.getAttribute('ID'),
    boundary: parseBoundary(element.getAttribute('Boundary')),
    ctm: parseMatrix(element.getAttribute('CTM'))
  }
  switch (localNameOf(element)) {
    case 'TextObject':
      return {
        ...base,
        kind: 'text',
        fontId: element.getAttribute('FontID'),
        fontSize: parseNumber(element.getAttribute('FontSize')),
        fillColor: parseOfdColor(element.getAttribute('FillColor')),
        codes: childrenNamed(element, 'TextCode').map(parseTextCode)
      }
    case 'ImageObject':
      return { ...base, kind: 'image', resourceId: element.getAttribute('ResourceID') }
    case 'PathObject':
      return {
        ...base,
        kind: 'path',
        fillColor: parseOfdColor(element.getAttribute('FillColor')),
        strokeColor: parseOfdColor(element.getAttribute('StrokeColor')),
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

function parseTextCode(code: Element): OfdTextCode {
  return {
    x: parseNumber(code.getAttribute('X')),
    y: parseNumber(code.getAttribute('Y')),
    deltaX: parseNumberList(code.getAttribute('DeltaX')),
    deltaY: parseNumberList(code.getAttribute('DeltaY')),
    text: code.textContent ?? ''
  }
}

const PATH_ARITY: Record<OfdPathCommand['type'], number> = { M: 2, L: 2, C: 6, Q: 4, Z: 0 }

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
