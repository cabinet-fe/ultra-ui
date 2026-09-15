import { describe, expect, it } from 'vitest'

import { OfdParseError } from '../error'
import { glyphPathD, parseEmbeddedFont, type OfdEmbeddedFont } from '../font'
import { buildTtf, expectParseError, TRIANGLE_CONTOUR } from './fixtures'

describe('parseEmbeddedFont', () => {
  it('解析表目录与度量：cmap 码点映射 glyph、unitsPerEm、步进宽度', () => {
    const font = parseEmbeddedFont(
      buildTtf({
        cmap: { 65: 1, 20013: 2 },
        glyphs: [{}, { contours: [TRIANGLE_CONTOUR] }, { contours: [TRIANGLE_CONTOUR] }],
        advances: [600, 700, 800]
      }),
      'a.ttf'
    )

    expect(font.unitsPerEm).toBe(1000)
    expect(font.numGlyphs).toBe(3)
    expect(font.glyphIndexOf(65)).toBe(1)
    expect(font.glyphIndexOf(20013)).toBe(2)
    expect(font.glyphIndexOf(67)).toBe(null)
    expect(font.advanceWidth(0)).toBe(600)
    expect(font.advanceWidth(2)).toBe(800)
  })

  it('glyph id 超出 hmtx 度量数时取最后一条度量', () => {
    const font = parseEmbeddedFont(
      buildTtf({ glyphs: [{}, {}, {}], advances: [600, 700] }),
      'a.ttf'
    )
    expect(font.advanceWidth(2)).toBe(700)
    expect(font.advanceWidth(99)).toBe(700)
  })

  it('glyphOutline 按 on/off 标志提取轮廓点', () => {
    const font = parseEmbeddedFont(
      buildTtf({
        glyphs: [
          {},
          {
            contours: [
              [
                { x: 0, y: 0, on: true },
                { x: 250, y: 500, on: false },
                { x: 500, y: 0, on: true }
              ]
            ]
          }
        ]
      }),
      'a.ttf'
    )

    expect(font.glyphOutline(0)).toEqual([])
    expect(font.glyphOutline(1)).toEqual([
      [
        { x: 0, y: 0, onCurve: true },
        { x: 250, y: 500, onCurve: false },
        { x: 500, y: 0, onCurve: true }
      ]
    ])
  })
})

describe('glyphPathD', () => {
  function triangleFont(): OfdEmbeddedFont {
    return parseEmbeddedFont(
      buildTtf({ cmap: { 65: 1 }, glyphs: [{}, { contours: [TRIANGLE_CONTOUR] }] }),
      'a.ttf'
    )
  }

  it('按字号缩放（unitsPerEm → 字号）并以基线定位、翻转 y 轴', () => {
    expect(glyphPathD(triangleFont(), 1, 10, 10, 20)).toBe('M 10 20 L 15 20 L 12.5 15 Z')
  })

  it('off-curve 点输出二次贝塞尔 Q 指令', () => {
    const font = parseEmbeddedFont(
      buildTtf({
        glyphs: [
          {},
          {
            contours: [
              [
                { x: 0, y: 0, on: true },
                { x: 250, y: 500, on: false },
                { x: 500, y: 0, on: true }
              ]
            ]
          }
        ]
      }),
      'a.ttf'
    )
    expect(glyphPathD(font, 1, 10, 0, 0)).toBe('M 0 0 Q 2.5 -5 5 0 Z')
  })

  it('连续 off-curve 点之间自动补隐式中点', () => {
    const font = parseEmbeddedFont(
      buildTtf({
        glyphs: [
          {},
          {
            contours: [
              [
                { x: 0, y: 0, on: true },
                { x: 0, y: 400, on: false },
                { x: 500, y: 400, on: false },
                { x: 500, y: 0, on: true }
              ]
            ]
          }
        ]
      }),
      'a.ttf'
    )
    expect(glyphPathD(font, 1, 10, 0, 0)).toBe('M 0 0 Q 0 -4 2.5 -4 Q 5 -4 5 0 Z')
  })

  it('复合 glyph 递归展开组件并应用偏移', () => {
    const font = parseEmbeddedFont(
      buildTtf({
        glyphs: [
          {},
          { contours: [TRIANGLE_CONTOUR] },
          { components: [{ glyph: 1, dx: 100, dy: 50 }] }
        ]
      }),
      'a.ttf'
    )
    expect(glyphPathD(font, 2, 10, 0, 0)).toBe('M 1 -0.5 L 6 -0.5 L 3.5 -5.5 Z')
  })

  it('空 glyph、越界 id 与零字号返回空串', () => {
    const font = triangleFont()
    expect(glyphPathD(font, 0, 10, 0, 0)).toBe('')
    expect(glyphPathD(font, 99, 10, 0, 0)).toBe('')
    expect(glyphPathD(font, 1, 0, 0, 0)).toBe('')
  })

  it('复合 glyph 循环引用直接断开，不挂死', () => {
    const font = parseEmbeddedFont(
      buildTtf({ glyphs: [{}, { components: [{ glyph: 1, dx: 10, dy: 0 }] }] }),
      'a.ttf'
    )
    expect(font.glyphOutline(1)).toEqual([])
  })
})

describe('字体二进制非法数据', () => {
  it('数据太短抛 invalid-font', async () => {
    const error = await expectParseError(() => parseEmbeddedFont(new Uint8Array(8), 'short.ttf'))
    expect(error).toBeInstanceOf(OfdParseError)
    expect(error.reason).toBe('invalid-font')
  })

  it('数据截断抛 invalid-font', async () => {
    const data = buildTtf({ glyphs: [{}, { contours: [TRIANGLE_CONTOUR] }] })
    const error = await expectParseError(() => parseEmbeddedFont(data.slice(0, 40), 'cut.ttf'))
    expect(error.reason).toBe('invalid-font')
  })

  it('缺少必需表抛 invalid-font；cmap 可省（子集字体靠 CGTransform 映射）', async () => {
    const error = await expectParseError(() =>
      parseEmbeddedFont(buildTtf({ glyphs: [{}], omitTables: ['glyf'] }), 'no-glyf.ttf')
    )
    expect(error.reason).toBe('invalid-font')

    const noCmap = parseEmbeddedFont(
      buildTtf({ glyphs: [{}], omitTables: ['cmap'] }),
      'no-cmap.ttf'
    )
    expect(noCmap.glyphIndexOf(65)).toBeNull()
  })

  it('unitsPerEm 为 0 抛 invalid-font', async () => {
    const error = await expectParseError(() =>
      parseEmbeddedFont(buildTtf({ unitsPerEm: 0, glyphs: [{}] }), 'upem.ttf')
    )
    expect(error.reason).toBe('invalid-font')
  })
})
