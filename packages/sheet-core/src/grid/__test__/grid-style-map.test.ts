import { describe, expect, it } from 'vite-plus/test'

import { fontSizePtToPx, sheetStyleToEngineStyle, estimateWrapRowHeight } from '../grid-style-map'
import { SHEET_CELL_PADDING, SHEET_DEFAULT_ROW_HEIGHT } from '../grid-theme'

describe('fontSizePtToPx', () => {
  it('Excel pt → CSS px（4/3，四舍五入）', () => {
    expect(fontSizePtToPx(11)).toBe(15)
    expect(fontSizePtToPx(12)).toBe(16)
  })
})

describe('sheetStyleToEngineStyle', () => {
  it('空样式返回 null（沿用主题分区 token）', () => {
    expect(sheetStyleToEngineStyle(undefined)).toBeNull()
    expect(sheetStyleToEngineStyle({})).toBeNull()
  })

  it('填充色 → background', () => {
    expect(sheetStyleToEngineStyle({ fill: { color: '#FF0000' } })).toEqual({
      background: '#FF0000'
    })
  })

  it('font 映射：颜色/加粗/斜体/下划线/删除线；字号 pt→px', () => {
    expect(
      sheetStyleToEngineStyle({
        font: {
          color: '#333333',
          bold: true,
          italic: true,
          underline: true,
          strikethrough: true,
          size: 12
        }
      })
    ).toEqual({
      color: '#333333',
      fontWeight: 'bold',
      fontStyle: 'italic',
      underline: true,
      lineThrough: true,
      fontSize: 16
    })
  })

  it('align 映射：水平/垂直/换行（wrap → textWrap）', () => {
    expect(
      sheetStyleToEngineStyle({ align: { horizontal: 'center', vertical: 'top', wrap: true } })
    ).toEqual({ textAlign: 'center', verticalAlign: 'top', textWrap: true })
  })

  it('边框逐边映射：thin/medium/thick → solid（宽度独立），dashed/dotted 保留', () => {
    const mapped = sheetStyleToEngineStyle({
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        right: { style: 'medium', width: 2, color: '#111111' },
        bottom: { style: 'dashed', width: 1, color: '#222222' },
        left: { style: 'dotted', width: 1, color: '#333333' }
      }
    })
    expect(mapped?.border).toEqual({
      top: { width: 1, color: '#000000', style: 'solid' },
      right: { width: 2, color: '#111111', style: 'solid' },
      bottom: { width: 1, color: '#222222', style: 'dashed' },
      left: { width: 1, color: '#333333', style: 'dotted' }
    })
  })

  it('thick 实线：宽度由边定义携带，线型归一为 solid', () => {
    const mapped = sheetStyleToEngineStyle({
      border: { top: { style: 'thick', width: 3, color: '#444444' } }
    })
    expect(mapped?.border?.top).toEqual({ width: 3, color: '#444444', style: 'solid' })
  })
})

describe('estimateWrapRowHeight', () => {
  it('单行短文本回落默认行高', () => {
    expect(estimateWrapRowHeight({ text: 'ab', colWidth: 80 })).toBe(SHEET_DEFAULT_ROW_HEIGHT)
  })

  it('显式换行符按多段折行累计', () => {
    const single = estimateWrapRowHeight({ text: 'line', colWidth: 80 })
    const multi = estimateWrapRowHeight({ text: 'line\nline\nline', colWidth: 80 })
    expect(multi).toBeGreaterThan(single)
    const padY = SHEET_CELL_PADDING[0] + SHEET_CELL_PADDING[2]
    expect(multi).toBe(Math.max(SHEET_DEFAULT_ROW_HEIGHT, Math.ceil(3 * 15 * 1.25 + padY)))
  })

  it('长文本按列宽折行；合并格总宽按传入 colWidth 计算', () => {
    const narrow = estimateWrapRowHeight({ text: 'x'.repeat(100), colWidth: 80 })
    const wide = estimateWrapRowHeight({ text: 'x'.repeat(100), colWidth: 240 })
    expect(narrow).toBeGreaterThan(wide)
  })
})
