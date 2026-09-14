import { OfdParseError } from './error'
import type {
  OfdDocInfo,
  OfdDocResources,
  OfdFontDecl,
  OfdLayerDecl,
  OfdLayerType,
  OfdMediaDecl,
  OfdPageSize
} from './types'

// GB/T 33190 未强制命名空间前缀，统一按 localName 匹配，兼容 ofd: 等任意前缀。

function childElements(element: Element): Element[] {
  const out: Element[] = []
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i]
    if (node && node.nodeType === 1) out.push(node as Element)
  }
  return out
}

function localNameOf(element: Element): string {
  if (element.localName) return element.localName
  const tag = element.nodeName
  return tag.includes(':') ? tag.slice(tag.indexOf(':') + 1) : tag
}

function childrenNamed(element: Element, name: string): Element[] {
  return childElements(element).filter((child) => localNameOf(child) === name)
}

function firstChildNamed(element: Element, name: string): Element | null {
  return childrenNamed(element, name)[0] ?? null
}

function childText(element: Element, name: string): string | null {
  return firstChildNamed(element, name)?.textContent ?? null
}

function normalizedText(value: string | null): string | null {
  const text = value?.trim()
  return text ? text : null
}

function parseXml(xml: string, source: string): Document {
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

function rootElementOf(doc: Document, name: string, source: string): Element {
  const root = doc.documentElement
  if (!root || localNameOf(root) !== name) {
    throw new OfdParseError('invalid-structure', `${source} 根节点不是 ${name}`)
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
  /** DocumentRes@ResLoc，相对文档根目录；未声明为 null */
  resLocation: string | null
  /** Page@BaseLoc 列表，相对文档根目录 */
  pageLocations: string[]
}

/** 解析 Document.xml：默认页尺寸、公共资源引用、页面树 */
export function parseDocumentXml(xml: string, source: string): OfdDocumentModel {
  const root = rootElementOf(parseXml(xml, source), 'Document', source)
  const commonData = firstChildNamed(root, 'CommonData')
  const resNode = firstChildNamed(root, 'DocumentRes')
  const pages = firstChildNamed(root, 'Pages')
  return {
    pageSize: commonData ? parsePageSize(commonData) : null,
    resLocation: resNode ? normalizedText(resNode.getAttribute('ResLoc')) : null,
    pageLocations: pages
      ? childrenNamed(pages, 'Page')
          .map((page) => normalizedText(page.getAttribute('BaseLoc')))
          .filter((value): value is string => value !== null)
      : []
  }
}

/** 解析 DocumentRes.xml：字体与多媒体资源声明 */
export function parseDocumentRes(xml: string, source: string): OfdDocResources {
  const root = rootElementOf(parseXml(xml, source), 'Res', source)
  const fonts: OfdFontDecl[] = []
  const medias: OfdMediaDecl[] = []
  for (const group of childrenNamed(root, 'Fonts')) {
    for (const font of childrenNamed(group, 'Font')) {
      const id = font.getAttribute('ID')
      if (id !== null) fonts.push({ id, fontName: normalizedText(font.getAttribute('FontName')) })
    }
  }
  for (const group of childrenNamed(root, 'MultiMedias')) {
    for (const media of childrenNamed(group, 'MultiMedia')) {
      const id = media.getAttribute('ID')
      if (id !== null) {
        medias.push({
          id,
          type: media.getAttribute('Type'),
          location: normalizedText(media.getAttribute('ResLoc'))
        })
      }
    }
  }
  return { fonts, medias }
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
    size: commonData ? parsePageSize(commonData) : null,
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

function parseLayerType(value: string | null): OfdLayerType | null {
  return value === 'background' ||
    value === 'body' ||
    value === 'foreground' ||
    value === 'annotation'
    ? value
    : null
}
