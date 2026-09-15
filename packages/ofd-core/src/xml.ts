import { parseOfdColor } from './color'
import { parseNumberList } from './ctm'
import { OfdParseError } from './error'
import type {
  OfdDocInfo,
  OfdDocResources,
  OfdDrawParamDecl,
  OfdFontDecl,
  OfdLayerDecl,
  OfdLayerType,
  OfdMediaDecl,
  OfdPageSize,
  OfdTemplateDecl
} from './types'

// GB/T 33190 未强制命名空间前缀，统一按 localName 匹配，兼容 ofd: 等任意前缀。
// 下方 XML 遍历辅助同时供 page-objects.ts 等包内解析模块复用。

export function childElements(element: Element): Element[] {
  const out: Element[] = []
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i]
    if (node && node.nodeType === 1) out.push(node as Element)
  }
  return out
}

export function localNameOf(element: Element): string {
  if (element.localName) return element.localName
  const tag = element.nodeName
  return tag.includes(':') ? tag.slice(tag.indexOf(':') + 1) : tag
}

export function childrenNamed(element: Element, name: string): Element[] {
  return childElements(element).filter((child) => localNameOf(child) === name)
}

export function firstChildNamed(element: Element, name: string): Element | null {
  return childrenNamed(element, name)[0] ?? null
}

function childText(element: Element, name: string): string | null {
  return firstChildNamed(element, name)?.textContent ?? null
}

function normalizedText(value: string | null): string | null {
  const text = value?.trim()
  return text ? text : null
}

export function parseXml(xml: string, source: string): Document {
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml')
  } catch (cause) {
    throw new OfdParseError('invalid-xml', `${source} 不是合法的 XML`, { cause })
  }
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new OfdParseError('invalid-xml', `${source} 不是合法的 XML`)
  }
  return doc
}

export function rootElementOf(
  doc: Document,
  names: string | readonly string[],
  source: string
): Element {
  const expected = typeof names === 'string' ? [names] : names
  const root = doc.documentElement
  // OFD.xml 根节点实际产出为 'OFD'（大小写各异），按不区分大小写匹配
  const lowered = expected.map((name) => name.toLowerCase())
  if (!root || !lowered.includes(localNameOf(root).toLowerCase())) {
    throw new OfdParseError('invalid-structure', `${source} 根节点不是 ${expected.join(' / ')}`)
  }
  return root
}

/** OFD.xml 中一个 DocBody 的入口信息 */
export interface OfdRootEntry {
  /** DocRoot 声明的文档入口路径，如 'Doc_0/Document.xml' */
  docRoot: string
  info: OfdDocInfo
}

/** 解析 OFD.xml：每个 DocBody 产出一条入口，支持多文档容器 */
export function parseOfdRoot(xml: string, source = 'OFD.xml'): OfdRootEntry[] {
  const root = rootElementOf(parseXml(xml, source), 'Ofd', source)
  return childrenNamed(root, 'DocBody').map((body) => {
    const docRoot = normalizedText(childText(body, 'DocRoot'))
    if (!docRoot) throw new OfdParseError('invalid-structure', `${source} 中 DocBody 缺少 DocRoot`)
    const info = firstChildNamed(body, 'DocInfo')
    return {
      docRoot,
      info: {
        docId: info ? normalizedText(childText(info, 'DocID')) : null,
        title: info ? normalizedText(childText(info, 'Title')) : null
      }
    }
  })
}

/** Document.xml 解析结果 */
export interface OfdDocumentModel {
  pageSize: OfdPageSize | null
  /** DocumentRes 声明路径，相对文档根目录；未声明为 null */
  resLocation: string | null
  /** PublicRes 声明路径，相对文档根目录；未声明为 null */
  publicResLocation: string | null
  /** CommonData 声明的模板页（TemplatePage），按声明顺序 */
  templates: OfdTemplateDecl[]
  /** Page@BaseLoc 列表，相对文档根目录 */
  pageLocations: string[]
}

/** 解析 Document.xml：默认页尺寸、公共资源引用、模板页声明、页面树 */
export function parseDocumentXml(xml: string, source: string): OfdDocumentModel {
  const root = rootElementOf(parseXml(xml, source), 'Document', source)
  const commonData = firstChildNamed(root, 'CommonData')
  const pages = firstChildNamed(root, 'Pages')
  return {
    pageSize: commonData
      ? (parsePageSize(commonData) ?? physicalBoxSize(commonData, 'PageArea'))
      : null,
    resLocation: resDeclarationLocation(root, commonData, 'DocumentRes'),
    publicResLocation: resDeclarationLocation(root, commonData, 'PublicRes'),
    templates: commonData
      ? childrenNamed(commonData, 'TemplatePage').map((template) => ({
          id: template.getAttribute('ID'),
          location: normalizedText(template.getAttribute('BaseLoc') ?? template.textContent)
        }))
      : [],
    pageLocations: pages
      ? childrenNamed(pages, 'Page')
          .map((page) => normalizedText(page.getAttribute('BaseLoc')))
          .filter((value): value is string => value !== null)
      : []
  }
}

/**
 * 资源声明路径兼容两种产出形态：声明元素挂在 Document 根或 CommonData 下，
 * 路径写在 ResLoc 属性或元素文本中（WPS / 数科 / 数电发票产出均为文本形态）。
 */
function resDeclarationLocation(
  root: Element,
  commonData: Element | null,
  name: string
): string | null {
  const node = firstChildNamed(root, name) ?? (commonData && firstChildNamed(commonData, name))
  if (!node) return null
  return normalizedText(node.getAttribute('ResLoc')) ?? normalizedText(node.textContent)
}

/** 物理盒尺寸兜底（"x y w h" 取宽高）；主流生成器以 PhysicalBox 代替 PageWidth/PageHeight */
function physicalBoxSize(scope: Element, wrapper: string): OfdPageSize | null {
  const container = firstChildNamed(scope, wrapper)
  const box = container ? firstChildNamed(container, 'PhysicalBox') : null
  const numbers = parseNumberList(box?.textContent ?? null)
  return numbers.length === 4 ? { width: numbers[2]!, height: numbers[3]! } : null
}

/** 解析 DocumentRes.xml / PublicRes.xml：字体、多媒体资源与绘制参数声明 */
export function parseDocumentRes(xml: string, source: string): OfdDocResources {
  const root = rootElementOf(parseXml(xml, source), 'Res', source)
  const baseLoc = normalizedText(root.getAttribute('BaseLoc'))
  const fonts: OfdFontDecl[] = []
  const medias: OfdMediaDecl[] = []
  const drawParams: OfdDrawParamDecl[] = []
  for (const group of childrenNamed(root, 'Fonts')) {
    for (const font of childrenNamed(group, 'Font')) {
      const id = font.getAttribute('ID')
      if (id !== null) {
        fonts.push({
          id,
          fontName: normalizedText(font.getAttribute('FontName')),
          fontFile: fontFileLocation(baseLoc, font)
        })
      }
    }
  }
  for (const group of childrenNamed(root, 'MultiMedias')) {
    for (const media of childrenNamed(group, 'MultiMedia')) {
      const id = media.getAttribute('ID')
      if (id !== null) {
        medias.push({
          id,
          type: media.getAttribute('Type'),
          location:
            normalizedText(media.getAttribute('ResLoc')) ?? mediaFileLocation(baseLoc, media)
        })
      }
    }
  }
  for (const group of childrenNamed(root, 'DrawParams')) {
    for (const param of childrenNamed(group, 'DrawParam')) {
      const id = param.getAttribute('ID')
      if (id !== null) {
        drawParams.push({
          id,
          lineWidth: parseNumber(param.getAttribute('LineWidth')),
          relative: normalizedText(param.getAttribute('Relative')),
          fillColor: declaredColor(param, 'FillColor'),
          strokeColor: declaredColor(param, 'StrokeColor')
        })
      }
    }
  }
  return { fonts, medias, drawParams }
}

/** DrawParam 子元素颜色：<FillColor Value="128 0 0"/> 按 Value 属性解析 */
function declaredColor(param: Element, name: string): string | null {
  return parseOfdColor(firstChildNamed(param, name)?.getAttribute('Value') ?? null)
}

/**
 * 字体文件位置：FontFile 兼容属性与子元素两种声明（新版数电发票实证为子元素），
 * 路径相对资源声明根的 BaseLoc 解析，未声明 BaseLoc 时相对文档根。
 */
function fontFileLocation(baseLoc: string | null, font: Element): string | null {
  const file =
    normalizedText(font.getAttribute('FontFile')) ?? normalizedText(childText(font, 'FontFile'))
  return file === null ? null : joinZipPath(baseLoc ?? '', file)
}

/** 媒体位置兜底：MediaFile 子元素声明文件名，相对资源声明根的 BaseLoc 解析 */
function mediaFileLocation(baseLoc: string | null, media: Element): string | null {
  const file = normalizedText(firstChildNamed(media, 'MediaFile')?.textContent ?? null)
  return file === null ? null : joinZipPath(baseLoc ?? '', file)
}

/**
 * 拼接并规范化容器内路径：去空段与 './'，统一 '/' 分隔（页面定位、图片资源定位共用）。
 * 段以 '/' 开头时按容器绝对路径处理（个别产出在相对文档根的位置写绝对路径）。
 */
export function joinZipPath(...segments: string[]): string {
  const parts: string[] = []
  for (const segment of segments) {
    if (segment.startsWith('/')) parts.length = 0
    for (const piece of segment.split('/')) {
      if (piece !== '' && piece !== '.') parts.push(piece)
    }
  }
  return parts.join('/')
}

/** Page.xml 解析结果 */
export interface OfdPageModel {
  size: OfdPageSize | null
  layers: OfdLayerDecl[]
}

/** 解析 Page.xml：页面尺寸覆盖与图层声明 */
export function parsePageXml(xml: string, source: string): OfdPageModel {
  const root = rootElementOf(parseXml(xml, source), 'Page', source)
  const commonData = firstChildNamed(root, 'CommonData')
  // 声明上 Layer 挂在 Content 下；个别产出直接挂在 Page 下，这里都兼容
  const layerParent = firstChildNamed(root, 'Content') ?? root
  return {
    size:
      (commonData
        ? (parsePageSize(commonData) ?? physicalBoxSize(commonData, 'PageArea'))
        : null) ?? physicalBoxSize(root, 'Area'),
    layers: childrenNamed(layerParent, 'Layer').map((layer) => ({
      id: layer.getAttribute('ID'),
      type: parseLayerType(layer.getAttribute('Type'))
    }))
  }
}

function parsePageSize(commonData: Element): OfdPageSize | null {
  const width = parseNumber(childText(commonData, 'PageWidth'))
  const height = parseNumber(childText(commonData, 'PageHeight'))
  return width !== null && height !== null ? { width, height } : null
}

function parseNumber(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseLayerType(value: string | null): OfdLayerType | null {
  // 新版数电票实证 Type 首字母大写（Body），统一按小写匹配
  const lowered = value?.toLowerCase()
  return lowered === 'background' ||
    lowered === 'body' ||
    lowered === 'foreground' ||
    lowered === 'annotation'
    ? lowered
    : null
}
