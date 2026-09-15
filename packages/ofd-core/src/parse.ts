import { OfdParseError } from './error'
import type { OfdContainer, OfdDoc, OfdDocInfo, OfdDocResources, OfdPage } from './types'
import { joinZipPath, parseDocumentRes, parseDocumentXml, parseOfdRoot, parsePageXml } from './xml'
import { openOfdZip, type OfdZip } from './zip'

export { joinZipPath } from './xml'
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
    loadResources(zip, dir, documentModel.resLocation, documentModel.publicResLocation),
    Promise.all(
      documentModel.pageLocations.map((baseLoc, index) => loadPage(zip, dir, baseLoc, index))
    )
  ])

  return {
    dir,
    info,
    pageSize: documentModel.pageSize,
    templates: documentModel.templates,
    resources,
    pages
  }
}

/** 合并文档资源与公共资源声明；同 ID 时文档资源声明在前、查找优先 */
async function loadResources(
  zip: OfdZip,
  dir: string,
  resLocation: string | null,
  publicResLocation: string | null
): Promise<OfdDocResources> {
  const locations = [resLocation, publicResLocation].filter(
    (location): location is string => location !== null
  )
  if (locations.length === 0) return { fonts: [], medias: [], drawParams: [] }
  const parts = await Promise.all(
    locations.map(async (location) =>
      parseDocumentRes(await zip.text(joinZipPath(dir, location)), location)
    )
  )
  return {
    fonts: parts.flatMap((part) => part.fonts),
    medias: parts.flatMap((part) => part.medias),
    drawParams: parts.flatMap((part) => part.drawParams)
  }
}

async function loadPage(
  zip: OfdZip,
  dir: string,
  baseLoc: string,
  index: number
): Promise<OfdPage> {
  const pageLocation = resolveContentLocation(dir, baseLoc)
  const pageModel = parsePageXml(await zip.text(pageLocation), pageLocation)
  return { index, location: pageLocation, size: pageModel.size, layers: pageModel.layers }
}

/**
 * 页 / 模板页内容定位共用：BaseLoc 以 .xml 结尾时是内容文件（WPS / 数科 /
 * 数电发票的页与模板页均写 Content.xml），否则按页目录处理（内含 Page.xml）。
 */
export function resolveContentLocation(dir: string, baseLoc: string): string {
  return /\.xml$/i.test(baseLoc) ? joinZipPath(dir, baseLoc) : joinZipPath(dir, baseLoc, 'Page.xml')
}
