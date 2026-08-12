import { describe, expect, it } from 'vitest'

import { composeCellStyles } from '../compose'
import type { CellStyle } from '../types'

describe('composeCellStyles 层叠加语义', () => {
  it('行红字 + 格蓝字 → 蓝（后者覆盖）', () => {
    const row: CellStyle = { font: { color: '#FF0000' } }
    const cell: CellStyle = { font: { color: '#0000FF' } }
    expect(composeCellStyles(row, cell)).toEqual({ font: { color: '#0000FF' } })
  })

  it('行红字 + 格仅 bold → 红+粗（字段级保留）', () => {
    const row: CellStyle = { font: { color: '#FF0000' } }
    const cell: CellStyle = { font: { bold: true } }
    expect(composeCellStyles(row, cell)).toEqual({ font: { color: '#FF0000', bold: true } })
  })

  it('列 → 行 → 格 三层叠加', () => {
    const col: CellStyle = { fill: { color: '#EEEEEE' }, font: { size: 12 } }
    const row: CellStyle = { font: { color: '#FF0000', bold: true } }
    const cell: CellStyle = { font: { italic: true } }
    const withRow = composeCellStyles(col, row)
    expect(composeCellStyles(withRow, cell)).toEqual({
      fill: { color: '#EEEEEE' },
      font: { size: 12, color: '#FF0000', bold: true, italic: true }
    })
  })

  it('fill 整层覆盖；border 边级叠加', () => {
    const base: CellStyle = {
      fill: { color: '#111111' },
      border: {
        top: { style: 'thin', width: 1, color: '#000000' },
        left: { style: 'thin', width: 1, color: '#000000' }
      }
    }
    const overlay: CellStyle = {
      fill: { color: '#FFFFFF' },
      border: { top: { style: 'thick', width: 3, color: '#FF0000' } }
    }
    expect(composeCellStyles(base, overlay)).toEqual({
      fill: { color: '#FFFFFF' },
      border: {
        top: { style: 'thick', width: 3, color: '#FF0000' },
        left: { style: 'thin', width: 1, color: '#000000' }
      }
    })
  })

  it('overlay 为空 / base 为空', () => {
    const base: CellStyle = { fill: { color: '#ABCDEF' } }
    expect(composeCellStyles(base, undefined)).toEqual(base)
    expect(composeCellStyles(undefined, base)).toEqual(base)
    expect(composeCellStyles(undefined, undefined)).toBeUndefined()
  })
})
