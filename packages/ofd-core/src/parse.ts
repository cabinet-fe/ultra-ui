import { OfdParseError } from './error'
import type { OfdContainer, OfdDoc, OfdDocInfo, OfdDocResources, OfdPage } from './types'
import { parseDocumentRes, parseDocumentXml, parseOfdRoot, parsePageXml } from './xml'
import { openOfdZip, type OfdZip } from './zip'

export { openOfdZip, type OfdZip } from './zip'

/** 解析 OFD 文件字节：解包 ZIP 容器并解析全部文档的页面模型 */
export async function parseOfd(data: Uint8Array): Promise<OfdContainer> {
  return parseOfdContainer(openOfdZip(data))
}

/** 在已打开的容器上解析（复用同一个 OfdZip 读多个文档） */
export async function parseOfdContainer(zip: OfdZip): Promise<OfdContainer> {
  if (!zip.has('OFD.xml')) {
    throw new OfdParseError('missing-entry', '容器中缺少 OFD.xml，不是合法的 OFD 文件')
  }
  const bodies = parseOfdRoot(await zip.text('OFD.xml'))
  if (bodies.length === 0) {
    throw new OfdParseError('invalid-structure', 'OFD.xml 中没有 DocBody')
  }
  return { docs: await Promise.all(bodies.map((body) => parseDoc(zip, body.docRoot, body.info))) }
}

async function parseDoc(zip: OfdZip, docRoot: string, info: OfdDocInfo): Promise<OfdDoc> {
  const docLocation = joinZipPath(docRoot)
  const dir = docLocation.includes('/') ? docLocation.slice(0, docLocation.lastIndexOf('/')) : ''
  const documentModel = parseDocumentXml(await zip.text(docLocation), docLocation)

  const [resources, pages] = await Promise.all([
    loadResources(zip, dir, documentModel.resLocation),
    Promise.all(
      documentModel.pageLocations.map((baseLoc, index) => loadPage(zip, dir, baseLoc, index))
    )
  ])

  return { dir, info, pageSize: documentModel.pageSize, resources, pages }
}

async function loadResources(
  zip: OfdZip,
  dir: string,
  resLocation: string | null
): Promise<OfdDocResources> {
  if (!resLocation) return { fonts: [], medias: [] }
  return parseDocumentRes(await zip.text(joinZipPath(dir, resLocation)), resLocation)
}

async function loadPage(
  zip: OfdZip,
  dir: string,
  baseLoc: string,
  index: number
): Promise<OfdPage> {
  const pageLocation = joinZipPath(dir, baseLoc, 'Page.xml')
  const pageModel = parsePageXml(await zip.text(pageLocation), pageLocation)
  return { index, location: pageLocation, size: pageModel.size, layers: pageModel.layers }
}

/** 拼接并规范化容器内路径：去空段与 './'，统一 '/' 分隔（图片资源定位等处复用） */
export function joinZipPath(...segments: string[]): string {
  const parts: string[] = []
  for (const segment of segments) {
    for (const piece of segment.split('/')) {
      if (piece !== '' && piece !== '.') parts.push(piece)
    }
  }
  return parts.join('/')
}
