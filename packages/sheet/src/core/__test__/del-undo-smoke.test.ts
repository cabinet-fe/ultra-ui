import { describe, expect, it } from 'vitest'

import { Sheet } from '../sheet'

describe('deleteRows/Cols undo restores deleted values', () => {
  it('deleteRows undo restores values in deleted range；redo 再删', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 1, col: 0 }, 'DEL-A')
    sheet.setCellValue({ row: 2, col: 0 }, 'DEL-B')
    sheet.setCellValue({ row: 3, col: 0 }, 'KEEP')
    sheet.setCellFormula({ row: 1, col: 1 }, '=A2')
    sheet.history.clear()
    sheet.deleteRows(1, 2)
    expect(sheet.getDisplayValue({ row: 1, col: 0 })).toBe('KEEP')
    expect(sheet.undo()).toBe(true)
    expect(sheet.getDisplayValue({ row: 1, col: 0 })).toBe('DEL-A')
    expect(sheet.getDisplayValue({ row: 2, col: 0 })).toBe('DEL-B')
    expect(sheet.getDisplayValue({ row: 3, col: 0 })).toBe('KEEP')
    expect(sheet.getCellData({ row: 1, col: 1 })?.f).toBe('A2')
    expect(sheet.redo()).toBe(true)
    expect(sheet.getDisplayValue({ row: 1, col: 0 })).toBe('KEEP')
    expect(sheet.getCellData({ row: 1, col: 1 })).toBeUndefined()
  })

  it('deleteCols undo restores values in deleted range；redo 再删', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 1 }, 'C1')
    sheet.setCellValue({ row: 0, col: 2 }, 'C2')
    sheet.setCellValue({ row: 0, col: 3 }, 'C3')
    sheet.history.clear()
    sheet.deleteCols(1, 2)
    expect(sheet.getDisplayValue({ row: 0, col: 1 })).toBe('C3')
    expect(sheet.undo()).toBe(true)
    expect(sheet.getDisplayValue({ row: 0, col: 1 })).toBe('C1')
    expect(sheet.getDisplayValue({ row: 0, col: 2 })).toBe('C2')
    expect(sheet.getDisplayValue({ row: 0, col: 3 })).toBe('C3')
    expect(sheet.redo()).toBe(true)
    expect(sheet.getDisplayValue({ row: 0, col: 1 })).toBe('C3')
    expect(sheet.getCellData({ row: 0, col: 2 })).toBeUndefined()
  })
})
