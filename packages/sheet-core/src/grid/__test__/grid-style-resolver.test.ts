import { describe, expect, it, vi } from 'vitest'

import { mergeCellStyle } from '../../core/command/set-cell-style'
import { Sheet } from '../../core/sheet'
import { GridStyleResolver } from '../grid-style-resolver'

describe('GridStyleResolver.resolveCellStyle Hook', () => {
  it('无 Hook 时 getEffectiveStyle 原样返回 StylePool 静态样式', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }
    sheet.setCellStyle({ start: addr, end: addr }, { fill: { color: '#ABCDEF' } })

    const resolver = new GridStyleResolver(sheet, 10, 10)
    expect(resolver.getEffectiveStyle(addr)).toMatchObject({ fill: { color: '#ABCDEF' } })
  })

  it('Hook 接收地址与 baseStyle，返回合并样式参与生效样式计算', () => {
    const sheet = new Sheet()
    const addr = { row: 1, col: 2 }
    sheet.setCellStyle({ start: addr, end: addr }, { fill: { color: '#111111' } })

    const hook = vi.fn((receivedAddr, baseStyle) =>
      mergeCellStyle(baseStyle, { fill: { color: '#FF0000' } })
    )
    const resolver = new GridStyleResolver(sheet, 10, 10, { resolveCellStyle: hook })

    const effective = resolver.getEffectiveStyle(addr)
    expect(hook).toHaveBeenCalledOnce()
    expect(hook).toHaveBeenCalledWith(addr, { fill: { color: '#111111' } })
    expect(effective).toMatchObject({ fill: { color: '#FF0000' } })
    // 底层存储不变
    expect(sheet.getCellStyle(addr)?.fill?.color).toBe('#111111')
  })

  it('Hook 返回 undefined 时回落 baseStyle', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }
    sheet.setCellStyle({ start: addr, end: addr }, { fill: { color: '#222222' } })

    const resolver = new GridStyleResolver(sheet, 10, 10, { resolveCellStyle: () => undefined })
    expect(resolver.getEffectiveStyle(addr)).toMatchObject({ fill: { color: '#222222' } })
  })

  it('无样式格 + Hook 可纯动态注入样式', () => {
    const sheet = new Sheet()
    const addr = { row: 3, col: 4 }
    sheet.setCellValue(addr, 150)

    const resolver = new GridStyleResolver(sheet, 10, 10, {
      resolveCellStyle: (receivedAddr, baseStyle) => {
        if (receivedAddr.row === 3 && receivedAddr.col === 4) {
          return mergeCellStyle(baseStyle, { fill: { color: '#00FF00' } })
        }
        return baseStyle
      }
    })
    expect(resolver.getEffectiveStyle(addr)).toMatchObject({ fill: { color: '#00FF00' } })
    expect(sheet.getCellStyle(addr)).toBeUndefined()
  })

  it('合并格读锚点 baseStyle；Hook 作用于锚点地址', () => {
    const sheet = new Sheet()
    const anchor = { row: 0, col: 0 }
    const merged = { row: 0, col: 1 }
    sheet.setCellStyle({ start: anchor, end: merged }, { fill: { color: '#333333' } })
    sheet.mergeCells({ start: anchor, end: merged })

    const hook = vi.fn()
    const resolver = new GridStyleResolver(sheet, 10, 10, { resolveCellStyle: hook })
    resolver.getEffectiveStyle(merged)

    expect(hook).toHaveBeenCalledOnce()
    expect(hook).toHaveBeenCalledWith(merged, { fill: { color: '#333333' } })
  })

  it('空单元格仍可继承行列默认样式', () => {
    const sheet = new Sheet()
    const addr = { row: 2, col: 3 }
    sheet.setColStyle(3, { font: { color: '#FF0000' } })
    sheet.setRowStyle(2, { font: { bold: true } })

    const resolver = new GridStyleResolver(sheet, 10, 10)
    expect(resolver.getStoredStyle(addr)).toEqual({ font: { color: '#FF0000', bold: true } })
    expect(resolver.getEffectiveStyle(addr)).toEqual({ font: { color: '#FF0000', bold: true } })
    expect(sheet.getCellStyle(addr)).toBeUndefined()
  })

  it('getWrapMetrics：列/行/格 wrap 覆盖且不分配 compose 结果也能读到', () => {
    const sheet = new Sheet()
    sheet.setColStyle(1, { align: { wrap: true }, font: { size: 14 } })
    sheet.setRowStyle(2, { font: { size: 18 } })
    sheet.setCellStyle(
      { start: { row: 2, col: 1 }, end: { row: 2, col: 1 } },
      { font: { bold: true } }
    )

    const resolver = new GridStyleResolver(sheet, 10, 10)
    expect(resolver.getWrapMetrics({ row: 0, col: 1 })).toEqual({ wrap: true, fontSizePt: 14 })
    expect(resolver.getWrapMetrics({ row: 2, col: 0 })).toEqual({ wrap: false, fontSizePt: 18 })
    expect(resolver.getWrapMetrics({ row: 2, col: 1 })).toEqual({ wrap: true, fontSizePt: 18 })
    expect(resolver.getWrapMetrics({ row: 0, col: 0 })).toEqual({
      wrap: false,
      fontSizePt: undefined
    })
  })
})
