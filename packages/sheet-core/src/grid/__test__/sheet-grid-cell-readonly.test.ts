import { ListTable } from '@visactor/vtable'
import { describe, expect, it } from 'vitest'

import { Sheet } from '../../core/sheet'
import { EDITOR_NAME } from '../grid-editor-router'
import { SheetGrid } from '../sheet-grid'

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  return el
}

function createEditableGrid() {
  const sheet = new Sheet()
  const container = createContainer()
  const grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
  return { sheet, grid, table: grid.getTable() }
}

describe('SheetGrid 单元格级只读', () => {
  it('列级 editor 函数：只读格不解析出编辑器，普通格解析为单例编辑器', () => {
    const { sheet, grid, table } = createEditableGrid()
    try {
      sheet.setCellReadonly({ row: 0, col: 0 })
      // body 格 (1,1) = 模型 (0,0)；getEditor 是双击 / Enter 进编辑的统一入口
      expect(table.getEditor(1, 1)).toBeUndefined()
      expect(table.getEditor(1, 2)).toBeDefined()
    } finally {
      grid.release()
    }
  })

  it('运行期新标记的只读格不放行旧编辑器（meta-change 清空 getEditor 按格缓存）', () => {
    const { sheet, grid, table } = createEditableGrid()
    try {
      // 先解析一次普通格，写入 VTable 的 cacheLastSelectedCellEditor
      expect(table.getEditor(1, 1)).toBeDefined()
      sheet.setCellReadonly({ row: 0, col: 0 })
      expect(table.getEditor(1, 1)).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('运行期解除只读后恢复编辑', () => {
    const { sheet, grid, table } = createEditableGrid()
    try {
      sheet.setCellReadonly({ row: 0, col: 0 })
      expect(table.getEditor(1, 1)).toBeUndefined()
      sheet.setCellReadonly({ row: 0, col: 0 }, false)
      expect(table.getEditor(1, 1)).toBeDefined()
    } finally {
      grid.release()
    }
  })

  it('options 行为不变：表级 editor / editCellTrigger / 填充柄保持开启', () => {
    const { grid, table } = createEditableGrid()
    try {
      expect(table.options.editor).toBe(EDITOR_NAME)
      expect(table.options.editCellTrigger).toBe('doubleclick')
      expect(table.options.excelOptions?.fillHandle).toBe(true)
    } finally {
      grid.release()
    }
  })

  it('CHANGE_CELL_VALUE 不写只读格并回滚视图显示；普通格照常回写', () => {
    const { sheet, grid, table } = createEditableGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'locked')
      sheet.setCellReadonly({ row: 0, col: 0 })
      grid.flushPending()

      table.changeCellValue(1, 1, 'hacked', false, true)
      expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'locked' })
      expect(table.getCellValue(1, 1)).toBe('locked')

      table.changeCellValue(2, 1, 'ok', false, true)
      expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 'ok' })
    } finally {
      grid.release()
    }
  })

  it('填充柄跳过只读目标格，其余格照常填充', () => {
    const { sheet, grid, table } = createEditableGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 1)
      sheet.setCellReadonly({ row: 2, col: 0 })

      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 1, row: 1 } }]
      table.fireListeners(ListTable.EVENT_TYPE.MOUSEDOWN_FILL_HANDLE, {})
      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 1, row: 4 } }]
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_FILL_HANDLE_END, { direction: 'bottom' })

      expect(sheet.getCellData({ row: 1, col: 0 })).toMatchObject({ v: 2 })
      expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined() // 只读，跳过
      expect(sheet.getCellData({ row: 3, col: 0 })).toMatchObject({ v: 4 })
    } finally {
      grid.release()
    }
  })

  it('整表 readonly 时列级 editor 函数也不挂（列级会覆盖表级空值）', () => {
    const sheet = new Sheet()
    const grid = new SheetGrid({
      container: createContainer(),
      sheet,
      rows: 20,
      cols: 6,
      readonly: true
    })
    try {
      const table = grid.getTable()
      expect(table.options.editor).toBeUndefined()
      expect(table.getEditor(1, 1)).toBeUndefined()
    } finally {
      grid.release()
    }
  })
})
