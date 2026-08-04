import type { ListTable } from '@visactor/vtable'
import { describe, expect, it } from 'vitest'

import { Sheet } from '../../core/sheet'
import { SheetGrid } from '../sheet-grid'

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  return el
}

function createGrid() {
  const sheet = new Sheet()
  const container = createContainer()
  const grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
  return { sheet, grid, table: grid.getTable(), container }
}

/** 当前编辑器 input（容器里另有 VTable 内部 input，不能靠 querySelector 取） */
function editorInput(table: ListTable): HTMLInputElement | undefined {
  const manager = (
    table as unknown as {
      editorManager?: { editingEditor?: { getInputElement?: () => HTMLInputElement } }
    }
  ).editorManager
  return manager?.editingEditor?.getInputElement?.()
}

describe('SheetGrid 公式集成（happy-dom）', () => {
  it('公式格显示计算值（模型写入公式 → 表格显示缓存值）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 21)
      sheet.setCellFormula({ row: 0, col: 1 }, '=A1*2')
      // 模型 (0,1) → 表格 (2,1)
      expect(table.getCellValue(2, 1)).toBe(42)
    } finally {
      grid.release()
    }
  })

  it('编辑提交 = 开头文本 → 模型存公式，表格回推计算值', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 5)
      // 模拟编辑提交（Playwright 无法触发双击编辑，changeCellValue 走同一提交路径）
      table.changeCellValue(2, 1, '=A1*2', false, true)
      expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ f: 'A1*2', v: 10, t: 'n' })
      // VTable 先把输入文本写进 record；回推后必须是计算值而非公式原文
      expect(table.getCellValue(2, 1)).toBe(10)
    } finally {
      grid.release()
    }
  })

  it('编辑提交引发的派生变更同步到表格（源格 + 全部依赖格）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 1)
      sheet.setCellFormula({ row: 0, col: 1 }, '=A1*2')
      sheet.setCellFormula({ row: 0, col: 2 }, '=B1+1')
      expect(table.getCellValue(2, 1)).toBe(2)
      expect(table.getCellValue(3, 1)).toBe(3)

      // 编辑 A1 → B1/C1 派生重算，两格都要同步到表格
      // （编辑提交回写的是输入文本，setCellValue 规范化为 number）
      table.changeCellValue(1, 1, '10', false, true)
      expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 10, t: 'n' })
      expect(table.getCellValue(1, 1)).toBe(10)
      expect(table.getCellValue(2, 1)).toBe(20)
      expect(table.getCellValue(3, 1)).toBe(21)
    } finally {
      grid.release()
    }
  })

  it('进入编辑时公式格显示原文，提交新公式后模型与显示更新', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 21)
      sheet.setCellFormula({ row: 0, col: 1 }, '=A1*2')

      // 程序化进入编辑（等价双击）：编辑器文本 = 公式原文
      table.startEditCell(2, 1)
      const input = editorInput(table)
      expect(input).toBeDefined()
      expect(input!.value).toBe('=A1*2')

      // 输入新公式并提交
      input!.value = '=A1*3'
      table.completeEditCell()
      expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ f: 'A1*3', v: 63 })
      expect(table.getCellValue(2, 1)).toBe(63)
    } finally {
      grid.release()
    }
  })

  it('普通格进入编辑显示当前值', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'plain')
      table.startEditCell(1, 1)
      expect(editorInput(table)!.value).toBe('plain')
      table.completeEditCell()
    } finally {
      grid.release()
    }
  })

  it('公式错误值直接显示（#DIV/0!）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellFormula({ row: 0, col: 0 }, '=1/0')
      expect(table.getCellValue(1, 1)).toBe('#DIV/0!')
    } finally {
      grid.release()
    }
  })

  it('undo 公式编辑后表格恢复显示', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 21)
      sheet.setCellFormula({ row: 0, col: 1 }, '=A1*2')
      expect(table.getCellValue(2, 1)).toBe(42)

      sheet.undo()
      expect(table.getCellValue(2, 1)).toBeUndefined()

      sheet.redo()
      expect(table.getCellValue(2, 1)).toBe(42)
    } finally {
      grid.release()
    }
  })
})
