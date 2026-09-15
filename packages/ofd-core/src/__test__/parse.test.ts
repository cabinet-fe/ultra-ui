import { describe, expect, it } from 'vitest'

import { parseOfd } from '../parse'
import { buildZip, expectParseError, utf8 } from './fixtures'

const OFD_NS = 'http://www.ofdservice.org/ofd'

function ofdXml(bodies: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><ofd:Ofd xmlns:ofd="${OFD_NS}">${bodies.join('')}</ofd:Ofd>`
}

function docBody(index: number): string {
  return (
    `<ofd:DocBody><ofd:DocInfo><ofd:DocID>doc-${index}</ofd:DocID><ofd:Title>文档 ${index}</ofd:Title></ofd:DocInfo>` +
    `<ofd:DocRoot>Doc_${index}/Document.xml</ofd:DocRoot></ofd:DocBody>`
  )
}

function documentXml(pageLocs: string[], withRes: boolean): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Document xmlns:ofd="${OFD_NS}">` +
    '<ofd:CommonData><ofd:PageWidth>21000</ofd:PageWidth><ofd:PageHeight>29700</ofd:PageHeight></ofd:CommonData>' +
    (withRes ? '<ofd:DocumentRes ResLoc="DocumentRes.xml"/>' : '') +
    `<ofd:Pages>${pageLocs.map((loc) => `<ofd:Page BaseLoc="${loc}"/>`).join('')}</ofd:Pages></ofd:Document>`
  )
}

function documentResXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Res xmlns:ofd="${OFD_NS}">` +
    '<ofd:Fonts><ofd:Font ID="0" FontName="宋体"/></ofd:Fonts>' +
    '<ofd:MultiMedias><ofd:MultiMedia ID="1" Type="g" ResLoc="Res/image_0.png"/></ofd:MultiMedias>' +
    '</ofd:Res>'
  )
}

function pageXml(
  layers: Array<{ id: string; type: string }>,
  size?: { width: number; height: number }
): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?><ofd:Page xmlns:ofd="${OFD_NS}">` +
    (size
      ? `<ofd:CommonData><ofd:PageWidth>${size.width}</ofd:PageWidth><ofd:PageHeight>${size.height}</ofd:PageHeight></ofd:CommonData>`
      : '') +
    `<ofd:Content>${layers.map((layer) => `<ofd:Layer ID="${layer.id}" Type="${layer.type}"/>`).join('')}</ofd:Content>` +
    '</ofd:Page>'
  )
}

describe('parseOfd', () => {
  it('多文档容器：文档数、页数与结构化模型同构造一致', async () => {
    const data = await buildZip([
      { name: 'OFD.xml', data: utf8(ofdXml([docBody(0), docBody(1)])), deflate: true },
      {
        name: 'Doc_0/Document.xml',
        data: utf8(documentXml(['Pages/Page_0', 'Pages/Page_1'], true))
      },
      { name: 'Doc_0/DocumentRes.xml', data: utf8(documentResXml()) },
      {
        name: 'Doc_0/Pages/Page_0/Page.xml',
        data: utf8(
          pageXml([
            { id: '1', type: 'body' },
            { id: '2', type: 'background' }
          ])
        )
      },
      {
        name: 'Doc_0/Pages/Page_1/Page.xml',
        data: utf8(pageXml([{ id: '3', type: 'foreground' }], { width: 14800, height: 21000 }))
      },
      {
        name: 'Doc_1/Document.xml',
        data: utf8(documentXml(['Pages/Page_0', 'Pages/Page_1', 'Pages/Page_2'], false))
      },
      { name: 'Doc_1/Pages/Page_0/Page.xml', data: utf8(pageXml([])) },
      { name: 'Doc_1/Pages/Page_1/Page.xml', data: utf8(pageXml([])) },
      { name: 'Doc_1/Pages/Page_2/Page.xml', data: utf8(pageXml([])) }
    ])

    const ofd = await parseOfd(data)

    expect(ofd.docs).toHaveLength(2)
    expect(ofd.docs.map((doc) => doc.info.docId)).toEqual(['doc-0', 'doc-1'])
    expect(ofd.docs[0].pages).toHaveLength(2)
    expect(ofd.docs[1].pages).toHaveLength(3)

    const first = ofd.docs[0]
    expect(first.dir).toBe('Doc_0')
    expect(first.pageSize).toEqual({ width: 21000, height: 29700 })
    expect(first.pages[0].location).toBe('Doc_0/Pages/Page_0/Page.xml')
    expect(first.pages[0].size).toBeNull()
    expect(first.pages[0].layers).toEqual([
      { id: '1', type: 'body' },
      { id: '2', type: 'background' }
    ])
    // 页级 CommonData 覆盖文档默认尺寸
    expect(first.pages[1].size).toEqual({ width: 14800, height: 21000 })
    expect(first.resources.fonts).toEqual([{ id: '0', fontName: '宋体', fontFile: null }])
    expect(first.resources.medias).toEqual([{ id: '1', type: 'g', location: 'Res/image_0.png' }])

    const second = ofd.docs[1]
    expect(second.resources).toEqual({ fonts: [], medias: [] })
    expect(second.pages.map((page) => page.location)).toEqual([
      'Doc_1/Pages/Page_0/Page.xml',
      'Doc_1/Pages/Page_1/Page.xml',
      'Doc_1/Pages/Page_2/Page.xml'
    ])
  })

  it('缺 OFD.xml 抛 missing-entry', async () => {
    const data = await buildZip([{ name: 'Doc_0/Document.xml', data: utf8('<ofd:Document/>') }])

    const error = await expectParseError(() => parseOfd(data))
    expect(error.reason).toBe('missing-entry')
  })

  it('非 ZIP 输入抛 not-zip', async () => {
    const error = await expectParseError(() => parseOfd(utf8('this is not a zip')))
    expect(error.reason).toBe('not-zip')
  })

  it('截断输入抛 OfdParseError 而非崩溃', async () => {
    const full = await buildZip([
      { name: 'OFD.xml', data: utf8(ofdXml([docBody(0)])) },
      { name: 'Doc_0/Document.xml', data: utf8(documentXml(['Pages/Page_0'], false)) },
      { name: 'Doc_0/Pages/Page_0/Page.xml', data: utf8(pageXml([{ id: '1', type: 'body' }])) }
    ])

    const error = await expectParseError(() => parseOfd(full.subarray(0, full.length - 40)))
    expect(error.reason).toBe('not-zip')
  })
})
