import { describe, expect, it, vi } from 'vite-plus/test'

import { SHEET_DEFAULT_COL_WIDTH } from '../grid-theme'
import { cellX, cellY, createGrid, fire, flushMicrotasks } from './grid-test-utils'

describe('整表只读模式', () => {
  it('不注册编辑器：startEdit 拒绝、双击/Enter 无编辑会话', () => {
    const { grid, table } = createGrid({ readonly: true })
    try {
      expect(table.startEdit(0, 0)).toBe(false)
      expect(table.isEditing()).toBe(false)
    } finally {
      grid.release()
    }
  })

  it('保留渲染/选区/右键回调（守入口不守模型）', async () => {
    const seen: unknown[] = []
    const { grid, container, sheet } = createGrid({
      readonly: true,
      onContextMenu: (info) => seen.push(info)
    })
    try {
      container.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 200,
          clientY: 100
        })
      )
      await flushMicrotasks()
      expect(seen).toHaveLength(1)
      // 模型层不设防：写入口只在 grid（预览器不暴露命令入口）
      sheet.setCellValue({ row: 0, col: 0 }, 'ro')
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe('ro')
    } finally {
      grid.release()
    }
  })

  it('只读禁用行列 resize：列缘拖拽不改宽不写模型（canResize 恒 false）', async () => {
    const { grid, container, table, sheet } = createGrid({ readonly: true })
    try {
      // 第 0 列右缘（46 + 80 = 126，±4 手柄区）列头带内拖 +30
      fire(container, 'pointerdown', { clientX: 124, clientY: 10 })
      fire(container, 'pointermove', { clientX: 156, clientY: 10 })
      fire(container, 'pointerup', { clientX: 156, clientY: 10 })
      await flushMicrotasks()
      expect(table.getColWidth(0)).toBe(SHEET_DEFAULT_COL_WIDTH)
      expect(sheet.getColWidth(0)).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('只读填充柄不写模型（onFillDragEnd 不接线）', async () => {
    const { grid, container, table, sheet } = createGrid({ readonly: true })
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 1)
      table.selectCells([{ start: { col: 0, row: 0 }, end: { col: 0, row: 0 } }])
      fire(container, 'pointerdown', { clientX: 124, clientY: 54 })
      fire(container, 'pointermove', { clientX: cellX(0) + 40, clientY: cellY(2) })
      fire(container, 'pointerup', { clientX: cellX(0) + 40, clientY: cellY(2) })
      await flushMicrotasks()
      expect(sheet.getCellData({ row: 1, col: 0 })).toBeUndefined()
      expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('undo/redo 快捷键只读守卫：Ctrl+Z / Ctrl+Y 不改模型', () => {
    const { grid, container, sheet } = createGrid({ readonly: true })
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'x')

      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe('x')

      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })
      )
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe('x')
    } finally {
      grid.release()
    }
  })
})

describe('单元格级只读（填报场景）', () => {
  it('只读格 startEdit 拒绝，其余格正常（meta 运行期生效）', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellReadonly({ row: 1, col: 1 }, true)
      expect(table.startEdit(1, 1)).toBe(false)
      expect(table.startEdit(0, 0)).toBe(true)
      table.cancelEdit()

      sheet.setCellReadonly({ row: 1, col: 1 }, false)
      expect(table.startEdit(1, 1)).toBe(true)
      table.cancelEdit()
    } finally {
      grid.release()
    }
  })
})

describe('公式格', () => {
  it('显示计算缓存值；编辑初值为公式原文（所见即所编）', async () => {
    const { grid, container, table, sheet } = createGrid()
    try {
      sheet.setCellFormula({ row: 0, col: 0 }, '1+1')
      await flushMicrotasks()
      expect(table.getCellText(0, 0)).toBe('2')

      expect(table.startEdit(0, 0)).toBe(true)
      const input = container.querySelector('input')
      expect(input).not.toBeNull()
      expect((input as HTMLInputElement).value).toBe('=1+1')

      // 编辑改写提交：'=' 前缀自动走公式命令
      ;(input as HTMLInputElement).value = '=2+3'
      table.commitEdit()
      await flushMicrotasks()
      expect(sheet.getCellData({ row: 0, col: 0 })?.f).toBe('2+3')
      expect(table.getCellText(0, 0)).toBe('5')
    } finally {
      grid.release()
    }
  })

  it('编辑提交引发派生变更同步：源格更新后依赖格显示刷新', async () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellFormula({ row: 1, col: 1 }, 'A1*2')
      sheet.setCellValue({ row: 0, col: 0 }, 5)
      await flushMicrotasks()
      expect(table.getCellText(1, 1)).toBe('10')
      // 编辑提交路径（引擎回写 → 模型重算 → 依赖格刷新）
      table.updateCell(0, 0, 7)
      await flushMicrotasks()
      expect(table.getCellText(1, 1)).toBe('14')
    } finally {
      grid.release()
    }
  })

  it('公式错误值直接显示（#DIV/0!）', async () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellFormula({ row: 0, col: 0 }, '1/0')
      await flushMicrotasks()
      expect(table.getCellText(0, 0)).toBe('#DIV/0!')
    } finally {
      grid.release()
    }
  })

  it('undo 公式编辑后表格恢复显示', async () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 21)
      sheet.setCellFormula({ row: 1, col: 0 }, 'A1*2')
      await flushMicrotasks()
      expect(table.getCellText(0, 1)).toBe('42')
      table.updateCell(0, 0, 30)
      await flushMicrotasks()
      expect(table.getCellText(0, 1)).toBe('60')
      expect(sheet.undo()).toBe(true)
      await flushMicrotasks()
      expect(table.getCellText(0, 1)).toBe('42')
    } finally {
      grid.release()
    }
  })

  it('普通格编辑初值为当前值', () => {
    const { grid, container, table, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 1, col: 1 }, 'plain')
      expect(table.startEdit(1, 1)).toBe(true)
      const input = container.querySelector('input')
      expect(input).not.toBeNull()
      expect((input as HTMLInputElement).value).toBe('plain')
      table.cancelEdit()
    } finally {
      grid.release()
    }
  })

  it('编辑提交与取消均触发 onEditEnd（镜像退出挂钩点）', () => {
    const onEditEnd = vi.fn()
    const { grid, table } = createGrid({ onEditEnd })
    try {
      table.startEdit(0, 0)
      table.commitEdit()
      expect(onEditEnd).toHaveBeenCalledTimes(1)
      expect(onEditEnd).toHaveBeenLastCalledWith({ row: 0, col: 0 })

      table.startEdit(1, 1)
      table.cancelEdit()
      expect(onEditEnd).toHaveBeenCalledTimes(2)
      expect(onEditEnd).toHaveBeenLastCalledWith({ row: 1, col: 1 })
    } finally {
      grid.release()
    }
  })
})
