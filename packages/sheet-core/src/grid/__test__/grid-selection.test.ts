import { describe, expect, it, vi } from 'vitest'

import { cellX, cellY, createGrid, fire, flushMicrotasks } from './grid-test-utils'

describe('选区双向同步', () => {
  it('表格 → 模型：程序化 selectCells 落模型选区（数据坐标无偏移）', () => {
    const { grid, table, sheet } = createGrid()
    try {
      table.selectCells([{ start: { col: 1, row: 2 }, end: { col: 3, row: 4 } }])
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 2, col: 1 },
        end: { row: 4, col: 3 }
      })
    } finally {
      grid.release()
    }
  })

  it('模型 → 表格：selectCell/selectRange 回驱画布；区域选区保持', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.selectCell({ row: 2, col: 1 })
      expect(table.getSelectedCellRanges()[0]).toEqual({
        start: { col: 1, row: 2 },
        end: { col: 1, row: 2 }
      })
      sheet.selectRange({ start: { row: 0, col: 0 }, end: { row: 2, col: 1 } })
      expect(table.getSelectedCellRanges()[0]).toEqual({
        start: { col: 0, row: 0 },
        end: { col: 1, row: 2 }
      })
    } finally {
      grid.release()
    }
  })

  it('指针按下选中数据格 → 模型选区同步（引擎事件管线驱动）', () => {
    const { grid, container, sheet } = createGrid()
    try {
      fire(container, 'pointerdown', { clientX: cellX(2), clientY: cellY(2) })
      fire(container, 'pointerup', { clientX: cellX(2), clientY: cellY(2) })
      expect(sheet.getSelection().activeCell).toEqual({ row: 2, col: 2 })
    } finally {
      grid.release()
    }
  })

  it('区域拖选结束：模型保留完整区域不收缩为单格', async () => {
    const { grid, container, sheet } = createGrid()
    try {
      fire(container, 'pointerdown', { clientX: cellX(1), clientY: cellY(1) })
      fire(container, 'pointermove', { clientX: cellX(3), clientY: cellY(3) })
      fire(container, 'pointerup', { clientX: cellX(3), clientY: cellY(3) })
      await flushMicrotasks()
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 1, col: 1 },
        end: { row: 3, col: 3 }
      })
    } finally {
      grid.release()
    }
  })

  it('行号/列头指针点击 → 整行/整列选区落模型（活动格在交互行/列）', async () => {
    const { grid, container, sheet } = createGrid({ rows: 10, cols: 5 })
    try {
      fire(container, 'pointerdown', { clientX: 10, clientY: cellY(2) })
      fire(container, 'pointerup', { clientX: 10, clientY: cellY(2) })
      await flushMicrotasks()
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 2, col: 0 },
        end: { row: 2, col: 4 }
      })
      expect(sheet.getSelection().activeCell?.row).toBe(2)

      fire(container, 'pointerdown', { clientX: cellX(3), clientY: 10 })
      fire(container, 'pointerup', { clientX: cellX(3), clientY: 10 })
      await flushMicrotasks()
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 0, col: 3 },
        end: { row: 9, col: 3 }
      })
      expect(sheet.getSelection().activeCell?.col).toBe(3)
    } finally {
      grid.release()
    }
  })

  it('Ctrl 加选禁用（ctrlMultiSelect: false）：追加点击仍单区域', async () => {
    const { grid, container, table, sheet } = createGrid()
    try {
      fire(container, 'pointerdown', { clientX: cellX(1), clientY: cellY(1) })
      fire(container, 'pointerup', { clientX: cellX(1), clientY: cellY(1) })
      fire(container, 'pointerdown', { clientX: cellX(3), clientY: cellY(3), ctrlKey: true })
      fire(container, 'pointerup', { clientX: cellX(3), clientY: cellY(3), ctrlKey: true })
      await flushMicrotasks()
      expect(table.getSelectedCellRanges()).toHaveLength(1)
      expect(sheet.getSelection().ranges).toHaveLength(1)
      expect(sheet.getSelection().activeCell).toEqual({ row: 3, col: 3 })
    } finally {
      grid.release()
    }
  })

  it('模型 → 表格：视口外目标滚动可见', () => {
    const { grid, table, sheet } = createGrid({ rows: 100, cols: 26 })
    try {
      sheet.selectCell({ row: 80, col: 20 })
      expect(table.getScrollTop()).toBeGreaterThan(0)
    } finally {
      grid.release()
    }
  })

  it('回驱不递归：模型选区回写画布不再次落模型', async () => {
    const { grid, sheet } = createGrid()
    try {
      let calls = 0
      sheet.on('selection-change', () => {
        calls++
      })
      sheet.selectCell({ row: 1, col: 1 })
      expect(calls).toBe(1)
      await flushMicrotasks()
      // 引擎外部回写（applyExternalSelection）不广播，无二次模型事件
      expect(calls).toBe(1)
    } finally {
      grid.release()
    }
  })
})

describe('整行/整列选区', () => {
  it('整列选区落模型：该列 × 全部行，活动格落在交互列', () => {
    const { grid, table, sheet } = createGrid({ rows: 10, cols: 5 })
    try {
      table.selectCol(2)
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 0, col: 2 },
        end: { row: 9, col: 2 }
      })
      expect(sheet.getSelection().activeCell?.col).toBe(2)
    } finally {
      grid.release()
    }
  })

  it('整行选区落模型：该行 × 全部列', () => {
    const { grid, table, sheet } = createGrid({ rows: 10, cols: 5 })
    try {
      table.selectRow(3)
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 3, col: 0 },
        end: { row: 3, col: 4 }
      })
      expect(sheet.getSelection().activeCell?.row).toBe(3)
    } finally {
      grid.release()
    }
  })
})

describe('引用选择拦截', () => {
  it('interceptSelection 命中：不落模型选区、回调拦截区域、画布回推模型选区', () => {
    const onSelectionIntercept = vi.fn()
    const { grid, container, sheet } = createGrid({
      interceptSelection: () => true,
      onSelectionIntercept
    })
    try {
      fire(container, 'pointerdown', { clientX: cellX(2), clientY: cellY(2) })
      fire(container, 'pointerup', { clientX: cellX(2), clientY: cellY(2) })
      expect(onSelectionIntercept).toHaveBeenCalledWith({
        start: { row: 2, col: 2 },
        end: { row: 2, col: 2 }
      })
      // 模型选区保持 A1（公式目标格高亮语义）
      expect(sheet.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    } finally {
      grid.release()
    }
  })

  it('引用拾取拖选手势收敛：抬手一次回交最终区域（不逐事件回交、不落模型选区）', () => {
    const onSelectionIntercept = vi.fn()
    const { grid, container, sheet } = createGrid({
      interceptSelection: () => true,
      onSelectionIntercept
    })
    try {
      fire(container, 'pointerdown', { clientX: cellX(1), clientY: cellY(1) })
      fire(container, 'pointermove', { clientX: cellX(3), clientY: cellY(3) })
      // 手势期只记录：中间选区变更不回交
      expect(onSelectionIntercept).not.toHaveBeenCalled()
      fire(container, 'pointerup', { clientX: cellX(3), clientY: cellY(3) })
      expect(onSelectionIntercept).toHaveBeenCalledTimes(1)
      expect(onSelectionIntercept).toHaveBeenCalledWith({
        start: { row: 1, col: 1 },
        end: { row: 3, col: 3 }
      })
      // 模型选区保持 A1（公式目标格高亮语义）
      expect(sheet.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    } finally {
      grid.release()
    }
  })
})

describe('填充柄生成', () => {
  it('拖拽填充：数字序列写入模型（单 undo 单元），选区扩展到源+目标', async () => {
    const { grid, container, table, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 1)
      table.selectCells([{ start: { col: 0, row: 0 }, end: { col: 0, row: 0 } }])

      // 按下填充柄（锚定段右下角骑点）：cell(0,0) 右下角 (126, 56) 附近
      fire(container, 'pointerdown', { clientX: 124, clientY: 54 })
      // 纵向拖到第 4 行（轴锁定：纵向主轴）
      fire(container, 'pointermove', { clientX: cellX(0) + 40, clientY: cellY(3) })
      fire(container, 'pointerup', { clientX: cellX(0) + 40, clientY: cellY(3) })
      await flushMicrotasks()

      expect(sheet.getCellData({ row: 1, col: 0 })?.v).toBe(2)
      expect(sheet.getCellData({ row: 2, col: 0 })?.v).toBe(3)
      expect(sheet.getCellData({ row: 3, col: 0 })?.v).toBe(4)
      // 选区扩展为源+目标
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 0, col: 0 },
        end: { row: 3, col: 0 }
      })
      // 单 undo 单元：一次撤销全部清空
      expect(sheet.undo()).toBe(true)
      expect(sheet.getCellData({ row: 1, col: 0 })).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('只读格不被填充覆盖', () => {
    const { grid, container, table, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 1)
      sheet.setCellReadonly({ row: 1, col: 0 }, true)
      table.selectCells([{ start: { col: 0, row: 0 }, end: { col: 0, row: 0 } }])
      fire(container, 'pointerdown', { clientX: 124, clientY: 54 })
      fire(container, 'pointermove', { clientX: cellX(0) + 40, clientY: cellY(2) })
      fire(container, 'pointerup', { clientX: cellX(0) + 40, clientY: cellY(2) })
      // (1,0) 只读被跳过，(2,0) 按序列正常写入
      expect(sheet.getCellData({ row: 1, col: 0 })).toBeUndefined()
      expect(sheet.getCellData({ row: 2, col: 0 })?.v).toBe(3)
    } finally {
      grid.release()
    }
  })
})
