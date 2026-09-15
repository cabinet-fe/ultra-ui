import { describe, expect, it } from 'vitest'

import { openOfdZip } from '../zip'
import { buildZip, expectParseError, utf8 } from './fixtures'

describe('openOfdZip', () => {
  it('解析中央目录并列出全部条目', async () => {
    const zip = openOfdZip(
      await buildZip([
        { name: 'OFD.xml', data: utf8('<ofd:Ofd/>') },
        { name: 'Doc_0/Document.xml', data: utf8('<ofd:Document/>') },
        { name: 'Doc_0/Res/', data: new Uint8Array(0) }
      ])
    )

    expect(zip.entries.map((entry) => entry.name)).toEqual([
      'OFD.xml',
      'Doc_0/Document.xml',
      'Doc_0/Res/'
    ])
    expect(zip.has('Doc_0/Document.xml')).toBe(true)
    expect(zip.has('missing.xml')).toBe(false)
  })

  it('读取 stored 条目字节', async () => {
    const data = utf8('hello ofd')
    const zip = openOfdZip(await buildZip([{ name: 'a.txt', data }]))

    expect(await zip.read('a.txt')).toEqual(data)
    expect(await zip.text('a.txt')).toBe('hello ofd')
  })

  it('解压 deflate 条目并还原原始字节', async () => {
    const data = utf8('deflate me '.repeat(64))
    const zip = openOfdZip(await buildZip([{ name: 'Doc_0/Page.xml', data, deflate: true }]))

    const entry = zip.entries[0]
    expect(entry.method).toBe(8)
    expect(entry.compressedSize).toBeLessThan(data.length)
    expect(await zip.read('Doc_0/Page.xml')).toEqual(data)
  })

  it('读取不存在的条目抛 missing-entry', async () => {
    const zip = openOfdZip(await buildZip([{ name: 'a.txt', data: utf8('x') }]))

    const error = await expectParseError(() => zip.read('nope.xml'))
    expect(error.reason).toBe('missing-entry')
  })

  it('条目路径大小写不一致时按不敏感匹配（WPS 产出 Doc_0 / DOC_0 混用）', async () => {
    const data = utf8('png bytes')
    const zip = openOfdZip(await buildZip([{ name: 'DOC_0/Res/Image_4.JPEG', data }]))

    expect(zip.has('Doc_0/Res/image_4.jpeg')).toBe(true)
    expect(await zip.read('Doc_0/RES/Image_4.jpeg')).toEqual(data)
  })

  it('非 ZIP 输入抛 not-zip', async () => {
    const error = await expectParseError(() => openOfdZip(utf8('plain text, not a zip at all')))
    expect(error.reason).toBe('not-zip')
  })

  it('中央目录越界抛 truncated', async () => {
    const full = await buildZip([{ name: 'OFD.xml', data: utf8('<ofd/>') }])
    // 把 EOCD 的中央目录偏移改到越界位置，模拟容器被截断
    const view = new DataView(full.buffer, full.byteOffset, full.byteLength)
    view.setUint32(full.length - 6, 0x7fffffff, true)

    const error = await expectParseError(() => openOfdZip(full))
    expect(error.reason).toBe('truncated')
  })

  it('中央目录签名损坏抛 bad-central-directory', async () => {
    const full = await buildZip([{ name: 'OFD.xml', data: utf8('<ofd/>') }])
    // 从 EOCD 读出中央目录起点（偏移字段在 EOCD 起始后 16 字节，即距文件尾 6 字节），改写其签名
    const view = new DataView(full.buffer, full.byteOffset, full.byteLength)
    full.set([0, 0, 0, 0], view.getUint32(full.length - 6, true))

    const error = await expectParseError(() => openOfdZip(full))
    expect(error.reason).toBe('bad-central-directory')
  })
})
