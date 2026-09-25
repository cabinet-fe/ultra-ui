import { describe, expect, it } from 'vite-plus/test'

import { parseOfdColor } from '../color'

describe('parseOfdColor', () => {
  it('灰度：单值或 g / gray 前缀', () => {
    expect(parseOfdColor('128')).toBe('rgb(128 128 128)')
    expect(parseOfdColor('g 255')).toBe('rgb(255 255 255)')
    expect(parseOfdColor('gray,64')).toBe('rgb(64 64 64)')
  })

  it('RGB：3 值或 rgb 前缀', () => {
    expect(parseOfdColor('255 0 0')).toBe('rgb(255 0 0)')
    expect(parseOfdColor('rgb,0,128,255')).toBe('rgb(0 128 255)')
  })

  it('CMYK 转 RGB：r = 255·(1−c)·(1−k)', () => {
    expect(parseOfdColor('cmyk 0 255 255 0')).toBe('rgb(255 0 0)')
    expect(parseOfdColor('0 255 255 0')).toBe('rgb(255 0 0)')
    expect(parseOfdColor('0 84 159 60')).toBe('rgb(195 131 73)')
  })

  it('十六进制声明原样返回', () => {
    expect(parseOfdColor('#FF8000')).toBe('#FF8000')
  })

  it('末位透明度通道输出 rgba', () => {
    expect(parseOfdColor('cmyk 0 0 0 255 128')).toBe('rgba(0 0 0 / 0.502)')
  })

  it('通道值夹取到 0-255', () => {
    expect(parseOfdColor('rgb 300 -5 0')).toBe('rgb(255 0 0)')
    expect(parseOfdColor('cmyk 999 999 999 0 30')).toBe('rgba(0 0 0 / 0.118)')
  })

  it('无法识别返回 null', () => {
    expect(parseOfdColor(null)).toBeNull()
    expect(parseOfdColor('')).toBeNull()
    expect(parseOfdColor('   ')).toBeNull()
    expect(parseOfdColor('x 1 2')).toBeNull()
    expect(parseOfdColor('gray')).toBeNull()
    expect(parseOfdColor('1 2 3 4 5 6')).toBeNull()
    expect(parseOfdColor('rgb 1 2')).toBeNull()
  })
})
