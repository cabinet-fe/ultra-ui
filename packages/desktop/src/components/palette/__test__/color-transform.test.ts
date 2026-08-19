import { describe, expect, it } from 'vitest'

import { HEX2RGBA } from '../color-transform'

describe('HEX2RGBA', () => {
  it('解析 6 位 HEX（# 可省略、大小写不敏感）', () => {
    expect(HEX2RGBA('#FF0000')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 1 })
    expect(HEX2RGBA('ff0000')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 1 })
    expect(HEX2RGBA('  #00ff00  ')).toEqual({ RGB: { r: 0, g: 255, b: 0 }, alpha: 1 })
  })

  it('解析 3/4 位缩写 HEX', () => {
    expect(HEX2RGBA('#f00')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 1 })
    expect(HEX2RGBA('#f008')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 0x88 / 255 })
  })

  it('解析 8 位 HEX（RRGGBBAA）', () => {
    expect(HEX2RGBA('#FF000080')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 0x80 / 255 })
  })

  it('解析 rgb() / rgba() 函数表示', () => {
    expect(HEX2RGBA('rgb(255, 0, 0)')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 1 })
    expect(HEX2RGBA('rgba(255,0,0,0.5)')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 0.5 })
    expect(HEX2RGBA('rgba(255, 0, 0, 50%)')).toEqual({ RGB: { r: 255, g: 0, b: 0 }, alpha: 0.5 })
  })

  it('非法输入返回 null', () => {
    expect(HEX2RGBA('')).toBeNull()
    expect(HEX2RGBA('#FF')).toBeNull()
    expect(HEX2RGBA('#GGGGGG')).toBeNull()
    expect(HEX2RGBA('red')).toBeNull()
    expect(HEX2RGBA('rgb(256, 0, 0)')).toBeNull()
    expect(HEX2RGBA('rgba(0, 0, 0, 2)')).toBeNull()
  })
})
