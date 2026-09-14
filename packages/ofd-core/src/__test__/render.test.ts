import { describe, expect, it } from 'vitest'

import { parseOfdContainer } from '../parse'
import { pageToSvg } from '../render'
import { openOfdZip } from '../zip'
import { buildZip, expectParseError, utf8 } from './fixtures'

const OFD_NS = 'http://www.ofdservice.org/ofd'

const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13])

function ofdXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Ofd xmlns:ofd="${OFD_NS}">` +
    `<ofd:DocBody><ofd:DocInfo><ofd:DocID>doc-0</ofd:DocID></ofd:DocInfo>` +
    '<ofd:DocRoot>Doc_0/Document.xml</ofd:DocRoot></ofd:DocBody></ofd:Ofd>'
  )
}

function documentXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Document xmlns:ofd="${OFD_NS}">` +
    '<ofd:CommonData><ofd:PageWidth>210</ofd:PageWidth><ofd:PageHeight>297</ofd:PageHeight></ofd:CommonData>' +
    '<ofd:DocumentRes ResLoc="DocumentRes.xml"/>' +
    '<ofd:Pages><ofd:Page BaseLoc="Pages/Page_0"/><ofd:Page BaseLoc="Pages/Page_1"/><ofd:Page BaseLoc="Pages/Page_2"/></ofd:Pages>' +
    '</ofd:Document>'
  )
}

function documentResXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Res xmlns:ofd="${OFD_NS}">` +
    '<ofd:Fonts><ofd:Font ID="0" FontName="宋体"/></ofd:Fonts>' +
    '<ofd:MultiMedias>' +
    '<ofd:MultiMedia ID="1" Type="g" ResLoc="Res/seal.png"/>' +
    // 声明了但容器中不存在的资源：渲染时降级跳过
    '<ofd:MultiMedia ID="2" Type="g" ResLoc="Res/gone.png"/>' +
    '</ofd:MultiMedias></ofd:Res>'
  )
}

/** 含文本 + 图片（CTM 旋转）+ 路径 + 复合 + 签章层图片的最小页面 */
function page0Xml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}"><ofd:Content>` +
    '<ofd:Layer ID="10" Type="body">' +
    '<ofd:TextObject ID="t1" Boundary="20 20 100 20" FontID="0" FontSize="3.7" FillColor="255 0 0">' +
    '<ofd:TextCode X="0" Y="3.7" DeltaX="1 2">合计&lt;金额&gt;100&amp;20</ofd:TextCode>' +
    '</ofd:TextObject>' +
    '<ofd:ImageObject ID="i1" Boundary="30 40 60 40" CTM="0 1 -1 0 210 0" ResourceID="1"/>' +
    '<ofd:ImageObject ID="i2" Boundary="10 150 20 20" ResourceID="2"/>' +
    '<ofd:PathObject ID="p1" Boundary="50 60 80 80" FillColor="0 0 255" StrokeColor="g 0" LineWidth="0.5" DashPattern="2 1">' +
    '<ofd:AbbreviatedData>M 0 0 L 40 0 C 40 20 60 20 80 80 Q 40 40 20 20 Z</ofd:AbbreviatedData>' +
    '</ofd:PathObject>' +
    '</ofd:Layer>' +
    '<ofd:Layer ID="11" Type="foreground">' +
    '<ofd:CompositeObject ID="c1" Boundary="0 0 80 80" CTM="1 0 0 1 50 0" ReferenceID="p1"/>' +
    '</ofd:Layer>' +
    '<ofd:Layer ID="12" Type="annotation">' +
    '<ofd:ImageObject ID="stamp1" Boundary="150 10 20 20" ResourceID="1"/>' +
    '</ofd:Layer>' +
    '</ofd:Content></ofd:Page>'
  )
}

function page1Xml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}"/>`
}

/** 自引用复合对象：渲染应断开循环而不是挂死 */
function page2Xml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}"><ofd:Content>` +
    '<ofd:Layer ID="1" Type="body">' +
    '<ofd:CompositeObject ID="x1" Boundary="0 0 10 10" ReferenceID="x1"/>' +
    '</ofd:Layer></ofd:Content></ofd:Page>'
  )
}

async function buildFixture() {
  const data = await buildZip([
    { name: 'OFD.xml', data: utf8(ofdXml()), deflate: true },
    { name: 'Doc_0/Document.xml', data: utf8(documentXml()) },
    { name: 'Doc_0/DocumentRes.xml', data: utf8(documentResXml()) },
    { name: 'Doc_0/Pages/Page_0/Page.xml', data: utf8(page0Xml()) },
    { name: 'Doc_0/Pages/Page_1/Page.xml', data: utf8(page1Xml()) },
    { name: 'Doc_0/Pages/Page_2/Page.xml', data: utf8(page2Xml()) },
    { name: 'Doc_0/Res/seal.png', data: PNG_MAGIC }
  ])
  const zip = openOfdZip(data)
  return { zip, container: await parseOfdContainer(zip) }
}

describe('pageToSvg', () => {
  it('页面物理尺寸按毫米换算为像素，viewBox 保留文档坐标', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toMatch(/^<svg /)
    expect(svg).toContain('width="793.7px"')
    expect(svg).toContain('height="1122.52px"')
    expect(svg).toContain('viewBox="0 0 210 297"')
  })

  it('文本对象按 Boundary 定位、声明颜色填充，字距与转义正确', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain('<g data-ofd-layer="body">')
    expect(svg).toContain(
      '<text x="0" y="3.7" dx="1 2" font-size="3.7" font-family="宋体" fill="rgb(255 0 0)">' +
        '合计&lt;金额&gt;100&amp;20</text>'
    )
  })

  it('图片对象按 Boundary/CTM 定位，资源按媒体类型解析', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain('transform="matrix(0 1 -1 0 210 0) translate(30 40)"')
    expect(svg).toContain('<image width="60" height="40" href="data:image/png;base64,')
    // 缺失资源降级跳过：只剩正文图片与签章图两处
    expect(svg.match(/<image /g)).toHaveLength(2)
  })

  it('路径对象输出 M/L/C/Q/Z 指令与描边填充、线宽、虚线', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain(
      '<path d="M 0 0 L 40 0 C 40 20 60 20 80 80 Q 40 40 20 20 Z" fill="rgb(0 0 255)" ' +
        'stroke="rgb(0 0 0)" stroke-width="0.5" stroke-dasharray="2 1"/>'
    )
  })

  it('复合对象递归渲染被引用路径，子对象继承 CTM 链', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg.match(/<path /g)).toHaveLength(2)
    expect(svg).toContain('<g transform="matrix(1 0 0 1 50 0) translate(0 0)">')
  })

  it('签章图在注释层按位置叠加渲染，位于正文之后', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    const annotationStart = svg.indexOf('data-ofd-layer="annotation"')
    expect(annotationStart).toBeGreaterThan(svg.indexOf('data-ofd-layer="body"'))
    expect(svg.slice(annotationStart)).toContain('transform="translate(150 10)"')
    expect(svg.slice(annotationStart)).toContain(
      '<image width="20" height="20" href="data:image/png;base64,'
    )
  })

  it('页与页相互独立：空页可单独输出，同页重复输出结果一致', async () => {
    const { zip, container } = await buildFixture()

    const emptyPage = await pageToSvg(zip, container, 0, 1)
    expect(emptyPage).toContain('viewBox="0 0 210 297"')
    expect(emptyPage).not.toContain('<text')

    const svg = await pageToSvg(zip, container, 0, 0)
    expect(await pageToSvg(zip, container, 0, 0)).toBe(svg)
  })

  it('自引用复合对象断开循环，不挂死不输出', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 2)

    expect(svg).not.toContain('<g')
  })

  it('文档或页序号越界抛 out-of-range', async () => {
    const { zip, container } = await buildFixture()

    const pageError = await expectParseError(() => pageToSvg(zip, container, 0, 3))
    expect(pageError.reason).toBe('out-of-range')
    const docError = await expectParseError(() => pageToSvg(zip, container, 1, 0))
    expect(docError.reason).toBe('out-of-range')
  })
})
