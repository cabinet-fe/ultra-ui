import { ListTable } from '@visactor/vtable'
import type { ListTableConstructorOptions } from '@visactor/vtable'
import { describe, expect, it, vi } from 'vitest'

import { Sheet } from '../../core/sheet'
import { SheetGrid } from '../sheet-grid'

/**
 * Spike：VTable 1.26.5 冻结能力验证（结论写回 plans/sheet-enhancement/phase-2-freeze-and-find.md）。
 *
 * 验证点：
 * - 构造选项 frozenRowCount / frozenColCount 是否透传（ListTable refreshRowColCount 读取 options）
 * - 偏移语义：表格坐标含行号列（col 0）与列头行（row 0），模型冻结值需加偏移
 * - 动态更新：table.frozenRowCount = n / table.frozenColCount = n setter 是否生效
 * - 选区回驱：selectCells / scrollToCell（表格坐标）可调用
 */

function createTable(options: ListTableConstructorOptions = {}): ListTable {
  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)
  return new ListTable(container, {
    records: Array.from({ length: 20 }, () => ({})),
    columns: Array.from({ length: 6 }, (_, col) => ({ field: String(col), title: String(col) })),
    defaultRowHeight: 28,
    ...options
  })
}

describe('Spike: VTable frozenRowCount / frozenColCount（1.26.5）', () => {
  it('构造选项透传：frozenRowCount 被列头行数兜底，frozenColCount 原样透传', () => {
    const table = createTable({ frozenRowCount: 0, frozenColCount: 0 })
    try {
      // 列头行本身总是冻结：frozenRowCount 至少 = columnHeaderLevelCount（1）
      expect(table.columnHeaderLevelCount).toBe(1)
      expect(table.frozenRowCount).toBe(1)
      // frozenColCount 不含行号列/列头列：0 = 只冻结行号列 + 列头列
      expect(table.frozenColCount).toBe(0)
    } finally {
      table.release()
    }
  })

  it('构造选项：frozenRowCount: 3 / frozenColCount: 2 → 运行时反映（模型 2 行 + 列头行 / 模型 1 列 + 行号列 + 列头列）', () => {
    const table = createTable({ frozenRowCount: 3, frozenColCount: 2 })
    try {
      expect(table.frozenRowCount).toBe(3)
      expect(table.frozenColCount).toBe(2)
      // options 也被记录（setter 同步 options，构造时亦然）
      expect(table.options.frozenRowCount).toBe(3)
      expect(table.options.frozenColCount).toBe(2)
      // 冻结区内单元格判定（isFrozenCell(col, row).row = row < frozenRowCount，.col = col < frozenColCount）
      expect(table.isFrozenCell(1, 2)).toMatchObject({ row: true, col: true })
      expect(table.isFrozenCell(3, 2)).toMatchObject({ row: true, col: false })
    } finally {
      table.release()
    }
  })

  it('动态 setter 即时生效：frozenRowCount = n / frozenColCount = n 并同步 options', () => {
    const table = createTable()
    try {
      table.frozenRowCount = 2
      table.frozenColCount = 3
      expect(table.frozenRowCount).toBe(2)
      expect(table.frozenColCount).toBe(3)
      expect(table.options.frozenRowCount).toBe(2)
      expect(table.options.frozenColCount).toBe(3)
    } finally {
      table.release()
    }
  })

  it('选区回驱 API：selectCells 更新 VTable 选区（表格坐标），scrollToCell 不抛错', () => {
    const table = createTable({ frozenRowCount: 2, frozenColCount: 2 })
    try {
      // 表格坐标（含行号列/列头行偏移）：body B2:D3 → (2,2)..(4,3)
      table.selectCells([{ start: { col: 2, row: 2 }, end: { col: 4, row: 3 } }])
      const ranges = table.getSelectedCellRanges()
      expect(ranges).toHaveLength(1)
      expect(ranges[0]).toMatchObject({ start: { col: 2, row: 2 }, end: { col: 4, row: 3 } })

      // 单格
      table.selectCells([{ start: { col: 5, row: 5 }, end: { col: 5, row: 5 } }])
      expect(table.getSelectedCellRanges()[0]).toMatchObject({
        start: { col: 5, row: 5 },
        end: { col: 5, row: 5 }
      })

      // 滚动（冻结感知：目标在冻结区内时不滚动 body）
      table.scrollToCell({ col: 2, row: 2 })
      table.scrollToCell({ col: 6, row: 8 })
    } finally {
      table.release()
    }
  })
})

describe('SheetGrid 冻结映射与选区回驱（Phase 2 回归）', () => {
  function createContainer(): HTMLElement {
    const el = document.createElement('div')
    el.style.width = '800px'
    el.style.height = '600px'
    document.body.appendChild(el)
    return el
  }

  function createGrid(sheet: Sheet, rows = 20, cols = 6) {
    const container = createContainer()
    const grid = new SheetGrid({ container, sheet, rows, cols })
    return { grid, table: grid.getTable() }
  }

  it('构造时按模型冻结值映射：frozen rows/cols + 1 偏移（列头行 / 行号列）', () => {
    const sheet = new Sheet()
    sheet.setFrozen(2, 1)
    const { grid, table } = createGrid(sheet)
    try {
      // 模型 2 行冻结 → VTable frozenRowCount = 3（列头行 + 2 body 行）
      expect(table.frozenRowCount).toBe(3)
      // 模型 1 列冻结 → VTable frozenColCount = 2（行号列 + 1 body 列）
      expect(table.frozenColCount).toBe(2)
      // 冻结区判定（表格坐标）：模型 A1(表格 1,1) 在冻结区内
      expect(table.isFrozenCell(1, 1)).toMatchObject({ row: true, col: true })
      // 模型 C3（表格 3,3）不在冻结区 → isFrozenCell 返回 null（row 3 ≥ frozenRowCount 3，col 3 ≥ frozenColCount 2）
      expect(table.isFrozenCell(3, 3)).toBeNull()
    } finally {
      grid.release()
    }
  })

  it('隐藏行列头时冻结不再加列头/行号偏移', () => {
    const sheet = new Sheet()
    sheet.setFrozen(2, 1)
    const container = document.createElement('div')
    container.style.width = '800px'
    container.style.height = '600px'
    document.body.appendChild(container)
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 20,
      cols: 6,
      showRowHeader: false,
      showColHeader: false
    })
    try {
      const table = grid.getTable()
      expect(table.columnHeaderLevelCount).toBe(0)
      expect(table.frozenRowCount).toBe(2)
      expect(table.frozenColCount).toBe(1)
      expect(table.isFrozenCell(0, 0)).toMatchObject({ row: true, col: true })
    } finally {
      grid.release()
    }
  })

  it('冻结变更即时生效：setFrozen → frozen-change → VTable 冻结布局更新', () => {
    const sheet = new Sheet()
    const { grid, table } = createGrid(sheet)
    try {
      expect(table.frozenRowCount).toBe(1) // 默认：仅列头行
      expect(table.frozenColCount).toBe(1) // 默认：仅行号列

      sheet.setFrozen(5, 0)
      expect(table.frozenRowCount).toBe(6)
      expect(table.frozenColCount).toBe(1)

      sheet.setFrozen(0, 3)
      expect(table.frozenRowCount).toBe(1)
      expect(table.frozenColCount).toBe(4)
    } finally {
      grid.release()
    }
  })

  it('冻结值钳制：超过渲染行/列数时压到上限', () => {
    const sheet = new Sheet()
    sheet.setFrozen(99, 99) // 渲染 20 行 6 列
    const { grid, table } = createGrid(sheet)
    try {
      expect(table.frozenRowCount).toBe(20)
      expect(table.frozenColCount).toBe(6)
    } finally {
      grid.release()
    }
  })

  it('选区回驱：模型 selectCell/selectRange → VTable 高亮；不可见目标滚动可见', () => {
    const sheet = new Sheet()
    // 大表格（100 行 26 列）使视口外目标存在
    const { grid, table } = createGrid(sheet, 100, 26)
    try {
      const scrollSpy = vi.spyOn(table, 'scrollToCell')

      // 视口内目标（A1）：高亮同步（happy-dom 布局测量为 0，可见性判断不可靠，
      // 不在此断言「不滚动」——真实浏览器由 isCellVisible 保证不滚动避免跳动）
      sheet.selectCell({ row: 0, col: 0 })
      expect(table.getSelectedCellRanges()[0]).toMatchObject({
        start: { col: 1, row: 1 },
        end: { col: 1, row: 1 }
      })
      scrollSpy.mockClear()

      // 视口外目标（Z100 → 表格 26,100）：高亮 + 滚动可见
      sheet.selectCell({ row: 99, col: 25 })
      expect(table.getSelectedCellRanges()[0]).toMatchObject({
        start: { col: 26, row: 100 },
        end: { col: 26, row: 100 }
      })
      expect(scrollSpy).toHaveBeenCalledWith({ col: 26, row: 100 })

      // 区域选区
      scrollSpy.mockClear()
      sheet.selectRange({ start: { row: 0, col: 0 }, end: { row: 2, col: 1 } })
      expect(table.getSelectedCellRanges()[0]).toMatchObject({
        start: { col: 1, row: 1 },
        end: { col: 2, row: 3 }
      })
    } finally {
      grid.release()
    }
  })

  it('回驱不递归：SELECTED_CELL 不回写模型（syncingSelection 拦截）', () => {
    const sheet = new Sheet()
    const { grid, table } = createGrid(sheet)
    try {
      const selectSpy = vi.spyOn(sheet, 'selectCell')
      // selectCells 会同步派发 SELECTED_CELL；syncingSelection 期间 handler 直接返回
      sheet.selectCell({ row: 0, col: 0 })
      expect(selectSpy).toHaveBeenCalledTimes(1)
    } finally {
      grid.release()
    }
  })

  it('tab 重建还原：新 SheetGrid 按模型冻结值重建冻结布局', () => {
    const sheet = new Sheet()
    sheet.setFrozen(1, 2)
    const container = createContainer()
    let grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
    try {
      expect(grid.getTable().frozenRowCount).toBe(2)
      expect(grid.getTable().frozenColCount).toBe(3)

      grid.release()
      grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
      expect(grid.getTable().frozenRowCount).toBe(2)
      expect(grid.getTable().frozenColCount).toBe(3)
    } finally {
      grid.release()
    }
  })
})
