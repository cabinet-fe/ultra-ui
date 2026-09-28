import { describe, expect, it } from 'vite-plus/test'

import { parseOfdContainer } from '../parse'
import { pageToSvg } from '../render'
import { openOfdZip } from '../zip'
import { buildTtf, buildZip, expectParseError, TRIANGLE_CONTOUR, utf8 } from './fixtures'

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
    // 数电发票票面标记形态：B 二次贝塞尔 + Fill="true" 无颜色声明
    '<ofd:PathObject ID="p2" Boundary="5 95 5 5" Fill="true" LineWidth="0.225">' +
    '<ofd:AbbreviatedData>M 4.5 2.5 B 4.5 1.4 3.6 0.45 B 1.4 0.45 0.45 2.5 M 1 1 L 4 4</ofd:AbbreviatedData>' +
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
      // DeltaX 步长换算为逐字符绝对坐标：x = 0、1、3，其余字符自然排布
      '<text xml:space="preserve" x="0 1 3" y="3.7" font-size="3.7" font-family="宋体" fill="rgb(255 0 0)">' +
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

  it('B 二次贝塞尔输出为 SVG Q，Fill="true" 无颜色声明按默认黑填充', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain(
      '<path d="M 4.5 2.5 Q 4.5 1.4 3.6 0.45 Q 1.4 0.45 0.45 2.5 M 1 1 L 4 4" fill="#000" stroke-width="0.225"/>'
    )
  })

  it('复合对象递归渲染被引用路径，子对象继承 CTM 链', async () => {
    const { zip, container } = await buildFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    // p1 直渲染 + 复合引用再渲染，p2 票面标记一处
    expect(svg.match(/<path /g)).toHaveLength(3)
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

// ---- 内嵌字体文本（P3）：声明 FontFile 时按 glyph 轮廓输出 path ----

const SQUARE_CONTOUR = [
  { x: 0, y: 0, on: true },
  { x: 400, y: 0, on: true },
  { x: 400, y: 400, on: true },
  { x: 0, y: 400, on: true }
]

/** A→三角形（宽 500）、B→正方形（宽 400），unitsPerEm 1000 */
const EMBEDDED_FONT = buildTtf({
  cmap: { 65: 1, 66: 2 },
  glyphs: [{}, { contours: [TRIANGLE_CONTOUR] }, { contours: [SQUARE_CONTOUR] }],
  advances: [600, 500, 400]
})

function embeddedDocumentXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Document xmlns:ofd="${OFD_NS}">` +
    '<ofd:CommonData><ofd:PageWidth>210</ofd:PageWidth><ofd:PageHeight>297</ofd:PageHeight></ofd:CommonData>' +
    '<ofd:DocumentRes ResLoc="DocumentRes.xml"/>' +
    '<ofd:Pages><ofd:Page BaseLoc="Pages/Page_0"/></ofd:Pages>' +
    '</ofd:Document>'
  )
}

function embeddedDocumentResXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Res xmlns:ofd="${OFD_NS}">` +
    '<ofd:Fonts>' +
    '<ofd:Font ID="9" FontName="内嵌" FontFile="Res/font.ttf"/>' +
    // 字体文件损坏 / 未放入容器：渲染时回退系统字体
    '<ofd:Font ID="8" FontName="损坏" FontFile="Res/broken.ttf"/>' +
    '<ofd:Font ID="7" FontName="缺失" FontFile="Res/missing.ttf"/>' +
    '</ofd:Fonts></ofd:Res>'
  )
}

function embeddedPageXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}"><ofd:Content>` +
    '<ofd:Layer ID="1" Type="body">' +
    '<ofd:TextObject ID="et1" Boundary="0 0 100 30" FontID="9" FontSize="10" FillColor="0 255 0">' +
    '<ofd:TextCode X="0" Y="10" DeltaX="2">AB</ofd:TextCode>' +
    '</ofd:TextObject>' +
    '<ofd:TextObject ID="et2" Boundary="0 30 100 30" FontID="9" FontSize="10">' +
    '<ofd:TextCode X="0" Y="10">A</ofd:TextCode>' +
    '</ofd:TextObject>' +
    '<ofd:TextObject ID="bt" Boundary="0 60 100 30" FontID="8" FontSize="10" FillColor="0 0 255">' +
    '<ofd:TextCode X="0" Y="10">坏&lt;字&gt;</ofd:TextCode>' +
    '</ofd:TextObject>' +
    '<ofd:TextObject ID="mt" Boundary="0 90 100 30" FontID="7" FontSize="10">' +
    '<ofd:TextCode X="0" Y="10">缺资源</ofd:TextCode>' +
    '</ofd:TextObject>' +
    '</ofd:Layer></ofd:Content></ofd:Page>'
  )
}

async function buildEmbeddedFixture() {
  const data = await buildZip([
    { name: 'OFD.xml', data: utf8(ofdXml()) },
    { name: 'Doc_0/Document.xml', data: utf8(embeddedDocumentXml()) },
    { name: 'Doc_0/DocumentRes.xml', data: utf8(embeddedDocumentResXml()) },
    { name: 'Doc_0/Pages/Page_0/Page.xml', data: utf8(embeddedPageXml()) },
    { name: 'Doc_0/Res/font.ttf', data: EMBEDDED_FONT },
    { name: 'Doc_0/Res/broken.ttf', data: utf8('not a ttf') }
  ])
  const zip = openOfdZip(data)
  return { zip, container: await parseOfdContainer(zip) }
}

describe('内嵌字体文本', () => {
  it('声明 FontFile 的文本按 glyph 轮廓输出 path，同一字体复用解析缓存', async () => {
    const { zip, container } = await buildEmbeddedFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    // A=三角形，DeltaX=2 后 B=正方形，字号 10 / unitsPerEm 1000 → 缩放 0.01，基线 Y=10
    expect(svg).toContain(
      '<path d="M 0 10 L 5 10 L 2.5 5 Z M 2 10 L 6 10 L 6 6 L 2 6 Z" fill="rgb(0 255 0)"/>'
    )
    // 第二个文本对象同字体复用解析缓存，TextCode Y 相对自身 Boundary
    expect(svg).toContain('<path d="M 0 10 L 5 10 L 2.5 5 Z" fill="#000"/>')
    // 只有损坏/缺失字体的两个对象回退为 text
    expect(svg.match(/<text /g)).toHaveLength(2)
  })

  it('内嵌字体损坏或资源缺失时回退系统字体，文字内容完整不缺字', async () => {
    const { zip, container } = await buildEmbeddedFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain('font-family="损坏"')
    expect(svg).toContain('>坏&lt;字&gt;</text>')
    expect(svg).toContain('font-family="缺失"')
    expect(svg).toContain('>缺资源</text>')
  })
})

// ---- 新版数电票形态：Body 图层 PageBlock 容器、子元素颜色声明、FontFile 子元素 + 无 cmap 子集字体 CGTransform 字形替换、CTM 平移缩放定位的单位盒图片 ----

/** 无 cmap 的子集字体：字形顺序被打乱（A 的轮廓挂在 gid 5），靠 CGTransform 指定字形 */
const SHUFFLED_FONT = buildTtf({
  cmap: undefined,
  glyphs: [{}, {}, {}, {}, {}, { contours: [TRIANGLE_CONTOUR] }, { contours: [SQUARE_CONTOUR] }],
  advances: [0, 0, 0, 0, 0, 500, 400],
  omitTables: ['cmap']
})

async function buildNewInvoiceFixture() {
  const data = await buildZip([
    { name: 'OFD.xml', data: utf8(ofdXml()) },
    {
      name: 'Doc_0/Document.xml',
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8"?><ofd:Document xmlns:ofd="${OFD_NS}">` +
          '<ofd:CommonData><ofd:PageArea><ofd:PhysicalBox>0 0 187.8228 124.9994</ofd:PhysicalBox></ofd:PageArea>' +
          '<ofd:PublicRes>PublicRes.xml</ofd:PublicRes>' +
          '<ofd:DocumentRes>DocumentRes.xml</ofd:DocumentRes></ofd:CommonData>' +
          '<ofd:Pages><ofd:Page BaseLoc="Pages/Page_0/Content.xml"/></ofd:Pages></ofd:Document>'
      )
    },
    {
      // 颜色全部为子元素形式；DrawParam 值文本走 FillColor 0 0 0
      name: 'Doc_0/DocumentRes.xml',
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8"?><ofd:Res xmlns:ofd="${OFD_NS}" BaseLoc="Res">` +
          '<ofd:DrawParams><ofd:DrawParam ID="105" LineWidth="1">' +
          '<ofd:FillColor Value="0 0 0"/><ofd:StrokeColor Value="255 255 255"/></ofd:DrawParam></ofd:DrawParams>' +
          '<ofd:MultiMedias><ofd:MultiMedia ID="103" Type="Image">' +
          '<ofd:MediaFile>qrcode.png</ofd:MediaFile></ofd:MultiMedia></ofd:MultiMedias></ofd:Res>'
      )
    },
    {
      // FontFile 为子元素声明，路径相对 Res 根 BaseLoc
      name: 'Doc_0/PublicRes.xml',
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8"?><ofd:Res xmlns:ofd="${OFD_NS}" BaseLoc="Res">` +
          '<ofd:Fonts><ofd:Font ID="6" FontName="KaiTi"><ofd:FontFile>font_6.ttf</ofd:FontFile></ofd:Font>' +
          '<ofd:Font FontName="simsun" ID="106"/></ofd:Fonts></ofd:Res>'
      )
    },
    {
      name: 'Doc_0/Pages/Page_0/Content.xml',
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}">` +
          '<ofd:Area><ofd:PhysicalBox>0 0 187.8228 124.9994</ofd:PhysicalBox></ofd:Area>' +
          '<ofd:Content>' +
          '<ofd:Layer ID="2">' +
          // 标题：内嵌子集字体 + CGTransform 字形替换 + 子元素 FillColor
          '<ofd:TextObject ID="7" CTM="1 0 0 1 0 0" Boundary="62 7 64 6" Font="6" Size="10">' +
          '<ofd:FillColor Value="128 0 0"/>' +
          '<ofd:CGTransform CodePosition="0" CodeCount="2" GlyphCount="2"><ofd:Glyphs>5 6</ofd:Glyphs></ofd:CGTransform>' +
          '<ofd:TextCode X="0" Y="9" DeltaX="10">AB</ofd:TextCode>' +
          '</ofd:TextObject>' +
          // 框线：Fill="true" 细矩形 + 子元素 FillColor
          '<ofd:PathObject ID="8" CTM="1 0 0 1 0 0" Boundary="4 23 180 0.4" Stroke="false" Fill="true">' +
          '<ofd:FillColor Value="128 0 0"/>' +
          '<ofd:AbbreviatedData>M 0 0 L 180 0 L 180 0.4 L 0 0.4 C</ofd:AbbreviatedData>' +
          '</ofd:PathObject>' +
          // 二维码：整页 Boundary + 带平移缩放的 CTM，内容为单位盒
          '<ofd:ImageObject ID="106" ResourceID="103" Boundary="0 0 210 297" CTM="18.2 0 0 18.2 5.3 3"/>' +
          '</ofd:Layer>' +
          '<ofd:Layer ID="103" Type="Body"><ofd:PageBlock ID="104">' +
          // 值文本藏在 PageBlock 分组容器内，颜色沿对象 DrawParam 继承
          '<ofd:TextObject Boundary="0 0 210 297" Font="106" Size="2.8" ID="111" Fill="true" DrawParam="105">' +
          '<ofd:TextCode X="10" Y="30">26327902880800161820</ofd:TextCode>' +
          '</ofd:TextObject>' +
          '</ofd:PageBlock></ofd:Layer>' +
          '</ofd:Content></ofd:Page>'
      )
    },
    { name: 'Doc_0/Res/font_6.ttf', data: SHUFFLED_FONT },
    { name: 'Doc_0/Res/qrcode.png', data: PNG_MAGIC }
  ])
  const zip = openOfdZip(data)
  return { zip, container: await parseOfdContainer(zip) }
}

describe('新版数电票渲染', () => {
  it('PageBlock 分组容器内的对象正常渲染，值文本沿对象 DrawParam 取色', async () => {
    const { zip, container } = await buildNewInvoiceFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain(
      '<text xml:space="preserve" x="10" y="30" font-size="2.8" font-family="simsun" fill="rgb(0 0 0)">26327902880800161820</text>'
    )
  })

  it('子元素颜色声明生效：细矩形框线按 FillColor 填充而非默认黑', async () => {
    const { zip, container } = await buildNewInvoiceFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain('<path d="M 0 0 L 180 0 L 180 0.4 L 0 0.4" fill="rgb(128 0 0)"/>')
  })

  it('FontFile 子元素声明相对 BaseLoc 解析，CGTransform 字形替换按序号取轮廓', async () => {
    const { zip, container } = await buildNewInvoiceFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    // A→gid5 三角形、B→gid6 正方形（cmap 缺失，仅 CGTransform 映射），DeltaX=10 定位 B
    expect(svg).toContain(
      '<path d="M 0 9 L 5 9 L 2.5 4 Z M 10 9 L 14 9 L 14 5 L 10 5 Z" fill="rgb(128 0 0)"/>'
    )
  })

  it('带平移缩放 CTM 的图片按单位盒渲染，不受整页 Boundary 影响', async () => {
    const { zip, container } = await buildNewInvoiceFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain(
      '<g transform="translate(0 0) matrix(18.2 0 0 18.2 5.3 3)"><image width="1" height="1"'
    )
  })
})

// ---- 真实产出形态（WPS 导出）：PhysicalBox 页尺寸、MediaFile 媒体、Type=Image、缩放 CTM、Font/Size 简写 ----

async function buildWpsStyleFixture() {
  const data = await buildZip([
    { name: 'OFD.xml', data: utf8(ofdXml()) },
    {
      name: 'Doc_0/Document.xml',
      data: utf8(
        `<?xml version="1.0" encoding="utf-8"?><ofd:Document xmlns:ofd="${OFD_NS}">` +
          '<ofd:CommonData><ofd:PageArea><ofd:PhysicalBox>0 0 215.9 279.4</ofd:PhysicalBox></ofd:PageArea>' +
          '<ofd:DocumentRes>DocumentRes.xml</ofd:DocumentRes>' +
          '<ofd:PublicRes>PublicRes.xml</ofd:PublicRes></ofd:CommonData>' +
          '<ofd:Pages><ofd:Page BaseLoc="Pages/Page_0/Content.xml"/></ofd:Pages></ofd:Document>'
      )
    },
    {
      name: 'Doc_0/DocumentRes.xml',
      data: utf8(
        `<?xml version="1.0" encoding="utf-8"?><ofd:Res xmlns:ofd="${OFD_NS}" BaseLoc="Res">` +
          '<ofd:MultiMedias><ofd:MultiMedia ID="4" Type="Image">' +
          '<ofd:MediaFile>Image_4.JPEG</ofd:MediaFile></ofd:MultiMedia></ofd:MultiMedias></ofd:Res>'
      )
    },
    {
      name: 'Doc_0/PublicRes.xml',
      data: utf8(
        `<?xml version="1.0" encoding="utf-8"?><ofd:Res xmlns:ofd="${OFD_NS}" BaseLoc="Res">` +
          '<ofd:Fonts><ofd:Font ID="29" FontName="楷体"/></ofd:Fonts></ofd:Res>'
      )
    },
    {
      name: 'Doc_0/Pages/Page_0/Content.xml',
      data: utf8(
        `<?xml version="1.0" encoding="utf-8"?><ofd:Page xmlns:ofd="${OFD_NS}">` +
          '<ofd:Area><ofd:PhysicalBox>0 0 209.96 296.94</ofd:PhysicalBox></ofd:Area>' +
          '<ofd:Content><ofd:Layer ID="2">' +
          // WPS 形态：Boundary 为变换后最终包围盒，CTM 把 [0,1] 单位盒缩放到该盒
          '<ofd:ImageObject ID="3" Boundary="31.743 25.6484 145.3829 109.0266" CTM="145.3829 0 0 109.0266 0 0" ResourceID="4"/>' +
          '<ofd:TextObject ID="5" Boundary="20 150 100 10" Font="29" Size="3.175">' +
          '<ofd:TextCode X="0" Y="8">WPS 导出</ofd:TextCode>' +
          '</ofd:TextObject></ofd:Layer></ofd:Content></ofd:Page>'
      )
    },
    // 条目目录与文档目录大小写不一致（WPS 实证）
    { name: 'DOC_0/Res/Image_4.JPEG', data: PNG_MAGIC }
  ])
  const zip = openOfdZip(data)
  return { zip, container: await parseOfdContainer(zip) }
}

describe('真实产出形态渲染（WPS 导出）', () => {
  it('MediaFile 媒体按 BaseLoc 定位，缩放 CTM 下图片内容盒反推为单位盒', async () => {
    const { zip, container } = await buildWpsStyleFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    // 页内 Area/PhysicalBox 覆盖文档默认尺寸
    expect(svg).toContain('viewBox="0 0 209.96 296.94"')
    expect(svg).toContain('transform="translate(31.743 25.6484) matrix(145.3829 0 0 109.0266 0 0)"')
    expect(svg).toContain('<image width="1" height="1" href="data:image/png;base64,')
  })

  it('Font/Size 简写生效，字体回退取 PublicRes 声明', async () => {
    const { zip, container } = await buildWpsStyleFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg).toContain('font-size="3.175" font-family="楷体"')
    expect(svg).toContain('>WPS 导出</text>')
  })
})

// ---- 模板页渲染（数电发票形态）：Tpls/Tpl_n 与页面内容叠加合成 ----

function templateDocumentXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Document xmlns:ofd="${OFD_NS}">` +
    '<ofd:CommonData><ofd:PageWidth>210</ofd:PageWidth><ofd:PageHeight>140</ofd:PageHeight>' +
    '<ofd:PublicRes>PublicRes.xml</ofd:PublicRes>' +
    '<ofd:DocumentRes>DocumentRes.xml</ofd:DocumentRes>' +
    '<ofd:TemplatePage ID="1" BaseLoc="Tpls/Tpl_0/Content.xml"/></ofd:CommonData>' +
    '<ofd:Pages><ofd:Page ID="61" BaseLoc="Pages/Page_0/Content.xml"/></ofd:Pages>' +
    '</ofd:Document>'
  )
}

/** 数电发票形态：DrawParam 在 PublicRes，Relative 沿链继承颜色与线宽 */
function templatePublicResXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Res xmlns:ofd="${OFD_NS}">` +
    '<ofd:DrawParams>' +
    '<ofd:DrawParam ID="3" LineWidth="0.25"><ofd:StrokeColor Value="128 0 0" ColorSpace="2"/></ofd:DrawParam>' +
    '<ofd:DrawParam ID="4" Relative="3"><ofd:FillColor Value="128 0 0" ColorSpace="2"/></ofd:DrawParam>' +
    '</ofd:DrawParams>' +
    '<ofd:Fonts><ofd:Font ID="5" FontName="楷体"/></ofd:Fonts>' +
    '</ofd:Res>'
  )
}

/** 模板内容文件：refs 为 Template 引用元素（模板递归引用），位于 Content 之前 */
function templateContentXml(inner: string, refs = ''): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}">` +
    refs +
    `<ofd:Content><ofd:Layer ID="6" DrawParam="4">${inner}</ofd:Layer></ofd:Content>` +
    '</ofd:Page>'
  )
}

const BOX_LINE =
  '<ofd:PathObject ID="7" Boundary="4.5 29.8 201 0.4">' +
  '<ofd:AbbreviatedData>M 0 0.2 L 201 0.2</ofd:AbbreviatedData></ofd:PathObject>'

/** 票面框线（无颜色声明，沿图层 DrawParam 继承）+ 栏目标签文本 */
const TEMPLATE_INNER =
  BOX_LINE +
  // 对象显式声明逐属性覆盖 DrawParam 继承值
  '<ofd:PathObject ID="8" Boundary="4.5 51.8 201 0.4" StrokeColor="0 0 255">' +
  '<ofd:AbbreviatedData>M 0 0.2 L 201 0.2</ofd:AbbreviatedData></ofd:PathObject>' +
  '<ofd:TextObject ID="3" Boundary="56 8 90 7.0732" Font="5" Size="7.0732">' +
  '<ofd:TextCode X="1.061" Y="6.0854">电子发票（增值税专用发票）</ofd:TextCode></ofd:TextObject>'

function invoicePageXml(zOrder: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}">` +
    '<ofd:Area><ofd:PhysicalBox>0 0 210 140</ofd:PhysicalBox></ofd:Area>' +
    `<ofd:Template TemplateID="1" ZOrder="${zOrder}"/>` +
    '<ofd:Content><ofd:Layer ID="6948">' +
    '<ofd:TextObject ID="6922" Boundary="170 10.3 38 5" Font="5" Size="3.175">' +
    '<ofd:TextCode X="0" Y="3.6414" DeltaX="g 3 1.5875">24112000000048542163</ofd:TextCode>' +
    '</ofd:TextObject></ofd:Layer></ofd:Content></ofd:Page>'
  )
}

async function buildTemplateFixture(pageZOrder = 'Background') {
  const data = await buildZip([
    { name: 'OFD.xml', data: utf8(ofdXml()) },
    { name: 'Doc_0/Document.xml', data: utf8(templateDocumentXml()) },
    { name: 'Doc_0/DocumentRes.xml', data: utf8(`<ofd:Res xmlns:ofd="${OFD_NS}"/>`) },
    { name: 'Doc_0/PublicRes.xml', data: utf8(templatePublicResXml()) },
    { name: 'Doc_0/Tpls/Tpl_0/Content.xml', data: utf8(templateContentXml(TEMPLATE_INNER)) },
    { name: 'Doc_0/Pages/Page_0/Content.xml', data: utf8(invoicePageXml(pageZOrder)) }
  ])
  const zip = openOfdZip(data)
  return { zip, container: await parseOfdContainer(zip) }
}

describe('模板页渲染（数电发票形态）', () => {
  it('背景模板与页面内容叠加合成，框线沿 DrawParam 继承链取色取线宽', async () => {
    const { zip, container } = await buildTemplateFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    // 线宽与描边沿 Relative 链取自 DrawParam 3，填充取自 4
    expect(svg).toContain(
      '<path d="M 0 0.2 L 201 0.2" fill="rgb(128 0 0)" stroke="rgb(128 0 0)" stroke-width="0.25"/>'
    )
    // 对象显式 StrokeColor 逐属性覆盖继承值，填充仍继承
    expect(svg).toContain(
      '<path d="M 0 0.2 L 201 0.2" fill="rgb(128 0 0)" stroke="rgb(0 0 255)" stroke-width="0.25"/>'
    )
    expect(svg).toContain('font-size="7.0732" font-family="楷体" fill="rgb(128 0 0)">电子发票')
    // 压缩写法 DeltaX="g n v" 展开为 n 个步长 v，未覆盖字符自然排布
    expect(svg).toContain('x="0 1.5875 3.175 4.7625" y="3.6414"')
    // 模板内容不改变页面尺寸：viewBox 取页内 Area 声明
    expect(svg).toContain('viewBox="0 0 210 140"')
  })

  it('ZOrder=Background 的模板内容位于页面内容之下', async () => {
    const { zip, container } = await buildTemplateFixture()
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg.indexOf('电子发票')).toBeLessThan(svg.indexOf('24112000000048542163'))
  })

  it('ZOrder=Foreground 的模板内容位于页面内容之上', async () => {
    const { zip, container } = await buildTemplateFixture('Foreground')
    const svg = await pageToSvg(zip, container, 0, 0)

    expect(svg.indexOf('24112000000048542163')).toBeLessThan(svg.indexOf('电子发票'))
  })

  it('模板递归引用按链展开，环引用断开、悬空引用跳过', async () => {
    const data = await buildZip([
      { name: 'OFD.xml', data: utf8(ofdXml()) },
      {
        name: 'Doc_0/Document.xml',
        data: utf8(
          `<?xml version="1.0" encoding="UTF-8"?><ofd:Document xmlns:ofd="${OFD_NS}">` +
            '<ofd:CommonData>' +
            '<ofd:TemplatePage ID="1" BaseLoc="Tpls/Tpl_0/Content.xml"/>' +
            '<ofd:TemplatePage ID="2" BaseLoc="Tpls/Tpl_1/Content.xml"/></ofd:CommonData>' +
            '<ofd:Pages><ofd:Page BaseLoc="Pages/Page_0"/></ofd:Pages></ofd:Document>'
        )
      },
      // Tpl_0 引用悬空的 9 与 Tpl_1；Tpl_1 回引 Tpl_0 成环
      {
        name: 'Doc_0/Tpls/Tpl_0/Content.xml',
        data: utf8(
          templateContentXml(
            '<ofd:TextObject ID="1" Boundary="0 0 10 5"><ofd:TextCode>背景甲</ofd:TextCode></ofd:TextObject>',
            '<ofd:Template TemplateID="9"/><ofd:Template TemplateID="2"/>'
          )
        )
      },
      {
        name: 'Doc_0/Tpls/Tpl_1/Content.xml',
        data: utf8(
          templateContentXml(
            '<ofd:TextObject ID="2" Boundary="0 0 10 5"><ofd:TextCode>背景乙</ofd:TextCode></ofd:TextObject>',
            '<ofd:Template TemplateID="1"/>'
          )
        )
      },
      {
        name: 'Doc_0/Pages/Page_0/Page.xml',
        data: utf8(
          `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}">` +
            '<ofd:Template TemplateID="1"/>' +
            '<ofd:Content><ofd:Layer ID="1" Type="body">' +
            '<ofd:TextObject ID="3" Boundary="0 0 10 5"><ofd:TextCode>页面字</ofd:TextCode></ofd:TextObject>' +
            '</ofd:Layer></ofd:Content></ofd:Page>'
        )
      }
    ])
    const zip = openOfdZip(data)
    const container = await parseOfdContainer(zip)
    const svg = await pageToSvg(zip, container, 0, 0)

    // 链上两层模板均渲染；环与悬空引用不产生重复内容
    expect(svg.match(/背景甲/g)).toHaveLength(1)
    expect(svg.match(/背景乙/g)).toHaveLength(1)
    // 模板自身引用的内容先于其图层内容
    expect(svg.indexOf('背景乙')).toBeLessThan(svg.indexOf('背景甲'))
    expect(svg.indexOf('背景甲')).toBeLessThan(svg.indexOf('页面字'))
  })

  it('模板与页面同 ID 对象按内容域作用域解析，互不串扰', async () => {
    const data = await buildZip([
      { name: 'OFD.xml', data: utf8(ofdXml()) },
      { name: 'Doc_0/Document.xml', data: utf8(templateDocumentXml()) },
      { name: 'Doc_0/DocumentRes.xml', data: utf8(`<ofd:Res xmlns:ofd="${OFD_NS}"/>`) },
      { name: 'Doc_0/PublicRes.xml', data: utf8(templatePublicResXml()) },
      {
        name: 'Doc_0/Tpls/Tpl_0/Content.xml',
        data: utf8(
          templateContentXml(
            '<ofd:TextObject ID="s1" Boundary="0 0 10 5"><ofd:TextCode>模板字</ofd:TextCode></ofd:TextObject>' +
              '<ofd:CompositeObject ID="sc" Boundary="20 0 10 5" ReferenceID="s1"/>'
          )
        )
      },
      {
        name: 'Doc_0/Pages/Page_0/Content.xml',
        data: utf8(
          `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}">` +
            '<ofd:Template TemplateID="1" ZOrder="Background"/>' +
            '<ofd:Content><ofd:Layer ID="1" Type="body">' +
            '<ofd:TextObject ID="s1" Boundary="0 100 10 5"><ofd:TextCode>页面字</ofd:TextCode></ofd:TextObject>' +
            '<ofd:CompositeObject ID="pc" Boundary="0 120 10 5" ReferenceID="s1"/>' +
            '</ofd:Layer></ofd:Content></ofd:Page>'
        )
      }
    ])
    const zip = openOfdZip(data)
    const container = await parseOfdContainer(zip)
    const svg = await pageToSvg(zip, container, 0, 0)

    // 模板复合对象命中模板自身的 s1，页面复合对象命中页面的 s1
    expect(svg.match(/模板字/g)).toHaveLength(2)
    expect(svg.match(/页面字/g)).toHaveLength(2)
  })
})
